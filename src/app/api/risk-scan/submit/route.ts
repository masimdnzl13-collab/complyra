import { NextRequest, NextResponse } from "next/server";
import { evaluateRiskScan, isValidScanAnswers } from "@/lib/risk-scan/rules";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (!checkRateLimit(`risk-scan-submit:${ip}`, 15, 10 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many requests. Try again in a few minutes." },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => null);
  if (!isValidScanAnswers(body)) {
    return NextResponse.json({ error: "Invalid answers" }, { status: 400 });
  }

  const result = evaluateRiskScan(body);
  return NextResponse.json(result);
}
