export type QuestionSection =
  | 'Identity & Stability'
  | 'Financial habits'
  | 'Numerical literacy'
  | 'Consistency traps'
  | 'Future orientation';

export type AssessmentQuestion = {
  id: string;
  text: string;
  options: string[];
  section: QuestionSection;
  signalLabel: string;
};

export const assessmentQuestions: AssessmentQuestion[] = [
  {
    id: 'q_identity_address_duration',
    text: 'How long have you been living at your current address?',
    options: ['Less than 6 months', '6–12 months', '1–3 years', 'More than 3 years'],
    section: 'Identity & Stability',
    signalLabel: 'Stability signal recorded',
  },
  {
    id: 'q_identity_job_duration',
    text: 'How long have you been at your current job or income source?',
    options: ['Less than 6 months', '6–12 months', '1–3 years', 'More than 3 years'],
    section: 'Identity & Stability',
    signalLabel: 'Employment consistency signal recorded',
  },
  {
    id: 'q_habits_windfall',
    text: 'You receive ₹10,000 unexpectedly. What do you do?',
    options: [
      'Spend on something I need',
      'Save most of it',
      'Pay off a pending bill',
      'Split between saving and spending',
    ],
    section: 'Financial habits',
    signalLabel: 'Spending-priority signal recorded',
  },
  {
    id: 'q_habits_emi_shortfall',
    text: "Your EMI is due tomorrow and you're ₹500 short. What do you do?",
    options: [
      'Borrow from a friend',
      'Skip this month',
      'Arrange it somehow today',
      'Ask for extension from lender',
    ],
    section: 'Financial habits',
    signalLabel: 'Repayment intent signal recorded',
  },
  {
    id: 'q_numerical_interest',
    text: 'If you borrow ₹12,000 at 2% monthly interest, roughly how much do you owe after 3 months?',
    options: ['₹12,240', '₹12,720', '₹12,500', 'Not sure'],
    section: 'Numerical literacy',
    signalLabel: 'Numerical literacy signal recorded',
  },
  {
    id: 'q_consistency_monthly_spend',
    text: 'On average how much do you spend in a month across all expenses?',
    options: ['Below ₹10,000', '₹10,000–₹20,000', '₹20,000–₹30,000', 'Above ₹30,000'],
    section: 'Consistency traps',
    signalLabel: 'Consistency signal recorded',
  },
  {
    id: 'q_future_income_expectation',
    text: 'Where do you expect your income to be in 12 months?',
    options: ['Lower than now', 'About the same', 'Somewhat higher', 'Significantly higher'],
    section: 'Future orientation',
    signalLabel: 'Future-orientation signal recorded',
  },
];

export const assessmentSectionOrder: QuestionSection[] = [
  'Identity & Stability',
  'Financial habits',
  'Numerical literacy',
  'Consistency traps',
  'Future orientation',
];
