import Link from "next/link";
import {
  ClipboardList,
  ShieldAlert,
  FileText,
  Megaphone,
  GraduationCap,
  LayoutDashboard,
  Code2,
  ShoppingCart,
  Users,
  Globe,
} from "lucide-react";
import { constructMetadata } from "@/lib/construct-metadata";
import { siteConfig, regulationDeadlines } from "@/config/site";
import { getTimeRemaining } from "@/lib/countdown";
import { CountdownCard } from "@/components/marketing/countdown-card";
import { NewsletterForm } from "@/components/marketing/newsletter-form";
import { DashboardPreview } from "@/components/marketing/dashboard-preview";
import { LegalTag } from "@/components/marketing/legal-tag";

export const metadata = constructMetadata({ path: "/" });

// Revalidate periodically so the server-rendered countdown (see the
// Countdowns section below) never drifts far from real time, even though
// the page itself has no other dynamic data.
export const revalidate = 60;

const steps = [
  {
    title: "Inventory your AI",
    description:
      "Answer a short set of guided questions to log every AI system your company builds, buys, or uses.",
  },
  {
    title: "Get your risk classification",
    description:
      "Each system is classified against the Act's risk tiers, with a plain-language justification and the article it's based on.",
  },
  {
    title: "Generate and maintain your documents",
    description:
      "Produce the technical documentation, conformity records, and transparency notices your risk tier requires — and keep them current as your systems change.",
  },
] as const;

const features = [
  {
    title: "AI system inventory",
    description: "A single, structured record of every AI system in use across your organization.",
    icon: ClipboardList,
    tag: "Annex III",
  },
  {
    title: "Risk classification",
    description: "Each system placed into its EU AI Act risk tier, with the reasoning and article behind it.",
    icon: ShieldAlert,
    tag: "Art. 6",
  },
  {
    title: "Document generation",
    description: "Technical documentation, conformity declarations, and instructions for use, drafted from your inventory.",
    icon: FileText,
    tag: "Annex IV",
  },
  {
    title: "Article 50 transparency pack",
    description: "Chatbot disclosures and AI-content labeling notices, ready for the systems that need them.",
    icon: Megaphone,
    tag: "Art. 50",
  },
  {
    title: "Staff AI literacy training",
    description: "Track completed training records to meet the Act's AI literacy obligation for staff.",
    icon: GraduationCap,
    tag: "Art. 4",
  },
  {
    title: "Compliance dashboard",
    description: "One view of every system, its risk tier, and the status of its required documentation.",
    icon: LayoutDashboard,
    tag: "Art. 12",
  },
] as const;

const legalReferenceChips = [
  "Art. 5 — Prohibited Practices",
  "Art. 6(3) — Derogation",
  "Art. 50 — Transparency",
  "Annex III — High-Risk",
  "Art. 4 — AI Literacy",
] as const;

const audiences = [
  {
    title: "SaaS companies",
    description: "Embedding AI features into their product.",
    icon: Code2,
  },
  {
    title: "E-commerce businesses",
    description: "Using AI for recommendations, pricing, or support.",
    icon: ShoppingCart,
  },
  {
    title: "Agencies",
    description: "Deploying AI systems on behalf of clients.",
    icon: Users,
  },
  {
    title: "Non-EU companies",
    description: "Selling AI-enabled products or services into the EU.",
    icon: Globe,
  },
] as const;

const faqs = [
  {
    question: "Does this law apply to my company if we're not based in the EU?",
    answer:
      "Usually, yes. The EU AI Act applies to providers and deployers outside the EU if their AI system's output is used within the EU — similar in reach to the GDPR.",
  },
  {
    question: "High-risk obligations were pushed back — should I wait?",
    answer:
      "No. Inventory and transparency obligations already apply on their own timeline, independent of the high-risk deadline. Waiting only compresses the work later.",
    tag: "Annex III",
  },
  {
    question: "Does Vermoncy give legal advice?",
    answer:
      "No. Vermoncy is a documentation preparation tool, not a source of legal advice, and using it doesn't create a legal or professional relationship. See the disclaimer at the bottom of every page.",
  },
  {
    question: "What documents does Vermoncy actually produce?",
    answer:
      "Risk classification reports, technical documentation, conformity declarations, instructions for use, and Article 50 transparency notices — scoped to what your systems' risk tier requires.",
    tag: "Art. 50",
  },
] as const;

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: siteConfig.name,
  url: siteConfig.url,
  description: siteConfig.description,
  sameAs: [siteConfig.social.twitter, siteConfig.social.linkedin, siteConfig.social.github],
};

