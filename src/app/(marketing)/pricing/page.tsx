import Link from "next/link";
import { constructMetadata } from "@/lib/construct-metadata";
import { pricingPlans, pricingComparisonRows, formatPlanPrice } from "@/config/site";

export const metadata = constructMetadata({
  title: "Pricing",
  description: "Simple, transparent pricing for teams of every size preparing EU AI Act compliance documentation.",
  path: "/pricing",
});

export default function PricingPage() {
  return (
    <div className="mx-auto max-w-6xl px-6 py-24">
      <div className="text-center">
        <h1 className="text-4xl font-semibold tracking-tight text-navy-900">Pricing</h1>
        <p className="mt-4 text-lg text-navy-600">
          Choose the plan that fits your compliance workload.
        </p>
      </div>

      <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {pricingPlans.map((plan) => (
          <div
            key={plan.id}
            className={`flex flex-col rounded-xl border p-6 ${
              plan.highlighted
                ? "border-accent bg-white shadow-lg"
                : "border-navy-100 bg-white"
            }`}
          >
            {plan.highlighted && (
              <span className="mb-3 inline-block w-fit rounded-full bg-accent px-3 py-1 text-xs font-medium text-white">
                Most popular
              </span>
            )}
            <h2 className="text-lg font-semibold text-navy-900">{plan.name}</h2>
            <p className="mt-2 text-3xl font-semibold text-navy-900">
              {formatPlanPrice(plan)}
            </p>
            <p className="mt-3 text-sm text-navy-600">{plan.description}</p>
            <p className="mt-4 text-xs font-medium uppercase tracking-wide text-navy-400">
              {plan.targetUser}
            </p>
            <p className="mt-4 text-sm font-medium text-navy-900">
              {plan.systemsLimit === "unlimited" ? "Unlimited" : plan.systemsLimit} AI system
              {plan.systemsLimit === 1 ? "" : "s"}
            </p>
            <ul className="mt-4 space-y-2">
              {plan.modules.map((module) => (
                <li key={module} className="flex items-start gap-2 text-sm text-navy-700">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  {module}
                </li>
              ))}
            </ul>
            <Link
              href="/register"
              className={`mt-6 rounded-md px-4 py-2 text-center text-sm font-medium transition-colors ${
                plan.highlighted
                  ? "bg-accent text-white hover:bg-accent-600"
                  : "border border-navy-200 text-navy-900 hover:bg-navy-50"
              }`}
            >
              Get started
            </Link>
          </div>
        ))}
      </div>

      {/* Comparison table */}
      <div className="mt-20">
        <h2 className="text-center text-2xl font-semibold tracking-tight text-navy-900">
          Compare plans
        </h2>
        <div className="mt-8 overflow-x-auto rounded-xl border border-navy-100 bg-white">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead>
              <tr className="border-b border-navy-100">
                <th className="px-6 py-4 font-medium text-navy-500">Feature</th>
                {pricingPlans.map((plan) => (
                  <th key={plan.id} className="px-6 py-4 font-semibold text-navy-900">
                    {plan.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-100">
              {pricingComparisonRows.map((row) => (
                <tr key={row.feature}>
                  <td className="px-6 py-4 text-navy-700">{row.feature}</td>
                  {pricingPlans.map((plan) => (
                    <td key={plan.id} className="px-6 py-4 text-navy-600">
                      {row.values[plan.id]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Objection handling */}
      <div className="mx-auto mt-24 max-w-3xl rounded-xl border border-navy-100 bg-navy-50 p-8 text-center">
        <h2 className="text-xl font-semibold text-navy-900">Compared to a compliance consultant</h2>
        <p className="mt-4 text-sm text-navy-600">
          A single outside-counsel analysis for EU AI Act readiness typically runs into the
          thousands of euros, as a one-time engagement that goes out of date the moment your AI
          systems change. Every Complyra plan is a monthly subscription — your documentation stays
          current as your systems evolve, at a fraction of the cost of a one-off review.
        </p>
      </div>
    </div>
  );
}
