import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { constructMetadata } from "@/lib/construct-metadata";
import { siteConfig } from "@/config/site";

export const metadata = constructMetadata({
  title: "Checkout cancelled",
  path: "/checkout/cancel",
  noIndex: true,
});

export default async function CheckoutCancelPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="mx-auto flex max-w-md flex-col items-center px-6 py-24 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-navy-100">
        <svg className="h-7 w-7 text-navy-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </div>

      <h1 className="mt-6 text-2xl font-semibold text-navy-900">Checkout cancelled</h1>
      <p className="mt-2 text-navy-600">No charge was made. Your plan hasn&apos;t changed.</p>

      <Link href="/billing" className="mt-8 w-full rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-600">
        Back to billing
      </Link>
      <a href={`mailto:${siteConfig.contact.supportEmail}`} className="mt-3 text-sm font-medium text-navy-500 hover:text-navy-900">
        Need help? Contact support
      </a>
    </div>
  );
}
