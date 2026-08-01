import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { pricingPlans } from "@/config/site";
import { makeOrganization, NORMAL_UID, SUPERADMIN_UID } from "../../../test/fixtures/organization";
import {
  checkAiLiteracySeatLimit,
  checkExpertReviewAccess,
  checkMonthlyQuota,
  checkPastDue,
  checkSystemsLimit,
  type MonthlyQuotaType,
} from "./quota";

afterEach(() => {
  vi.unstubAllEnvs();
});

const QUOTA_TYPES: {
  type: MonthlyQuotaType;
  usageKey: "assessmentsThisMonth" | "documentsGeneratedThisMonth" | "article50TextsThisMonth";
  planKey: "assessmentsPerMonth" | "documentsPerMonth" | "article50TextsPerMonth";
}[] = [
  { type: "assessments", usageKey: "assessmentsThisMonth", planKey: "assessmentsPerMonth" },
  { type: "documents", usageKey: "documentsGeneratedThisMonth", planKey: "documentsPerMonth" },
  { type: "article50Texts", usageKey: "article50TextsThisMonth", planKey: "article50TextsPerMonth" },
];

describe("checkMonthlyQuota — full plan x feature matrix", () => {
  for (const plan of pricingPlans) {
    for (const { type, usageKey, planKey } of QUOTA_TYPES) {
      const limit = plan[planKey];

      describe(`${plan.id} / ${type} (limit: ${limit})`, () => {
        beforeEach(() => vi.stubEnv("SUPERADMIN_UIDS", SUPERADMIN_UID));

        if (limit === "unlimited") {
          it("allows a normal user regardless of usage", () => {
            const org = makeOrganization(plan.id, { usage: { [usageKey]: 999_999 } });
            expect(checkMonthlyQuota(org, type, 1, NORMAL_UID).allowed).toBe(true);
          });
        } else {
          const justUnder = Math.max(limit - 1, 0);

          it(`${limit > 0 ? "allows" : "still rejects (0 limit)"} a normal user with usage ${justUnder}`, () => {
            const org = makeOrganization(plan.id, { usage: { [usageKey]: justUnder } });
            const result = checkMonthlyQuota(org, type, 1, NORMAL_UID);
            expect(result.allowed).toBe(limit > 0);
          });

          it(`rejects a normal user once usage reaches the limit (${limit})`, () => {
            const org = makeOrganization(plan.id, { usage: { [usageKey]: limit } });
            const result = checkMonthlyQuota(org, type, 1, NORMAL_UID);
            expect(result.allowed).toBe(false);
            expect(result.error).toMatch(/limit/i);
          });

          it("rejects identically when uid is omitted — omission must never fall back to unlimited", () => {
            const org = makeOrganization(plan.id, { usage: { [usageKey]: limit } });
            const result = checkMonthlyQuota(org, type, 1);
            expect(result.allowed).toBe(false);
          });

          it("always allows the superadmin, far past the limit", () => {
            const org = makeOrganization(plan.id, { usage: { [usageKey]: limit + 1000 } });
            expect(checkMonthlyQuota(org, type, 1, SUPERADMIN_UID).allowed).toBe(true);
          });
        }
      });
    }
  }
});

describe("checkSystemsLimit — full plan matrix", () => {
  beforeEach(() => vi.stubEnv("SUPERADMIN_UIDS", SUPERADMIN_UID));

  for (const plan of pricingPlans) {
    const limit = plan.systemsLimit;

    describe(`${plan.id} (limit: ${limit})`, () => {
      if (limit === "unlimited") {
        it("allows a normal user regardless of registered systems count", () => {
          const org = makeOrganization(plan.id, { usage: { registeredSystemsCount: 999_999 } });
          expect(checkSystemsLimit(org, NORMAL_UID).allowed).toBe(true);
        });
      } else {
        it(`allows a normal user just under the limit (${limit - 1})`, () => {
          const org = makeOrganization(plan.id, { usage: { registeredSystemsCount: limit - 1 } });
          expect(checkSystemsLimit(org, NORMAL_UID).allowed).toBe(true);
        });

        it(`rejects a normal user at the limit (${limit})`, () => {
          const org = makeOrganization(plan.id, { usage: { registeredSystemsCount: limit } });
          const result = checkSystemsLimit(org, NORMAL_UID);
          expect(result.allowed).toBe(false);
          expect(result.error).toMatch(/plan supports up to/i);
        });

        it("rejects identically when uid is omitted", () => {
          const org = makeOrganization(plan.id, { usage: { registeredSystemsCount: limit } });
          expect(checkSystemsLimit(org).allowed).toBe(false);
        });

        it("always allows the superadmin, far past the limit", () => {
          const org = makeOrganization(plan.id, { usage: { registeredSystemsCount: limit + 1000 } });
          expect(checkSystemsLimit(org, SUPERADMIN_UID).allowed).toBe(true);
        });
      }
    });
  }
});

