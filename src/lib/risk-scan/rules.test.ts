import { describe, expect, it } from "vitest";
import { evaluateRiskScan, isValidScanAnswers } from "./rules";
import type { ScanAnswers } from "./types";

describe("isValidScanAnswers", () => {
  it("accepts a minimal 'neither' answer with no further fields", () => {
    expect(isValidScanAnswers({ euRelation: "neither" })).toBe(true);
  });

  it("rejects a missing euRelation", () => {
    expect(isValidScanAnswers({})).toBe(false);
  });

  it("rejects an invalid useCase value (untrusted request body)", () => {
    expect(
      isValidScanAnswers({
        euRelation: "based",
        aiRole: "provider",
        useCases: ["not_a_real_use_case"],
        vulnerableAudience: false,
        companySize: "1-10",
      })
    ).toBe(false);
  });

  it("accepts a fully populated valid answer set", () => {
    const answers: ScanAnswers = {
      euRelation: "sells",
      aiRole: "both",
      useCases: ["hiring", "chatbot"],
      vulnerableAudience: true,
      companySize: "51-200",
    };
    expect(isValidScanAnswers(answers)).toBe(true);
  });
});

describe("evaluateRiskScan", () => {
  it("early-exits when the Act doesn't apply", () => {
    const result = evaluateRiskScan({
      euRelation: "neither",
      aiRole: "provider",
      useCases: [],
      vulnerableAudience: false,
      companySize: "1-10",
    });
    expect(result.earlyExit).toBe(true);
    expect(result.findings).toHaveLength(0);
  });

  it("always includes the AI literacy finding for any in-scope company", () => {
    const result = evaluateRiskScan({
      euRelation: "based",
      aiRole: "deployer",
      useCases: ["none"],
      vulnerableAudience: false,
      companySize: "1-10",
    });
    expect(result.findings.some((f) => f.id === "ai-literacy")).toBe(true);
  });

  it("flags workplace emotion monitoring as a prohibited practice, not just a documentation gap", () => {
    const result = evaluateRiskScan({
      euRelation: "based",
      aiRole: "deployer",
      useCases: ["emotion_monitoring"],
      vulnerableAudience: false,
      companySize: "1-10",
    });
    const finding = result.findings.find((f) => f.id === "prohibited-emotion");
    expect(finding?.severity).toBe("prohibited");
    expect(finding?.legalReference).toBe("Article 5");
  });

  it("flags hiring use cases as high-risk under Annex III(4)", () => {
    const result = evaluateRiskScan({
      euRelation: "based",
      aiRole: "deployer",
      useCases: ["hiring"],
      vulnerableAudience: false,
      companySize: "1-10",
    });
    const finding = result.findings.find((f) => f.id === "high-risk-hiring");
    expect(finding?.severity).toBe("high");
  });

  it("reports matchedAreas equal to the number of findings actually returned", () => {
    const result = evaluateRiskScan({
      euRelation: "based",
      aiRole: "provider",
      useCases: ["chatbot", "content_generation"],
      vulnerableAudience: false,
      companySize: "11-50",
    });
    expect(result.matchedAreas).toBe(result.findings.length);
  });
});
