export type Option = {
  label: string;
  value: string;
  score: number;
  rawValue?: number | string; // actual model input value
};

export type Question = {
  id: string;
  section: number;
  sectionLabel: string;
  text: string;
  options: Option[];
  signalLabel: string;
  featureKey: string; // maps to model feature name
};

export const QUESTIONS: Question[] = [
  // ── Section 1: Personal Details ──────────────────────────
  {
    id: "q1",
    section: 1,
    sectionLabel: "Personal Details",
    text: "What is your gender?",
    featureKey: "CODE_GENDER",
    options: [
      { label: "Male", value: "M", score: 0, rawValue: "M" },
      { label: "Female", value: "F", score: 0, rawValue: "F" },
    ],
    signalLabel: "Gender recorded",
  },
  {
    id: "q2",
    section: 1,
    sectionLabel: "Personal Details",
    text: "What is your highest level of education?",
    featureKey: "NAME_EDUCATION_TYPE",
    options: [
      {
        label: "Higher education",
        value: "Higher education",
        score: 4,
        rawValue: "Higher education",
      },
      {
        label: "Secondary / high school",
        value: "Secondary / secondary special",
        score: 3,
        rawValue: "Secondary / secondary special",
      },
      {
        label: "Incomplete higher",
        value: "Incomplete higher",
        score: 2,
        rawValue: "Incomplete higher",
      },
      {
        label: "Lower secondary",
        value: "Lower secondary",
        score: 1,
        rawValue: "Lower secondary",
      },
    ],
    signalLabel: "Education level recorded",
  },
  {
    id: "q3",
    section: 1,
    sectionLabel: "Personal Details",
    text: "What is your current family / marital status?",
    featureKey: "NAME_FAMILY_STATUS",
    options: [
      { label: "Married", value: "Married", score: 0, rawValue: "Married" },
      {
        label: "Single / not married",
        value: "Single / not married",
        score: 0,
        rawValue: "Single / not married",
      },
      {
        label: "Civil marriage",
        value: "Civil marriage",
        score: 0,
        rawValue: "Civil marriage",
      },
      {
        label: "Separated",
        value: "Separated",
        score: 0,
        rawValue: "Separated",
      },
      { label: "Widow", value: "Widow", score: 0, rawValue: "Widow" },
    ],
    signalLabel: "Family status recorded",
  },

  // ── Section 2: Employment ─────────────────────────────────
  {
    id: "q4",
    section: 2,
    sectionLabel: "Employment",
    text: "How long have you been at your current job or income source?",
    featureKey: "DAYS_EMPLOYED", // convert: years × 365, stored as negative int
    options: [
      { label: "Less than 6 months", value: "lt6m", score: 1, rawValue: -90 },
      { label: "6–12 months", value: "6to12m", score: 2, rawValue: -270 },
      { label: "1–3 years", value: "1to3y", score: 3, rawValue: -730 },
      { label: "More than 3 years", value: "gt3y", score: 4, rawValue: -1460 },
    ],
    signalLabel: "Employment duration recorded",
  },

  // ── Section 3: Loan Details ───────────────────────────────
  {
    id: "q5",
    section: 3,
    sectionLabel: "Loan Details",
    text: "What is the total loan amount you are applying for?",
    featureKey: "AMT_CREDIT",
    options: [
      { label: "Under ₹1,00,000", value: "lt1L", score: 4, rawValue: 75000 },
      {
        label: "₹1,00,000 – ₹3,00,000",
        value: "1to3L",
        score: 3,
        rawValue: 200000,
      },
      {
        label: "₹3,00,000 – ₹7,00,000",
        value: "3to7L",
        score: 2,
        rawValue: 500000,
      },
      {
        label: "More than ₹7,00,000",
        value: "gt7L",
        score: 1,
        rawValue: 1000000,
      },
    ],
    signalLabel: "Loan amount recorded",
  },
  {
    id: "q6",
    section: 3,
    sectionLabel: "Loan Details",
    text: "What monthly repayment (EMI) are you comfortable with?",
    featureKey: "AMT_ANNUITY", // stored as monthly amount; model uses annual — multiply ×12 if needed
    options: [
      { label: "Under ₹5,000", value: "lt5k", score: 4, rawValue: 4000 },
      { label: "₹5,000 – ₹12,000", value: "5to12k", score: 3, rawValue: 8500 },
      {
        label: "₹12,000 – ₹25,000",
        value: "12to25k",
        score: 2,
        rawValue: 18000,
      },
      { label: "More than ₹25,000", value: "gt25k", score: 1, rawValue: 30000 },
    ],
    signalLabel: "Monthly repayment recorded",
  },
  {
    id: "q7",
    section: 3,
    sectionLabel: "Loan Details",
    text: "What is the approximate value of the goods or asset this loan is for?",
    featureKey: "AMT_GOODS_PRICE", // used to derive GOODS_CREDIT_RATIO = AMT_GOODS_PRICE / AMT_CREDIT
    options: [
      {
        label: "Less than the loan amount",
        value: "lt_credit",
        score: 2,
        rawValue: 0.7,
      }, // ratio placeholder
      {
        label: "About equal to the loan amount",
        value: "eq_credit",
        score: 4,
        rawValue: 1.0,
      },
      {
        label: "More than the loan amount",
        value: "gt_credit",
        score: 3,
        rawValue: 1.2,
      },
      {
        label: "Not applicable / personal loan",
        value: "na",
        score: 2,
        rawValue: 1.0,
      },
    ],
    signalLabel: "Goods-to-credit ratio recorded",
  },

  // ── Section 4: Credit History ─────────────────────────────
  {
    id: "q8",
    section: 4,
    sectionLabel: "Credit History",
    text: "Have you ever missed or been late on a loan or EMI payment?",
    featureKey: "inst_recent_days_late",
    options: [
      { label: "Never", value: "never", score: 4, rawValue: 0 },
      {
        label: "Once or twice, long ago",
        value: "rare",
        score: 3,
        rawValue: 5,
      },
      {
        label: "A few times in the past year",
        value: "few",
        score: 2,
        rawValue: 15,
      },
      {
        label: "Frequently or recently",
        value: "often",
        score: 1,
        rawValue: 30,
      },
    ],
    signalLabel: "Payment history signal recorded",
  },

  // ── Section 5: Documents & Assets ────────────────────────
  {
    id: "q9",
    section: 5,
    sectionLabel: "Documents & Assets",
    text: "How many supporting documents can you provide with this application?",
    featureKey: "DOCS_PROVIDED",
    options: [
      { label: "1–2 documents", value: "1to2", score: 1, rawValue: 1 },
      { label: "3–5 documents", value: "3to5", score: 2, rawValue: 4 },
      { label: "6–10 documents", value: "6to10", score: 3, rawValue: 8 },
      { label: "More than 10", value: "gt10", score: 4, rawValue: 12 },
    ],
    signalLabel: "Document count recorded",
  },
  {
    id: "q10",
    section: 5,
    sectionLabel: "Documents & Assets",
    text: "Do you own a car, and if so, how old is it?",
    featureKey: "OWN_CAR_AGE",
    options: [
      { label: "I don't own a car", value: "none", score: 2, rawValue: -1 }, // -1 = no car flag
      { label: "Less than 3 years old", value: "lt3y", score: 4, rawValue: 2 },
      { label: "3–7 years old", value: "3to7y", score: 3, rawValue: 5 },
      { label: "More than 7 years old", value: "gt7y", score: 2, rawValue: 10 },
    ],
    signalLabel: "Vehicle asset recorded",
  },
];

