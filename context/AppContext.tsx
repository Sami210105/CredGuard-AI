import React, { createContext, ReactNode, useContext, useState } from "react";
import { QUESTIONS } from "../constants/questions";

// ── Types ───────────────────────────────────────────────────

export type Answer = {
  questionId: string;
  value: string;
  label: string;
  score: number;
  timestamp: number;
};

export type Message = {
  id: string;
  role: "bot" | "user";
  text: string;
  // bot-only fields
  questionId?: string;
  chips?: { label: string; value: string; score: number }[];
  answered?: boolean;
  selectedLabel?: string;
  signalLabel?: string;
  timestamp: number;
};

type AppContextType = {
  answers: Record<string, Answer>;
  messages: Message[];
  currentQuestionIndex: number;
  assessmentComplete: boolean;
  // TODO: replace null with model output type when ML pipeline is wired
  credScore: number | null;
  recordAnswer: (
    questionId: string,
    option: { label: string; value: string; score: number },
  ) => void;
  addMessage: (msg: Omit<Message, "id" | "timestamp">) => void;
  markQuestionAnswered: (questionId: string, selectedLabel: string) => void;
  advanceQuestion: () => void;
  setAssessmentComplete: (v: boolean) => void;
  setCredScore: (v: number | null) => void;
  getProgressPercent: () => number;
  getCurrentSectionLabel: () => string;
  getTotalScore: () => number;
};

// ── Context ─────────────────────────────────────────────────

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [answers, setAnswers] = useState<Record<string, Answer>>({});

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "intro",
      role: "bot",
      text: "Namaste! I'm Aarav, your CredGuard loan readiness coach.\n\nI'll ask you a few questions to understand your financial profile. No documents needed here — just honest answers.\n\nLet's begin.",
      timestamp: Date.now(),
    },
  ]);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [assessmentComplete, setAssessmentComplete] = useState(false);

  // TODO: wire to XGBoost model endpoint
  const [credScore, setCredScore] = useState<number | null>(null);

  function recordAnswer(
    questionId: string,
    option: { label: string; value: string; score: number },
  ) {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: {
        questionId,
        value: option.value,
        label: option.label,
        score: option.score,
        timestamp: Date.now(),
      },
    }));
  }

  function addMessage(msg: Omit<Message, "id" | "timestamp">) {
    setMessages((prev) => [
      ...prev,
      { ...msg, id: `${Date.now()}-${Math.random()}`, timestamp: Date.now() },
    ]);
  }

  // Mark an existing bot message as answered (swap chips → selected label)
  function markQuestionAnswered(questionId: string, selectedLabel: string) {
    setMessages((prev) =>
      prev.map((m) =>
        m.questionId === questionId
          ? { ...m, answered: true, selectedLabel }
          : m,
      ),
    );
  }

  function advanceQuestion() {
    const next = currentQuestionIndex + 1;
    setCurrentQuestionIndex(next);
  }

  function getProgressPercent() {
    return Math.round((Object.keys(answers).length / QUESTIONS.length) * 100);
  }

  function getCurrentSectionLabel() {
    const q = QUESTIONS[currentQuestionIndex];
    return q ? q.sectionLabel : "";
  }

  function getTotalScore() {
    return Object.values(answers).reduce((s, a) => s + a.score, 0);
  }

  return (
    <AppContext.Provider
      value={{
        answers,
        messages,
        currentQuestionIndex,
        assessmentComplete,
        credScore,
        recordAnswer,
        addMessage,
        markQuestionAnswered,
        advanceQuestion,
        setAssessmentComplete,
        setCredScore,
        getProgressPercent,
        getCurrentSectionLabel,
        getTotalScore,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useApp must be used inside AppProvider");
  return ctx;
}
