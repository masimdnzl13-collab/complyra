export interface LeadCsvRow {
  company_name: string;
  city: string;
  sector: string;
  source_url: string;
  contact_hint: string;
  priority: string;
  notes: string;
}

export interface ParsedLeadCsv {
  rows: LeadCsvRow[];
  /** 1-indexed data row numbers (header is row 1) that were dropped for missing company_name. */
  skipped: Array<{ row: number; reason: string }>;
}

const EXPECTED_COLUMNS = ["company_name", "city", "sector", "source_url", "contact_hint", "priority", "notes"] as const;

/**
 * Minimal RFC4180 parser: handles quoted fields, embedded commas, embedded
 * newlines, and "" as an escaped quote. Columns are looked up by header
 * name, not position, so file column order doesn't matter.
 */
function parseCsvLines(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  const normalized = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  for (let i = 0; i < normalized.length; i++) {
    const char = normalized[i];
    if (inQuotes) {
      if (char === '"') {
        if (normalized[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      field = "";
      rows.push(row);
      row = [];
    } else {
      field += char;
    }
  }
  // Flush the last field/row if the file didn't end with a newline.
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((r) => !(r.length === 1 && r[0].trim() === ""));
}

export function parseLeadCsv(text: string): ParsedLeadCsv {
  const lines = parseCsvLines(text);
  if (lines.length === 0) return { rows: [], skipped: [] };

  const header = lines[0].map((h) => h.trim().toLowerCase());
  const colIndex = new Map<string, number>();
  for (const col of EXPECTED_COLUMNS) {
    const idx = header.indexOf(col);
    if (idx !== -1) colIndex.set(col, idx);
  }

  const rows: LeadCsvRow[] = [];
  const skipped: ParsedLeadCsv["skipped"] = [];

  for (let i = 1; i < lines.length; i++) {
    const raw = lines[i];
    const get = (col: (typeof EXPECTED_COLUMNS)[number]) => {
      const idx = colIndex.get(col);
      return idx !== undefined ? (raw[idx] ?? "").trim() : "";
    };

    const companyName = get("company_name");
    if (!companyName) {
      skipped.push({ row: i + 1, reason: "Missing company_name" });
      continue;
    }

    rows.push({
      company_name: companyName,
      city: get("city"),
      sector: get("sector"),
      source_url: get("source_url"),
      contact_hint: get("contact_hint"),
      priority: get("priority"),
      notes: get("notes"),
    });
  }

  return { rows, skipped };
}
