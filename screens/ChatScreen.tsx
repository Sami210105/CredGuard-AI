import React, { useEffect, useRef } from "react";
import {
    FlatList,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    Text,
    View,
} from "react-native";
import ChatBubble from "../components/Chatbubble";
import Input from "../components/Input";
import { Colors, FontSize } from "../constants/credguard-theme";
import { QUESTIONS } from "../constants/questions";
import { useApp } from "../context/AppContext";

export default function ChatScreen() {
  const {
    messages,
    answers,
    currentQuestionIndex,
    assessmentComplete,
    addMessage,
    recordAnswer,
    markQuestionAnswered,
    advanceQuestion,
    setAssessmentComplete,
    getProgressPercent,
    getCurrentSectionLabel,
  } = useApp();

  const flatRef = useRef<FlatList>(null);

  // Push first question once on mount
  useEffect(() => {
    if (messages.length === 1 && QUESTIONS.length > 0) {
      setTimeout(() => pushQuestion(0), 500);
    }
  }, []);

  function pushQuestion(index: number) {
    const q = QUESTIONS[index];
    if (!q) return;
    addMessage({
      role: "bot",
      text: q.text,
      chips: q.options,
      questionId: q.id,
      answered: false,
    });
  }

  function handleSelectOption(
    questionId: string,
    option: { label: string; value: string; score: number },
  ) {
    const qIndex = QUESTIONS.findIndex((q) => q.id === questionId);
    if (qIndex === -1) return;
    const q = QUESTIONS[qIndex];

    // Record answer in context
    recordAnswer(questionId, option);

    // Swap chips → selected label on the question bubble
    markQuestionAnswered(questionId, option.label);

    // User echo bubble
    addMessage({ role: "user", text: option.label });

    // Signal badge bubble
    addMessage({
      role: "bot",
      text: "",
      signalLabel: q.signalLabel,
      answered: true,
    });

    advanceQuestion();

    const nextIndex = qIndex + 1;

    if (nextIndex < QUESTIONS.length) {
      setTimeout(() => pushQuestion(nextIndex), 700);
    } else {
      setTimeout(() => {
        setAssessmentComplete(true);
        addMessage({
          role: "bot",
          text: "Assessment complete! Your behavioral profile has been built.\n\nHead to the Documents tab to upload verification, or check your CredScore tab for your preliminary result.",
        });
      }, 900);
    }
  }

  const progress = getProgressPercent();
  const sectionLabel = getCurrentSectionLabel();

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      {/* Progress bar */}
      <View style={styles.progressWrap}>
        <View style={styles.progressMeta}>
          <Text style={styles.progressLabel}>
            {assessmentComplete
              ? "Assessment complete"
              : sectionLabel
                ? `${sectionLabel}`
                : "Starting..."}
          </Text>
          <Text style={styles.progressPct}>{progress}%</Text>
        </View>
        <View style={styles.track}>
          <View style={[styles.fill, { width: `${progress}%` as any }]} />
        </View>
      </View>

      {/* Messages */}
      <FlatList
        ref={flatRef}
        data={messages}
        keyExtractor={(m) => m.id}
        renderItem={({ item }) => (
          <ChatBubble message={item} onSelectOption={handleSelectOption} />
        )}
        contentContainerStyle={styles.list}
        onContentSizeChange={() =>
          flatRef.current?.scrollToEnd({ animated: true })
        }
        onLayout={() => flatRef.current?.scrollToEnd({ animated: false })}
        showsVerticalScrollIndicator={false}
      />

      {/* Input */}
      <Input placeholder="Ask Aarav anything..." />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.bgPrimary,
  },
  progressWrap: {
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
    backgroundColor: Colors.bgCard,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  progressMeta: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 5,
  },
  progressLabel: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  progressPct: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: "600",
  },
  track: {
    height: 3,
    backgroundColor: Colors.border,
    borderRadius: 2,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    backgroundColor: Colors.brandMid,
    borderRadius: 2,
  },
  list: {
    paddingTop: 14,
    paddingBottom: 10,
  },
});
