import { constructMetadata } from "@/lib/construct-metadata";
import { siteConfig } from "@/config/site";
import { ScannerWizard } from "@/components/risk-scan/scanner-wizard";

export const metadata = constructMetadata({
  title: "Free Risk Scan",
  description: `Find out in minutes which EU AI Act obligations apply to your company — ${siteConfig.name}'s free risk scanner.`,
  path: "/risk-scan",
});

export default function RiskScanPage() {
  return <ScannerWizard />;
}
