# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

The project guidance lives in `AGENTS.md` (stack, architecture, conventions, verification) and `WORKPLAN.md` (phases, data model, API surface, open questions). Both are imported here; keep them as the single source of truth instead of duplicating content in this file.

@AGENTS.md
@WORKPLAN.md

## Commands not covered above

```
cd backend  && php artisan test --filter=ApiTest            # one test class
cd backend  && php artisan test --filter=test_method_name   # one test method
cd backend  && php artisan db:seed                          # (re)seed from database/seeders/content.json; never overwrites admin edits
cd frontend && npx tsc -b                                   # type-check only
```

- Tests run on in-memory SQLite (`backend/phpunit.xml`), so they don't need MySQL running and never touch the `legitech` database.
- Use the PHP at `C:\php-8.3.35` for `php`/`composer`, not XAMPP's bundled PHP.
- Frontend lint is `oxlint` (not ESLint).
- The Vite dev server proxies `/api` to `http://127.0.0.1:8000`, so the admin's session cookie and CSRF work only when the site is opened through `localhost:5173`, not by hitting `:8000` directly.

## Cross-cutting rules

A change to a content type usually touches four places that must stay in sync: the migration/model in `backend/`, the public resource/controller (`Api/*`) plus `frontend/src/lib/api.ts` types, the admin validation rules in `Admin/ContentController.php`, and the field list in `frontend/src/admin/content-types.ts`.
