# Offline selling: context for a later update

Status: **deferred**. The app is built online-first (every action goes through Supabase). This file records what offline selling would need, so it can be added later without rediscovering the decisions. Decision owner: the pharmacy owner. Last updated: 2026-10-29.

## The question to settle before building
Must the pharmacy keep selling when the internet is down? If the connection is reliable, skip this file. If sales can't stop, read on.

## What offline selling means
Works offline: search, barcode scan, cart, confirming a sale, viewing stock and prices from the last sync.
Stays online-only: first login, adding or editing products, stock adjustments (Ajouter / Déstocker), reports and the dashboard, user management.

How it works:
1. **Local copy**: the phone keeps a SQLite copy of `products`, `batches` (and prices). Search, scan and the cart read from it.
2. **Sale queue**: a sale confirmed offline is stored locally as `pending` and the cart clears as usual. The local stock is decremented so the next sale sees it.
3. **Sync**: when the connection returns, pending sales are sent to Supabase in order, then fresh data is downloaded.
4. **Status indicator**: show "Hors ligne" and the number of pending sales (e.g. "3 ventes en attente"), and a clear state when a sale failed to sync.

## Tooling options
- **PowerSync** (recommended if we do it): ready-made sync between Supabase Postgres and local SQLite, handles the upload queue and downloads. Needs a PowerSync service (hosted or self-hosted) and a native build.
- **Own queue**: SQLite (expo-sqlite) or AsyncStorage for the pending sales, replayed with the same `create_sale` call. Less machinery, but we write the sync and the local stock logic ourselves.
- Firebase would have given offline for free, but we chose Supabase/Postgres for relational stock data (see CLAUDE.md).

## The hard part: conflicts
Two phones (or one offline phone and one online) can sell the **same last box**. On sync the server stock would go negative.

Recommended policy: **always accept the sale** (the customer already left with the medicine), let stock go negative, and flag the product for the owner to correct (dashboard alert plus a `stock_movements` entry with reason `sync_conflict`). Rejecting the late sale is not acceptable at a counter.

Other conflicts:
- A price changed on another phone while offline: the sale keeps the price shown to the customer (`sale_items.unit_price` is stored per line), the local copy refreshes on sync.
- A product deleted or expired meanwhile: the sale still syncs; the batch is matched by id, not by name.
- Which batch is deducted: offline picks the earliest-expiry local batch (FEFO); on sync the server re-applies FEFO and records what it actually used.

## What to do now so offline is cheap later
These cost almost nothing today and save a rewrite:
1. **Keep all data access in the service layer** (`services/*`, Phase 3). Screens never call Supabase directly. Offline then swaps the implementation behind the same functions.
2. **Create sales with a client-generated id** (UUID) and make `create_sale` **idempotent** on that id: sending the same sale twice does nothing the second time. Required for safe retries even online.
3. **`create_sale` accepts negative stock when told to** (a `allow_negative` flag or a separate sync path) and records a `sync_conflict` movement instead of failing.
4. Store `unit_price` on every `sale_items` row and `created_at` from the client clock plus a server `synced_at`.
5. Show a clear "Pas de connexion" state with retry on every screen that loads data, instead of a blank screen (Phase 3 loading/error states).

## Impact on the roadmap
- Phase 3: service layer boundaries as above.
- Phase 5: stock list reads from the local copy if offline is enabled.
- Phase 6: the sale flow changes from "call `create_sale`" to "write locally, queue, sync". Plan about 3 to 5 extra days plus testing on a real device with the network cut.
- Phase 9: tests for: sale while offline, app killed with pending sales, same last box sold on two phones, retry after partial sync.
- Needs a native build (already required for the camera and keyboard library); not usable in Expo Go.

## Open questions for the owner
1. How long can the connection be down in practice (minutes or hours)? Hours means stale prices and stock matter more.
2. How many phones sell at the same time? One phone = almost no conflicts.
3. Is negative stock flagged for correction acceptable?
4. Which actions must work offline besides selling (e.g. adding stock on delivery)?
