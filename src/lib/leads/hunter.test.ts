import { describe, expect, it } from "vitest";
import { extractDomain, mapHunterDomainSearchToEmails } from "./hunter";

describe("extractDomain", () => {
  it("strips protocol and www from a full URL", () => {
    expect(extractDomain("https://www.example.com/about")).toBe("example.com");
  });

  it("accepts a bare domain with no protocol", () => {
    expect(extractDomain("example.com")).toBe("example.com");
  });

  it("returns null for an unparseable value", () => {
    expect(extractDomain("")).toBeNull();
  });
});

describe("mapHunterDomainSearchToEmails", () => {
  it("maps a personal email to verified confidence, preserving Hunter's numeric score", () => {
    const result = mapHunterDomainSearchToEmails({
      pattern: "{first}.{last}",
      emails: [
        { value: "jane.doe@example.com", type: "personal", confidence: 92, first_name: "Jane", last_name: "Doe", position: "CEO" },
      ],
    });
    expect(result.emails[0]).toMatchObject({
      address: "jane.doe@example.com",
      confidence: "verified",
      confidenceScore: 92,
      name: "Jane Doe",
      position: "CEO",
    });
    expect(result.pattern).toBe("{first}.{last}");
  });

  it("maps a generic email to generic_corporate confidence", () => {
    const result = mapHunterDomainSearchToEmails({
      pattern: null,
      emails: [{ value: "info@example.com", type: "generic", confidence: 70, first_name: null, last_name: null, position: null }],
    });
    expect(result.emails[0].confidence).toBe("generic_corporate");
    expect(result.emails[0].name).toBeNull();
  });

  it("never fabricates an address from the pattern when Hunter finds no emails", () => {
    const result = mapHunterDomainSearchToEmails({ pattern: "{f}{last}", emails: [] });
    expect(result.emails).toHaveLength(0);
    expect(result.pattern).toBe("{f}{last}");
  });
});
