// Gera src/data/cards.json a partir das imagens em public/cards/<Set>/<setCode>-<numero>-<Nome>.webp
import { readdirSync, mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CARDS_DIR = path.join(__dirname, "..", "public", "cards");
const OUT_FILE = path.join(__dirname, "..", "src", "data", "cards.json");

const SET_LABELS = {
  Delta_Reign: "Delta Reign",
  Promos: "Promos",
  Thirtieth_Collection: "30th Anniversary Collection",
};

const FILENAME_RE = /^([a-zA-Z0-9]+)-(\d+)-(.+)\.webp$/i;

const cards = [];

for (const setDir of readdirSync(CARDS_DIR, { withFileTypes: true })) {
  if (!setDir.isDirectory()) continue;
  const setFolder = setDir.name;
  const setLabel = SET_LABELS[setFolder] ?? setFolder.replace(/_/g, " ");

  const files = readdirSync(path.join(CARDS_DIR, setFolder));
  for (const file of files) {
    const m = file.match(FILENAME_RE);
    if (!m) {
      console.warn(`Ignorando arquivo fora do padrao: ${setFolder}/${file}`);
      continue;
    }
    const [, setCode, number, rawName] = m;
    const name = rawName.replace(/_/g, " ");

    cards.push({
      id: `${setFolder}-${setCode}-${number}`,
      name,
      setCode,
      setFolder,
      setLabel,
      number,
      image: `/cards/${setFolder}/${file}`,
    });
  }
}

cards.sort((a, b) =>
  a.setLabel === b.setLabel
    ? a.number.localeCompare(b.number, undefined, { numeric: true })
    : a.setLabel.localeCompare(b.setLabel)
);

mkdirSync(path.dirname(OUT_FILE), { recursive: true });
writeFileSync(OUT_FILE, JSON.stringify(cards, null, 2));

console.log(`cards.json gerado com ${cards.length} cartas -> ${OUT_FILE}`);
