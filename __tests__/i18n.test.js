import fs from "fs";
import path from "path";
import en from "../tools/en.json";
import fr from "../tools/fr.json";

const root = path.join(__dirname, "..");
const SKIP = new Set(["node_modules", ".git", ".expo", "supabase", "patches", "__tests__", "android", "ios"]);

function sourceFiles(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (SKIP.has(entry.name)) return [];
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) return sourceFiles(full);
    return /\.(jsx?|tsx?)$/.test(entry.name) ? [full] : [];
  });
}

describe("translations", () => {
  test("French and English define the same keys", () => {
    expect(Object.keys(fr).sort()).toEqual(Object.keys(en).sort());
  });

  test("no empty translation", () => {
    for (const [lang, dict] of [["fr", fr], ["en", en]]) {
      for (const [key, value] of Object.entries(dict)) {
        expect([lang, key, value.trim().length > 0]).toEqual([lang, key, true]);
      }
    }
  });

  test("every key used in the code exists in both languages", () => {
    const used = new Set();
    for (const file of sourceFiles(root)) {
      const src = fs.readFileSync(file, "utf8");
      for (const m of src.matchAll(/\bt\(\s*"([^"]+)"/g)) used.add(m[1]);
      for (const m of src.matchAll(/(?:label|title):\s*"([A-Za-z0-9]+)"/g)) used.add(m[1]);
      for (const m of src.matchAll(/return "(err[A-Za-z]+)"/g)) used.add(m[1]);
      for (const m of src.matchAll(/t\(\s*\w+\s*\?\s*"(\w+)"\s*:\s*"(\w+)"/g)) {
        used.add(m[1]);
        used.add(m[2]);
      }
    }
    const has = (dict, key) => key in dict || `${key}_one` in dict || `${key}_other` in dict;
    const missing = [...used].filter((k) => !has(fr, k) || !has(en, k));
    expect(missing).toEqual([]);
  });
});
