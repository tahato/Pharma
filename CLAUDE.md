# Pharma: project context

Mobile pharmacy management app (stock + point of sale). Expo / React Native, French-first UI (English available). The UI (blue-teal design, see `DESIGN.md`) now runs on the **real Supabase backend**: sign-in, stock, sales, history and dashboard all read and write the database. Not yet tested on a device with a real account (see Current state).

## Stack
- Expo ~54, React Native 0.81, React 19, `expo-router` ~6 (file-based routing, typed routes, React Compiler enabled)
- `react-i18next` + `i18next` (default `fr`, resources in `tools/fr.json`, `tools/en.json`)
- `expo-camera` (barcode scanning), `expo-image`, `expo-image-picker` + `expo-file-system/legacy` (product photos: camera or gallery), `@expo/vector-icons` (MaterialCommunityIcons everywhere)
- Styling: plain `StyleSheet` with tokens from `constants/theme.ts`. No NativeWind, so do not use `className`. Light mode only (`userInterfaceStyle: "light"`).
- Path alias `@/*` -> project root (`tsconfig.json`). Screens and components are `.jsx`; the tabs layout and theme are `.ts(x)`.
- Keyboard: `react-native-keyboard-controller` 1.18.5 with a patch (`patches/`, applied by `patch-package` in `postinstall`). Needs a native rebuild (not Expo Go).
- Backend: Supabase project `ljpbqmngwvsjitlfhljr` (client in `lib/supabase.js`, env vars in `.env`, template in `.env.example`), TanStack Query (`lib/queryClient.js`, provider in `app/_layout.jsx`). Migrations live in `supabase/` (CLI is a devDependency: `npx supabase ...`). Data access goes through `services/*` (screens never call Supabase directly); auth through `lib/auth.jsx`.

## Commands
```bash
npm install
npx expo start          # then a / i / w, or scan with Expo Go
npx expo lint           # must stay clean
npx tsc --noEmit        # must stay clean
npm test                # Jest (jest-expo): stock helpers, error mapping, translations
```
Database tests (rollback SQL, run after any schema change): `npx supabase db query --linked -f supabase/tests/<file>.sql` for `stock_logic`, `app_support`, `product_admin`, `team_settings`; each must print `TESTS_PASSED`. Security/performance check: `npx supabase db advisors --linked` (the only expected warnings are the 7 `SECURITY DEFINER` functions the app must call as a signed-in user; each checks the caller itself).