export const TOTAL_SECTIONS = 5;
export const MAX_SCORE = QUESTIONS.reduce((s, q) => s + 4, 0); // 10 × 4 = 40

// ---------------------------------------------------------------------------
// Auto-fill values for features NOT collected from the user.
// These are training-set medians / most-frequent values.
// ---------------------------------------------------------------------------
export const AUTO_FILL_FEATURES: Record<string, number | string> = {
  EXT_SOURCE_1: 0.502,
  EXT_SOURCE_2: 0.559,
  EXT_SOURCE_3: 0.51,
  EXT_SOURCE_MEAN: 0.524,
  EXT_SOURCE_MAX: 0.66,
  EXT_SOURCE_MIN: 0.374,
  bur_CREDIT_DEBT_RATIO_max: 0.072,
  pos_instalment_future: 12,
  prev_DAYS_LAST_DUE_1ST_VERSION_max: -395,
  inst_amt_payment_sum: 45000,
};

// ---------------------------------------------------------------------------
// Helper: build the full feature vector from quiz answers
// ---------------------------------------------------------------------------
export function buildFeatureVector(
  answers: Record<string, Option>,
): Record<string, number | string> {
  const credit = (answers["q5"]?.rawValue as number) ?? 200000;
  const annuity = (answers["q6"]?.rawValue as number) ?? 8500;
  const goodsRatio = (answers["q7"]?.rawValue as number) ?? 1.0;

  return {
    // User-supplied
    CODE_GENDER: answers["q1"]?.rawValue ?? "M",
    NAME_EDUCATION_TYPE:
      answers["q2"]?.rawValue ?? "Secondary / secondary special",
    NAME_FAMILY_STATUS: answers["q3"]?.rawValue ?? "Married",
    DAYS_EMPLOYED: answers["q4"]?.rawValue ?? -730,
    AMT_CREDIT: credit,
    AMT_ANNUITY: annuity,
    AMT_GOODS_PRICE: Math.round(credit * (goodsRatio as number)),
    inst_recent_days_late: answers["q8"]?.rawValue ?? 0,
    DOCS_PROVIDED: answers["q9"]?.rawValue ?? 4,
    OWN_CAR_AGE: answers["q10"]?.rawValue ?? -1,

    // Derived
    CREDIT_TERM_MONTHS: Math.round(credit / annuity),
    GOODS_CREDIT_RATIO: goodsRatio,

    // Auto-filled medians
    ...AUTO_FILL_FEATURES,
  };
}
