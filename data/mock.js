// Placeholder data used until the Supabase backend is connected.
const day = 86400000;
const inDays = (n) => new Date(Date.now() + n * day).toISOString();

function product(id, name, barcode, classe, priceHt, ppa, minStock, batches) {
  const withDates = batches.map(([qty, days]) => ({ qty, expiry: inDays(days) }));
  return {
    id,
    name,
    barcode,
    classe,
    priceHt,
    ppa,
    minStock,
    batches: withDates,
    qty: withDates.reduce((sum, b) => sum + b.qty, 0),
  };
}

export const user = { name: "Sara B.", role: "owner" };

export const products = [
  product("1", "Doliprane 500", "6130012345", "Antalgique", 260, 320, 10, [[40, 20], [46, 700]]),
  product("2", "Amoxil 1g", "6130012346", "Antibiotique", 700, 850, 5, [[4, 400]]),
  product("3", "Spasfon", "6130012347", "Antispasmodique", 330, 410, 5, []),
  product("4", "Efferalgan 1g", "6130012348", "Antalgique", 290, 360, 10, [[52, 500]]),
  product("5", "Ventoline", "6130012349", "Bronchodilatateur", 480, 590, 5, [[18, 300]]),
  product("6", "Smecta", "6130012350", "Antidiarrhéique", 210, 260, 5, [[3, 25]]),
  product("7", "Augmentin 1g", "6130012351", "Antibiotique", 900, 1100, 5, [[30, 600]]),
];

export const sales = [
  { id: "148", time: "14:32", itemCount: 6, total: 2720, daysAgo: 0 },
  { id: "147", time: "13:58", itemCount: 2, total: 640, daysAgo: 0 },
  { id: "146", time: "12:10", itemCount: 1, total: 850, daysAgo: 0 },
  { id: "145", time: "11:45", itemCount: 4, total: 1480, daysAgo: 0 },
  { id: "140", time: "17:20", itemCount: 3, total: 1190, daysAgo: 3 },
  { id: "122", time: "10:05", itemCount: 5, total: 2310, daysAgo: 12 },
];

export function findProduct(id) {
  return products.find((p) => p.id === id) ?? products[0];
}