export default function HomePage() {
  return (
    <>
      {/* eslint-disable-next-line react/no-danger */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }} />

      {/* Hero — light theme, consistent with the rest of the site; the page-wide BackgroundTexture (marketing layout) shows through here */}
      <section className="relative mx-auto flex max-w-4xl flex-col items-center px-6 py-section-lg text-center">
        <p className="rounded-full bg-navy-50 px-4 py-1 text-sm font-medium text-navy-600">
          {siteConfig.tagline}
        </p>
        <h1 className="mt-6 text-4xl font-semibold tracking-tight text-navy-900 sm:text-5xl">
          Your EU AI Act compliance file, ready in hours — not months.
        </h1>
        <p className="mt-4 max-w-2xl text-lg text-navy-600">
          Built for small and mid-sized companies operating in the EU, or selling into it, who
          need an AI system inventory, risk classification, and compliance documentation without
          hiring outside counsel.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/risk-scan"
            className="rounded-md bg-accent px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-accent-600"
          >
            Start your free risk scan
          </Link>
          <Link
            href="/pricing"
            className="rounded-md border border-navy-200 px-6 py-3 text-sm font-medium text-navy-900 transition-colors hover:bg-navy-50"
          >
            View pricing
          </Link>
        </div>

        <DashboardPreview />
      </section>

      {/* Legal reference strip — fills the hero-to-content transition with a quiet signal of regulatory depth */}
      <section className="border-b border-navy-100 bg-white py-section-sm">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-3 px-6">
          {legalReferenceChips.map((chip) => (
            <LegalTag key={chip}>{chip}</LegalTag>
          ))}
        </div>
      </section>

      {/* Countdowns */}
      <section className="border-y border-navy-100 bg-navy-50 py-section-lg">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-navy-900">
              The compliance clock is running
            </h2>
            <p className="mt-3 text-navy-600">
              Key EU AI Act deadlines, counting down in real time.
            </p>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {regulationDeadlines.map((deadline) => (
              <CountdownCard
                key={deadline.id}
                deadline={deadline}
                initialRemaining={getTimeRemaining(deadline.date)}
              />
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-6 py-section-lg">
        <div className="text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-navy-900">How it works</h2>
        </div>
        <div className="mt-12 grid gap-8 sm:grid-cols-3">
          {steps.map((step, index) => (
            <div key={step.title}>
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent text-sm font-semibold text-white">
                {index + 1}
              </div>
              <h3 className="mt-4 text-lg font-semibold text-navy-900">{step.title}</h3>
              <p className="mt-2 text-sm text-navy-600">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="border-y border-navy-100 bg-navy-50 py-section-lg">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-navy-900">
              Everything your compliance file needs
            </h2>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.title} className="rounded-xl border border-navy-100 bg-white p-6 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
                    <feature.icon className="h-5 w-5" />
                  </div>
                  <LegalTag>{feature.tag}</LegalTag>
                </div>
                <h3 className="mt-4 text-base font-semibold text-navy-900">{feature.title}</h3>
                <p className="mt-2 text-sm text-navy-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Audience + penalties */}
      <section className="mx-auto max-w-6xl px-6 py-section-lg">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-navy-900">Built for teams like yours</h2>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {audiences.map((audience) => (
                <div key={audience.title} className="rounded-xl border border-navy-100 bg-white p-6 shadow-sm">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent">
                    <audience.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-base font-semibold text-navy-900">{audience.title}</h3>
                  <p className="mt-2 text-sm text-navy-600">{audience.description}</p>
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-xl border border-danger/20 bg-navy-900 p-8 text-white">
            <h2 className="text-2xl font-semibold tracking-tight">The penalties are real</h2>
            <div className="mt-6 flex flex-wrap items-baseline gap-x-6 gap-y-2">
              <p className="font-mono text-6xl font-bold leading-none text-danger sm:text-7xl">€35M</p>
              <p className="font-mono text-6xl font-bold leading-none text-danger sm:text-7xl">7%</p>
            </div>
            <p className="mt-5 text-sm text-navy-300">
              Maximum fine for non-compliance — or 7% of global annual turnover, whichever is higher.
              A lower cap applies for SMEs, but the obligation to prepare documentation applies
              regardless of company size.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-navy-100 bg-navy-50 py-section-lg">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="text-center text-3xl font-semibold tracking-tight text-navy-900">
            Frequently asked questions
          </h2>
          <div className="mt-10 divide-y divide-navy-100 rounded-xl border border-navy-100 bg-white">
            {faqs.map((faq) => (
              <details key={faq.question} className="group px-6 py-5">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-medium text-navy-900">
                  <span>{faq.question}</span>
                  {"tag" in faq && <LegalTag>{faq.tag}</LegalTag>}
                </summary>
                <p className="mt-3 text-sm text-navy-600">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="mx-auto max-w-3xl px-6 py-section-lg text-center">
        <h2 className="text-2xl font-semibold tracking-tight text-navy-900">
          Stay ahead of the deadlines
        </h2>
        <p className="mt-3 text-navy-600">
          We track changes to the EU AI Act and send a plain-language summary when something
          affects your obligations. No noise.
        </p>
        <div className="mt-6 flex justify-center">
          <NewsletterForm />
        </div>
      </section>
    </>
  );
}
