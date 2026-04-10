export type Option = {
  label: string;
  value: string;
  score: number;
};

export type Question = {
  id: string;
  section: number;
  sectionLabel: string;
  text: string;
  options: Option[];
  signalLabel: string;
};

export const QUESTIONS: Question[] = [
  // ── Section 1: Identity & Stability ──────────────────────
  {
    id: "q1",
    section: 1,
    sectionLabel: "Identity & Stability",
    text: "How long have you been living at your current address?",
    options: [
      { label: "Less than 6 months", value: "lt6m", score: 1 },
      { label: "6–12 months", value: "6to12m", score: 2 },
      { label: "1–3 years", value: "1to3y", score: 3 },
      { label: "More than 3 years", value: "gt3y", score: 4 },
    ],
    signalLabel: "Residential stability recorded",
  },
  {
    id: "q2",
    section: 1,
    sectionLabel: "Identity & Stability",
    text: "How long have you been at your current job or income source?",
    options: [
      { label: "Less than 6 months", value: "lt6m", score: 1 },
      { label: "6–12 months", value: "6to12m", score: 2 },
      { label: "1–3 years", value: "1to3y", score: 3 },
      { label: "More than 3 years", value: "gt3y", score: 4 },
    ],
    signalLabel: "Employment stability recorded",
  },

  // ── Section 2: Financial Habits ───────────────────────────
  {
    id: "q3",
    section: 2,
    sectionLabel: "Financial Habits",
    text: "You receive ₹10,000 unexpectedly. What do you do first?",
    options: [
      { label: "Spend on something I need", value: "spend", score: 1 },
      { label: "Pay off a pending bill", value: "bill", score: 3 },
      { label: "Save most of it", value: "save", score: 4 },
      { label: "Split between saving and spending", value: "split", score: 3 },
    ],
    signalLabel: "Financial impulse pattern recorded",
  },
  {
    id: "q4",
    section: 2,
    sectionLabel: "Financial Habits",
    text: "Your EMI is due tomorrow and you're ₹500 short. What do you do?",
    options: [
      { label: "Skip this month", value: "skip", score: 1 },
      { label: "Borrow from a friend", value: "borrow", score: 2 },
      { label: "Ask lender for extension", value: "extension", score: 3 },
      { label: "Arrange it somehow today", value: "arrange", score: 4 },
    ],
    signalLabel: "Repayment commitment signal recorded",
  },

  // ── Section 3: Numerical Literacy ─────────────────────────
  {
    id: "q5",
    section: 3,
    sectionLabel: "Numerical Literacy",
    text: "If you borrow ₹12,000 at 2% monthly interest, roughly how much do you owe after 3 months?",
    options: [
      { label: "₹12,240", value: "low", score: 1 },
      { label: "₹12,500", value: "mid", score: 2 },
      { label: "₹12,720", value: "correct", score: 4 },
      { label: "Not sure", value: "unsure", score: 1 },
    ],
    signalLabel: "Financial literacy signal recorded",
  },

  // ── Section 4: Spending Patterns ──────────────────────────
  {
    id: "q6",
    section: 4,
    sectionLabel: "Spending Patterns",
    text: "On average, how much do you spend across all expenses in a month?",
    options: [
      { label: "Less than ₹8,000", value: "lt8k", score: 4 },
      { label: "₹8,000 – ₹15,000", value: "8to15k", score: 3 },
      { label: "₹15,000 – ₹25,000", value: "15to25k", score: 2 },
      { label: "More than ₹25,000", value: "gt25k", score: 1 },
    ],
    signalLabel: "Spending pattern recorded",
  },
  {
    id: "q7",
    section: 4,
    sectionLabel: "Spending Patterns",
    text: "Do you set aside a fixed amount for savings every month?",
    options: [
      { label: "Yes, always", value: "always", score: 4 },
      { label: "Most months", value: "mostly", score: 3 },
      { label: "Occasionally", value: "sometimes", score: 2 },
      { label: "Rarely or never", value: "never", score: 1 },
    ],
    signalLabel: "Savings consistency signal recorded",
  },

  // ── Section 5: Future Orientation ─────────────────────────
  {
    id: "q8",
    section: 5,
    sectionLabel: "Future Orientation",
    text: "Where do you expect your income to be in 12 months?",
    options: [
      { label: "Lower than now", value: "lower", score: 1 },
      { label: "About the same", value: "same", score: 2 },
      { label: "Somewhat higher", value: "higher", score: 3 },
      { label: "Significantly higher", value: "much", score: 4 },
    ],
    signalLabel: "Future orientation signal recorded",
  },
];

export const TOTAL_SECTIONS = 5;
export const MAX_SCORE = QUESTIONS.reduce((s, q) => s + 4, 0); // 8 × 4 = 32
