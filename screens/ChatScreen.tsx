import * as DocumentPicker from "expo-document-picker";
import { useState } from "react";
import {
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { questions as initialMessages } from "../constants/questions.tsx"

export default function ChatScreen() {
  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [step, setStep] = useState(0);


  const pickDocument = async () => {
    let result = await DocumentPicker.getDocumentAsync({});
    console.log(result);
  };

  const handleSend = () => {
    if (!input) return;

    const userMsg = { id: Date.now(), text: input, sender: "user" };
    let botReply = "";

    // FLOW LOGIC
    if (step === 0) {
      botReply = "Got it. What's your credit score?";
      setStep(1);
    } else if (step === 1) {
      botReply = "Do you have any existing loans?";
      setStep(2);
    } else if (step === 2) {
      botReply = "Great. Now upload your documents 📄";
      setStep(3);
    }

    setMessages((prev) => [
      ...prev,
      userMsg,
      { id: Date.now() + 1, text: botReply, sender: "bot" },
    ]);

    setInput("");
  };

  return (
    <View style={{ flex: 1, padding: 20, paddingTop: 50 }}>
      <FlatList
        data={messages}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={{ paddingBottom: 20 }}
        renderItem={({ item }) => (
          <Text
            style={{
              alignSelf: item.sender === "user" ? "flex-end" : "flex-start",
              backgroundColor: item.sender === "user" ? "#4CAF50" : "#E0E0E0",
              padding: 10,
              borderRadius: 10,
              marginVertical: 5,
              maxWidth: "80%",
            }}
          >
            {item.text}
          </Text>
        )}
      />

      {/* SHOW UPLOAD BUTTON ONLY AT STEP 3 */}
      {step === 3 && (
        <TouchableOpacity onPress={pickDocument}>
          <Text style={{ color: "blue", marginVertical: 10 }}>
            Upload Document 📄
          </Text>
        </TouchableOpacity>
      )}

      <View style={{ flexDirection: "row", alignItems: "center" }}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Type your answer..."
          style={{
            flex: 1,
            borderWidth: 1,
            padding: 10,
            borderRadius: 10,
          }}
        />
        <TouchableOpacity onPress={handleSend}>
          <Text style={{ padding: 10 }}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}