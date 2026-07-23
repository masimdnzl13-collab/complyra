import Link from "next/link";
import { siteConfig } from "@/config/site";
import { Logo } from "@/components/logo";

export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-navy-100 bg-navy-900 text-navy-100">
      <div className="mx-auto max-w-6xl px-6 py-12">
        <div className="grid gap-8 sm:grid-cols-4">
          <div>
            <Logo variant="light" />
            <p className="mt-3 text-sm text-navy-300">{siteConfig.tagline}</p>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Product</p>
            <ul className="mt-3 space-y-2 text-sm text-navy-300">
              <li>
                <Link href="/pricing" className="hover:text-white">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white">
                  About
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-white">
                  Blog
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Legal</p>
            <ul className="mt-3 space-y-2 text-sm text-navy-300">
              <li>
                <Link href="/terms" className="hover:text-white">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-white">
                  Privacy Policy
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-sm font-semibold text-white">Contact</p>
            <ul className="mt-3 space-y-2 text-sm text-navy-300">
              <li>
                <a href={`mailto:${siteConfig.contact.email}`} className="hover:text-white">
                  {siteConfig.contact.email}
                </a>
              </li>
              <li>
                <a href={siteConfig.social.linkedin} className="hover:text-white">
                  LinkedIn
                </a>
              </li>
              <li>
                <a href={siteConfig.social.twitter} className="hover:text-white">
                  Twitter
                </a>
              </li>
            </ul>
          </div>
        </div>
        <p className="mt-10 border-t border-navy-700 pt-6 text-xs text-navy-400">
          &copy; {year} {siteConfig.legalName}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
