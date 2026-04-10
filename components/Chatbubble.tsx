import React from "react";
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    View
} from "react-native";
import { Colors, FontSize, Radius, Shadow } from "../constants/credguard-theme";
import type { Message } from "../context/AppContext";

type Props = {
  message: Message;
  onSelectOption?: (
    questionId: string,
    option: { label: string; value: string; score: number },
  ) => void;
};

function SignalBadge({ label }: { label: string }) {
  return (
    <View style={styles.signalBadge}>
      <View style={styles.signalDot} />
      <Text style={styles.signalText}>{label}</Text>
    </View>
  );
}

export default function ChatBubble({ message, onSelectOption }: Props) {
  const isBot = message.role === "bot";

  // Empty bot message used only to show signal badge
  if (isBot && !message.text && message.signalLabel) {
    return (
      <View style={styles.signalRow}>
        <SignalBadge label={message.signalLabel} />
      </View>
    );
  }

  if (!message.text && !message.chips) return null;

  return (
    <View style={[styles.row, isBot ? styles.rowLeft : styles.rowRight]}>
      <View
        style={[styles.bubble, isBot ? styles.botBubble : styles.userBubble]}
      >
        {isBot && <Text style={styles.sender}>Aarav · CredGuard</Text>}

        {!!message.text && (
          <Text style={[styles.text, isBot ? styles.botText : styles.userText]}>
            {message.text}
          </Text>
        )}

        {/* Chips — unanswered */}
        {isBot && message.chips && !message.answered && (
          <View style={styles.chips}>
            {message.chips.map((chip) => (
              <TouchableOpacity
                key={chip.value}
                style={styles.chip}
                activeOpacity={0.7}
                onPress={() =>
                  onSelectOption &&
                  message.questionId &&
                  onSelectOption(message.questionId, chip)
                }
              >
                <Text style={styles.chipText}>{chip.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Selected answer */}
        {isBot && message.answered && message.selectedLabel && (
          <View style={styles.selectedChip}>
            <Text style={styles.selectedChipText}>{message.selectedLabel}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    marginVertical: 4,
    paddingHorizontal: 14,
  },
  rowLeft: { alignItems: "flex-start" },
  rowRight: { alignItems: "flex-end" },

  bubble: {
    maxWidth: "86%",
    borderRadius: Radius.lg,
    padding: 12,
  },
  botBubble: {
    backgroundColor: Colors.bgCard,
    borderBottomLeftRadius: 4,
    borderWidth: 0.5,
    borderColor: Colors.border,
    ...Shadow.card,
  },
  userBubble: {
    backgroundColor: Colors.brand,
    borderBottomRightRadius: 4,
  },

  sender: {
    fontSize: FontSize.xs,
    fontWeight: "600",
    color: Colors.brandMid,
    marginBottom: 4,
    letterSpacing: 0.3,
  },
  text: {
    fontSize: FontSize.base,
    lineHeight: 20,
  },
  botText: { color: Colors.textPrimary },
  userText: { color: "#E0F5EC" },

  chips: { marginTop: 10, gap: 6 },
  chip: {
    backgroundColor: Colors.bgSecondary,
    borderRadius: Radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderWidth: 0.5,
    borderColor: Colors.borderMid,
  },
  chipText: {
    fontSize: FontSize.base,
    color: Colors.textPrimary,
  },

  selectedChip: {
    marginTop: 8,
    backgroundColor: Colors.brandLight,
    borderRadius: Radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 5,
    alignSelf: "flex-start",
    borderWidth: 0.5,
    borderColor: Colors.brandMid,
  },
  selectedChipText: {
    fontSize: FontSize.sm,
    color: Colors.brandText,
    fontWeight: "600",
  },

  // Signal badge
  signalRow: {
    paddingHorizontal: 14,
    marginBottom: 6,
  },
  signalBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: Colors.brandLight,
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
    gap: 5,
  },
  signalDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.brandMid,
  },
  signalText: {
    fontSize: FontSize.xs,
    color: Colors.brandText,
    fontWeight: "500",
  },
});
