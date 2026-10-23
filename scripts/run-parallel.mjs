#!/usr/bin/env node
/**
 * Runs Cypress specs in parallel without a paid dashboard.
 *
 *   node scripts/run-parallel.mjs                 # default number of workers
 *   node scripts/run-parallel.mjs --workers 4
 *   node scripts/run-parallel.mjs -- --browser chrome   # extra args go to cypress
 *
 * Specs are balanced across workers by an estimated weight (number of tests in the file),
 * so one slow spec does not make a worker finish much later than the others.
 * Isolation comes from the tests themselves: every worker creates its own workspace tokens,
 * as the spec requires ("Кожен паралельний worker має створювати свій token").
 */
import { spawn } from 'node:child_process';
import { globSync, readFileSync, rmSync } from 'node:fs';
import { availableParallelism } from 'node:os';

const SPEC_PATTERN = 'cypress/e2e/**/*.cy.js';
const ASSET_DIRS = ['cypress/screenshots', 'cypress/videos'];

function parseArgs(argv) {
  const separator = argv.indexOf('--');
  const own = separator === -1 ? argv : argv.slice(0, separator);
  const passThrough = separator === -1 ? [] : argv.slice(separator + 1);
  const value = (flag) => {
    const index = own.indexOf(flag);
    return index === -1 ? undefined : own[index + 1];
  };


  const defaultWorkers = Math.min(3, Math.max(1, availableParallelism() - 1));
  return {
    workers: Number(value('--workers') ?? defaultWorkers),
    passThrough,
  };
}

/** Rough cost of a spec: every it(...) plus every data-driven case inside forEach tables. */
const weightOf = (file) => {
  const source = readFileSync(file, 'utf8');
  const tests = source.match(/\bit\(/g)?.length ?? 0;
  const tableRows = source.match(/^\s*\{ (title|method):/gm)?.length ?? 0;
  return Math.max(1, tests + tableRows);
};

/** Greedy balancing: heaviest spec goes to the currently lightest bucket. */
function split(specs, buckets) {
  const groups = Array.from({ length: buckets }, () => ({ specs: [], weight: 0 }));
  specs
    .map((file) => ({ file, weight: weightOf(file) }))
    .sort((a, b) => b.weight - a.weight)
    .forEach((spec) => {
      const lightest = groups.reduce((min, g) => (g.weight < min.weight ? g : min));
      lightest.specs.push(spec.file);
      lightest.weight += spec.weight;
    });
  return groups.filter((g) => g.specs.length);
}

function runWorker(id, specs, passThrough) {
  const args = [
    'cypress', 'run',
    '--spec', specs.join(','),
    // Assets are cleaned once by this script; a worker must not delete another worker's evidence.
    '--config', 'trashAssetsBeforeRuns=false',
    ...passThrough,
  ];
  const label = `[worker ${id}]`;
  return new Promise((resolve) => {
    const child = spawn('npx', args, { stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, WORKER_ID: String(id) } });
    const prefix = (stream, out) =>
      stream.on('data', (chunk) =>
        chunk.toString().split('\n').filter(Boolean).forEach((line) => out.write(`${label} ${line}\n`)),
      );
    prefix(child.stdout, process.stdout);
    prefix(child.stderr, process.stderr);
    child.on('close', (code) => resolve({ id, specs, code }));
  });
}

async function main() {
  const { workers, passThrough } = parseArgs(process.argv.slice(2));
  const specs = globSync(SPEC_PATTERN).sort();
  const groups = split(specs, workers);
  if (!groups.length) {
    console.log(`No specs found for ${SPEC_PATTERN}.`);
    return;
  }

  ASSET_DIRS.forEach((dir) => rmSync(dir, { recursive: true, force: true }));
  console.log(`Running ${specs.length} specs in ${groups.length} parallel worker(s):`);
  groups.forEach((g, i) => console.log(`  worker ${i + 1} (weight ${g.weight}): ${g.specs.join(', ')}`));

  const started = Date.now();
  const results = await Promise.all(groups.map((g, i) => runWorker(i + 1, g.specs, passThrough)));

  console.log(`\nFinished in ${Math.round((Date.now() - started) / 1000)}s`);
  results.forEach(({ id, specs: s, code }) =>
    console.log(`  worker ${id}: ${code === 0 ? 'passed' : `failed (exit ${code})`} — ${s.length} spec(s)`),
  );
  // Cypress exits with the number of failed tests; any non-zero worker fails the whole run.
  process.exitCode = results.some((r) => r.code !== 0) ? 1 : 0;
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