## Structure
| Path | Role |
|---|---|
| `app/_layout.jsx` | Providers (Query, Auth, Keyboard, Gesture) + route guard: `Stack.Protected` shows `(auth)` when signed out and the app when signed in |
| `app/(auth)/login.jsx`, `register.jsx` | Sign-in and registration (both render `components/Form` with `mode`). Register: name, e-mail, password (8+), confirm |
| `app/(tabs)/_layout.tsx` | 4 bottom tabs: `index` (Accueil), `stock`, `vente`, `historique` |
| `app/(tabs)/index.jsx` | Dashboard from `services/dashboard.js`: today's sales, low-stock and expiring counters (tap -> filtered Stock), watch list, avatar -> settings |
| `app/(tabs)/stock.jsx` | Infinite list of `product_stock` (server-side search, filters `?filter=low\|expiring`), barcode scan, FAB -> `/addProducts` |
| `app/(tabs)/vente.jsx` | Cart (search or scan to add, swipe-to-remove, `Stepper`), confirmation sheet -> `create_sale` with one idempotent sale id per cart content |
| `app/(tabs)/historique.jsx` | Sales by period (today / 7 days / month) with total; row -> `/saleDetail` |
| `app/saleDetail.jsx` | One sale (`?id=`): lines grouped per product, total |
| `app/medicins.jsx` | Product detail (`?id=`): stock, details, batches; Ajouter / Déstocker open `StockAdjustSheet` -> `adjust_stock`; pencil (owner only) -> edit |
| `app/addProducts.jsx` | New product (validation, barcode scan, month/year expiry, photo camera/gallery) -> photo upload + `create_product`. Opened with `?id=` it edits the product (owner only: `update_product`, quantity/expiry hidden) and offers "Supprimer" (`archive_product`) |
| `app/settings.jsx` | Profile and role, language toggle (fr/en), Équipe (owner), expiry alert window (owner edits it in a sheet, staff read it), sign out |
| `app/team.jsx` | Owner only: team list; FAB creates an employee (`CreateStaffSheet`), tap a member for `MemberSheet` (reset password, owner/staff role, deactivate/reactivate) |
| `components/` | `KeyboardScrollView`, `ScreenHeader`, `Button` (has `loading`), `Card`, `Badge`, `Chip`, `TextField`, `SearchBar`, `Stepper`, `ProductRow`, `DetailField`, `EmptyState`, `LoadingState`, `ErrorState`, `BarcodeScanner`, `MonthYearPicker`, `StockAdjustSheet`, `BottomSheet` (generic keyboard-safe sheet), `CreateStaffSheet`, `MemberSheet`, `Form` (sign-in and register) |
| `services/` | `products.js`, `sales.js`, `dashboard.js`, `team.js`, `settings.js` (all Supabase calls), `errors.js` (error -> translation key), `invalidate.js` (query invalidation after stock/sales changes) |
| `lib/` | `supabase.js` (client), `auth.jsx` (AuthProvider, `useAuth`: session, profile, `isOwner`), `queryClient.js`, `settings.js` (`useSettings()` -> `expiryDays`, default 30), `useDebounce.js` |
| `constants/theme.ts` | Design tokens: `colors`, `spacing`, `radius`, `font`, `hairline` |
| `tools/stock.js` | `stockStatus`, expiry helpers, `EXPIRY_ALERT_DAYS` (30), `formatDA`, `formatExpiry`, `localDateString` |
| `tools/i18next.js`, `fr.json`, `en.json` | i18n setup and translations |
| `supabase/` | `migrations/` (schema, functions, storage, app support, archive, team/settings), `tests/` (rollback SQL tests), `functions/manage-staff` (Deno edge function), `config.toml` |

## Decisions
- **Backend**: Supabase (Postgres) over Firebase, because stock, batches, expiry and sales are relational and need transactions and reports.
- **Open registration** (decided 2026-11, replaces the earlier plan to disable sign-ups): anyone can register from the app's register screen. The FIRST account ever created becomes the owner (trigger `handle_new_user`); every later one is an active employee with no approval step. The owner can still deactivate accounts, reset passwords and change roles in Équipe. Supabase must have "Allow new users to sign up" ON and, for instant activation, "Confirm email" OFF (the register screen also handles the confirmation case with a notice). Risk accepted by the owner: anyone with the app can create an account and see stock and sales; register the owner account BEFORE sharing the app, because the first registrant becomes owner.
- **Online-first**: every action goes through Supabase. Offline selling is deferred; see `docs/OFFLINE_SELLING.md` for the plan, conflict policy and what to prepare now (service layer, idempotent `create_sale` with a client-generated sale id).
- **One pharmacy** for now; add `pharmacy_id` to tables only if multi-pharmacy is ever needed.
- **Design**: blue-teal, light only, phone first (`DESIGN.md`). Android is edge-to-edge with the patched keyboard library (see Rules).

## Domain vocabulary (French UI terms)
- **Stock**: inventory. **Vente**: sale. **Déstocker**: remove stock. **Péremption**: expiry.
- **Prix HT**: purchase price excl. tax. **PPA**: public sale price. **Classe**: therapeutic/product class.
- Currency: **DA** (Algerian dinar), formatted "2 720 DA" via `formatDA`.
- A **product** is a kind of medicine; a **batch** is a delivery with its own quantity and expiry date. Product quantity = sum of its batches.

