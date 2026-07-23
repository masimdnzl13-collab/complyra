import "server-only";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import type { TrainingRecordDoc } from "@/lib/firestore/schema";
import { ROLE_LABELS } from "./modules";
import { siteConfig } from "@/config/site";

export async function generateCertificatePdf(record: TrainingRecordDoc, companyName: string): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const page = doc.addPage([842, 595]); // landscape
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const centerX = 421;
  const navy = rgb(0.04, 0.09, 0.15);
  const accent = rgb(0.11, 0.4, 0.91);

  page.drawRectangle({ x: 0, y: 0, width: 842, height: 595, borderColor: accent, borderWidth: 6 });

  const title = "AI Literacy Completion Certificate";
  const titleWidth = bold.widthOfTextAtSize(title, 26);
  page.drawText(title, { x: centerX - titleWidth / 2, y: 440, size: 26, font: bold, color: navy });

  const subtitle = `Issued by ${siteConfig.name}`;
  const subtitleWidth = font.widthOfTextAtSize(subtitle, 12);
  page.drawText(subtitle, { x: centerX - subtitleWidth / 2, y: 410, size: 12, font, color: rgb(0.4, 0.44, 0.5) });

  const name = record.userName;
  const nameWidth = bold.widthOfTextAtSize(name, 32);
  page.drawText(name, { x: centerX - nameWidth / 2, y: 340, size: 32, font: bold, color: navy });

  const completedDate = record.completedAt ? record.completedAt.toDate().toISOString().slice(0, 10) : "";
  const line2 = `has completed the EU AI Act literacy training for ${companyName} as a ${ROLE_LABELS[record.role]}`;
  const line2Width = font.widthOfTextAtSize(line2, 13);
  page.drawText(line2, { x: centerX - line2Width / 2, y: 290, size: 13, font, color: navy });

  const line3 = `certified on ${completedDate}`;
  const line3Width = font.widthOfTextAtSize(line3, 13);
  page.drawText(line3, { x: centerX - line3Width / 2, y: 265, size: 13, font, color: navy });

  const certId = `Certificate ID: ${record.certificateId ?? "—"}`;
  page.drawText(certId, { x: 60, y: 60, size: 9, font, color: rgb(0.55, 0.55, 0.55) });

  const disclaimer = "Prepared with Vermoncy. Not legal advice.";
  const disclaimerWidth = font.widthOfTextAtSize(disclaimer, 9);
  page.drawText(disclaimer, { x: 842 - 60 - disclaimerWidth, y: 60, size: 9, font, color: rgb(0.55, 0.55, 0.55) });

  return doc.save();
}
