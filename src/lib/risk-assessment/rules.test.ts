import { describe, expect, it } from "vitest";
import {
  ANNEX_III_REFERENCES,
  checkDerogation,
  checkProhibitedPractice,
  getAnnexIIICategory,
} from "./rules";
import type { AiSystemDoc } from "@/lib/firestore/schema";

const timestamp = { seconds: 0, nanoseconds: 0, toDate: () => new Date(0) };

function buildSystem(overrides: Partial<AiSystemDoc> = {}): AiSystemDoc {
  return {
    name: "Applicant screener",
    description: "Screens job applicants",
    role: "deployer",
    vendor: "own_model",
    businessArea: "hr",
    purpose: "Ranks candidates by fit",
    dataTypes: ["personal"],
    affectedGroups: ["job_applicants"],
    decisionMakingRole: "human_in_the_loop",
    interactsWithPeople: false,
    generatesSyntheticContent: false,
    infersEmotionOrBehavior: false,
    status: "active",
    assessmentStatus: "not_assessed",
    createdAt: timestamp,
    updatedAt: timestamp,
    ...overrides,
  };
}

describe("getAnnexIIICategory", () => {
  it("returns null for 'none'", () => {
    expect(getAnnexIIICategory("none")).toBeNull();
  });

  it("maps every non-'none' decision point to a category with a real Annex III reference", () => {
    const points = [
      "hiring_evaluation",
      "credit_insurance",
      "education_exam",
      "law_enforcement",
      "migration_border",
      "public_benefits",
      "judicial_decision",
    ] as const;
    for (const point of points) {
      const category = getAnnexIIICategory(point);
      expect(category).not.toBeNull();
      expect(ANNEX_III_REFERENCES[category!]).toMatch(/^Annex III\(\d\)$/);
    }
  });

  it("maps both credit_insurance and public_benefits to essential_services, per the Annex III(5) grouping", () => {
    expect(getAnnexIIICategory("credit_insurance")).toBe("essential_services");
    expect(getAnnexIIICategory("public_benefits")).toBe("essential_services");
  });
});

describe("checkProhibitedPractice", () => {
  it("flags Article 5(1)(f) when a system infers employee emotion/behavior", () => {
    const system = buildSystem({ infersEmotionOrBehavior: true, affectedGroups: ["employees"] });
    expect(checkProhibitedPractice(system)).toEqual({ detected: true, reference: "Article 5(1)(f)" });
  });

  it("does not flag emotion inference on non-employee groups", () => {
    const system = buildSystem({ infersEmotionOrBehavior: true, affectedGroups: ["customers"] });
    expect(checkProhibitedPractice(system)).toEqual({ detected: false, reference: null });
  });

  it("does not flag employee-affecting systems that don't infer emotion", () => {
    const system = buildSystem({ infersEmotionOrBehavior: false, affectedGroups: ["employees"] });
    expect(checkProhibitedPractice(system)).toEqual({ detected: false, reference: null });
  });
});

describe("checkDerogation", () => {
  it("applies when the decision point maps to an Annex III category and the role is info_only", () => {
    const system = buildSystem({ decisionMakingRole: "info_only" });
    expect(checkDerogation("hiring_evaluation", system)).toBe(true);
  });

  it("does not apply when the system is autonomous even in a high-risk category", () => {
    const system = buildSystem({ decisionMakingRole: "autonomous" });
    expect(checkDerogation("hiring_evaluation", system)).toBe(false);
  });

  it("does not apply for decisionPoint 'none', regardless of role", () => {
    const system = buildSystem({ decisionMakingRole: "info_only" });
    expect(checkDerogation("none", system)).toBe(false);
  });
});
