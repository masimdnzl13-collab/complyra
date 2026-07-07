/**
 * Single source of truth for every brand and product constant in Complyra.
 * Nothing in this codebase should hardcode a name, price, color, link, or
 * legal string directly — it must be read from here, so this module can be
 * lifted into other projects unchanged.
 */

export const siteConfig = {
  name: "Complyra",
  legalName: "Complyra",
  tagline: "EU AI Act compliance, automated",
  description:
    "Complyra helps teams generate and manage the documentation required for EU AI Act compliance — risk classification, technical documentation, and conformity records, without the manual paperwork.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://complyra.io",
  locale: "en",
  language: "en-US",
  contact: {
    email: "hello@complyra.io",
    supportEmail: "support@complyra.io",
  },
  social: {
    twitter: "https://twitter.com/complyra",
    linkedin: "https://www.linkedin.com/company/complyra",
    github: "https://github.com/complyra",
  },
} as const;

/**
 * Brand color references. These are the only place hex values are defined;
 * tailwind.config.ts reads from here to build the theme, so UI code should
 * reference Tailwind classes (e.g. bg-navy-900) rather than raw hex codes.
 */
export const brandColors = {
  navy: {
    50: "#EEF2F8",
    100: "#D9E1EC",
    200: "#AFC0D8",
    300: "#83A0C0",
    400: "#5A7BA0",
    500: "#35577D",
    600: "#223F63",
    700: "#172D4A",
    800: "#0F1F35",
    900: "#0A1626",
    DEFAULT: "#0A1626",
  },
  accent: {
    50: "#EAF1FE",
    100: "#CFE0FD",
    200: "#9FC2FB",
    300: "#6FA3F8",
    400: "#3F85F6",
    500: "#1B66E8",
    600: "#1552BC",
    700: "#103E8F",
    800: "#0B2B63",
    900: "#061737",
    DEFAULT: "#1B66E8",
  },
  background: {
    DEFAULT: "#F7F8FA",
    surface: "#FFFFFF",
  },
  success: {
    DEFAULT: "#3FA772",
  },
  warning: {
    DEFAULT: "#D9A441",
  },
  danger: {
    DEFAULT: "#DC2626",
  },
} as const;

export type PlanId = "free" | "starter" | "growth" | "scale";

export interface PricingPlan {
  id: PlanId;
  name: string;
  price: number;
  currency: string;
  billingPeriod: "month";
  description: string;
  highlighted?: boolean;
}

export const pricingPlans: readonly PricingPlan[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    currency: "EUR",
    billingPeriod: "month",
    description: "Explore Complyra with a single project and limited exports.",
  },
  {
    id: "starter",
    name: "Starter",
    price: 49,
    currency: "EUR",
    billingPeriod: "month",
    description: "For small teams preparing their first EU AI Act filings.",
  },
  {
    id: "growth",
    name: "Growth",
    price: 149,
    currency: "EUR",
    billingPeriod: "month",
    description: "For growing teams managing multiple AI systems and audits.",
    highlighted: true,
  },
  {
    id: "scale",
    name: "Scale",
    price: 399,
    currency: "EUR",
    billingPeriod: "month",
    description: "For organizations with complex, multi-entity compliance needs.",
  },
] as const;

export const legalConfig = {
  disclaimer:
    "Complyra is a documentation preparation tool. It does not constitute legal advice, and using it does not establish a legal or professional relationship. Consult a qualified professional for advice on your specific compliance obligations under the EU AI Act.",
  copyrightHolder: "Complyra",
} as const;

export function formatPlanPrice(plan: PricingPlan): string {
  if (plan.price === 0) return "Free";
  const formatter = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: plan.currency,
    minimumFractionDigits: 0,
  });
  return `${formatter.format(plan.price)}/${plan.billingPeriod}`;
}
