import { NextRequest, NextResponse } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { getAdminFirestore } from "@/lib/firebase/admin";
import { getCurrentConsultant } from "@/lib/auth/current-consultant";
import { firestorePaths, type ConsultantLanguage, type ConsultantTurnaround } from "@/lib/firestore/schema";

const LANGUAGES: ConsultantLanguage[] = ["en", "de", "tr"];
const TURNAROUNDS: ConsultantTurnaround[] = ["24h", "2d", "1w"];

interface ProfileInput {
  name: string;
  expertiseAreas: string[];
  languages: ConsultantLanguage[];
  hourlyRate: number;
  yearsExperience: number;
  bio: string;
  worksWithTurkey: boolean;
  certifications: string[];
  references: string[];
  averageTurnaround: ConsultantTurnaround;
}

function isValidProfile(body: unknown): body is ProfileInput {
  if (!body || typeof body !== "object") return false;
  const p = body as Record<string, unknown>;
  return (
    typeof p.name === "string" &&
    p.name.trim().length > 0 &&
    Array.isArray(p.expertiseAreas) &&
    p.expertiseAreas.every((a) => typeof a === "string") &&
    Array.isArray(p.languages) &&
    p.languages.length > 0 &&
    (p.languages as unknown[]).every((l) => LANGUAGES.includes(l as ConsultantLanguage)) &&
    typeof p.hourlyRate === "number" &&
    p.hourlyRate > 0 &&
    typeof p.yearsExperience === "number" &&
    p.yearsExperience >= 0 &&
    typeof p.bio === "string" &&
    p.bio.trim().length > 0 &&
    typeof p.worksWithTurkey === "boolean" &&
    Array.isArray(p.certifications) &&
    Array.isArray(p.references) &&
    TURNAROUNDS.includes(p.averageTurnaround as ConsultantTurnaround)
  );
}

export async function POST(request: NextRequest) {
  const consultant = await getCurrentConsultant();
  if (!consultant) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (!isValidProfile(body)) {
    return NextResponse.json({ error: "Please complete every required profile field" }, { status: 400 });
  }

  const db = getAdminFirestore();
  await db.doc(firestorePaths.consultant(consultant.uid)).update({
    name: body.name.trim(),
    expertiseAreas: body.expertiseAreas.map((a) => a.trim()).filter(Boolean),
    languages: body.languages,
    hourlyRate: body.hourlyRate,
    yearsExperience: body.yearsExperience,
    bio: body.bio.trim(),
    worksWithTurkey: body.worksWithTurkey,
    certifications: body.certifications.map((c) => c.trim()).filter(Boolean),
    references: body.references.map((r) => r.trim()).filter(Boolean),
    averageTurnaround: body.averageTurnaround,
    updatedAt: FieldValue.serverTimestamp(),
  });

  return NextResponse.json({ ok: true });
}
