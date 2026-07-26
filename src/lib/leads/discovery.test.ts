import { describe, expect, it } from "vitest";
import { pickDiscoveryTarget } from "./discovery";
import { DISCOVERY_CITIES, DISCOVERY_SECTORS } from "./discovery-config";

describe("pickDiscoveryTarget", () => {
  it("picks the first candidate city/sector when there are no existing leads", () => {
    const target = pickDiscoveryTarget([]);
    expect(DISCOVERY_CITIES).toContain(target.city);
    expect(DISCOVERY_SECTORS).toContain(target.sector);
  });

  it("picks the least-represented city over a heavily-represented one", () => {
    const heavilyCovered = DISCOVERY_CITIES[0];
    const underCovered = DISCOVERY_CITIES[1];
    const leads = Array.from({ length: 20 }, () => ({ city: heavilyCovered, sector: DISCOVERY_SECTORS[0] }));
    const target = pickDiscoveryTarget(leads);
    expect(target.city).toBe(underCovered);
  });

  it("ignores leads whose city/sector isn't in the fixed candidate lists", () => {
    const leads = [{ city: "İstanbul", sector: "tekstil" }];
    const target = pickDiscoveryTarget(leads);
    // İstanbul isn't a discovery candidate city, so it shouldn't skew the pick.
    expect(DISCOVERY_CITIES).toContain(target.city);
  });

  it("picks the least-represented sector independently of city counts", () => {
    const heavilyCovered = DISCOVERY_SECTORS[0];
    const underCovered = DISCOVERY_SECTORS[1];
    const leads = Array.from({ length: 10 }, () => ({ city: DISCOVERY_CITIES[0], sector: heavilyCovered }));
    const target = pickDiscoveryTarget(leads);
    expect(target.sector).toBe(underCovered);
  });
});
