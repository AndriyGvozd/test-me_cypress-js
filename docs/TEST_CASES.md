# Тест-кейси

Джерело правди — таблиця кейсів: [Test_Cases_UI.xlsx](Test_Cases_UI.xlsx), [Test_Cases_API.xlsx](Test_Cases_API.xlsx)
(та сама структура, що й у Google Sheets: ID, Section, Title, Preconditions, Test Steps, Expected result, Priority, Status, Comment).
Нижче — трасування «кейс → автотест». ID кейса стоїть на початку назви `it(...)` / `describe(...)`.

## UI (критичний функціонал)
| ID | Назва | Пріоритет | Автотест |
|---|---|---|---|
| TC-UI-1 | Оформлення замовлення з WELCOME10 і стандартною доставкою | Critical | `cypress/e2e/ui/checkout.cy.js` |
| TC-UI-2 | Відхилена оплата не створює замовлення | Critical | `cypress/e2e/ui/checkout.cy.js` |
| TC-UI-3 | Подвійне натискання не створює два замовлення | Critical | `cypress/e2e/ui/checkout.cy.js` |
| TC-UI-4 | Безкоштовна доставка від 1500 грн рахується до знижки | Critical | `cypress/e2e/ui/cart.cy.js` |
| TC-UI-5 | Кількість обмежена 1–10 і наявністю; одна позиція на товар | High | `cypress/e2e/ui/cart.cy.js` |
| TC-UI-6 | Кошик і промокод зберігаються після перезавантаження | High | `cypress/e2e/ui/cart.cy.js` |
| TC-UI-7 | Скасування замовлення | High | `cypress/e2e/ui/orders.cy.js` |
| TC-UI-8 | Повторне замовлення обмежене наявністю і 10, промокод не переноситься | High | `cypress/e2e/ui/orders.cy.js` |
| TC-UI-9 | «Почати заново» створює порожнє середовище | High | `cypress/e2e/ui/environment.cy.js` |
| TC-UI-10 | Фільтри комбінуються; межі ціни включні; сортування числове | High | `cypress/e2e/ui/catalog.cy.js` |
| TC-UI-11 | Обране перемикається, зберігається на сервері, ізольоване | Medium | `cypress/e2e/ui/favorites.cy.js` |
| TC-UI-12 | HTML у відгуку відображається як текст | Critical | `cypress/e2e/ui/reviews.cy.js` |

## API (повне покриття ендпоінтів)
| ID | Назва | Пріоритет | Ендпоінт | Автотест |
|---|---|---|---|---|
| TC-API-1 | Створення workspace | Critical | `POST /workspaces` | `api/workspace.cy.js` |
| TC-API-2 | Захищені ендпоінти вимагають валідний token | Critical | усі захищені | `api/workspace.cy.js` |
| TC-API-3 | WELCOME10 і безкоштовна стандартна доставка | Critical | `POST /quote` | `api/quote.cy.js` |
| TC-API-4 | Межа безкоштовної доставки 1500 грн до знижки | Critical | `POST /quote` | `api/quote.cy.js` |
| TC-API-5 | Експрес-доставка й округлення знижки | High | `POST /quote` | `api/quote.cy.js` |
| TC-API-6 | Регістр і пробіли промокоду; невідомий код | High | `POST /quote` | `api/quote.cy.js` |
| TC-API-7 | Обмеження кількості й наявності | Critical | `POST /quote` | `api/quote.cy.js` |
| TC-API-8 | Створення замовлення з успішною оплатою | Critical | `POST /orders`, `GET /orders`, `GET /orders/{id}` | `api/orders.cy.js` |
| TC-API-9 | Відхилена оплата | Critical | `POST /orders` | `api/orders.cy.js` |
| TC-API-10 | Валідація полів оформлення (після trim) | High | `POST /orders` | `api/orders.cy.js` |
| TC-API-11 | Скасування й повторне скасування | Critical | `POST /orders/{id}/cancel` | `api/orders.cy.js` |
| TC-API-12 | Інше середовище не має доступу до замовлення | Critical | `GET /orders/{id}`, cancel | `api/isolation.cy.js` |
| TC-API-13 | Stock — межа на одне замовлення, а не спільний склад; понад stock → 409 | High | `POST /orders` | `api/orders.cy.js` |
| TC-API-14 | Валідація відгуку, один на товар, ізоляція | High | `GET/POST /products/{id}/review` | `api/reviews.cy.js` |
| TC-API-15 | Фільтри: межі ціни, in_stock, числове сортування, пошук | High | `GET /products` | `api/products.cy.js` |
| TC-API-16 | Обране зберігається, без дублікатів, ізольоване | High | `GET/PUT /favorites` | `api/favorites.cy.js` |
| TC-API-17 | Деталі товару | Medium | `GET /products/{id}` | `api/products.cy.js` |
| TC-API-18 | Пагінація, limit і категорія | Medium | `GET /products` | `api/products.cy.js` |
| TC-API-19 | Фільтр списку замовлень за статусом | Medium | `GET /orders` | `api/orders.cy.js` |
| TC-API-20 | Старий token працює після створення нового workspace | Medium | `GET /orders` | `api/workspace.cy.js` |