## Current state
- Everything is wired to Supabase: register, sign-in/out with a persisted session, stock list/search/filters, product creation (with photo), Ajouter/Déstocker, sales through `create_sale`, history, sale detail, dashboard counters.
- **Verified**: database functions and permissions (`supabase/tests/*.sql`), anonymous access refused, TypeScript, lint, Android bundle. **Not yet verified**: the app against the live database with a real signed-in account, photo upload, the keyboard fix and the barcode scanner on a device. Test these first.
- Needs the first account: register the owner from the app's register screen BEFORE sharing the app (the first account becomes the owner).
- Edit and delete (archive) product: done, owner only.
- Team management (create employees, reset passwords, change roles, deactivate) and the editable expiry window: done, owner only.
- Not done: password reset by e-mail (the sign-in screen tells users to ask the owner, who resets it in Équipe), per-product minimum is the only low-stock threshold, offline selling (deferred).

## Conventions
- Components are PascalCase function components (hooks require it; lint enforces).
- All user-facing text goes through `t('key')`; add keys to **both** `fr.json` and `en.json`. Plurals use `_one` / `_other` suffixes (e.g. `items`, `salesCount`).
- Colours, spacing, radii and font sizes come from `constants/theme.ts`; do not hard-code hex values in screens.
- One filled primary `Button` per screen; use `variant="secondary"` or `"danger"` otherwise. Touch targets at least 44px.
- Reuse the shared components before creating new ones. Screens get data only through `services/*` with TanStack Query (`useQuery`, `useInfiniteQuery`, `useMutation`); after a write call `invalidateStock` / `invalidateSales`. Show `LoadingState` / `ErrorState` / `EmptyState` for every list.
- Keep `expo lint` and `tsc --noEmit` clean before committing.

## Docs
- `DESIGN.md`: visual language, tokens, screens.
- `docs/OFFLINE_SELLING.md`: deferred offline-selling plan.
- `C:\workspace\Project_manager\docs\PM_KEYBOARD_CONTEXT.md`: why the keyboard setup looks the way it does (other project).

