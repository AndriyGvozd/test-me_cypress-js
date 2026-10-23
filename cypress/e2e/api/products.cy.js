import { Api } from '../../support/api/client';
import { HTTP, RULES } from '../../support/constants';

describe('API: catalog filters', () => {
  /** Fetches every page so assertions cover the whole result set, not just page 1. */
  const fetchAll = (qs, page = 1, acc = []) =>
    Api.products({ ...qs, page, limit: 20 }).then(({ status, body }) => {
      expect(status).to.eq(HTTP.OK);
      const items = [...acc, ...body.items];
      return items.length < body.total ? fetchAll(qs, page + 1, items) : items;
    });

  describe('TC-API-15 price bounds, in_stock, numeric sort, search', () => {
    it('includes products priced exactly at the bounds', () => {
      fetchAll({ min_price: 150000, max_price: 150000 }).then((items) => {
        expect(items.map((p) => p.id)).to.include('p02');
        items.forEach((p) => expect(p.price).to.eq(150000));
      });
    });

    it('rejects min_price greater than max_price with 422', () => {
      Api.products({ min_price: 300000, max_price: 100000 }).its('status').should('eq', HTTP.UNPROCESSABLE);
    });

    it('in_stock excludes products with stock = 0', () => {
      fetchAll({ in_stock: true }).then((items) => {
        expect(items).not.to.be.empty;
        items.forEach((p) => expect(p.stock, `${p.id} stock`).to.be.greaterThan(0));
      });
    });

    it('sorts by price numerically', () => {
      fetchAll({ sort: 'price_asc' }).then((items) => {
        const prices = items.map((p) => p.price);
        expect(prices).to.deep.eq([...prices].sort((a, b) => a - b));
      });
    });

    it('search ignores case and surrounding spaces', () => {
      Api.products({ q: '  ОРБІТА  ' }).its('body.items').should((items) => {
        expect(items.map((p) => p.id)).to.include('p01');
      });
    });
  });

  describe('TC-API-17 product details', () => {
    it('returns image, description, price, stock and specifications', () => {
      cy.fixture('products').then(({ orbita }) => {
        Api.product(orbita.id).then(({ status, body }) => {
          expect(status).to.eq(HTTP.OK);
          expect(body).to.include({ id: orbita.id, name: orbita.name, price: orbita.price, stock: orbita.stock });
          expect(body.image).to.be.a('string').and.not.be.empty;
          expect(body.description).to.be.a('string').and.not.be.empty;
          expect(body.specs).to.be.an('object').and.not.be.empty;
        });
      });
    });

    it('returns 404 for an unknown product', () => {
      Api.product('p999').its('status').should('eq', HTTP.NOT_FOUND);
    });
  });

  describe('TC-API-18 pagination, limit and category', () => {
    [1, 20].forEach((limit) => {
      it(`accepts limit=${limit}`, () => {
        Api.products({ limit }).then(({ status, body }) => {
          expect(status).to.eq(HTTP.OK);
          expect(body.items.length).to.be.at.most(limit);
        });
      });
    });

    [0, 21].forEach((limit) => {
      it(`rejects limit=${limit} with 422`, () => {
        Api.products({ limit }).its('status').should('eq', HTTP.UNPROCESSABLE);
      });
    });

    it('rejects page=0 with 422', () => {
      Api.products({ page: 0 }).its('status').should('eq', HTTP.UNPROCESSABLE);
    });

    it('pages do not overlap and together contain the whole catalog', () => {
      fetchAll({}).then((all) => {
        const ids = all.map((p) => p.id);
        expect(new Set(ids).size, 'no duplicates across pages').to.eq(ids.length);
        Api.products({ limit: RULES.pageSize }).its('body.total').should('eq', ids.length);
      });
    });

    ['Audio', 'Workspace', 'Lifestyle'].forEach((category) => {
      it(`category=${category} returns only that category`, () => {
        fetchAll({ category }).then((items) => {
          expect(items).not.to.be.empty;
          items.forEach((p) => expect(p.category, p.id).to.eq(category));
        });
      });
    });
  });
});
