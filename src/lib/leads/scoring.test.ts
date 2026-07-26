import { describe, expect, it } from "vitest";
import { computeAiUsageScore, isPathAllowedByRobots, type ScannedPage } from "./scoring";

function page(url: string, html: string): ScannedPage {
  return { url, html, text: html.replace(/<[^>]+>/g, " ").toLowerCase() };
}

describe("computeAiUsageScore", () => {
  it("scores a strong-signal company at 70 or above", () => {
    const pages: ScannedPage[] = [
      page(
        "https://example.com",
        "<html><body>We export to Germany and the European Union, REACH and RoHS compliant, CE certified. " +
          "<script src='https://widget.intercom.io/widget/abc'></script> Our products use yapay zeka for quality control. " +
          "Founded in 2005, ISO 9001 certified.</body></html>"
      ),
    ];
    const result = computeAiUsageScore(pages, true);
    expect(result.score).toBeGreaterThanOrEqual(70);
    expect(result.rationale.length).toBeGreaterThan(0);
  });

  it("scores a no-signal company low with an explanatory rationale", () => {
    const pages: ScannedPage[] = [page("https://example.com", "<html><body>Welcome to our local bakery.</body></html>")];
    const result = computeAiUsageScore(pages, false);
    expect(result.score).toBeLessThan(20);
    expect(result.rationale[0]).toMatch(/no export/i);
  });

  it("caps each signal category at its configured weight even with many matches", () => {
    const pages: ScannedPage[] = [
      page(
        "https://example.com",
        "germany deutschland european union avrupa birliği reach rohs ce eudr cbam ihracat export exporter"
      ),
    ];
    const result = computeAiUsageScore(pages, false);
    expect(result.score).toBeLessThanOrEqual(40);
  });
});

describe("isPathAllowedByRobots", () => {
  it("allows everything when there is no matching disallow rule", () => {
    const robots = "User-agent: *\nDisallow: /admin\n";
    expect(isPathAllowedByRobots(robots, "/")).toBe(true);
  });

  it("disallows root scanning when Disallow: / is set for all agents", () => {
    const robots = "User-agent: *\nDisallow: /\n";
    expect(isPathAllowedByRobots(robots, "/")).toBe(false);
  });

  it("ignores disallow rules scoped to a different user-agent", () => {
    const robots = "User-agent: SomeOtherBot\nDisallow: /\n\nUser-agent: *\nDisallow: /private\n";
    expect(isPathAllowedByRobots(robots, "/")).toBe(true);
  });
});
