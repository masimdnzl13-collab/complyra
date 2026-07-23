import "server-only";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { ExpertReviewReport } from "@/lib/firestore/schema";

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const MARGIN = 56;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

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

interface Cursor {
  page: PDFPage;
  y: number;
}

function ensureSpace(doc: PDFDocument, cursor: Cursor, needed: number): Cursor {
  if (cursor.y - needed < MARGIN) {
    const page = doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
    return { page, y: PAGE_HEIGHT - MARGIN };
  }
  return cursor;
}

function drawParagraph(doc: PDFDocument, cursor: Cursor, text: string, font: PDFFont, size: number): Cursor {
  const lineHeight = size * 1.4;
  let c = cursor;
  for (const line of wrapText(text, font, size, CONTENT_WIDTH)) {
    c = ensureSpace(doc, c, lineHeight);
    c.page.drawText(line, { x: MARGIN, y: c.y, size, font, color: rgb(0.05, 0.09, 0.15) });
    c = { page: c.page, y: c.y - lineHeight };
  }
  return c;
}

function drawHeading(doc: PDFDocument, cursor: Cursor, text: string, bold: PDFFont): Cursor {
  const c = ensureSpace(doc, cursor, 24);
  c.page.drawText(text, { x: MARGIN, y: c.y, size: 13, font: bold });
  return { page: c.page, y: c.y - 20 };
}

export async function generateExpertReviewPdf(
  report: ExpertReviewReport,
  consultantName: string,
  systemName: string,
  companyName: string
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  let cursor: Cursor = { page: doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]), y: PAGE_HEIGHT - MARGIN };

  cursor.page.drawText("Expert Review Report", { x: MARGIN, y: cursor.y, size: 20, font: bold });
  cursor = { page: cursor.page, y: cursor.y - 32 };

  const meta = [
    `Company: ${companyName}`,
    `System: ${systemName}`,
    `Reviewed by: ${consultantName}`,
    `Date: ${report.submittedAt.toDate().toISOString().slice(0, 10)}`,
  ];
  for (const line of meta) {
    cursor = ensureSpace(doc, cursor, 16);
    cursor.page.drawText(line, { x: MARGIN, y: cursor.y, size: 11, font, color: rgb(0.3, 0.35, 0.4) });
    cursor = { page: cursor.page, y: cursor.y - 16 };
  }
  cursor = { page: cursor.page, y: cursor.y - 12 };

  cursor = drawHeading(doc, cursor, "Executive Summary", bold);
  cursor = drawParagraph(doc, cursor, report.executiveSummary, font, 11);
  cursor = { page: cursor.page, y: cursor.y - 16 };

  cursor = drawHeading(doc, cursor, "Legal Analysis", bold);
  cursor = drawParagraph(doc, cursor, report.legalAnalysis, font, 11);
  cursor = { page: cursor.page, y: cursor.y - 16 };

  cursor = drawHeading(doc, cursor, "Recommendation", bold);
  cursor = drawParagraph(doc, cursor, report.recommendation, font, 11);
  cursor = { page: cursor.page, y: cursor.y - 16 };

  const disclaimer =
    `This review is provided by ${consultantName} and constitutes professional advice. Vermoncy is not liable ` +
    "for its accuracy or completeness. For disputes, contact the consultant directly. This is a documentation " +
    "preparation platform, not a law firm, and using it does not establish a legal or professional relationship " +
    "with Vermoncy.";
  cursor = ensureSpace(doc, cursor, 50);
  cursor = { page: cursor.page, y: MARGIN + 40 };
  for (const line of wrapText(disclaimer, font, 8, CONTENT_WIDTH)) {
    cursor.page.drawText(line, { x: MARGIN, y: cursor.y, size: 8, font, color: rgb(0.5, 0.5, 0.5) });
    cursor = { page: cursor.page, y: cursor.y - 11 };
  }

  return doc.save();
}