Поза автотестами: `GET /api/health` перевіряється окремим тестом без ID кейса (доступність стенда). Що свідомо не покрито — див. [TEST_PLAN.md](TEST_PLAN.md#3-поза-обсягом).

<!-- added: accessibility, network errors (star tasks) + spec review -->
## 🆕 Додано пізніше
| ID | Назва | Пріоритет | Автотест | Звідки |
|---|---|---|---|---|
| TC-UI-13 | Немає критичних і серйозних порушень WCAG 2.1 AA (axe-core) | High | `cypress/e2e/ui/accessibility.cy.js` | Завдання з зірочкою — доступність, кейс у [Test_Cases_UI.xlsx](Test_Cases_UI.xlsx) |
| TC-UI-14 | Поля форм мають підписи, кнопки-іконки мають доступні назви | High | `cypress/e2e/ui/accessibility.cy.js` | те саме |
| TC-UI-15 | Оформлення замовлення лише з клавіатури | High | `cypress/e2e/ui/accessibility.cy.js` | те саме |
| TC-UI-16 | Діалоги закриваються Esc і повертають фокус | Medium | `cypress/e2e/ui/accessibility.cy.js` | те саме |
| TC-UI-17 | Кількість обмежена максимумом 10, навіть якщо stock більший | High | `cypress/e2e/ui/cart.cy.js` | Повторна звірка з ТЗ: межа 10 в UI не була перевірена, кейс у [Test_Cases_UI.xlsx](Test_Cases_UI.xlsx) |
| TC-UI-18 | Каталог показує стани завантаження й помилки та відновлюється | High | `cypress/e2e/ui/network-errors.cy.js` | Завдання з зірочкою — мережеві помилки, кейс у [Test_Cases_UI.xlsx](Test_Cases_UI.xlsx) |
| TC-UI-19 | Оформлення замовлення переживає збій мережі | Critical | `cypress/e2e/ui/network-errors.cy.js` | Завдання з зірочкою — мережеві помилки, кейс у [Test_Cases_UI.xlsx](Test_Cases_UI.xlsx) |
| TC-UI-20 | Суми не показуються, а оформлення заблоковане, поки розрахунок падає | High | `cypress/e2e/ui/network-errors.cy.js` | Завдання з зірочкою — мережеві помилки, кейс у [Test_Cases_UI.xlsx](Test_Cases_UI.xlsx) |
| TC-UI-21 | Невдале збереження обраного не показується як збережене | Medium | `cypress/e2e/ui/network-errors.cy.js` | Завдання з зірочкою — мережеві помилки, кейс у [Test_Cases_UI.xlsx](Test_Cases_UI.xlsx) |
| TC-UI-22 | Стани порожніх даних | Low | `cypress/e2e/ui/network-errors.cy.js` | Завдання з зірочкою — мережеві помилки, кейс у [Test_Cases_UI.xlsx](Test_Cases_UI.xlsx) |
| TC-UI-23 | Повторне додавання того самого товару не створює другу позицію (p07) | Medium | `cypress/e2e/ui/cart.cy.js` | Дефект BUG-8, кейс у [Test_Cases_UI.xlsx](Test_Cases_UI.xlsx) |
