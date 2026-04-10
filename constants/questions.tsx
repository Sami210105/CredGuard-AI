export const questions = [
  {
    id: "q1",
    type: "mcq",
    category: "impulsivity",
    question: "You receive ₹10,000 unexpectedly. What do you do?",
    options: [
      "Spend it immediately",
      "Buy something useful",
      "Save part of it",
      "Invest it",
    ],
    scores: [0, 1, 2, 3],
    allowSkip: true,
    weight: 1.2,
  },

  {
    id: "q2",
    type: "mcq",
    category: "problem_solving",
    question: "Your EMI is due tomorrow and you're ₹500 short. What do you do?",
    options: [
      "Ignore it",
      "Delay payment",
      "Borrow from friend",
      "Arrange funds immediately",
    ],
    scores: [0, 1, 2, 3],
    allowSkip: true,
    weight: 1.5,
  },

  {
    id: "q3",
    type: "numeric",
    category: "numerical",
    question:
      "If you borrow ₹10,000 at 2% monthly interest, how much after 3 months?",
    answer: 10612,
    tolerance: 200,
    score: 3,
    allowSkip: true,
    weight: 2,
  },

  {
    id: "q4",
    type: "mcq",
    category: "future_orientation",
    question: "Where do you see your income in 12 months?",
    options: [
      "Lower than now",
      "Same as now",
      "Slightly higher",
      "Significantly higher",
    ],
    scores: [0, 1, 2, 3],
    allowSkip: true,
    weight: 1,
  },

  {
    id: "q5",
    type: "mcq",
    category: "stability",
    question: "How long have you been at your current job?",
    options: [
      "Less than 6 months",
      "6 months - 1 year",
      "1–3 years",
      "More than 3 years",
    ],
    scores: [0, 1, 2, 3],
    allowSkip: true,
    weight: 1.3,
  },
  {
    id: "q6",
    type: "mcq",
    category: "consistency_check",
    linkedTo: "q1",
    question: "Do you usually save money for emergencies?",
    options: ["Never", "Sometimes", "Often", "Always"],
    scores: [0, 1, 2, 3],
    allowSkip: true,
    weight: 1.5,
  },
];
