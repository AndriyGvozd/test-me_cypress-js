# test-me.vzl.one — Cypress UI & API tests

Автотести для навчального магазину https://test-me.vzl.one: 20 API-кейсів (повне покриття ендпоінтів) і 12 UI-кейсів з `docs/Test_Cases_*.xlsx`.
ID кейса (`TC-API-N`, `TC-UI-N`) стоїть на початку назви тесту, тож кейс, автотест і дефект легко зіставити.
Тест кейси - https://docs.google.com/spreadsheets/d/1DiaG7jXL_eJUx5FkEu08B5QAquO6drBLEBnCdKx3owQ/edit?usp=sharing

## Документація
- [Тест-план](docs/TEST_PLAN.md) — обсяг тестування й пріоритети, ризики, підхід, **критерії завершення**, аналіз нестабільних тестів, а також що свідомо не покрито і чому.
- [Тест-кейси](docs/TEST_CASES.md) — трасування «кейс → автотест»; повні кейси з кроками, даними й результатами — у Google Sheets (посилання вище) та `docs/Test_Cases_*.xlsx`.
- [Дефекти](docs/BUGS.md) — знайдені баги з кроками, очікуваним і фактичним результатом та скриншотами.
<!-- added: accessibility (star task) -->
- 🆕 **Завдання з зірочкою — доступність**: [docs/ACCESSIBILITY.md](docs/ACCESSIBILITY.md) — що перевіряється (WCAG 2.1 AA, підписи полів, клавіатура, діалоги), результат і дефект BUG-7; кейси TC-UI-13…16 — у [docs/Test_Cases_Accessibility.xlsx](docs/Test_Cases_Accessibility.xlsx).
<!-- added: network errors (star task) -->
- 🆕 **Завдання з зірочкою — мережеві помилки**: [docs/NETWORK_ERRORS.md](docs/NETWORK_ERRORS.md) — обрив мережі й помилки сервера (каталог, оформлення, розрахунок, обране), стани завантаження й порожніх даних; кейси TC-UI-18…22 — у [docs/Test_Cases_Network.xlsx](docs/Test_Cases_Network.xlsx).

## Запуск
Потрібен Node.js 22+ (вимога Cypress 16).
```bash
npm install
npm run cy:open        # інтерактивно
npm test               # усі тести headless, послідовно
npm run test:parallel  # усі тести в 3 паралельних workers
npm run test:api       # лише API
npm run test:ui        # лише UI (разом із тестами доступності)
npx cypress run --spec cypress/e2e/ui/accessibility.cy.js   # 🆕 лише доступність
npx cypress run --spec cypress/e2e/ui/network-errors.cy.js  # 🆕 лише мережеві помилки
```

## Результат
84 тести: 76 passed, 8 failed. Усі падіння — навмисні дефекти застосунку, описані в [docs/BUGS.md](docs/BUGS.md) зі скриншотами в [docs/evidence](docs/evidence).
Тести перевіряють **вимоги ТЗ**, а не поточну поведінку, тому червоні тести на цих дефектах — очікуваний результат.

<!-- added: accessibility (star task) -->
🆕 **Завдання з зірочкою — доступність**: ще 10 тестів, 9 passed, 1 failed (BUG-7). Разом із ними та 🆕 TC-UI-17 (межа 10 у кошику) повний прогін — 95 тестів: 86 passed, 9 failed.

<!-- added: network errors (star task) -->
🆕 **Завдання з зірочкою — мережеві помилки**: ще 8 тестів, усі passed (нових дефектів немає). Повний прогін тепер — 103 тести: 94 passed, 9 failed.

<!-- added: BUG-8 -->
🆕 Додано TC-UI-23 (дефект BUG-8: дубль позиції p07 у кошику). Повний прогін — **104 тести: 94 passed, 10 failed → 8 дефектів**.

## Структура
```
cypress/
  e2e/api/            workspace, favorites, quote, orders, isolation, reviews, products
  e2e/ui/             checkout, cart, orders, environment, catalog, favorites, reviews,
                      accessibility, network-errors (🆕 зірочка)
  fixtures/           дані товарів, на які спираються кейси
  support/
    api/client.js     обгортки над API (заголовок X-Workspace-Token)
    api/routes.js     матчери для cy.intercept
    commands.js       cy.createWorkspace, cy.visitShop, cy.apiCreateOrder, cy.appState, parseWith
    a11y.js           🆕 cy.axeViolations, cy.checkA11y (axe-core, WCAG 2.1 AA)
    network.js        🆕 cy.goOffline, cy.goOnline (офлайн-режим через DevTools Protocol)
    pages/            Page Objects: Header, CatalogPage, CartDialog, OrdersPage, ProductDialog
    utils/            еталонний розрахунок quote, гроші, тестові дані
    constants.js      бізнес-правила з ТЗ і HTTP-коди
scripts/run-parallel.mjs  паралельний запуск у кількох workers
docs/                 тест-план, тест-кейси, дефекти, evidence
```

## Принципи
- **Ізоляція.** Кожен тест працює у власному workspace: API-тести створюють token самі, а UI-тести підкладають його в `localStorage` ще до завантаження сторінки (`cy.visitShop`). Тести незалежні й можуть іти паралельно.
- **Еталон замість поточної поведінки.** Очікувані суми рахує `expectedQuote()` за правилами ТЗ.
- **Без фіксованих пауз.** Синхронізація йде через `cy.intercept` + `cy.wait('@alias')`, а значення з DOM розбираються retryable-запитом `parseWith`. Єдине очікування за часом — пауза за заголовком `Retry-After` при rate limit.
- **Підготовка через API, перевірка через UI.** Замовлення, обране й кошик для UI-сценаріїв створюються через API або storage, тож кожен UI-тест перевіряє лише свою поведінку.
- **Негативні кейси на рівні API.** `failOnStatusCode: false`, і статус перевіряється явно в кожному тесті.
- **Безпека.** Токени не комітяться й не виводяться в лог; усі контактні дані вигадані.

## Паралельний запуск
- **Локально:** `npm run test:parallel` (або `node scripts/run-parallel.mjs --workers 4`). Специфікації розподіляються між workers з балансуванням за кількістю тестів, вивід кожного worker позначено префіксом `[worker N]`. Додаткові аргументи для Cypress передаються після `--`, наприклад `node scripts/run-parallel.mjs -- --browser chrome`.
- **Ізоляція:** кожен worker створює власні workspace token (вимога ТЗ). Якщо спрацює спільний rate limit, `cy.createWorkspace` чекає час із `Retry-After` і повторює запит.
- Час прогону: близько 2 хв 40 с послідовно, близько 1 хв 30 с у 3 workers.
