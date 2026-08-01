import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { pricingPlans } from "@/config/site";
import { makeOrganization, NORMAL_UID, SUPERADMIN_UID } from "../../../test/fixtures/organization";
import { checkArticle50TextQuota } from "./quota";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("checkArticle50TextQuota", () => {
  beforeEach(() => vi.stubEnv("SUPERADMIN_UIDS", SUPERADMIN_UID));

  it("rejects a normal Free-plan user with the exact 'requires Starter plan or higher' message", () => {
    const org = makeOrganization("free");
    const result = checkArticle50TextQuota(org, NORMAL_UID);
    expect(result.allowed).toBe(false);
    expect(result.error).toBe(
      "Custom Article 50 text generation requires the Starter plan or higher. Static checklists and templates stay available on every plan."
    );
  });

  it("rejects a Free-plan user identically when uid is omitted", () => {
    const org = makeOrganization("free");
    const result = checkArticle50TextQuota(org);
    expect(result.allowed).toBe(false);
    expect(result.error).toMatch(/requires the Starter plan or higher/);
  });

  it("allows a superadmin on the Free plan (resolves to Scale, which has no such gate)", () => {
    const org = makeOrganization("free");
    const result = checkArticle50TextQuota(org, SUPERADMIN_UID);
    expect(result.allowed).toBe(true);
  });

  for (const plan of pricingPlans.filter((p) => p.id !== "free")) {
    const limit = plan.article50TextsPerMonth;

    describe(`${plan.id} plan (limit: ${limit})`, () => {
      if (limit === "unlimited") {
        it("allows a normal user regardless of usage", () => {
          const org = makeOrganization(plan.id, { usage: { article50TextsThisMonth: 999_999 } });
          expect(checkArticle50TextQuota(org, NORMAL_UID).allowed).toBe(true);
        });
      } else {
        it(`allows a normal user just under the limit (${limit - 1})`, () => {
          const org = makeOrganization(plan.id, { usage: { article50TextsThisMonth: limit - 1 } });
          expect(checkArticle50TextQuota(org, NORMAL_UID).allowed).toBe(true);
        });

        it(`rejects a normal user once usage reaches the limit (${limit})`, () => {
          const org = makeOrganization(plan.id, { usage: { article50TextsThisMonth: limit } });
          const result = checkArticle50TextQuota(org, NORMAL_UID);
          expect(result.allowed).toBe(false);
          expect(result.error).toMatch(/monthly limit/i);
        });

        it("always allows the superadmin, far past the limit", () => {
          const org = makeOrganization(plan.id, { usage: { article50TextsThisMonth: limit + 1000 } });
          expect(checkArticle50TextQuota(org, SUPERADMIN_UID).allowed).toBe(true);
        });
      }
    });
  }

  it("blocks a past-due normal user before even checking the plan tier", () => {
    const org = makeOrganization("starter", { subscription: { status: "past_due" } });
    const result = checkArticle50TextQuota(org, NORMAL_UID);
    expect(result.allowed).toBe(false);
    expect(result.error).toMatch(/overdue/i);
  });

  it("does not block the superadmin when past-due", () => {
    const org = makeOrganization("starter", { subscription: { status: "past_due" } });
    expect(checkArticle50TextQuota(org, SUPERADMIN_UID).allowed).toBe(true);
  });
});
