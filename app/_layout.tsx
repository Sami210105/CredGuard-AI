import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { StyleSheet, Text, View } from "react-native";
import { Colors, FontSize } from "../constants/credguard-theme";
import { AppProvider, useApp } from "../context/AppContext";

function AppHeader() {
  const { assessmentComplete } = useApp();
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
      {assessmentComplete && (
        <View style={styles.doneBadge}>
          <Text style={styles.doneBadgeText}>Assessment done</Text>
        </View>
      )}
    </View>
  );
}

function RootLayoutInner() {
  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}

export default function RootLayout() {
  return (
    <AppProvider>
      <RootLayoutInner />
    </AppProvider>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: Colors.bgCard,
    paddingTop: 50,
    paddingBottom: 12,
    paddingHorizontal: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
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
  doneBadge: {
    backgroundColor: Colors.brandLight,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  doneBadgeText: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.brandText,
  },
});
