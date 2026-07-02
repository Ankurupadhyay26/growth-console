export interface SeedIdea {
  pillar: string;
  format: string;
  headline: string;
}

export const LINKEDIN_PILLARS = [
  "Contrarian Take",
  "Universal Story",
  "Life to PM Analogy",
  "PM Career Levels",
  "Hot Take on AI/GenAI Hype",
] as const;

export const INSTAGRAM_PILLARS = [
  "AI Tool Breakdown",
  "PM Career Tip",
  "Data Product Mini-Lesson",
  "POV / Hot Take",
  "Trend-Jack",
  "Day in the Life",
] as const;

// Which day of week (0=Sun..6=Sat) each LinkedIn pillar is scheduled on by default
export const LINKEDIN_DAY_PILLAR: Record<number, string[]> = {
  1: ["Contrarian Take", "Hot Take on AI/GenAI Hype"], // Monday
  3: ["Universal Story"], // Wednesday
  5: ["Life to PM Analogy", "PM Career Levels"], // Friday
};

export const LINKEDIN_SEED: SeedIdea[] = [
  { pillar: "Contrarian Take", format: "Text Post", headline: "Everyone's adding AI to their product. Almost nobody asks: should we?" },
  { pillar: "Contrarian Take", format: "Text Post", headline: "Dashboards don't make decisions. People avoiding decisions hide behind dashboards." },
  { pillar: "Contrarian Take", format: "Text Post", headline: "Your roadmap isn't a plan. It's a wishlist with dates on it." },
  { pillar: "Contrarian Take", format: "Text Post", headline: "Most 'AI strategy' decks are AI vendor strategy decks wearing a company logo." },
  { pillar: "Contrarian Take", format: "Text Post", headline: "The best data platform teams ship less than you'd expect. That's the point." },
  { pillar: "Universal Story", format: "Text Post", headline: "A time a 'simple' data migration wasn't simple" },
  { pillar: "Universal Story", format: "Text Post", headline: "A stakeholder who wanted a dashboard but actually needed a decision" },
  { pillar: "Universal Story", format: "Text Post", headline: "The API redesign that broke something nobody knew depended on it" },
  { pillar: "Universal Story", format: "Text Post", headline: "Onboarding a junior PM and realizing what you'd forgotten you once didn't know" },
  { pillar: "Universal Story", format: "Text Post", headline: "The GenAI pilot that impressed a demo room and died in production" },
  { pillar: "Life to PM Analogy", format: "Text Post", headline: "What ordering at a new restaurant teaches you about progressive disclosure in UX" },
  { pillar: "Life to PM Analogy", format: "Text Post", headline: "Packing for a trip vs. scoping an MVP — what you leave out matters more than what you bring" },
  { pillar: "Life to PM Analogy", format: "Text Post", headline: "Tailoring a suit vs. tailoring a platform to enterprise customers" },
  { pillar: "Life to PM Analogy", format: "Text Post", headline: "A recipe that 'should' work on paper but fails without the right feel — like a spec without taste" },
  { pillar: "PM Career Levels", format: "Text Post", headline: "Junior PM asks 'what should I build?' → Staff PM makes everyone ask better questions" },
  { pillar: "PM Career Levels", format: "Text Post", headline: "What actually changes between Senior PM and Staff PM (it's not scope, it's judgment)" },
  { pillar: "Hot Take on AI/GenAI Hype", format: "Text Post", headline: "2023: ChatGPT wrappers. 2024: RAG. 2025: agents. What users actually wanted the whole time." },
  { pillar: "Hot Take on AI/GenAI Hype", format: "Text Post", headline: "'AI-powered' is not a feature. It's a decision you're making for the user without asking." },
];

export const INSTAGRAM_SEED: SeedIdea[] = [
  { pillar: "AI Tool Breakdown", format: "Reel", headline: "30-second teardown of one AI tool you actually use in your PM work, showing the workflow" },
  { pillar: "AI Tool Breakdown", format: "Reel", headline: "3 AI tools that replaced 3 hours of my week — screen-recorded, fast cuts" },
  { pillar: "PM Career Tip", format: "Reel", headline: "Nobody tells you this about becoming a Staff PM — quick, punchy, on-screen text" },
  { pillar: "PM Career Tip", format: "Reel", headline: "The interview question that separates Senior from Staff PM" },
  { pillar: "Data Product Mini-Lesson", format: "Carousel", headline: "Dashboard vs. Data Product — what's the actual difference? (5-slide carousel)" },
  { pillar: "Data Product Mini-Lesson", format: "Carousel", headline: "3 signs your 'data product' is just a report with extra steps" },
  { pillar: "POV / Hot Take", format: "Reel", headline: "POV: you just sat through your 4th AI strategy meeting this month with no strategy in it" },
  { pillar: "POV / Hot Take", format: "Reel", headline: "Quick reaction-style take on an AI/PM trend, filmed selfie-style" },
  { pillar: "Trend-Jack", format: "Reel", headline: "React to a real, current AI/product news story with a 30-second PM-lens take" },
  { pillar: "Day in the Life", format: "Reel", headline: "A day building data platforms/AI products, told through a PM lens, casual and personality-led" },
];

export function seedBankFor(platform: "linkedin" | "instagram"): SeedIdea[] {
  return platform === "linkedin" ? LINKEDIN_SEED : INSTAGRAM_SEED;
}
