import { legalConfig } from "@/config/site";

export function LegalDisclaimerBanner() {
  return (
    <div className="border-t border-navy-100 bg-navy-50 px-4 py-3 text-center text-xs text-navy-600">
      <p className="mx-auto max-w-4xl">{legalConfig.disclaimer}</p>
    </div>
  );
}
