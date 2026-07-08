import type { EmployeeRole } from "@/lib/firestore/schema";

export interface QuizOption {
  id: string;
  text: string;
  correct: boolean;
  explanation: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: QuizOption[];
}

export interface TrainingModule {
  id: string;
  title: string;
  estimatedMinutes: number;
  markdownContent: string;
  videoUrl?: string;
  quiz: QuizQuestion[];
}

export const PASS_THRESHOLD = 80;
export const MAX_ATTEMPTS = 3;

export const ROLE_LABELS: Record<EmployeeRole, string> = {
  technical: "Technical / Engineer",
  hr: "HR / People Manager",
  business: "Business / Sales Manager",
  executive: "Executive / Leadership",
  general: "General Employee",
  other: "Other",
};

// ---------------------------------------------------------------------------
// Common modules — every role takes these five.
// ---------------------------------------------------------------------------

const commonModules: TrainingModule[] = [
  {
    id: "ai-basics",
    title: "What is AI: Basics",
    estimatedMinutes: 5,
    videoUrl: "https://www.youtube.com/results?search_query=what+is+artificial+intelligence+explained+simply",
    markdownContent: `
"AI" here means software that finds patterns in data and uses them to make a prediction, a recommendation, or a decision — without a person writing explicit step-by-step rules for every case.

**How it actually works, in plain terms:** an AI model is shown many examples during training (e.g. thousands of past loan applications and their outcomes), and it learns statistical patterns from them. When you give it something new, it applies those patterns to produce an output. It is not "thinking" the way a person does — it's finding the closest match to what it has seen before.

**Where this shows up in everyday work:** spam filters, recommendation feeds, chatbots, resume screening tools, fraud detection, image and video generation, and voice assistants are all AI systems, even when they don't say "AI" anywhere in the interface.

**The limits that matter for your job:**
- A model can be confidently wrong. It doesn't "know" it made a mistake — it just outputs the pattern it learned, even for a case that doesn't fit.
- It reflects the data it was trained on. If that data has gaps or historical bias, the model's outputs will too.
- It has no common sense outside its training. It can fail badly on situations that are unusual, even if they seem obvious to a person.

**Interactive check:** imagine an image classifier that is 92% confident a photo shows a "cat" — but the photo is actually a small dog that looks unusual. The model isn't lying; it's reporting the pattern match it found. What would you do before acting on a 92%-confidence AI output that affects a real decision? The right instinct is: treat high confidence as a signal worth a second look, not proof — especially when the output affects a person.
`.trim(),
    quiz: [
      {
        id: "q1",
        question: "What does it mean when an AI model is \"trained\"?",
        options: [
          { id: "a", text: "It is shown many past examples and learns statistical patterns from them.", correct: true, explanation: "Correct — training is the process of learning patterns from example data." },
          { id: "b", text: "A person manually writes every rule the system will follow.", correct: false, explanation: "That's traditional rule-based software, not how most modern AI models work." },
          { id: "c", text: "It is connected to the internet for the first time.", correct: false, explanation: "Internet connectivity has nothing to do with how a model is trained." },
        ],
      },
      {
        id: "q2",
        question: "Why can an AI model be \"confidently wrong\"?",
        options: [
          { id: "a", text: "Because it deliberately hides its mistakes.", correct: false, explanation: "Models don't have intent — they don't hide anything." },
          { id: "b", text: "Because it reports the closest pattern match it found, even if that case doesn't really fit.", correct: true, explanation: "Correct — high confidence reflects pattern similarity, not certainty about truth." },
          { id: "c", text: "Because the software has a bug that needs fixing.", correct: false, explanation: "This is normal model behavior, not necessarily a bug." },
        ],
      },
      {
        id: "q3",
        question: "True or false: an AI system trained on biased historical data will tend to reproduce that bias.",
        options: [
          { id: "a", text: "True", correct: true, explanation: "Correct — models learn the patterns present in their training data, including biased ones." },
          { id: "b", text: "False", correct: false, explanation: "Models reflect their training data; biased data tends to produce biased outputs." },
        ],
      },
      {
        id: "q4",
        question: "Which of these is an example of an AI system, even if it isn't labeled \"AI\"?",
        options: [
          { id: "a", text: "A spam filter that sorts email based on learned patterns.", correct: true, explanation: "Correct — spam filters are a classic, everyday AI system." },
          { id: "b", text: "A calculator that adds two numbers.", correct: false, explanation: "A calculator follows fixed arithmetic rules, not learned patterns." },
          { id: "c", text: "A printed instruction manual.", correct: false, explanation: "That's static text, not a system that makes predictions." },
        ],
      },
      {
        id: "q5",
        question: "A model outputs \"92% confidence\" for a decision that affects a real person. What's the right instinct?",
        options: [
          { id: "a", text: "Treat it as proof and act on it immediately.", correct: false, explanation: "High confidence is a signal, not proof — it can still be wrong." },
          { id: "b", text: "Treat high confidence as worth a second look, especially when it affects a person.", correct: true, explanation: "Correct — this is the core judgment this module is teaching." },
          { id: "c", text: "Ignore the confidence score entirely.", correct: false, explanation: "The score is useful information — it just isn't certainty." },
        ],
      },
    ],
  },
  {
    id: "eu-ai-act-basics",
    title: "The EU AI Act: What's Required",
    estimatedMinutes: 3,
    markdownContent: `
The **EU AI Act** is the first comprehensive law regulating AI systems in the European Union. It applies broadly: to companies based in the EU, and to companies outside the EU whose AI systems are used by people in the EU — similar in reach to how GDPR applies.

**What it does, in one sentence:** it sorts AI systems into risk tiers (prohibited, high-risk, limited-risk, minimal-risk) and attaches obligations to each tier — documentation, human oversight, transparency notices, and in the worst cases, an outright ban.

**Why this training exists:** Article 4 of the Act requires every organization that develops or uses AI to ensure its staff have "a sufficient level of AI literacy" — meaning enough understanding to use AI systems responsibly, given their role. Completing this training is how your employer satisfies that obligation for you specifically.

**Key dates you should know:**
- Transparency obligations (telling people they're interacting with AI, labeling AI-generated content) are already in force or take effect **2 August 2026**.
- Machine-readable watermarking of AI-generated media takes effect **2 December 2026**.
- Full high-risk system obligations (risk management, technical documentation, human oversight) take effect **2 December 2027**.

**What this means for you personally:** if your role touches an AI system in any way — building it, buying it, using its output, or being affected by its decisions — you have some level of responsibility under this law. This training scales that responsibility to what actually applies to your job.
`.trim(),
    quiz: [
      {
        id: "q1",
        question: "Does the EU AI Act apply to companies outside the EU?",
        options: [
          { id: "a", text: "No, it's EU-companies-only.", correct: false, explanation: "It also applies to non-EU companies whose AI output is used in the EU." },
          { id: "b", text: "Yes, if their AI system's output is used by people in the EU.", correct: true, explanation: "Correct — similar in reach to GDPR." },
        ],
      },
      {
        id: "q2",
        question: "What does Article 4 of the EU AI Act require?",
        options: [
          { id: "a", text: "That every AI system be open-source.", correct: false, explanation: "The Act doesn't require open-sourcing AI systems." },
          { id: "b", text: "That staff have a sufficient level of AI literacy for their role.", correct: true, explanation: "Correct — this is exactly the obligation this training satisfies." },
          { id: "c", text: "That companies stop using AI entirely.", correct: false, explanation: "The Act regulates AI use, it doesn't ban it generally." },
        ],
      },
      {
        id: "q3",
        question: "When do transparency obligations (like chatbot disclosure) take effect?",
        options: [
          { id: "a", text: "2 August 2026", correct: true, explanation: "Correct." },
          { id: "b", text: "2 December 2026", correct: false, explanation: "That's the machine-readable watermarking deadline, not transparency." },
          { id: "c", text: "2 December 2027", correct: false, explanation: "That's the full high-risk obligations deadline." },
        ],
      },
      {
        id: "q4",
        question: "True or false: the EU AI Act sorts AI systems into risk tiers with different obligations for each.",
        options: [
          { id: "a", text: "True", correct: true, explanation: "Correct — prohibited, high-risk, limited-risk, and minimal-risk, each with different rules." },
          { id: "b", text: "False", correct: false, explanation: "Risk-tiering is the Act's central structure." },
        ],
      },
    ],
  },
  {
    id: "prohibited-practices",
    title: "Prohibited Practices & Red Lines",
    estimatedMinutes: 5,
    markdownContent: `
Most of the EU AI Act is about managing risk. A small number of AI uses are treated differently: they are **banned outright**, under Article 5, regardless of how carefully you'd otherwise use them.

**The bans that are most likely to matter at work:**
- **Emotion recognition in the workplace or in education** — using AI to infer a person's emotions from their face, voice, or behavior in a work or school setting is prohibited, with only narrow medical or safety exceptions. This applies even if the intent is well-meaning (e.g. "checking on employee wellbeing").
- **Certain biometric categorization** — using AI to infer sensitive characteristics (like race, political opinions, or sexual orientation) from biometric data is prohibited.
- **Untargeted scraping of facial images** to build or expand a facial recognition database is prohibited.
- **Social scoring** — evaluating or classifying people based on their behavior or characteristics in ways that lead to unrelated, disproportionate treatment — is prohibited.

**Why this matters more than it might seem:** these aren't "high-risk, be careful" rules — they're bans. If a vendor pitches you a tool that does one of these things, or a team proposes building one internally, the answer isn't "let's add safeguards." The answer is "we can't do this."

**If your company has flagged specific risk areas:** check with your compliance lead about which of these apply directly to systems your team touches — some organizations have specific, higher-risk exposure here than others.
`.trim(),
    quiz: [
      {
        id: "q1",
        question: "Is an emotion-recognition tool used on employees during work hours prohibited under the EU AI Act?",
        options: [
          { id: "a", text: "Yes, under Article 5(1)(f), with only narrow medical/safety exceptions.", correct: true, explanation: "Correct — this is one of the clearest prohibited-practice examples in the Act." },
          { id: "b", text: "No, it's fine as long as HR approves it.", correct: false, explanation: "No level of internal approval makes a prohibited practice legal." },
          { id: "c", text: "Only if the employee didn't consent.", correct: false, explanation: "Consent doesn't cure a prohibited practice — it's banned regardless." },
        ],
      },
      {
        id: "q2",
        question: "What should you do if a vendor pitches a tool that infers sensitive characteristics from biometric data?",
        options: [
          { id: "a", text: "Add extra safeguards and proceed carefully.", correct: false, explanation: "This isn't a 'be careful' situation — it's a banned practice." },
          { id: "b", text: "Recognize this as a prohibited practice and decline.", correct: true, explanation: "Correct." },
          { id: "c", text: "Ask legal to review it after it's already deployed.", correct: false, explanation: "This should be caught before deployment, not after." },
        ],
      },
      {
        id: "q3",
        question: "True or false: social scoring — rating people based on behavior in ways leading to unrelated, disproportionate treatment — is prohibited.",
        options: [
          { id: "a", text: "True", correct: true, explanation: "Correct — this is one of the Article 5 prohibited practices." },
          { id: "b", text: "False", correct: false, explanation: "Social scoring is explicitly banned under Article 5." },
        ],
      },
      {
        id: "q4",
        question: "Untargeted scraping of the internet to build a facial recognition database is:",
        options: [
          { id: "a", text: "High-risk, requiring documentation.", correct: false, explanation: "This goes further than high-risk — it's prohibited outright." },
          { id: "b", text: "Prohibited under Article 5.", correct: true, explanation: "Correct." },
          { id: "c", text: "Allowed if the images are public.", correct: false, explanation: "Public availability of the images doesn't change the prohibition." },
        ],
      },
      {
        id: "q5",
        question: "A well-intentioned \"employee wellbeing check\" tool infers mood from webcam footage during meetings. Under the Act, this is:",
        options: [
          { id: "a", text: "Acceptable because the intent is positive.", correct: false, explanation: "Good intent doesn't exempt a prohibited practice." },
          { id: "b", text: "A prohibited workplace emotion-recognition practice.", correct: true, explanation: "Correct — the ban applies regardless of intent." },
        ],
      },
    ],
  },
  {
    id: "data-privacy",
    title: "Data & Privacy with AI",
    estimatedMinutes: 4,
    markdownContent: `
AI systems are often trained on or process personal data — customer records, employee information, support tickets. This puts you at the intersection of two laws: **GDPR** (data protection) and the **EU AI Act** (AI-specific rules). Neither replaces the other — both apply.

**What stays true whether or not AI is involved:**
- Personal data can only be used for the purpose it was collected for, unless you have a new legal basis (often consent) to use it differently.
- People retain their GDPR rights — access, correction, deletion, objection — even after their data has been used to train or run an AI system.
- Sensitive data (health, biometric, political opinions, etc.) needs a stronger legal basis and extra care.

**What AI adds on top:**
- If a system profiles people or makes automated decisions with legal or similarly significant effects, additional GDPR safeguards apply (the right to human review is one of them).
- Training data provenance matters — if personal data was used to train a model without a valid legal basis, that's a problem even if the model's current output looks fine.

**Short scenario:** a customer whose data was used to train an internal recommendation model asks you to delete their data. What are their rights? They still have the right to request deletion of their personal data under GDPR. Depending on how the model was built, this may mean deleting their data from future training runs — deletion rights don't automatically vanish just because AI was involved in processing the data.

**The practical rule for your day-to-day work:** if you're not sure whether a specific AI use of personal data is covered by an existing consent or legal basis, ask your data protection contact before proceeding — don't assume it's fine because "it's just an AI tool."
`.trim(),
    quiz: [
      {
        id: "q1",
        question: "Does GDPR still apply when an AI system is processing personal data?",
        options: [
          { id: "a", text: "No, the EU AI Act replaces GDPR for AI use cases.", correct: false, explanation: "Both laws apply — the AI Act doesn't replace GDPR." },
          { id: "b", text: "Yes, GDPR and the EU AI Act both apply, on top of each other.", correct: true, explanation: "Correct." },
        ],
      },
      {
        id: "q2",
        question: "A customer whose data trained an internal AI model asks for deletion. What's true?",
        options: [
          { id: "a", text: "Their deletion rights don't apply because AI was involved.", correct: false, explanation: "This is exactly the wrong instinct — deletion rights don't disappear because of AI." },
          { id: "b", text: "They retain their GDPR deletion rights.", correct: true, explanation: "Correct." },
        ],
      },
      {
        id: "q3",
        question: "If an AI system makes automated decisions with legally significant effects on someone, GDPR generally requires:",
        options: [
          { id: "a", text: "Nothing extra — automated decisions are treated the same as any other data use.", correct: false, explanation: "Automated significant-effect decisions trigger extra GDPR safeguards, including a right to human review." },
          { id: "b", text: "Additional safeguards, including a right to meaningful human review.", correct: true, explanation: "Correct." },
        ],
      },
      {
        id: "q4",
        question: "You're unsure whether using a customer dataset to fine-tune an AI tool is covered by existing consent. What should you do?",
        options: [
          { id: "a", text: "Proceed — it's probably fine since it's just an AI tool.", correct: false, explanation: "This is the exact assumption to avoid — check first." },
          { id: "b", text: "Ask your data protection contact before proceeding.", correct: true, explanation: "Correct." },
        ],
      },
    ],
  },
  {
    id: "decisions-with-ai",
    title: "Making Decisions with AI",
    estimatedMinutes: 4,
    markdownContent: `
AI can speed up decisions, but it changes where responsibility sits. Understanding that shift is the point of this module.

**Bias awareness:** an AI model can be systematically less accurate for some groups of people than others, even without anyone intending that outcome — usually because of gaps or imbalances in its training data. This isn't a hypothetical: it has shown up in hiring tools, credit scoring, and facial recognition in real, documented cases. Awareness means: don't assume a tool is neutral just because it's automated.

**When not to trust AI output on its own:**
- When the decision has a significant effect on a person (hiring, credit, access to a service).
- When the system's confidence is borderline or the case is unusual.
- When you don't have a clear way to explain the reasoning behind the output.

**Who's responsible:** using an AI recommendation does not transfer legal or ethical responsibility for the outcome to the AI system. If a person acts on a flawed AI output without appropriate review, the responsibility for that action generally still sits with the person and organization that acted on it — not the software.

**Scenario:** an AI system recommends rejecting a loan application. Should that recommendation be applied automatically, without a human reviewing it? No — for decisions with significant effects on a person, a human should review the AI's recommendation before it's applied, both because it's often legally required (see the data & privacy module) and because it's the practical safeguard against a wrong or biased output causing real harm.
`.trim(),
    quiz: [
      {
        id: "q1",
        question: "Can an AI model be systematically less accurate for some groups of people, even without anyone intending it?",
        options: [
          { id: "a", text: "No, AI models are neutral by default.", correct: false, explanation: "Models reflect gaps or imbalances in training data — they are not automatically neutral." },
          { id: "b", text: "Yes, this has happened in real, documented cases like hiring and credit scoring.", correct: true, explanation: "Correct." },
        ],
      },
      {
        id: "q2",
        question: "Should an AI's rejection of a loan application be applied automatically, without human review?",
        options: [
          { id: "a", text: "Yes, that's the point of using AI — to skip manual review.", correct: false, explanation: "Decisions with significant effects on a person need human review before being applied." },
          { id: "b", text: "No — a human should review it before it's applied.", correct: true, explanation: "Correct." },
        ],
      },
      {
        id: "q3",
        question: "If someone acts on a flawed AI recommendation without review, who is generally responsible for the outcome?",
        options: [
          { id: "a", text: "The AI software vendor, always.", correct: false, explanation: "Responsibility doesn't automatically shift to the vendor just because a tool was used." },
          { id: "b", text: "The person and organization that acted on it.", correct: true, explanation: "Correct — using an AI recommendation doesn't transfer responsibility away from the human decision-maker." },
        ],
      },
      {
        id: "q4",
        question: "When should you be most cautious about trusting an AI output on its own?",
        options: [
          { id: "a", text: "When the decision significantly affects a person and the case is unusual or borderline.", correct: true, explanation: "Correct — these are exactly the situations that call for review, not blind trust." },
          { id: "b", text: "Only when the system explicitly says it's uncertain.", correct: false, explanation: "Systems can be confidently wrong — don't wait for an explicit uncertainty flag." },
        ],
      },
    ],
  },
];

