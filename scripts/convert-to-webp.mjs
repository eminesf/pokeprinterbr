// Converte imagens para WEBP.
//
// Fluxo: crie uma subpasta com o nome da colecao dentro de "para converter/"
// (ex: "para converter/Nova_Colecao/001-Pikachu.png") e rode este script.
// As imagens convertidas vao para public/cards/<Colecao>/ com o mesmo nome,
// so que em .webp -- pronto pro app e pro generate-manifest.mjs usarem.
//
// "para converter/" fica no .gitignore de proposito: guarda os PNG/JPG
// originais localmente sem inflar o repo (so o .webp final e versionado).
//
// Uso:
//   node scripts/convert-to-webp.mjs

import { readdirSync, mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SOURCE_DIR = path.join(__dirname, "..", "para converter");
const OUTPUT_DIR = path.join(__dirname, "..", "public", "cards");
const WEBP_QUALITY = 82;
const WEBP_EFFORT = 6; // 0-6, mais alto = mais lento e comprime melhor
const IMAGE_RE = /\.(png|jpe?g)$/i;

async function main() {
  if (!existsSync(SOURCE_DIR)) {
    console.log(`Pasta nao encontrada: ${SOURCE_DIR}`);
    console.log(
      'Crie "para converter/<Nome da Colecao>/" e coloque as imagens (png/jpg) la dentro.'
    );
    return;
  }

  const collections = readdirSync(SOURCE_DIR, { withFileTypes: true }).filter(
    (e) => e.isDirectory()
  );

  if (collections.length === 0) {
    console.log('Nenhuma subpasta de colecao dentro de "para converter/".');
    return;
  }

  let converted = 0;
  let failed = 0;

  for (const collection of collections) {
    const srcDir = path.join(SOURCE_DIR, collection.name);
    const outDir = path.join(OUTPUT_DIR, collection.name);
    const files = readdirSync(srcDir).filter((f) => IMAGE_RE.test(f));

    if (files.length === 0) continue;
    mkdirSync(outDir, { recursive: true });

    for (const file of files) {
      const srcPath = path.join(srcDir, file);
      const outName = file.replace(IMAGE_RE, ".webp");
      const outPath = path.join(outDir, outName);

      try {
        await sharp(srcPath)
          .webp({ quality: WEBP_QUALITY, effort: WEBP_EFFORT })
          .toFile(outPath);
        converted++;
        console.log(`OK    ${collection.name}/${file} -> ${collection.name}/${outName}`);
      } catch (err) {
        failed++;
        console.error(`FALHA ${collection.name}/${file}: ${err.message}`);
      }
    }
  }

  console.log(`\nConcluido: ${converted} convertida(s), ${failed} falha(s).`);
  if (converted > 0) {
    console.log(
      'Rode "node scripts/generate-manifest.mjs" para atualizar o catalogo (cards.json).'
    );
  }
}

main();
