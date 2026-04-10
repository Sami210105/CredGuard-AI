import React from "react";
import {
    StyleSheet,
    Text,
    TextInput,
    TextInputProps,
    TouchableOpacity,
    View,
} from "react-native";
import { Colors, FontSize, Radius } from "../constants/credguard-theme";

type Props = TextInputProps & {
  onSend?: () => void;
};

export default function Input({ onSend, ...props }: Props) {
  return (
    <View style={styles.bar}>
      <TextInput
        style={styles.input}
        placeholderTextColor={Colors.textMuted}
        // TODO: wire to Gemini API for free-text questions
        {...props}
      />
      <TouchableOpacity style={styles.btn} activeOpacity={0.8} onPress={onSend}>
        <Text style={styles.icon}>↑</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: Colors.bgCard,
    borderTopWidth: 0.5,
    borderTopColor: Colors.border,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.bgSecondary,
    borderRadius: Radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 9,
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    borderWidth: 0.5,
    borderColor: Colors.borderMid,
  },
  btn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: Colors.brand,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    fontSize: 16,
    color: Colors.brandMint,
    fontWeight: "700",
  },
});
