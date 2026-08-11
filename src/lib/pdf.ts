import { jsPDF } from "jspdf";
import type { Card, CartLine } from "../types";

// Tamanho real de uma carta de Pokemon: 63 x 88mm.
// Proxies saem 3% menores para compensar o encaixe no sleeve por cima da carta real.
const REAL_CARD_WIDTH_MM = 63;
const REAL_CARD_HEIGHT_MM = 88;
const PROXY_SCALE = 0.97;

export const CARD_WIDTH_MM = REAL_CARD_WIDTH_MM * PROXY_SCALE;
export const CARD_HEIGHT_MM = REAL_CARD_HEIGHT_MM * PROXY_SCALE;

// Espaco entre cartas na folha: nao faz parte do tamanho da carta, existe so
// para dar lugar a uma linha de corte que nao passe em cima da arte.
const GUTTER_MM = 1;
const CROP_MARK_OVERHANG_MM = 4;

export type PageSize = "a4" | "letter";

export interface ExportOptions {
  pageSize: PageSize;
  cropMarks: boolean;
}

export interface ExportProgress {
  done: number;
  total: number;
}

interface LoadedImage {
  dataUrl: string;
  format: "PNG";
}

// jsPDF le WEBP nativamente, mas por baixo dos panos decodifica e reconverte
// pra JPEG (perde o canal alpha, o que estragaria a transparencia dos cantos
// arredondados da carta). Por isso decodificamos via canvas no browser e
// sempre embutimos como PNG, que preserva alpha e funciona pra qualquer
// formato de origem (webp, png, jpg).
async function loadImageAsDataUrl(url: string): Promise<LoadedImage> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Falha ao carregar imagem ${url}: HTTP ${res.status}`);
  const blob = await res.blob();
  const objectUrl = URL.createObjectURL(blob);

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`Falha ao decodificar imagem ${url}`));
      image.src = objectUrl;
    });

    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas 2D indisponivel neste navegador");
    ctx.drawImage(img, 0, 0);

    return { dataUrl: canvas.toDataURL("image/png"), format: "PNG" };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function computeGrid(pageWidth: number, pageHeight: number) {
  const cols = Math.max(
    1,
    Math.floor((pageWidth + GUTTER_MM) / (CARD_WIDTH_MM + GUTTER_MM))
  );
  const rows = Math.max(
    1,
    Math.floor((pageHeight + GUTTER_MM) / (CARD_HEIGHT_MM + GUTTER_MM))
  );
  const gridWidth = cols * CARD_WIDTH_MM + (cols - 1) * GUTTER_MM;
  const gridHeight = rows * CARD_HEIGHT_MM + (rows - 1) * GUTTER_MM;
  const offsetX = (pageWidth - gridWidth) / 2;
  const offsetY = (pageHeight - gridHeight) / 2;
  return { cols, rows, gridWidth, gridHeight, offsetX, offsetY };
}

function drawCropMarks(
  doc: jsPDF,
  grid: ReturnType<typeof computeGrid>
) {
  const { cols, rows, gridWidth, gridHeight, offsetX, offsetY } = grid;

  doc.setDrawColor(140);
  doc.setLineWidth(0.1);

  const yStart = offsetY - CROP_MARK_OVERHANG_MM;
  const yEnd = offsetY + gridHeight + CROP_MARK_OVERHANG_MM;
  for (let c = 0; c <= cols; c++) {
    let x: number;
    if (c === 0) x = offsetX;
    else if (c === cols) x = offsetX + gridWidth;
    else x = offsetX + c * CARD_WIDTH_MM + (c - 1) * GUTTER_MM + GUTTER_MM / 2;
    doc.line(x, yStart, x, yEnd);
  }

  const xStart = offsetX - CROP_MARK_OVERHANG_MM;
  const xEnd = offsetX + gridWidth + CROP_MARK_OVERHANG_MM;
  for (let r = 0; r <= rows; r++) {
    let y: number;
    if (r === 0) y = offsetY;
    else if (r === rows) y = offsetY + gridHeight;
    else y = offsetY + r * CARD_HEIGHT_MM + (r - 1) * GUTTER_MM + GUTTER_MM / 2;
    doc.line(xStart, y, xEnd, y);
  }
}

export function cardsPerPage(pageSize: PageSize): number {
  const doc = new jsPDF({ unit: "mm", format: pageSize, orientation: "portrait" });
  const { cols, rows } = computeGrid(
    doc.internal.pageSize.getWidth(),
    doc.internal.pageSize.getHeight()
  );
  return cols * rows;
}

export async function exportCartToPdf(
  lines: CartLine[],
  options: ExportOptions,
  onProgress?: (progress: ExportProgress) => void
): Promise<void> {
  const queue: Card[] = [];
  for (const line of lines) {
    for (let i = 0; i < line.qty; i++) queue.push(line.card);
  }
  if (queue.length === 0) return;

  const doc = new jsPDF({ unit: "mm", format: options.pageSize, orientation: "portrait" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const grid = computeGrid(pageWidth, pageHeight);
  const perPage = grid.cols * grid.rows;

  const cache = new Map<string, LoadedImage>();
  const total = queue.length;
  let done = 0;
  let index = 0;
  let firstPage = true;

  while (index < queue.length) {
    if (!firstPage) doc.addPage();
    firstPage = false;

    for (let slot = 0; slot < perPage && index < queue.length; slot++, index++) {
      const card = queue[index];
      let img = cache.get(card.image);
      if (!img) {
        img = await loadImageAsDataUrl(card.image);
        cache.set(card.image, img);
      }
      const col = slot % grid.cols;
      const row = Math.floor(slot / grid.cols);
      const x = grid.offsetX + col * (CARD_WIDTH_MM + GUTTER_MM);
      const y = grid.offsetY + row * (CARD_HEIGHT_MM + GUTTER_MM);
      doc.addImage(img.dataUrl, img.format, x, y, CARD_WIDTH_MM, CARD_HEIGHT_MM);

      done++;
      onProgress?.({ done, total });
    }

    if (options.cropMarks) drawCropMarks(doc, grid);
  }

  const dateStr = new Date().toISOString().slice(0, 10);
  doc.save(`proxies-${dateStr}.pdf`);
}
