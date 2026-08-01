import { afterEach, describe, expect, it, vi } from "vitest";
import type { PlanId } from "@/config/site";
import { getEffectivePlan, getEffectivePlanId, isUnlimitedUser } from "./effective-plan";

const ALL_PLANS: PlanId[] = ["free", "starter", "growth", "scale"];
const SUPERADMIN_UID = "superadmin-uid";
const NORMAL_UID = "normal-user-uid";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("isUnlimitedUser", () => {
  it("is false for a normal uid not on the allowlist", () => {
    vi.stubEnv("SUPERADMIN_UIDS", SUPERADMIN_UID);
    expect(isUnlimitedUser(NORMAL_UID)).toBe(false);
  });

  it("is true for a uid on the allowlist", () => {
    vi.stubEnv("SUPERADMIN_UIDS", SUPERADMIN_UID);
    expect(isUnlimitedUser(SUPERADMIN_UID)).toBe(true);
  });

  it("is false for undefined uid, even with an allowlist configured", () => {
    vi.stubEnv("SUPERADMIN_UIDS", SUPERADMIN_UID);
    expect(isUnlimitedUser(undefined)).toBe(false);
  });

  it("is false for null uid", () => {
    vi.stubEnv("SUPERADMIN_UIDS", SUPERADMIN_UID);
    expect(isUnlimitedUser(null)).toBe(false);
  });

  it("is false for an empty-string uid", () => {
    vi.stubEnv("SUPERADMIN_UIDS", SUPERADMIN_UID);
    expect(isUnlimitedUser("")).toBe(false);
  });

  it("is false for every uid when SUPERADMIN_UIDS is unset", () => {
    vi.stubEnv("SUPERADMIN_UIDS", "");
    expect(isUnlimitedUser(SUPERADMIN_UID)).toBe(false);
    expect(isUnlimitedUser(NORMAL_UID)).toBe(false);
  });

  it("removing a uid from the allowlist immediately reverts it to normal", () => {
    vi.stubEnv("SUPERADMIN_UIDS", SUPERADMIN_UID);
    expect(isUnlimitedUser(SUPERADMIN_UID)).toBe(true);
    vi.stubEnv("SUPERADMIN_UIDS", "some-other-uid");
    expect(isUnlimitedUser(SUPERADMIN_UID)).toBe(false);
  });
});

describe("getEffectivePlanId — normal users never get upgraded", () => {
  it.each(ALL_PLANS)("returns the org's real plan verbatim for a normal uid on %s", (planId) => {
    vi.stubEnv("SUPERADMIN_UIDS", SUPERADMIN_UID);
    expect(getEffectivePlanId(NORMAL_UID, planId)).toBe(planId);
  });

  it.each(ALL_PLANS)("returns the org's real plan verbatim when uid is undefined (%s)", (planId) => {
    vi.stubEnv("SUPERADMIN_UIDS", SUPERADMIN_UID);
    expect(getEffectivePlanId(undefined, planId)).toBe(planId);
  });

  it.each(ALL_PLANS)("returns the org's real plan verbatim when uid is null (%s)", (planId) => {
    vi.stubEnv("SUPERADMIN_UIDS", SUPERADMIN_UID);
    expect(getEffectivePlanId(null, planId)).toBe(planId);
  });

  it.each(ALL_PLANS)("returns the org's real plan verbatim when uid is empty string (%s)", (planId) => {
    vi.stubEnv("SUPERADMIN_UIDS", SUPERADMIN_UID);
    expect(getEffectivePlanId("", planId)).toBe(planId);
  });

  it.each(ALL_PLANS)("never resolves a normal user to scale unless their real plan already is scale (%s)", (planId) => {
    vi.stubEnv("SUPERADMIN_UIDS", SUPERADMIN_UID);
    const result = getEffectivePlanId(NORMAL_UID, planId);
    if (planId !== "scale") {
      expect(result).not.toBe("scale");
    }
  });
});

describe("getEffectivePlanId — superadmin always resolves to top tier", () => {
  it.each(ALL_PLANS)("resolves scale for a superadmin regardless of the org's real plan (%s)", (planId) => {
    vi.stubEnv("SUPERADMIN_UIDS", SUPERADMIN_UID);
    expect(getEffectivePlanId(SUPERADMIN_UID, planId)).toBe("scale");
  });
});

describe("getEffectivePlan", () => {
  it("returns the full Scale PricingPlan object for a superadmin", () => {
    vi.stubEnv("SUPERADMIN_UIDS", SUPERADMIN_UID);
    const plan = getEffectivePlan(SUPERADMIN_UID, "free");
    expect(plan.id).toBe("scale");
    expect(plan.systemsLimit).toBe("unlimited");
    expect(plan.assessmentsPerMonth).toBe("unlimited");
    expect(plan.documentsPerMonth).toBe("unlimited");
    expect(plan.article50TextsPerMonth).toBe("unlimited");
    expect(plan.aiLiteracySeats).toBe("unlimited");
  });

  it("returns the real PricingPlan object for a normal user on Free (finite limits, not unlimited)", () => {
    vi.stubEnv("SUPERADMIN_UIDS", SUPERADMIN_UID);
    const plan = getEffectivePlan(NORMAL_UID, "free");
    expect(plan.id).toBe("free");
    expect(plan.systemsLimit).toBe(1);
    expect(plan.assessmentsPerMonth).toBe(1);
    expect(plan.documentsPerMonth).toBe(5);
    expect(plan.article50TextsPerMonth).toBe(0);
  });
});