// ---------------------------------------------------------------------------
// Role-specific modules — one additional module per role.
// ---------------------------------------------------------------------------

const roleModules: Record<EmployeeRole, TrainingModule> = {
  technical: {
    id: "implementing-ai-responsibly",
    title: "Implementing AI Responsibly",
    estimatedMinutes: 5,
    markdownContent: `
As an engineer, you're closest to the decisions that determine whether an AI system is actually compliant, not just documented as compliant on paper.

**Model selection:** understand what a vendor or open-source model was trained on and what its known limitations are before integrating it — "it works well in the demo" is not the same as "it's fit for this use case." For high-risk use cases, this evaluation should be documented, not just informal team knowledge.

**Testing beyond accuracy:** standard ML testing (accuracy, precision, recall) doesn't catch fairness or bias issues on its own. Test model outputs across relevant subgroups when the system affects people — a model that's 95% accurate overall can still perform much worse for a specific group.

**Monitoring in production:** a model's performance can degrade over time as real-world data drifts from training data ("model drift"). High-risk systems need ongoing monitoring, not a one-time validation before launch.

**Interpretability:** for systems that make or influence significant decisions about people, you should be able to explain — at least at a reasonable level — why the model produced a given output. Fully black-box models are harder to defend under the Act's documentation requirements.

**Version control for compliance:** keep track of which model version, training data snapshot, and configuration was in production at any given time. If a decision is challenged later, you need to be able to reconstruct what actually ran.
`.trim(),
    quiz: [
      {
        id: "q1",
        question: "Is \"it works well in the demo\" sufficient justification for using a model in a high-risk use case?",
        options: [
          { id: "a", text: "Yes, if the demo covers the main use case.", correct: false, explanation: "Demo performance doesn't substitute for documented evaluation of training data and limitations." },
          { id: "b", text: "No — the evaluation should be documented, not just informal.", correct: true, explanation: "Correct." },
        ],
      },
      {
        id: "q2",
        question: "Why is standard accuracy testing not enough for systems that affect people?",
        options: [
          { id: "a", text: "Because accuracy metrics can hide much worse performance for specific subgroups.", correct: true, explanation: "Correct — overall accuracy can mask fairness issues." },
          { id: "b", text: "Because accuracy testing is only relevant for financial systems.", correct: false, explanation: "This isn't limited to financial systems." },
        ],
      },
      {
        id: "q3",
        question: "What is \"model drift\"?",
        options: [
          { id: "a", text: "A model's performance degrading over time as real-world data diverges from training data.", correct: true, explanation: "Correct." },
          { id: "b", text: "A model being moved to a different cloud provider.", correct: false, explanation: "That's a deployment change, not drift." },
        ],
      },
      {
        id: "q4",
        question: "Why does version control matter for compliance, not just engineering hygiene?",
        options: [
          { id: "a", text: "So you can reconstruct exactly what model/data/config produced a specific past decision if it's ever challenged.", correct: true, explanation: "Correct." },
          { id: "b", text: "It doesn't matter for compliance, only for engineering.", correct: false, explanation: "It directly supports the Act's documentation and accountability requirements." },
        ],
      },
    ],
  },
  hr: {
    id: "ai-in-recruitment",
    title: "AI in Recruitment & Worker Evaluation",
    estimatedMinutes: 5,
    markdownContent: `
AI used in hiring or employee evaluation is one of the EU AI Act's explicitly named **high-risk** categories (Annex III). If your team uses AI anywhere in recruitment, screening, or performance evaluation, extra rules apply.

**What counts as "AI in recruitment":** resume screening tools, automated candidate ranking, video-interview analysis, and algorithmic performance scoring all count — even if they're a small feature inside a larger HR platform, not a standalone "AI product."

**Bias auditing isn't optional here:** because this is a high-risk category, the system needs to be evaluated for whether it performs equally well across protected groups (gender, age, ethnicity, disability, etc.) before and during use — not just at initial purchase.

**Candidate rights:** candidates and employees affected by an AI-assisted decision generally have the right to know that AI was involved and, in many cases, to receive a meaningful explanation of the decision. "The algorithm decided" is not an acceptable explanation on its own.

**What you're responsible for as HR:**
- Confirming any recruitment/evaluation AI tool your team uses has documented its risk classification and required safeguards.
- Making sure hiring managers know they cannot rely on an AI ranking or score as the sole basis for a hire/reject decision — human review is required.
- Keeping records of AI-assisted decisions in case they're challenged later.
`.trim(),
    quiz: [
      {
        id: "q1",
        question: "Is AI-based resume screening covered by the EU AI Act's high-risk category?",
        options: [
          { id: "a", text: "Yes — recruitment and worker evaluation AI is explicitly named as high-risk in Annex III.", correct: true, explanation: "Correct." },
          { id: "b", text: "No, only standalone \"AI hiring products\" count, not features inside a larger platform.", correct: false, explanation: "Even a feature inside a larger HR platform counts if it does the same function." },
        ],
      },
      {
        id: "q2",
        question: "Can a hiring manager reject a candidate based solely on an AI ranking score?",
        options: [
          { id: "a", text: "Yes, if the tool is from a reputable vendor.", correct: false, explanation: "Vendor reputation doesn't remove the human-review requirement." },
          { id: "b", text: "No — human review is required, the AI score can't be the sole basis.", correct: true, explanation: "Correct." },
        ],
      },
      {
        id: "q3",
        question: "What is a candidate's right regarding an AI-assisted hiring decision?",
        options: [
          { id: "a", text: "To know AI was involved and, generally, get a meaningful explanation.", correct: true, explanation: "Correct." },
          { id: "b", text: "No rights beyond a normal hiring decision.", correct: false, explanation: "AI involvement in high-risk decisions adds specific rights, not none." },
        ],
      },
      {
        id: "q4",
        question: "How often should a recruitment AI tool be checked for bias across protected groups?",
        options: [
          { id: "a", text: "Once, at initial purchase, is sufficient.", correct: false, explanation: "Bias can emerge or change over time — ongoing evaluation is needed, not a one-time check." },
          { id: "b", text: "Before and during use, on an ongoing basis.", correct: true, explanation: "Correct." },
        ],
      },
    ],
  },
  business: {
    id: "selling-ai-products",
    title: "Selling AI Products: Your Responsibility",
    estimatedMinutes: 5,
    markdownContent: `
If your product has an AI feature embedded in it — a chatbot, a recommendation engine, AI-generated content, anything that fits the patterns from the earlier modules — you have specific disclosure obligations to customers under Article 50 of the EU AI Act, on top of your regular sales process.

**What customers need to be told:**
- If they'll interact directly with an AI system (a chatbot, a voice assistant) as part of using your product, they need to be told clearly that they're interacting with AI, not a human.
- If your product generates or manipulates content (text, images, audio, video) that could be mistaken for human-created, that needs a disclosure too.
- This isn't just a legal footnote — it needs to be clear and easy to notice, not buried in a terms-of-service document nobody reads.

**What this means for your sales conversations:**
- Don't oversell an AI feature's capabilities in ways that obscure what it actually is or does — accuracy in sales materials matters more under this framework, since customers rely on your representations to meet their own compliance obligations downstream.
- If a customer asks whether your product's AI features are EU AI Act compliant, don't guess — loop in your compliance contact rather than making a commitment you can't verify.

**License and contract management:** if your product embeds a third-party AI model or API, your license agreements should reflect who is responsible for what under the Act — this is increasingly a standard part of vendor and customer contracts, not an afterthought.
`.trim(),
    quiz: [
      {
        id: "q1",
        question: "If your product has a customer-facing chatbot, what must customers be told?",
        options: [
          { id: "a", text: "Nothing extra — a chatbot is just a support feature.", correct: false, explanation: "Article 50 specifically requires disclosure that they're interacting with AI." },
          { id: "b", text: "Clearly that they are interacting with an AI system, not a human.", correct: true, explanation: "Correct." },
        ],
      },
      {
        id: "q2",
        question: "Is it acceptable to bury the AI disclosure deep in a terms-of-service document?",
        options: [
          { id: "a", text: "Yes, as long as it's mentioned somewhere.", correct: false, explanation: "The disclosure needs to be clear and easy to notice, not buried." },
          { id: "b", text: "No — it needs to be clear and easy for the customer to notice.", correct: true, explanation: "Correct." },
        ],
      },
      {
        id: "q3",
        question: "A customer asks if your product is \"fully EU AI Act compliant.\" What should you do?",
        options: [
          { id: "a", text: "Confirm it is, since that's what customers want to hear.", correct: false, explanation: "Don't make compliance claims you can't verify — this can create real liability." },
          { id: "b", text: "Loop in your compliance contact rather than guessing.", correct: true, explanation: "Correct." },
        ],
      },
      {
        id: "q4",
        question: "Why does license/contract language matter when your product embeds a third-party AI model?",
        options: [
          { id: "a", text: "It doesn't — that's purely a legal department concern with no sales relevance.", correct: false, explanation: "This is increasingly standard in vendor and customer contracts, and sales needs to be aware of it." },
          { id: "b", text: "It should reflect who is responsible for what under the Act.", correct: true, explanation: "Correct." },
        ],
      },
    ],
  },
  executive: {
    id: "governance-and-liability",
    title: "Governance & Liability",
    estimatedMinutes: 5,
    markdownContent: `
As leadership, your exposure under the EU AI Act isn't about any single AI system — it's about whether the organization can demonstrate it governed its AI use responsibly, end to end.

**Legal liability sits with the organization, and can reach leadership:** penalties under the Act scale with severity — up to €35 million or 7% of global annual turnover for the most serious violations (prohibited practices), with lower caps for other violations and for SMEs. This is a board-level risk category, not just a compliance-team line item.

**What "governed responsibly" actually requires:**
- A current, accurate inventory of every AI system the organization builds, buys, or uses — you can't manage risk in systems you don't know about.
- Documented risk classifications and the reasoning behind them, kept up to date as systems change.
- An audit trail: who approved what, when, and on what basis — this is what gets checked in a regulatory inquiry or lawsuit.
- Staff AI literacy (this training) — a documented, org-wide baseline, not assumed knowledge.

**Insurance implications:** cyber and liability insurers are increasingly asking about AI governance maturity as part of underwriting. Weak AI governance can affect premiums and, in some cases, claim eligibility after an incident.

**The governance question worth asking regularly:** if a regulator or a plaintiff's lawyer asked "show me how you knew this AI system was compliant," could the organization produce a clear, dated answer — or would it be reconstructed after the fact? The goal of everything in this platform is to make the answer to that question "yes, here it is," not "let us get back to you."
`.trim(),
    quiz: [
      {
        id: "q1",
        question: "What is the maximum penalty tier under the EU AI Act, and for what?",
        options: [
          { id: "a", text: "Up to €35 million or 7% of global turnover, for prohibited practices.", correct: true, explanation: "Correct — this is the top penalty tier." },
          { id: "b", text: "A flat €10,000 fine regardless of severity.", correct: false, explanation: "Penalties scale steeply with severity, not a flat fee." },
        ],
      },
      {
        id: "q2",
        question: "Why does an AI system inventory matter at the governance level?",
        options: [
          { id: "a", text: "It's a nice-to-have for the compliance team's own tracking.", correct: false, explanation: "It's foundational — you can't manage risk in systems you don't know exist." },
          { id: "b", text: "You can't manage or demonstrate control over risk in systems you don't know about.", correct: true, explanation: "Correct." },
        ],
      },
      {
        id: "q3",
        question: "How are insurers increasingly treating AI governance maturity?",
        options: [
          { id: "a", text: "As irrelevant to underwriting.", correct: false, explanation: "It's increasingly a factor in underwriting, premiums, and claims." },
          { id: "b", text: "As a factor that can affect premiums and claim eligibility.", correct: true, explanation: "Correct." },
        ],
      },
      {
        id: "q4",
        question: "What should the organization be able to produce if asked how it knew an AI system was compliant?",
        options: [
          { id: "a", text: "A clear, dated record — not something reconstructed after the fact.", correct: true, explanation: "Correct — this is the practical test of good governance." },
          { id: "b", text: "A verbal assurance from the engineering team.", correct: false, explanation: "Verbal assurance isn't an audit trail." },
        ],
      },
    ],
  },
  general: {
    id: "ai-around-you",
    title: "AI Around You",
    estimatedMinutes: 4,
    markdownContent: `
You don't need to build or manage AI systems for this to matter to you — most people encounter AI at work without realizing it, and knowing what to do (and what rights you have) is the point of this module.

**Where you're likely to run into AI at work:**
- Tools that suggest replies, summarize meetings, or draft content for you.
- Customer-facing chatbots or support assistants.
- Systems that help schedule, prioritize, or route your work.
- Performance or productivity tracking tools that use AI-assisted scoring.

**What to do if a product you use has an AI feature:**
- Treat AI-generated suggestions as a starting point, not a final answer — review before you send, publish, or act on AI output, especially if it represents the company or affects someone else.
- If you're not sure whether something you're using is an AI feature, ask — it's a reasonable question, not a distraction.

**Your rights if an AI system makes a decision about you** (e.g. a performance-scoring tool, an internal automated approval):
- You generally have the right to know that AI was involved.
- For decisions with a significant effect on you, you generally have the right to request human review rather than accepting the automated outcome as final.
- You can raise concerns about an AI-assisted decision through the same channels you'd use for any other workplace decision you think is wrong.

**The one habit worth building:** before you rely on an AI output for something that matters, ask yourself "would I be comfortable if someone checked this?" If the answer is no, check it yourself first.
`.trim(),
    quiz: [
      {
        id: "q1",
        question: "Should you treat AI-generated suggestions (like a drafted email) as a final answer?",
        options: [
          { id: "a", text: "Yes, if it sounds reasonable.", correct: false, explanation: "AI output should be reviewed, especially if it represents the company or affects someone else." },
          { id: "b", text: "No — treat it as a starting point and review before acting on it.", correct: true, explanation: "Correct." },
        ],
      },
      {
        id: "q2",
        question: "If an AI-assisted tool scores your performance, what right do you generally have for significant decisions?",
        options: [
          { id: "a", text: "No rights — automated scores are final.", correct: false, explanation: "For decisions with significant effect, you generally have the right to request human review." },
          { id: "b", text: "The right to request human review rather than accepting the automated outcome as final.", correct: true, explanation: "Correct." },
        ],
      },
      {
        id: "q3",
        question: "You're not sure if a workplace tool you use has an AI feature. What should you do?",
        options: [
          { id: "a", text: "Just ask — it's a reasonable question.", correct: true, explanation: "Correct." },
          { id: "b", text: "Assume it doesn't, since no one mentioned it.", correct: false, explanation: "Many AI features aren't obviously labeled — it's fine to ask." },
        ],
      },
    ],
  },
  other: {
    id: "ai-around-you-other",
    title: "AI Around You",
    estimatedMinutes: 4,
    markdownContent: `
You don't need to build or manage AI systems for this to matter to you — most people encounter AI at work without realizing it, and knowing what to do (and what rights you have) is the point of this module.

**Where you're likely to run into AI at work:**
- Tools that suggest replies, summarize meetings, or draft content for you.
- Customer-facing chatbots or support assistants.
- Systems that help schedule, prioritize, or route your work.
- Performance or productivity tracking tools that use AI-assisted scoring.

**What to do if a product you use has an AI feature:**
- Treat AI-generated suggestions as a starting point, not a final answer — review before you send, publish, or act on AI output, especially if it represents the company or affects someone else.
- If you're not sure whether something you're using is an AI feature, ask — it's a reasonable question, not a distraction.

**Your rights if an AI system makes a decision about you:**
- You generally have the right to know that AI was involved.
- For decisions with a significant effect on you, you generally have the right to request human review rather than accepting the automated outcome as final.
- You can raise concerns about an AI-assisted decision through the same channels you'd use for any other workplace decision you think is wrong.

**The one habit worth building:** before you rely on an AI output for something that matters, ask yourself "would I be comfortable if someone checked this?" If the answer is no, check it yourself first.
`.trim(),
    quiz: [
      {
        id: "q1",
        question: "Should you treat AI-generated suggestions (like a drafted email) as a final answer?",
        options: [
          { id: "a", text: "Yes, if it sounds reasonable.", correct: false, explanation: "AI output should be reviewed, especially if it represents the company or affects someone else." },
          { id: "b", text: "No — treat it as a starting point and review before acting on it.", correct: true, explanation: "Correct." },
        ],
      },
      {
        id: "q2",
        question: "If an AI-assisted tool scores your performance, what right do you generally have for significant decisions?",
        options: [
          { id: "a", text: "No rights — automated scores are final.", correct: false, explanation: "For decisions with significant effect, you generally have the right to request human review." },
          { id: "b", text: "The right to request human review rather than accepting the automated outcome as final.", correct: true, explanation: "Correct." },
        ],
      },
      {
        id: "q3",
        question: "You're not sure if a workplace tool you use has an AI feature. What should you do?",
        options: [
          { id: "a", text: "Just ask — it's a reasonable question.", correct: true, explanation: "Correct." },
          { id: "b", text: "Assume it doesn't, since no one mentioned it.", correct: false, explanation: "Many AI features aren't obviously labeled — it's fine to ask." },
        ],
      },
    ],
  },
};

export function getModulesForRole(role: EmployeeRole): TrainingModule[] {
  return [...commonModules, roleModules[role]];
}

export function getModuleById(moduleId: string): TrainingModule | undefined {
  return [...commonModules, ...Object.values(roleModules)].find((m) => m.id === moduleId);
}

export function isModuleRequiredForRole(moduleId: string, role: EmployeeRole): boolean {
  return getModulesForRole(role).some((m) => m.id === moduleId);
}
