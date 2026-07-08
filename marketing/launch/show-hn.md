# Show HN — Complyra

**Target:** Tuesday or Wednesday, Sep 2–3, 2026, ~10:00 AM EST (peak HN traffic)
**Prep:** Participate in a couple of relevant Ask HN / Show HN threads beforehand to build some visible history — don't post cold.

## Title

Show HN: Complyra – We automated EU AI Act compliance for SaaS in 90 days

## Post body

The EU AI Act has real compliance deadlines starting August 2, 2026 (transparency obligations — think chatbot disclosure and AI-content labeling), December 2026 (watermarking), and December 2027 (full high-risk system obligations). If you run a SaaS company with AI features and any EU exposure, this already applies to you, extraterritorially, the same way GDPR does.

The existing options for a small team are: pay a law firm you probably can't afford, or hope nobody asks. Neither scales down to a 10-person startup.

We built Complyra to close that gap. The core loop:

1. Inventory the AI systems you build, buy, or use (structured questions, ~10 min per system)
2. Get a risk classification against the Act's four tiers, with the specific article/Annex III category cited and a plain-language justification — deterministic rules handle the clear-cut cases, Claude handles genuinely ambiguous ones
3. Generate the technical documentation, conformity records, and disclosure notices your tier requires
4. Get emailed as deadlines approach, based on what's actually in your inventory

Stack: Next.js 14 App Router, Firebase (Auth + Firestore), Vercel, Claude for the judgment-requiring classification calls and document drafting, LemonSqueezy for billing (EUR, VAT handled as merchant of record).

It is explicitly not legal advice — it's a documentation preparation tool, and we say that on every page. The goal is to get a small team 90% of the way to a defensible compliance posture and be honest about where the remaining 10% needs a real professional (we also have an expert-review marketplace inside the product for exactly that).

Free tier is real (not a time-limited trial) — one AI system, one risk assessment. Happy to answer anything about the regulation, the architecture, or why we made specific product calls.

Link: https://complyra.io
