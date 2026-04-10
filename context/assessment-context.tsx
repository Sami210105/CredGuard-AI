import React, { createContext, useContext, useMemo, useState } from 'react';

import { assessmentQuestions, assessmentSectionOrder, type AssessmentQuestion } from '@/config/questions';

export type AnswerRecord = {
  questionId: string;
  answer: string;
  section: string;
  timestamp: string;
};

export type ChatMessage = {
  id: string;
  sender: 'bot' | 'user';
  type: 'question' | 'text' | 'signal' | 'completion';
  text: string;
  label?: string;
  question?: AssessmentQuestion;
};

type AssessmentContextValue = {
  answers: AnswerRecord[];
  messages: ChatMessage[];
  currentQuestion: AssessmentQuestion | null;
  sectionIndex: number;
  completionPercent: number;
  isComplete: boolean;
  selectOption: (question: AssessmentQuestion, answer: string) => void;
  sendFreeText: (text: string) => void;
};

const introMessage: ChatMessage = {
  id: 'intro',
  sender: 'bot',
  type: 'text',
  text: "I'm Aarav, your loan readiness coach. I'll ask a few quick questions to build your behavioral profile.",
  label: 'Aarav · CredGuard',
};

const AssessmentContext = createContext<AssessmentContextValue | null>(null);

const generateQuestionMessage = (question: AssessmentQuestion): ChatMessage => ({
  id: `bot_${question.id}`,
  sender: 'bot',
  type: 'question',
  text: question.text,
  label: 'Aarav · CredGuard',
  question,
});

const initialMessages: ChatMessage[] = [introMessage, generateQuestionMessage(assessmentQuestions[0])];

export function AssessmentProvider({ children }: React.PropsWithChildren) {
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);

  const answeredQuestionIds = useMemo(() => new Set(answers.map((item) => item.questionId)), [answers]);
  const currentQuestion =
    assessmentQuestions.find((question) => !answeredQuestionIds.has(question.id)) ?? null;
  const completionPercent = Math.round((answers.length / assessmentQuestions.length) * 100);
  const sectionIndex = currentQuestion
    ? assessmentSectionOrder.findIndex((section) => section === currentQuestion.section)
    : assessmentSectionOrder.length - 1;
  const isComplete = answers.length >= assessmentQuestions.length;

  const selectOption = (question: AssessmentQuestion, answer: string) => {
    const alreadyAnswered = answeredQuestionIds.has(question.id);
    if (alreadyAnswered) {
      return;
    }

    const answerRecord: AnswerRecord = {
      questionId: question.id,
      answer,
      section: question.section,
      timestamp: new Date().toISOString(),
    };

    const signalMessage: ChatMessage = {
      id: `signal_${question.id}`,
      sender: 'bot',
      type: 'signal',
      text: question.signalLabel || 'Consistency signal recorded',
      label: 'Aarav · CredGuard',
    };

    const nextQuestion = assessmentQuestions.find(
      (candidate) => candidate.id !== question.id && !answeredQuestionIds.has(candidate.id)
    );

    const followUpMessages: ChatMessage[] = [
      {
        id: `user_${question.id}`,
        sender: 'user',
        type: 'text',
        text: answer,
      },
      signalMessage,
    ];

    if (nextQuestion) {
      followUpMessages.push(generateQuestionMessage(nextQuestion));
    } else {
      followUpMessages.push({
        id: 'completion',
        sender: 'bot',
        type: 'completion',
        text: 'Assessment complete — your behavioral profile has been built. Upload documents to strengthen your CredScore, or view your preliminary score now.',
        label: 'Aarav · CredGuard',
      });
    }

    setAnswers((prev) => [...prev, answerRecord]);
    setMessages((prev) => [...prev, ...followUpMessages]);
  };

  const sendFreeText = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) {
      return;
    }

    setMessages((prev) => [
      ...prev,
      {
        id: `user_free_${Date.now()}`,
        sender: 'user',
        type: 'text',
        text: trimmed,
      },
      {
        id: `bot_free_${Date.now()}`,
        sender: 'bot',
        type: 'text',
        text: "Great question. For now, focus on stable repayment behavior and accurate documents. I'll soon provide personalized guidance once the Gemini assistant is connected.",
        label: 'Aarav · CredGuard',
      },
    ]);
    // TODO: replace with Gemini API call
  };

  return (
    <AssessmentContext.Provider
      value={{
        answers,
        messages,
        currentQuestion,
        sectionIndex,
        completionPercent,
        isComplete,
        selectOption,
        sendFreeText,
      }}>
      {children}
    </AssessmentContext.Provider>
  );
}

export function useAssessment() {
  const context = useContext(AssessmentContext);
  if (!context) {
    throw new Error('useAssessment must be used within AssessmentProvider.');
  }

  return context;
}
