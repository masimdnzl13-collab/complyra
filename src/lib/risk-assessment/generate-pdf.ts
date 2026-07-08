import "server-only";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { AssessmentDoc } from "@/lib/firestore/schema";

const PAGE_WIDTH = 595;
const PAGE_HEIGHT = 842;
const MARGIN = 56;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const RISK_TIER_LABELS: Record<AssessmentDoc["riskTier"], string> = {
  unacceptable: "PROHIBITED PRACTICE",
  high: "HIGH RISK",
  limited: "LIMITED RISK",
  minimal: "MINIMAL RISK",
};

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

function drawParagraph(
  doc: PDFDocument,
  cursor: Cursor,
  text: string,
  font: PDFFont,
  size: number
): Cursor {
  const lineHeight = size * 1.4;
  let c = cursor;
  for (const line of wrapText(text, font, size, CONTENT_WIDTH)) {
    c = ensureSpace(doc, c, lineHeight);
    c.page.drawText(line, { x: MARGIN, y: c.y, size, font, color: rgb(0.05, 0.09, 0.15) });
    c = { page: c.page, y: c.y - lineHeight };
  }
  return c;
}

export async function generateAssessmentPdf(
  assessment: AssessmentDoc,
  systemName: string,
  companyName: string
): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  let cursor: Cursor = { page: doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]), y: PAGE_HEIGHT - MARGIN };

  cursor.page.drawText("EU AI Act Risk Assessment", { x: MARGIN, y: cursor.y, size: 20, font: bold });
  cursor = { page: cursor.page, y: cursor.y - 32 };

  const meta = [
    `Company: ${companyName}`,
    `System: ${systemName}`,
    `Assessment date: ${assessment.createdAt.toDate().toISOString().slice(0, 10)}`,
    `Version: ${assessment.version}`,
  ];
  for (const line of meta) {
    cursor = ensureSpace(doc, cursor, 16);
    cursor.page.drawText(line, { x: MARGIN, y: cursor.y, size: 11, font, color: rgb(0.3, 0.35, 0.4) });
    cursor = { page: cursor.page, y: cursor.y - 16 };
  }
  cursor = { page: cursor.page, y: cursor.y - 12 };

  const tierColor =
    assessment.riskTier === "unacceptable"
      ? rgb(0.8, 0.15, 0.15)
      : assessment.riskTier === "high"
        ? rgb(0.75, 0.55, 0.1)
        : rgb(0.1, 0.35, 0.85);
  cursor = ensureSpace(doc, cursor, 28);
  cursor.page.drawText(RISK_TIER_LABELS[assessment.riskTier], {
    x: MARGIN,
    y: cursor.y,
    size: 18,
    font: bold,
    color: tierColor,
  });
  cursor = { page: cursor.page, y: cursor.y - 28 };

  cursor = ensureSpace(doc, cursor, 16);
  cursor.page.drawText(`Legal reference: ${assessment.legalArticleReference}`, {
    x: MARGIN,
    y: cursor.y,
    size: 12,
    font: bold,
  });
  cursor = { page: cursor.page, y: cursor.y - 24 };

  cursor = ensureSpace(doc, cursor, 16);
  cursor.page.drawText("Justification", { x: MARGIN, y: cursor.y, size: 13, font: bold });
  cursor = { page: cursor.page, y: cursor.y - 18 };
  cursor = drawParagraph(doc, cursor, assessment.justification, font, 11);
  cursor = { page: cursor.page, y: cursor.y - 12 };

  cursor = ensureSpace(doc, cursor, 16);
  cursor.page.drawText(`Confidence: ${assessment.confidenceLevel}`, { x: MARGIN, y: cursor.y, size: 11, font });
  cursor = { page: cursor.page, y: cursor.y - 16 };

  if (assessment.isEdgeCase) {
    cursor = ensureSpace(doc, cursor, 16);
    cursor.page.drawText("Expert review recommended before relying on this classification.", {
      x: MARGIN,
      y: cursor.y,
      size: 11,
      font: bold,
      color: rgb(0.75, 0.55, 0.1),
    });
    cursor = { page: cursor.page, y: cursor.y - 16 };
  }

  const disclaimer =
    "This is a documentation preparation tool. It does not constitute legal advice, and using it does " +
    "not establish a legal or professional relationship. Consult a qualified professional for advice on " +
    "your specific compliance obligations under the EU AI Act. Prepared with Complyra.";
  cursor = ensureSpace(doc, cursor, 40);
  cursor = { page: cursor.page, y: MARGIN + 30 };
  for (const line of wrapText(disclaimer, font, 8, CONTENT_WIDTH)) {
    cursor.page.drawText(line, { x: MARGIN, y: cursor.y, size: 8, font, color: rgb(0.5, 0.5, 0.5) });
    cursor = { page: cursor.page, y: cursor.y - 11 };
  }

  return doc.save();
}
