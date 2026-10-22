# Pharma: design context

Design: **clean clinical blue-teal, light only, phone first**. This is implemented in the code (tokens in `constants/theme.ts`, shared components in `components/`). The original prototype look (mixed lightblue/lightgreen/black on a photo background) is gone.

## Principles
- Calm, clinical, fast to read at a busy counter. One primary colour, status colours only for stock/expiry state.
- One filled primary button per screen; everything else outlined or text.
- Flat surfaces with hairline borders. No background photo, no heavy shadows.
- Touch targets at least 44px high. Quantity steppers instead of long-press gestures.
- Light mode only. Set `userInterfaceStyle: "light"` in `app.json` and drop the dark-theme branches.

## Tokens (put these in `constants/theme.ts`)
| Token | Value | Use |
|---|---|---|
| `primary` | `#0E7C9B` | Headers, primary buttons, active tab, links |
| `primaryDark` | `#095F78` | Pressed state, text on primary tint |
| `primaryTint` | `#E3F3F8` | Thumbnails, selected chips, soft backgrounds |
| `background` | `#F5F8FA` | Screen background |
| `surface` | `#FFFFFF` | Cards, inputs, tab bar, sheets |
| `border` | `#DDE6EB` | Card/tab hairlines (0.5px) |
| `inputBorder` | `#D3DEE5` | Input outline |
| `text` | `#12202A` | Body |
| `textSecondary` | `#576873` | Labels, captions |
| `success` / `successBg` | `#17663C` / `#E4F5EA` | In stock |
| `warning` / `warningBg` | `#8A5A00` / `#FFF4DB` | Low stock |
| `danger` / `dangerBg` | `#A32D2D` / `#FDECEA` | Out of stock, expired or expiring, logout, delete |
| `overlay` | `rgba(18,32,42,0.45)` | Modal/sheet backdrop |

Spacing scale: 4, 8, 12, 16, 24. Radii: card 12, input 10, button 12, sheet 20 (top corners), avatar/thumb circle or 10.

## Typography
System font. Sizes: 22 (key numbers), 15 (screen and card titles), 12–13 (body, buttons), 11 (badges, tab labels). Two weights only: regular and medium (500). No custom font files.

## Components
- **Header**: solid `primary`, white title 15/500, optional back arrow or avatar. Home header holds a summary card overlapping its bottom edge.
- **Card**: white, 0.5px `border`, radius 12, padding 8–12.
- **Button**: primary (filled `primary`, white text), secondary (white, 0.5px `primary` border, `primary` text). Radius 12, padding 9–12.
- **Input**: white, 0.5px `inputBorder`, radius 10, label above in `textSecondary`. Barcode field carries a scan icon, expiry a date picker.
- **Badge**: radius 8, 11px; semantic colours above. Selected filter chip uses `primaryTint` / `primaryDark`.
- **List row (product)**: 34px thumbnail (tint square with pill icon when no photo), name 500, price secondary, quantity and status badge right-aligned.
- **Quantity stepper**: bordered pill with minus / count / plus.
- **Bottom tab bar**: 4 tabs (Accueil, Stock, Vente, Historique), icon 19px + 11px label, active = `primary`.
- **Floating action button** (Stock): 56px circle, `primary`, white plus, bottom-right above the tab bar.
- **Bottom sheet** (sale confirmation): white, 20px top radius, grab handle, over `overlay`.

## Screens
1. **Connexion / Inscription**: tint header with logo mark, white form (username, password with eye toggle, confirm password on register), one primary button, link to the other screen.
2. **Accueil (dashboard)**: greeting and date in the header, summary card (today's sales total in 22px, sale count), two counters (low stock = warning, expiring soon = danger), "À surveiller" list of products needing attention.
3. **Stock**: search input with barcode-scan button, filter chips (Tous / Stock bas / Expire), product rows, FAB to add a product.
4. **Détail médicament**: photo or placeholder, large quantity with status badge, key/value card (classe, prix HT, PPA, code barre), batch list with expiry badges, "Ajouter" (primary) and "Déstocker" (secondary) pinned at the bottom.
5. **Ajout produit**: photo area with camera/gallery choice, labelled inputs (two columns for class/quantity and HT/PPA), expiry date picker, full-width "Enregistrer".
6. **Vente (caisse)**: search or scan to add, cart rows with steppers, swipe to remove, fixed bottom bar with item count, total and "Encaisser".
7. **Confirmation de vente**: bottom sheet with lines, total, "Confirmer" and "Annuler".
8. **Historique**: period chips (Aujourd'hui / 7 jours / Mois), receipt rows (number, time, item count, total), tap for sale detail.
9. **Réglages**: profile with role badge, language, team (owner only), expiry alert window, low-stock threshold, logout (danger text).

## Navigation
Bottom tabs: Accueil, Stock, Vente, Historique. Detail, add product, sale detail and settings are stack screens above the tabs. Settings opens from the avatar on Accueil.

## Icons
`@expo/vector-icons`. Suggested: MaterialCommunityIcons or Ionicons for consistency (view-dashboard, package-variant, cart, history, barcode-scan, camera, calendar, receipt, account-circle). Replace the current mix of MaterialIcons, EvilIcons and FontAwesome5.

## Copy
French default, English available, sentence case, verb-first buttons ("Encaisser", "Enregistrer"), no exclamation marks. Currency format "2 720 DA".

## Implementation status
Done: tokens, shared components (`ScreenHeader`, `Button`, `Card`, `Badge`, `Chip`, `TextField`, `SearchBar`, `Stepper`, `ProductRow`, `DetailField`), 4-tab layout, all 9 screens on mock data, light mode forced.

Not done yet (needs later phases): barcode-scan buttons (stock search, add-product field, sales), date picker for expiry, swipe-to-remove in the cart (quantity 0 removes the line instead), sale detail screen, empty/loading/error states beyond the basic empty messages, dark mode (intentionally out of scope).
