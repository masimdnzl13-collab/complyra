import { describe, expect, it, vi } from "vitest";
import { hashPayload } from "./dedup";

vi.mock("@/lib/firebase/admin", () => ({
  getAdminFirestore: vi.fn(),
}));

describe("hashPayload", () => {
  it("is deterministic for identical payloads", () => {
    const body = JSON.stringify({ event: "subscription_updated", id: "sub_1" });
    expect(hashPayload(body)).toBe(hashPayload(body));
  });

  it("differs for payloads that differ", () => {
    const a = JSON.stringify({ id: "sub_1" });
    const b = JSON.stringify({ id: "sub_2" });
    expect(hashPayload(a)).not.toBe(hashPayload(b));
  });
});

describe("claimWebhookEvent", () => {
  it("claims an event the first time, and rejects every redelivery of the same event", async () => {
    const { getAdminFirestore } = await import("@/lib/firebase/admin");
    const { claimWebhookEvent } = await import("./dedup");

    // Mirrors Firestore's real create-if-absent semantics: a second
    // .create() on the same doc path throws.
    const claimed = new Set<string>();
    const doc = vi.fn((path: string) => ({
      create: vi.fn(async () => {
        if (claimed.has(path)) throw new Error("ALREADY_EXISTS");
        claimed.add(path);
      }),
    }));
    vi.mocked(getAdminFirestore).mockReturnValue({ doc } as unknown as ReturnType<typeof getAdminFirestore>);

    await expect(claimWebhookEvent("lemonsqueezy", "evt_123")).resolves.toBe(true);
    await expect(claimWebhookEvent("lemonsqueezy", "evt_123")).resolves.toBe(false);
  });

  it("treats the same eventId from different sources as distinct events", async () => {
    const { getAdminFirestore } = await import("@/lib/firebase/admin");
    const { claimWebhookEvent } = await import("./dedup");

    const claimed = new Set<string>();
    const doc = vi.fn((path: string) => ({
      create: vi.fn(async () => {
        if (claimed.has(path)) throw new Error("ALREADY_EXISTS");
        claimed.add(path);
      }),
    }));
    vi.mocked(getAdminFirestore).mockReturnValue({ doc } as unknown as ReturnType<typeof getAdminFirestore>);

    await expect(claimWebhookEvent("lemonsqueezy", "evt_1")).resolves.toBe(true);
    await expect(claimWebhookEvent("stripe", "evt_1")).resolves.toBe(true);
  });
});