describe("checkAiLiteracySeatLimit — full plan matrix", () => {
  beforeEach(() => vi.stubEnv("SUPERADMIN_UIDS", SUPERADMIN_UID));

  for (const plan of pricingPlans) {
    const limit = plan.aiLiteracySeats;

    describe(`${plan.id} (limit: ${limit})`, () => {
      const org = makeOrganization(plan.id);

      if (limit === "unlimited") {
        it("allows a normal user regardless of seats used", () => {
          expect(checkAiLiteracySeatLimit(org, 999_999, NORMAL_UID).allowed).toBe(true);
        });
      } else {
        it(`allows a normal user just under the limit (${limit - 1} seats used)`, () => {
          expect(checkAiLiteracySeatLimit(org, limit - 1, NORMAL_UID).allowed).toBe(true);
        });

        it(`rejects a normal user once seats used reaches the limit (${limit})`, () => {
          const result = checkAiLiteracySeatLimit(org, limit, NORMAL_UID);
          expect(result.allowed).toBe(false);
          expect(result.error).toMatch(/plan supports AI literacy training/i);
        });

        it("rejects identically when uid is omitted", () => {
          expect(checkAiLiteracySeatLimit(org, limit).allowed).toBe(false);
        });

        it("always allows the superadmin, far past the limit", () => {
          expect(checkAiLiteracySeatLimit(org, limit + 1000, SUPERADMIN_UID).allowed).toBe(true);
        });
      }
    });
  }
});

describe("checkExpertReviewAccess — plan-tier gate", () => {
  beforeEach(() => vi.stubEnv("SUPERADMIN_UIDS", SUPERADMIN_UID));

  const EXPECTED_ACCESS: Record<string, boolean> = { free: false, starter: false, growth: true, scale: true };

  for (const plan of pricingPlans) {
    describe(plan.id, () => {
      it(`normal user access is ${EXPECTED_ACCESS[plan.id]}`, () => {
        const org = makeOrganization(plan.id);
        expect(checkExpertReviewAccess(org, NORMAL_UID).allowed).toBe(EXPECTED_ACCESS[plan.id]);
      });

      it("uid omitted behaves like a normal user", () => {
        const org = makeOrganization(plan.id);
        expect(checkExpertReviewAccess(org).allowed).toBe(EXPECTED_ACCESS[plan.id]);
      });

      it("superadmin always has access, regardless of plan", () => {
        const org = makeOrganization(plan.id);
        expect(checkExpertReviewAccess(org, SUPERADMIN_UID).allowed).toBe(true);
      });
    });
  }
});

describe("checkPastDue — subscription-status gate", () => {
  beforeEach(() => vi.stubEnv("SUPERADMIN_UIDS", SUPERADMIN_UID));

  it("blocks a normal user when status is past_due", () => {
    const org = makeOrganization("starter", { subscription: { status: "past_due" } });
    expect(checkPastDue(org, NORMAL_UID)).toMatch(/overdue/i);
  });

  it("blocks identically when uid is omitted", () => {
    const org = makeOrganization("starter", { subscription: { status: "past_due" } });
    expect(checkPastDue(org)).toMatch(/overdue/i);
  });

  it("does not block the superadmin even when status is past_due", () => {
    const org = makeOrganization("starter", { subscription: { status: "past_due" } });
    expect(checkPastDue(org, SUPERADMIN_UID)).toBeNull();
  });

  it("does not block an active subscription", () => {
    const org = makeOrganization("starter", { subscription: { status: "active" } });
    expect(checkPastDue(org, NORMAL_UID)).toBeNull();
  });

  it("does not block a trialing subscription", () => {
    const org = makeOrganization("starter", { subscription: { status: "trialing" } });
    expect(checkPastDue(org, NORMAL_UID)).toBeNull();
  });

  // By design, a cancelled subscription is NOT blocked by checkPastDue — the
  // org keeps access through the end of its already-paid period (see the
  // "Your subscription is cancelled and will end on <date>" banner in
  // billing/page.tsx, which assumes continued access until then). Only
  // "past_due" (a failed payment) blocks. Asserting this explicitly so a
  // future change doesn't silently start blocking cancelled-but-still-paid
  // orgs, or silently stop blocking past_due ones.
  it("does not block a cancelled subscription (grandfathered access until period end, by design)", () => {
    const org = makeOrganization("starter", { subscription: { status: "cancelled" } });
    expect(checkPastDue(org, NORMAL_UID)).toBeNull();
  });
});
