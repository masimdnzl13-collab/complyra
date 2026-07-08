import { Inter } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { constructMetadata } from "@/lib/construct-metadata";
import { siteConfig } from "@/config/site";
import { LegalDisclaimerBanner } from "@/components/legal-disclaimer-banner";

const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata = constructMetadata();

/**
 * Deliberately minimal: the marketing header/footer and the app shell live
 * in (marketing)/layout.tsx and (app)/layout.tsx respectively, since auth
 * and app screens need a different shell than the marketing site. Only the
 * legal disclaimer banner is common to every single page, so it's the only
 * thing that lives here.
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang={siteConfig.locale} className={inter.variable}>
      <body className="flex min-h-screen flex-col font-sans antialiased">
        {GA_MEASUREMENT_ID && (
          <>
            <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`} strategy="afterInteractive" />
            <Script id="ga4-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_MEASUREMENT_ID}');
              `}
            </Script>
          </>
        )}
        <div className="flex-1">{children}</div>
        <LegalDisclaimerBanner />
      </body>
    </html>
  );
}
