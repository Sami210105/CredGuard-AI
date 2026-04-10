import { Tabs } from "expo-router";
import { StyleSheet, Text, View } from "react-native";
import { Colors, FontSize } from "../../constants/credguard-theme";

function TabIcon({ label, focused }: { label: string; focused: boolean }) {
  const icons: Record<string, string> = {
    chat: "💬",
    documents: "📄",
    credscore: "◎",
  };
  return (
    <View style={styles.iconWrap}>
      <Text style={styles.emoji}>{icons[label] ?? "•"}</Text>
      <Text style={[styles.label, focused && styles.labelActive]}>
        {label === "chat"
          ? "Assessment"
          : label === "documents"
            ? "Documents"
            : "CredScore"}
      </Text>
    </View>
  );
}

// Shared header component
function Header() {
  return (
    <View style={styles.header}>
      <View style={styles.logoPill}>
        <View style={styles.monogram}>
          <Text style={styles.monogramText}>CG</Text>
        </View>
        <View>
          <Text style={styles.logoName}>CredGuard AI</Text>
          <Text style={styles.logoSub}>LOAN READINESS COACH</Text>
        </View>
      </View>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        header: () => <Header />,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
        tabBarIcon: ({ focused }) => (
          <TabIcon label={route.name} focused={focused} />
        ),
      })}
    >
      <Tabs.Screen name="chat" />
      <Tabs.Screen name="documents" />
      <Tabs.Screen name="credscore" />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: Colors.bgCard,
    paddingTop: 52,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: "rgba(0,0,0,0.08)",
  },
  logoPill: { flexDirection: "row", alignItems: "center", gap: 10 },
  monogram: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: Colors.brand,
    alignItems: "center",
    justifyContent: "center",
  },
  monogramText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.brandMint,
    letterSpacing: 0.5,
  },
  logoName: {
    fontSize: 15,
    fontWeight: "600",
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  logoSub: {
    fontSize: 9,
    color: Colors.textMuted,
    letterSpacing: 0.8,
    marginTop: 1,
  },

  tabBar: {
    backgroundColor: Colors.bgCard,
    borderTopWidth: 0.5,
    borderTopColor: "rgba(0,0,0,0.08)",
    height: 72,
    paddingBottom: 10,
  },
  iconWrap: { alignItems: "center", gap: 2, paddingTop: 6 },
  emoji: { fontSize: 18 },
  label: { fontSize: FontSize.xs, color: Colors.textMuted },
  labelActive: { color: Colors.brandMid, fontWeight: "600" },
});
