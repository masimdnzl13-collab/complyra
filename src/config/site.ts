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
    500: "#2563EB",
    600: "#1D4ED8",
    700: "#103E8F",
    800: "#0B2B63",
    900: "#061737",
    DEFAULT: "#2563EB",
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

/** Growth and Scale are the two plans with expert-review access — everything gating that feature reads from here. */
const EXPERT_REVIEW_PLANS: readonly PlanId[] = ["growth", "scale"];
export function planHasExpertReviewAccess(planId: PlanId): boolean {
  return EXPERT_REVIEW_PLANS.includes(planId);
}

/**
 * Complyra's cut of every consultant payment (P13). Consultant honoraria are
 * paid through Complyra (Stripe), not directly — this is the platform fee
 * added on top of the consultant's own rate at checkout.
 */
export const consultantCommissionRate = 0.18;

export interface PricingPlan {
  id: PlanId;
  name: string;
  price: number;
  /** Annual price — billed once/year, discounted vs. 12x the monthly price. 0 on Free (no paid tier). */
  priceYearly: number;
  currency: string;
  billingPeriod: "month";
  description: string;
  /** Free trial length for a plan's first-ever subscription, or null if the plan has no trial (Free needs none; Starter historically hasn't offered one). */
  trialDays: number | null;
  /**
   * LemonSqueezy identifiers — null until the corresponding product/variant
   * is created in the LemonSqueezy dashboard (or via the API) for this
   * plan. The UI checks these before rendering a live checkout link;
   * null renders a "coming soon" state instead of a broken checkout.
   */
  lemonSqueezy: {
    productId: string | null;
    variantIdMonthly: string | null;
    variantIdYearly: string | null;
  };
  /** Who this plan is built for — shown on the pricing card. */
  targetUser: string;
  /** Number of AI systems the plan can track, or "unlimited". */
  systemsLimit: number | "unlimited";
  /** Risk assessments (AI-assisted classifications) the plan allows per calendar month, or "unlimited". */
  assessmentsPerMonth: number | "unlimited";
  /** Compliance documents (AI-assisted generation) the plan allows per calendar month, or "unlimited". */
  documentsPerMonth: number | "unlimited";
  /** AI-customized Article 50 texts (disclosure notices, labeling templates, deepfake text) per calendar month, or "unlimited". 0 on Free — static checklists/templates stay free, customized generation needs Starter+. */
  article50TextsPerMonth: number | "unlimited";
  /** Total distinct employees who can enroll in AI literacy training (not monthly — a headcount cap), or "unlimited". */
  aiLiteracySeats: number | "unlimited";
  /**
   * Team members (org members, not AI literacy seats) allowed on the plan.
   * Data only for now — no invite-time enforcement reads this yet, since
   * team size hasn't been a gated dimension before. Add the check in
   * /api/team/invite if/when this needs to be a real limit.
   */
  teamMembers: number | "unlimited";
  /** Whether the plan includes API access. Not built yet — the modules list still says "coming soon" until it exists. */
  apiAccess: boolean;
  /** Modules included, in display order — shown as a checklist on the card. */
  modules: readonly string[];
  highlighted?: boolean;
}

export const pricingPlans: readonly PricingPlan[] = [
  {
    id: "free",
    name: "Free",
    price: 0,
    priceYearly: 0,
    currency: "EUR",
    billingPeriod: "month",
    description: "Explore Complyra with a single project and limited exports.",
    trialDays: null,
    lemonSqueezy: { productId: null, variantIdMonthly: null, variantIdYearly: null },
    targetUser: "Solo founders and consultants exploring their obligations before committing.",
    systemsLimit: 1,
    assessmentsPerMonth: 1,
    documentsPerMonth: 5,
    article50TextsPerMonth: 0,
    aiLiteracySeats: 5,
    teamMembers: 1,
    apiAccess: false,
    modules: ["AI system inventory (1 system)", "Risk classification preview", "Powered by Complyra badge"],
  },
  {
    id: "starter",
    name: "Starter",
    price: 49,
    priceYearly: 529,
    currency: "EUR",
    billingPeriod: "month",
    description: "For small teams preparing their first EU AI Act filings.",
    trialDays: null,
    lemonSqueezy: {
      productId: null,
      variantIdMonthly: "var_abc123xyz",
      variantIdYearly: "var_def456uvw",
    },
    targetUser: "Small teams preparing their first EU AI Act filing.",
    systemsLimit: 5,
    assessmentsPerMonth: 10,
    documentsPerMonth: 20,
    article50TextsPerMonth: 3,
    aiLiteracySeats: 20,
    teamMembers: 5,
    apiAccess: false,
    modules: [
      "AI system inventory",
      "Risk classification with legal reasoning",
      "Core compliance documents",
      "Article 50 transparency pack",
    ],
  },
  {
    id: "growth",
    name: "Growth",
    price: 149,
    priceYearly: 1593,
    currency: "EUR",
    billingPeriod: "month",
    description: "For growing teams managing multiple AI systems and audits.",
    trialDays: 14,
    lemonSqueezy: {
      productId: null,
      variantIdMonthly: "var_ghi789xyz",
      variantIdYearly: "var_jkl012uvw",
    },
    targetUser: "Growing companies managing multiple AI systems across teams.",
    systemsLimit: 20,
    assessmentsPerMonth: "unlimited",
    documentsPerMonth: 50,
    article50TextsPerMonth: "unlimited",
    aiLiteracySeats: "unlimited",
    teamMembers: "unlimited",
    apiAccess: true,
    modules: [
      "AI system inventory",
      "Risk classification with legal reasoning",
      "Core compliance documents",
      "Article 50 transparency pack",
      "Staff AI literacy training records",
      "Compliance dashboard",
      "Consultant review access",
    ],
    highlighted: true,
  },
  {
    id: "scale",
    name: "Scale",
    price: 399,
    priceYearly: 4287,
    currency: "EUR",
    billingPeriod: "month",
    description: "For organizations with complex, multi-entity compliance needs.",
    trialDays: 14,
    lemonSqueezy: {
      productId: null,
      variantIdMonthly: "var_mno345xyz",
      variantIdYearly: "var_pqr678uvw",
    },
    targetUser: "Organizations with complex, multi-entity compliance needs.",
    systemsLimit: "unlimited",
    assessmentsPerMonth: "unlimited",
    documentsPerMonth: "unlimited",
    article50TextsPerMonth: "unlimited",
    aiLiteracySeats: "unlimited",
    teamMembers: "unlimited",
    apiAccess: true,
    modules: [
      "AI system inventory",
      "Risk classification with legal reasoning",
      "Core compliance documents",
      "Article 50 transparency pack",
      "Staff AI literacy training records",
      "Compliance dashboard",
      "Multi-entity / multi-brand support",
      "Audit log export",
      "Consultant review access",
      "API access (coming soon)",
      "Dedicated onboarding",
    ],
  },
] as const;

