# Copilot Instructions

## Project overview
- Library entry point re-exports `ConnectDB` and `Model` from [src/index.js](src/index.js).
- `Model` extends `adodb-query-builder`'s `QueryBuilder` and embeds a chainable `QueryChain` that builds SQL strings and runs them via `ConnectDB.connection` in [src/Model.js](src/Model.js).
- Models define columns with `this.Column(type)` in the constructor and set `Class.tableName` explicitly; see [src/ModelExample.js](src/ModelExample.js) and tests.

## Key patterns and conventions
- Use `Model.newQuery()` to build chain queries; it returns a `QueryChain` bound to the model's `tableName` ([src/Model.js](src/Model.js)).
- `QueryChain.where()` auto-wraps string values in single quotes, while `whereRaw()` injects raw SQL without escaping; tests in [test/querychain.test.js](test/querychain.test.js) show expected SQL.
- `Model.where()` also auto-quotes string values before delegating to `QueryBuilder.where()`; see [src/Model.js](src/Model.js).
- `Model.delete(whereObj)` manually builds a DELETE SQL string and calls `ConnectDB.connection.execute()` ([src/Model.js](src/Model.js)).
- SQL generation ends with a semicolon; `toSql()` is the debugging hook tested in [test/model.test.js](test/model.test.js).
- `QueryChain.buildQuery()` currently emits `LIMIT/OFFSET` even though Access uses `TOP`; this is noted in a comment and may affect tests or DB behavior ([src/Model.js](src/Model.js)).

## Workflows
- Install deps: `npm install`.
- Run the example against the bundled Access DB: `npm start` (uses [src/ExampleUse.js](src/ExampleUse.js) and [test/example.mdb](test/example.mdb)).
- Run tests: `npm test` (Mocha TDD UI, see [test/model.test.js](test/model.test.js) and [test/querychain.test.js](test/querychain.test.js)).

## Integration notes
- Database access flows through `ConnectDB.connect(connectionString)` from `adodb-query-builder`; see usage in [src/ExampleUse.js](src/ExampleUse.js).
- Query execution uses `ConnectDB.connection.query()` for SELECTs and `ConnectDB.connection.execute()` for DELETEs ([src/Model.js](src/Model.js)).

## When adding features
- Keep the chainable API consistent with existing methods (`select`, `join`, `where`, `orderBy`, `limit`, `offset`) in [src/Model.js](src/Model.js).
- Update or extend SQL expectations in tests when changing query rendering logic; see [test/model.test.js](test/model.test.js).

# General Code Review Standards

## Code Quality Essentials

- Functions should be focused and appropriately sized
- Use clear, descriptive naming conventions
- Ensure proper error handling throughout

## Security Standards

- Never hardcode secrets, API keys, or credentials in the codebase
- Validate all user inputs
- Verify proper sanitization
- Use parameterized queries to prevent SQL injection
- Look for XSS vulnerabilities

## Documentation Expectations

- All public functions must include doc comments
- Complex algorithms should have explanatory comments
- README files must be kept up to date

## Naming Conventions

Use descriptive, intention-revealing names.

```javascript
// Avoid
const d = new Date();
const x = users.filter(u => u.active);

// Prefer
const currentDate = new Date();
const activeUsers = users.filter(user => user.isActive);
```
