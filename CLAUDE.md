# Pharma: project context

Mobile pharmacy management app (stock + point of sale). Expo / React Native, French-first UI (English available). The UI is fully restyled (blue-teal design, see `DESIGN.md`) but still runs on **placeholder data** in `data/mock.js`. The Supabase backend is the next step (see Roadmap).

## Stack
- Expo ~54, React Native 0.81, React 19, `expo-router` ~6 (file-based routing, typed routes, React Compiler enabled)
- `react-i18next` + `i18next` (default `fr`, resources in `tools/fr.json`, `tools/en.json`)
- `expo-camera` (barcode scanning), `expo-image`, `expo-image-picker` + `expo-file-system/legacy` (product photos: camera or gallery), `@expo/vector-icons` (MaterialCommunityIcons everywhere)
- Styling: plain `StyleSheet` with tokens from `constants/theme.ts`. No NativeWind, so do not use `className`. Light mode only (`userInterfaceStyle: "light"`).
- Path alias `@/*` -> project root (`tsconfig.json`). Screens and components are `.jsx`; the tabs layout and theme are `.ts(x)`.
- Keyboard: `react-native-keyboard-controller` 1.18.5 with a patch (`patches/`, applied by `patch-package` in `postinstall`). Needs a native rebuild (not Expo Go).
- Backend: Supabase project `ljpbqmngwvsjitlfhljr` (client in `lib/supabase.js`, env vars in `.env`, template in `.env.example`), TanStack Query (`lib/queryClient.js`, provider in `app/_layout.jsx`). Migrations live in `supabase/` (CLI is a devDependency: `npx supabase ...`). The app still reads `data/mock.js` until Phase 3.

## Commands
```bash
npm install
npx expo start          # then a / i / w, or scan with Expo Go
npx expo lint           # must stay clean
npx tsc --noEmit        # must stay clean
```

## Structure
| Path | Role |
|---|---|
| `app/_layout.jsx` | Root `Stack` (headers hidden), loads i18n, light navigation theme from tokens |
| `app/(auth)/login.jsx`, `register.jsx` | Render `<Form screen="login\|register">` |
| `app/(tabs)/_layout.tsx` | 4 bottom tabs: `index` (Accueil), `stock`, `vente`, `historique` |
| `app/(tabs)/index.jsx` | Dashboard: today's sales, low-stock and expiring counters (tap -> filtered Stock), "À surveiller" list, avatar -> settings |
| `app/(tabs)/stock.jsx` | Search (+ barcode scan) + filter chips (Tous / Stock bas / Expire, also set via `?filter=` param), `ProductRow` list, FAB -> `/addProducts` |
| `app/(tabs)/vente.jsx` | Cart with search or barcode scan to add, swipe-to-remove, `Stepper` (0 also removes the line), bottom total bar, confirmation bottom sheet (`Modal`) |
| `app/(tabs)/historique.jsx` | Sales history with period chips and period total |
| `app/medicins.jsx` | Product detail (`?id=`): quantity + status, details card, batches with expiry badges, Ajouter / Déstocker |
| `app/addProducts.jsx` | New-product form with validation, barcode scan, month/year expiry picker; photo from camera or gallery (copied to app documents) |
| `app/settings.jsx` | Profile, language toggle (fr/en), alert settings (display only), logout -> login |
| `components/` | `KeyboardScrollView`, `ScreenHeader`, `Button`, `Card`, `Badge`, `Chip`, `TextField`, `SearchBar`, `Stepper`, `ProductRow`, `DetailField`, `EmptyState`, `BarcodeScanner`, `MonthYearPicker`, `Form` |
| `constants/theme.ts` | Design tokens: `colors`, `spacing`, `radius`, `font`, `hairline` |
| `data/mock.js` | Placeholder `products` (with batches), `sales`, `user`, `findProduct` |
| `tools/stock.js` | `stockStatus`, expiry helpers, `EXPIRY_ALERT_DAYS` (30), `formatDA`, `formatExpiry` |
| `tools/i18next.js`, `fr.json`, `en.json` | i18n setup and translations |