/**
 * Feature-by-feature comparison shown below the pricing cards. Kept here
 * (not hand-written in the page) so pricing changes only ever happen in one
 * place, per the central-config rule.
 */
export interface PricingComparisonRow {
  feature: string;
  values: Record<PlanId, string>;
}

export const pricingComparisonRows: readonly PricingComparisonRow[] = [
  {
    feature: "AI systems tracked",
    values: { free: "1", starter: "5", growth: "20", scale: "Unlimited" },
  },
  {
    feature: "Risk classification with legal reasoning",
    values: { free: "Preview only", starter: "Full", growth: "Full", scale: "Full" },
  },
  {
    feature: "Risk assessments per month",
    values: { free: "1", starter: "10", growth: "Unlimited", scale: "Unlimited" },
  },
  {
    feature: "Documents generated per month",
    values: { free: "5", starter: "20", growth: "50", scale: "Unlimited" },
  },
  {
    feature: "Article 50 checklists & static templates",
    values: { free: "Included", starter: "Included", growth: "Included", scale: "Included" },
  },
  {
    feature: "Article 50 AI-customized texts per month",
    values: { free: "—", starter: "3", growth: "Unlimited", scale: "Unlimited" },
  },
  {
    feature: "Employees enrolled in AI literacy training",
    values: { free: "5", starter: "20", growth: "Unlimited", scale: "Unlimited" },
  },
  {
    feature: "Article 50 transparency pack",
    values: { free: "—", starter: "Included", growth: "Included", scale: "Included" },
  },
  {
    feature: "Staff AI literacy training records",
    values: { free: "—", starter: "—", growth: "Included", scale: "Included" },
  },
  {
    feature: "Compliance dashboard",
    values: { free: "—", starter: "—", growth: "Included", scale: "Included" },
  },
  {
    feature: "Multi-entity support",
    values: { free: "—", starter: "—", growth: "—", scale: "Included" },
  },
  {
    feature: "Team members",
    values: { free: "1", starter: "5", growth: "Unlimited", scale: "Unlimited" },
  },
  {
    feature: "API access",
    values: { free: "—", starter: "—", growth: "Coming soon", scale: "Coming soon" },
  },
  {
    feature: "Support",
    values: { free: "Community", starter: "Email", growth: "Priority email", scale: "Dedicated onboarding" },
  },
] as const;

/**
 * EU AI Act compliance deadlines, referenced by the homepage countdown
 * cards. Dates live here — nowhere else — so a regulatory timeline change
 * (this law has moved dates before, and may again) is a one-line edit.
 * ISO 8601 UTC so the countdown math is unambiguous regardless of the
 * visitor's timezone.
 */
export interface RegulationDeadline {
  id: "transparency" | "watermarking" | "high-risk";
  title: string;
  date: string;
  description: string;
  legalReference: string;
}

export const regulationDeadlines: readonly RegulationDeadline[] = [
  {
    id: "transparency",
    title: "Transparency obligations",
    date: "2026-08-02T00:00:00Z",
    description:
      "AI systems that interact with people or generate synthetic content must disclose that fact — chatbot notices and AI-content labeling become mandatory.",
    legalReference: "Article 50",
  },
  {
    id: "watermarking",
    title: "Machine-readable marking obligation",
    date: "2026-12-02T00:00:00Z",
    description:
      "Synthetic audio, image, video, and text output must carry a machine-readable, detectable mark identifying it as AI-generated.",
    legalReference: "Article 50(2)",
  },
  {
    id: "high-risk",
    title: "High-risk system obligations",
    date: "2027-12-02T00:00:00Z",
    description:
      "Full risk-management, data governance, technical documentation, and human-oversight requirements apply to high-risk AI systems.",
    legalReference: "Articles 8–15, Annex III",
  },
] as const;

/** Blog taxonomy (P16) — the fixed set of categories content can be filed under. */
export type BlogCategory =
  | "eu-ai-act-compliance"
  | "article-50-transparency"
  | "risk-assessment"
  | "ai-literacy"
  | "case-studies"
  | "news-updates"
  | "product-updates";

export const blogCategories: readonly { id: BlogCategory; label: string }[] = [
  { id: "eu-ai-act-compliance", label: "EU AI Act Compliance" },
  { id: "article-50-transparency", label: "Article 50 Transparency" },
  { id: "risk-assessment", label: "Risk Assessment & High-Risk Systems" },
  { id: "ai-literacy", label: "AI Literacy & Training" },
  { id: "case-studies", label: "Case Studies" },
  { id: "news-updates", label: "News & Updates" },
  { id: "product-updates", label: "Product Updates" },
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