## Roadmap (Supabase backend)
0. Front-end cleanup: **done**
0b. Blue-teal redesign on mock data: **done**
1. Supabase project, `.env` (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_KEY` = publishable key), CLI + migrations: **done** (CLI logged in and linked to project `pharma`, eu-central-1, Postgres 17)
2. Schema: **done and live** on the project (migrations in `supabase/migrations/`: tables `profiles`, `products`, `batches`, `sales`, `sale_items`, `stock_movements`; view `product_stock`; RLS; functions `adjust_stock`, `create_sale` (FEFO, idempotent on sale id, prices from the server, expired batches never sold), `set_user_role`; public bucket `product-images`). Migration `20261031100000_app_support.sql` adds `is_low` and `earliest_expiry` to `product_stock` and the `create_product` function. Tested by `supabase/tests/stock_logic.sql` (29 checks) and `app_support.sql` (13 checks), both roll back: `npx supabase db query --linked -f supabase/tests/<file>.sql` prints `TESTS_PASSED`.
3. Client, service layer, TanStack Query, loading/error states; mock data removed: **done**
4. Auth (sign-in and register, `AuthProvider`, route guard, sign out): **done**
5. Stock screens on real data (list, search, add, detail, image upload, Ajouter/Déstocker): **done** (edit and delete/archive included)
6. Sales: checkout via `create_sale`, barcode scan, sale detail: **done**
7. Dashboard on real data: **done** (counters and watch list; push notifications not planned)
8. Roles (owner/staff), team management, editable expiry window: **done**
9. Hardening and tests: **in progress** (done: advisor review and fix, sales totals fix, Jest tests for helpers/errors/translations, 78 SQL checks; to do: a real-account try-out on a device; dashboard settings below). 10. optional offline; 11. EAS release
   - Supabase dashboard items to set by hand: minimum password length 8 (Authentication > Sign In / Providers > Email); consider shorter JWT expiry if instant deactivation matters; backups: the free plan has none, paid plans have daily backups, so decide before real data goes in.

## Database rules (Supabase)
- "Deleting" a product ARCHIVES it (`products.archived_at`, function `archive_product`): `product_stock`, search, scans, `create_sale` and `adjust_stock` ignore archived products, but sales and movements keep their history. A barcode is unique only among active products. `update_product` and `archive_product` are owner-only and raise `forbidden` for staff. Test: `supabase/tests/product_admin.sql` (20 checks).
- Stock and sales are written ONLY through `adjust_stock`, `create_sale` and `create_product` (`supabase.rpc`); the tables have no insert/update policies for sales, sale items or movements. The first account created becomes the owner (trigger `handle_new_user`); later ones are staff.
- Staff can create products, sell and adjust stock; only the owner edits prices, deletes products, corrects batches and changes roles (`set_user_role`).
- Error codes come back as the message of the Postgres error: `insufficient_stock` (detail = product name), `expiry_required`, `invalid_quantity`, `product_not_found`, `empty_sale`, `not_authenticated`, `forbidden`, `last_owner`.
- Change the schema only with a new migration file (`npx supabase migration new name`), then `npx supabase db push --linked`. Never edit an applied migration. No Docker here: test against the linked project with the rollback test above.
- Qty in `product_stock` counts only non-expired batches; `expired_qty` is stock past its expiry date. `batches.quantity >= 0` is enforced; offline selling would need to relax this (see `docs/OFFLINE_SELLING.md`).

- Team: `profiles` also holds `email` (copied by the trigger) and `active`. Accounts are created, passwords reset and users (de)activated ONLY by the edge function `supabase/functions/manage-staff` (needs the service key, which exists only on the server; it first checks `is_owner()`). Deploy: `npx supabase functions deploy manage-staff --use-api --project-ref ljpbqmngwvsjitlfhljr`. Roles change through `set_user_role`. Deactivating bans the user (no new sessions); an already issued token can keep working until it expires (about 1 hour).
- `app_settings` is a single row (`expiry_alert_days`, 1 to 365): everyone reads, only the owner updates. The app reads it with `useSettings()` and passes `expiryDays` to the services; the constant `EXPIRY_ALERT_DAYS` is only the default.
- Totals (history header, dashboard today) come from `sales_summary(p_from)` so they stay right with any number of sales; the sales list loads only the latest 200 of a period (`SALES_LIST_LIMIT`).
- `handle_new_user` is a trigger function: EXECUTE is revoked from public/anon/authenticated so it is not an API endpoint. Create the very first account after any change to it and check that a profile appears (the test login cannot reproduce the auth service's own insert).
- Tests: `stock_logic` (29), `app_support` (15), `product_admin` (20), `team_settings` (14) = 78 checks.

## Rules
- Android is edge-to-edge, so the keyboard does not resize the window. Any screen with text fields must use `components/KeyboardScrollView` (never `ScrollView` or `KeyboardAvoidingView`); `KeyboardProvider` wraps the app in `app/_layout.jsx`. On full-screen forms without a header, put a fixed `View` of height `insets.top` above the scroll view so the content never scrolls under the status bar (see `components/Form.jsx`). Do not upgrade the keyboard library without regenerating the patch; reference: `C:\workspace\Project_manager\docs\PM_KEYBOARD_CONTEXT.md`.
- Safe areas: screens do NOT use `<SafeAreaView>`; they use `useSafeAreaInsets()`. The top inset is added by `ScreenHeader` (and by the fixed spacer in `Form`); the bottom tab bar handles its own bottom inset. Anything that can sit at the bottom of a screen without the tab bar (stack screens, fixed action bars, FABs, scroll content, every Modal sheet, the scanner) must add `insets.bottom`, because Android is edge-to-edge and the navigation bar would cover it.
- Never put the Supabase `service_role` key in the app or repo; only the anon key. Keep `.env` out of git.
- Stock changes must go through server-side functions (transactions), never client-side read-modify-write.