## Decisions
- **Backend**: Supabase (Postgres) over Firebase, because stock, batches, expiry and sales are relational and need transactions and reports.
- **Public sign-ups must be disabled** in Supabase (decided 2026-10-29; confirmed done: `disable_signup: true` in the project's auth settings; anonymous sign-ins off, email auto-confirm on). Only the owner creates staff accounts (dashboard now, in-app "Équipe" later). In Phase 4 the register screen is removed or replaced by a "ask your owner for an account" message.
- **Online-first**: every action goes through Supabase. Offline selling is deferred; see `docs/OFFLINE_SELLING.md` for the plan, conflict policy and what to prepare now (service layer, idempotent `create_sale` with a client-generated sale id).
- **One pharmacy** for now; add `pharmacy_id` to tables only if multi-pharmacy is ever needed.
- **Design**: blue-teal, light only, phone first (`DESIGN.md`). Android is edge-to-edge with the patched keyboard library (see Rules).

## Domain vocabulary (French UI terms)
- **Stock**: inventory. **Vente**: sale. **Déstocker**: remove stock. **Péremption**: expiry.
- **Prix HT**: purchase price excl. tax. **PPA**: public sale price. **Classe**: therapeutic/product class.
- Currency: **DA** (Algerian dinar), formatted "2 720 DA" via `formatDA`.
- A **product** is a kind of medicine; a **batch** is a delivery with its own quantity and expiry date. Product quantity = sum of its batches.

## Current state (what is real vs placeholder)
- Real UI behaviour on mock data: navigation, barcode scanning (needs a camera; test on a device), swipe-to-remove, add-product validation, search and filters, cart add/remove/quantity, sale confirmation sheet (clears the cart only), period filter on history, language switch, photo picking.
- Not wired yet (needs the backend):
  - `Form` submit is an empty stub, with no auth guard (the app opens on Accueil).
  - "Enregistrer" in add-product, "Ajouter" / "Déstocker" in the detail screen, and the sale confirmation do not persist anything.
  - Settings thresholds are display only.
- Mock expiry dates are generated relative to today, so the "expiring soon" counters always show demo data.

## Conventions
- Components are PascalCase function components (hooks require it; lint enforces).
- All user-facing text goes through `t('key')`; add keys to **both** `fr.json` and `en.json`. Plurals use `_one` / `_other` suffixes (e.g. `items`, `salesCount`).
- Colours, spacing, radii and font sizes come from `constants/theme.ts`; do not hard-code hex values in screens.
- One filled primary `Button` per screen; use `variant="secondary"` or `"danger"` otherwise. Touch targets at least 44px.
- Reuse the shared components before creating new ones; screens read data only through `data/mock.js` today, and through a service layer after the Supabase phase.
- Keep `expo lint` and `tsc --noEmit` clean before committing.

## Docs
- `DESIGN.md`: visual language, tokens, screens.
- `docs/OFFLINE_SELLING.md`: deferred offline-selling plan.
- `C:\workspace\Project_manager\docs\PM_KEYBOARD_CONTEXT.md`: why the keyboard setup looks the way it does (other project).

## Roadmap (Supabase backend)
0. Front-end cleanup: **done**
0b. Blue-teal redesign on mock data: **done**
1. Supabase project, `.env` (`EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_KEY` = publishable key), CLI + migrations: **done** (CLI logged in and linked to project `pharma`, eu-central-1, Postgres 17; public sign-ups off)
2. Schema: **done and live** on the project (migrations in `supabase/migrations/`: tables `profiles`, `products`, `batches`, `sales`, `sale_items`, `stock_movements`; view `product_stock`; RLS; functions `adjust_stock`, `create_sale` (FEFO, idempotent on sale id, prices from the server, expired batches never sold), `set_user_role`; public bucket `product-images`). Tested by `supabase/tests/stock_logic.sql` (29 checks, always rolls back): `npx supabase db query --linked -f supabase/tests/stock_logic.sql` prints `TESTS_PASSED`.
3. Client (`lib/supabase.js`), service layer (`services/*`), TanStack Query provider; replace `data/mock.js`
4. Auth (wire `Form`, `AuthProvider`, route guard)
5. Stock screens on real data (list, search, add, detail, image upload, Ajouter/Déstocker)
6. Sales: checkout via `create_sale`, barcode scan, sale detail
7. Dashboard on real data; expiry/low-stock alerts
8. Roles (owner/staff), team management, editable thresholds
9. Hardening and tests; 10. optional offline; 11. EAS release

## Database rules (Supabase)
- Stock and sales are written ONLY through `adjust_stock` and `create_sale` (`supabase.rpc`); the tables have no insert/update policies for sales, sale items or movements. The first account created becomes the owner (trigger `handle_new_user`); later ones are staff.
- Staff can create products, sell and adjust stock; only the owner edits prices, deletes products, corrects batches and changes roles (`set_user_role`).
- Error codes come back as the message of the Postgres error: `insufficient_stock` (detail = product name), `expiry_required`, `invalid_quantity`, `product_not_found`, `empty_sale`, `not_authenticated`, `forbidden`, `last_owner`.
- Change the schema only with a new migration file (`npx supabase migration new name`), then `npx supabase db push --linked`. Never edit an applied migration. No Docker here: test against the linked project with the rollback test above.
- Qty in `product_stock` counts only non-expired batches; `expired_qty` is stock past its expiry date. `batches.quantity >= 0` is enforced; offline selling would need to relax this (see `docs/OFFLINE_SELLING.md`).

## Rules
- Android is edge-to-edge, so the keyboard does not resize the window. Any screen with text fields must use `components/KeyboardScrollView` (never `ScrollView` or `KeyboardAvoidingView`); `KeyboardProvider` wraps the app in `app/_layout.jsx`. On full-screen forms without a header, put a fixed `View` of height `insets.top` above the scroll view so the content never scrolls under the status bar (see `components/Form.jsx`). Do not upgrade the keyboard library without regenerating the patch; reference: `C:\workspace\Project_manager\docs\PM_KEYBOARD_CONTEXT.md`.
- Never put the Supabase `service_role` key in the app or repo; only the anon key. Keep `.env` out of git.
- Stock changes must go through server-side functions (transactions), never client-side read-modify-write.
