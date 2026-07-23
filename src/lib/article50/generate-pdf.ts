import "server-only";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import type { Article50Artifact } from "@/lib/firestore/schema";
import { LANGUAGE_LABELS, MODEL_SOURCE_LABELS, WATERMARK_STANDARD_NOTE } from "./content";
import {
  ChatbotDisclosureDataSchema,
  ContentLabelingDataSchema,
  DeepfakeDisclosureDataSchema,
  WatermarkChecklistDataSchema,
  type Language,
} from "./types";
import { regulationDeadlines } from "@/config/site";

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

function drawHeading(doc: PDFDocument, cursor: Cursor, text: string, font: PDFFont, size: number): Cursor {
  const c = ensureSpace(doc, cursor, size + 8);
  c.page.drawText(text, { x: MARGIN, y: c.y, size, font, color: rgb(0.05, 0.09, 0.15) });
  return { page: c.page, y: c.y - (size + 8) };
}

function drawParagraph(doc: PDFDocument, cursor: Cursor, text: string, font: PDFFont, size: number): Cursor {
  let c = cursor;
  const lineHeight = size * 1.4;
  for (const line of wrapText(text, font, size, CONTENT_WIDTH)) {
    c = ensureSpace(doc, c, lineHeight);
    c.page.drawText(line, { x: MARGIN, y: c.y, size, font, color: rgb(0.1, 0.14, 0.2) });
    c = { page: c.page, y: c.y - lineHeight };
  }
  return { page: c.page, y: c.y - 8 };
}

export async function generateArticle50Pdf(artifact: Article50Artifact): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  let cursor: Cursor = { page: doc.addPage([PAGE_WIDTH, PAGE_HEIGHT]), y: PAGE_HEIGHT - MARGIN };
  cursor.page.drawText(artifact.title, { x: MARGIN, y: cursor.y, size: 18, font: bold });
  cursor = { page: cursor.page, y: cursor.y - 22 };
  cursor.page.drawText(`Version ${artifact.version} · ${artifact.status}`, {
    x: MARGIN,
    y: cursor.y,
    size: 10,
    font,
    color: rgb(0.4, 0.44, 0.5),
  });
  cursor = { page: cursor.page, y: cursor.y - 28 };

  if (artifact.area === "chatbot_disclosure") {
    const data = ChatbotDisclosureDataSchema.parse(artifact.data);
    for (const lang of data.languages) {
      cursor = drawHeading(doc, cursor, LANGUAGE_LABELS[lang as Language] ?? lang, bold, 12);
      cursor = drawParagraph(doc, cursor, data.texts[lang as Language] ?? "", font, 11);
    }
  } else if (artifact.area === "content_labeling") {
    const data = ContentLabelingDataSchema.parse(artifact.data);
    cursor = drawHeading(doc, cursor, "Label text", bold, 12);
    cursor = drawParagraph(doc, cursor, data.labelText, font, 11);
    cursor = drawHeading(doc, cursor, "Implementation checklist", bold, 12);
    for (const item of data.checklist) {
      cursor = drawParagraph(doc, cursor, `${item.checked ? "[x]" : "[ ]"} ${item.label}`, font, 10.5);
    }
  } else if (artifact.area === "watermark_checklist") {
    const data = WatermarkChecklistDataSchema.parse(artifact.data);
    const deadline = regulationDeadlines.find((d) => d.id === "watermarking");
    cursor = drawParagraph(
      doc,
      cursor,
      `Deadline: ${deadline ? new Date(deadline.date).toLocaleDateString() : "2 December 2026"}`,
      bold,
      11
    );
    cursor = drawParagraph(doc, cursor, `Generative model source: ${MODEL_SOURCE_LABELS[data.modelSource]}`, font, 11);
    cursor = drawParagraph(doc, cursor, `Watermark capability: ${data.watermarkCapability}`, font, 11);
    cursor = drawParagraph(
      doc,
      cursor,
      `Vendor's Article 50 watermark commitment documented: ${data.vendorCommitmentDocumented ? "Yes" : "No"}`,
      font,
      11
    );
    cursor = drawParagraph(doc, cursor, `Watermark standard selected: ${data.standardSelected ? "Yes" : "No"}`, font, 11);
    cursor = drawParagraph(doc, cursor, `Output files verified for watermark: ${data.outputFilesVerified ? "Yes" : "No"}`, font, 11);
    cursor = drawHeading(doc, cursor, "Reference standard", bold, 12);
    cursor = drawParagraph(doc, cursor, WATERMARK_STANDARD_NOTE, font, 10);
  } else if (artifact.area === "deepfake_disclosure") {
    const data = DeepfakeDisclosureDataSchema.parse(artifact.data);
    if (data.deepfakeText) {
      cursor = drawHeading(doc, cursor, "Deepfake disclosure", bold, 12);
      cursor = drawParagraph(doc, cursor, data.deepfakeText, font, 11);
    }
    if (data.publicInterestText) {
      cursor = drawHeading(doc, cursor, "Public-interest text disclosure", bold, 12);
      cursor = drawParagraph(doc, cursor, data.publicInterestText, font, 11);
    }
  }

  const disclaimer =
    "This is a documentation preparation tool. It does not constitute legal advice. Prepared with Vermoncy.";
  cursor = ensureSpace(doc, cursor, 24);
  for (const line of wrapText(disclaimer, font, 7.5, CONTENT_WIDTH)) {
    cursor.page.drawText(line, { x: MARGIN, y: cursor.y, size: 7.5, font, color: rgb(0.55, 0.55, 0.55) });
    cursor = { page: cursor.page, y: cursor.y - 10 };
  }

  return doc.save();
}
