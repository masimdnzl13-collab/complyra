import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { BackgroundTexture } from "@/components/marketing/background-texture";

export default function MarketingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <BackgroundTexture />
      <SiteHeader />
      <main>{children}</main>
      <SiteFooter />
    </>
  );
}
