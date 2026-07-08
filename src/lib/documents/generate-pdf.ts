import "server-only";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { ComplianceDocumentDoc } from "@/lib/firestore/schema";
import { DOCUMENT_TEMPLATES } from "./templates";
import { siteConfig, legalConfig } from "@/config/site";

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const MARGIN = 56;
const HEADER_HEIGHT = 60;
const FOOTER_HEIGHT = 36;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;
const CONTENT_TOP = PAGE_HEIGHT - MARGIN - HEADER_HEIGHT;
const CONTENT_BOTTOM = MARGIN + FOOTER_HEIGHT;

function wrapText(text: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    const words = paragraph.split(" ");
    let current = "";
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) > maxWidth && current) {
        lines.push(current);
        current = word;
      } else {
        current = candidate;
      }
    }
    lines.push(current);
  }
  return lines;
}

interface Ctx {
  doc: PDFDocument;
  font: PDFFont;
  bold: PDFFont;
  title: string;
  pages: PDFPage[];
}

function drawHeaderFooter(ctx: Ctx, page: PDFPage, pageNumber: number) {
  page.drawText(siteConfig.name, { x: MARGIN, y: PAGE_HEIGHT - MARGIN - 14, size: 12, font: ctx.bold, color: rgb(0.04, 0.09, 0.15) });
  page.drawText(ctx.title, { x: MARGIN, y: PAGE_HEIGHT - MARGIN - 30, size: 10, font: ctx.font, color: rgb(0.4, 0.44, 0.5) });
  page.drawLine({
    start: { x: MARGIN, y: PAGE_HEIGHT - MARGIN - 38 },
    end: { x: PAGE_WIDTH - MARGIN, y: PAGE_HEIGHT - MARGIN - 38 },
    thickness: 0.5,
    color: rgb(0.85, 0.87, 0.9),
  });

  const disclaimerLines = wrapText(legalConfig.disclaimer, ctx.font, 6.5, CONTENT_WIDTH);
  let y = MARGIN + FOOTER_HEIGHT - 10;
  for (const line of disclaimerLines.slice(0, 2)) {
    page.drawText(line, { x: MARGIN, y, size: 6.5, font: ctx.font, color: rgb(0.55, 0.55, 0.55) });
    y -= 9;
  }
  page.drawText(`Page ${pageNumber}`, {
    x: PAGE_WIDTH - MARGIN - 40,
    y: MARGIN + FOOTER_HEIGHT - 10,
    size: 8,
    font: ctx.font,
    color: rgb(0.55, 0.55, 0.55),
  });
}

function newPage(ctx: Ctx): { page: PDFPage; y: number } {
  const page = ctx.doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  ctx.pages.push(page);
  drawHeaderFooter(ctx, page, ctx.pages.length);
  return { page, y: CONTENT_TOP };
}

function ensureSpace(ctx: Ctx, cursor: { page: PDFPage; y: number }, needed: number): { page: PDFPage; y: number } {
  if (cursor.y - needed < CONTENT_BOTTOM) return newPage(ctx);
  return cursor;
}

export async function generateDocumentPdf(document: ComplianceDocumentDoc): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);
  const template = DOCUMENT_TEMPLATES[document.type];

  const ctx: Ctx = { doc, font, bold, title: template.label, pages: [] };
  let cursor = newPage(ctx);

  cursor.page.drawText(template.label, { x: MARGIN, y: cursor.y, size: 20, font: bold });
  cursor = { page: cursor.page, y: cursor.y - 30 };

  const meta = [
    `Company: ${document.fixedFields.companyName}`,
    `System: ${document.fixedFields.systemName}`,
    `Assessment date: ${document.fixedFields.assessmentDate}`,
    `Prepared by: ${document.fixedFields.preparedBy}`,
    `Approved: ${document.fixedFields.approvedAt ?? "Pending review"}`,
    `Version: ${document.version}`,
  ];
  for (const line of meta) {
    cursor = ensureSpace(ctx, cursor, 15);
    cursor.page.drawText(line, { x: MARGIN, y: cursor.y, size: 10, font, color: rgb(0.3, 0.35, 0.4) });
    cursor = { page: cursor.page, y: cursor.y - 15 };
  }
  cursor = { page: cursor.page, y: cursor.y - 10 };

  for (const section of document.sections) {
    cursor = ensureSpace(ctx, cursor, 24);
    cursor.page.drawText(section.title, { x: MARGIN, y: cursor.y, size: 13, font: bold });
    cursor = { page: cursor.page, y: cursor.y - 18 };

    const lines = wrapText(section.content || "(not filled in)", font, 10.5, CONTENT_WIDTH);
    for (const line of lines) {
      cursor = ensureSpace(ctx, cursor, 14);
      cursor.page.drawText(line, { x: MARGIN, y: cursor.y, size: 10.5, font, color: rgb(0.05, 0.09, 0.15) });
      cursor = { page: cursor.page, y: cursor.y - 14 };
    }
    cursor = { page: cursor.page, y: cursor.y - 14 };
  }

  cursor.page.drawText("Signature: ______________________________", {
    x: MARGIN,
    y: Math.max(cursor.y - 10, CONTENT_BOTTOM + 10),
    size: 10,
    font,
  });

  return doc.save();
}
