import { constructMetadata } from "@/lib/construct-metadata";
import { pricingPlans, formatPlanPrice } from "@/config/site";

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
            className={`rounded-xl border p-6 ${
              plan.highlighted
                ? "border-accent bg-white shadow-lg"
                : "border-navy-100 bg-white"
            }`}
          >
            <h2 className="text-lg font-semibold text-navy-900">{plan.name}</h2>
            <p className="mt-2 text-3xl font-semibold text-navy-900">
              {formatPlanPrice(plan)}
            </p>
            <p className="mt-4 text-sm text-navy-600">{plan.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
