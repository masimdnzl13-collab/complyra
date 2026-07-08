import Link from "next/link";
import { constructMetadata } from "@/lib/construct-metadata";
import { siteConfig, regulationDeadlines } from "@/config/site";
import { CountdownCard } from "@/components/marketing/countdown-card";
import { NewsletterForm } from "@/components/marketing/newsletter-form";

export const metadata = constructMetadata({ path: "/" });

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
  },
  {
    title: "Risk classification",
    description: "Each system placed into its EU AI Act risk tier, with the reasoning and article behind it.",
  },
  {
    title: "Document generation",
    description: "Technical documentation, conformity declarations, and instructions for use, drafted from your inventory.",
  },
  {
    title: "Article 50 transparency pack",
    description: "Chatbot disclosures and AI-content labeling notices, ready for the systems that need them.",
  },
  {
    title: "Staff AI literacy training",
    description: "Track completed training records to meet the Act's AI literacy obligation for staff.",
  },
  {
    title: "Compliance dashboard",
    description: "One view of every system, its risk tier, and the status of its required documentation.",
  },
] as const;

const audiences = [
  "SaaS companies embedding AI features into their product",
  "E-commerce businesses using AI for recommendations, pricing, or support",
  "Agencies deploying AI systems on behalf of clients",
  "Non-EU companies selling AI-enabled products or services into the EU",
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
  },
  {
    question: "Does Complyra give legal advice?",
    answer:
      "No. Complyra is a documentation preparation tool, not a source of legal advice, and using it doesn't create a legal or professional relationship. See the disclaimer at the bottom of every page.",
  },
  {
    question: "What documents does Complyra actually produce?",
    answer:
      "Risk classification reports, technical documentation, conformity declarations, instructions for use, and Article 50 transparency notices — scoped to what your systems' risk tier requires.",
  },
] as const;

export default function HomePage() {
  return (
    <>
      {/* Hero */}
      <section className="mx-auto flex max-w-4xl flex-col items-center px-6 py-24 text-center">
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
      </section>

      {/* Countdowns */}
      <section className="border-y border-navy-100 bg-navy-50 py-20">
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
              <CountdownCard key={deadline.id} deadline={deadline} />
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-6 py-24">
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
      <section className="border-y border-navy-100 bg-navy-50 py-24">
        <div className="mx-auto max-w-6xl px-6">
          <div className="text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-navy-900">
              Everything your compliance file needs
            </h2>
          </div>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature) => (
              <div key={feature.title} className="rounded-xl border border-navy-100 bg-white p-6">
                <h3 className="text-base font-semibold text-navy-900">{feature.title}</h3>
                <p className="mt-2 text-sm text-navy-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Audience + penalties */}
      <section className="mx-auto max-w-6xl px-6 py-24">
        <div className="grid gap-12 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-navy-900">Built for teams like yours</h2>
            <ul className="mt-6 space-y-3">
              {audiences.map((audience) => (
                <li key={audience} className="flex items-start gap-3 text-sm text-navy-700">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  {audience}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-xl border border-navy-100 bg-navy-900 p-8 text-white">
            <h2 className="text-2xl font-semibold tracking-tight">The penalties are real</h2>
            <p className="mt-4 text-navy-200">
              Non-compliance can carry fines of up to €35 million or 7% of global annual turnover,
              whichever is higher. A lower cap applies for SMEs, but the obligation to prepare
              documentation applies regardless of company size.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-navy-100 bg-navy-50 py-24">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="text-center text-3xl font-semibold tracking-tight text-navy-900">
            Frequently asked questions
          </h2>
          <div className="mt-10 divide-y divide-navy-100 rounded-xl border border-navy-100 bg-white">
            {faqs.map((faq) => (
              <details key={faq.question} className="group px-6 py-5">
                <summary className="cursor-pointer list-none text-sm font-medium text-navy-900">
                  {faq.question}
                </summary>
                <p className="mt-3 text-sm text-navy-600">{faq.answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="mx-auto max-w-3xl px-6 py-24 text-center">
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
