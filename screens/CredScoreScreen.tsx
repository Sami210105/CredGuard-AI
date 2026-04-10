import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Colors, FontSize, Radius, Shadow } from "../constants/credguard-theme";
import { MAX_SCORE } from "../constants/questions";
import { useApp } from "../context/AppContext";

function SlotBadge({ label }: { label: string }) {
  return (
    <View style={styles.slotBadge}>
      <Text style={styles.slotText}>{label}</Text>
    </View>
  );
}

function LockedCard({
  title,
  description,
  slot,
}: {
  title: string;
  description: string;
  slot: string;
}) {
  return (
    <View style={styles.lockedCard}>
      <View style={styles.lockedTop}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={styles.lockedTitle}>{title}</Text>
          <Text style={styles.lockedDesc}>{description}</Text>
        </View>
        <Text style={{ fontSize: 18 }}>🔒</Text>
      </View>
      <SlotBadge label={slot} />
    </View>
  );
}

export default function CredScoreScreen() {
  const { assessmentComplete, getTotalScore } = useApp();

  // Rough preliminary percentage from psychometric answers only
  // TODO: replace with actual XGBoost model output
  const preliminary = assessmentComplete
    ? Math.round((getTotalScore() / MAX_SCORE) * 100)
    : null;

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Score gauge */}
      <View style={styles.gaugeCard}>
        <Text style={styles.gaugeLabel}>YOUR CREDSCORE</Text>
        <View style={styles.gaugeRow}>
          <Text style={styles.gaugeValue}>
            {preliminary !== null ? preliminary : "—"}
          </Text>
          <Text style={styles.gaugeMax}>/100</Text>
        </View>

        {preliminary !== null ? (
          <>
            <Text style={styles.gaugeStatus}>
              Preliminary · Behavioral assessment only
            </Text>
            <Text style={styles.gaugeHint}>
              Upload documents to generate your full CredScore
            </Text>
          </>
        ) : (
          <Text style={styles.gaugeStatus}>
            Complete your assessment and upload documents to generate your score
          </Text>
        )}

        {/* MODEL SLOT */}
        <SlotBadge label="[MODEL SLOT] — XGBoost / LightGBM probability output" />
      </View>

      {/* Locked features */}
      <Text style={styles.sectionHeader}>What you unlock</Text>

      <LockedCard
        title="Eligibility Probability"
        description="Calibrated approval probability from our model trained on real loan outcome data."
        slot="[MODEL SLOT] — XGBoost output"
      />
      <LockedCard
        title="Key Factors"
        description="Which signals helped or hurt your score, with specific numbers and counterfactuals."
        slot="[DICE SLOT] — DiCE counterfactual explainability"
      />
      <LockedCard
        title="90-Day Improvement Plan"
        description="Exactly what to change, in what order, and by when to improve your score."
        slot="[LLM SLOT] — Gemini API narrative output"
      />

      {/* How it works */}
      <View style={styles.infoCard}>
        <Text style={styles.infoTitle}>How CredScore works</Text>
        {[
          {
            dot: Colors.brandMid,
            text: "Behavioral assessment — psychometric signals from your answers",
          },
          {
            dot: Colors.brandMid,
            text: "Document verification — income consistency, identity match",
          },
          {
            dot: Colors.brandMid,
            text: "ML model — trained on 307,000 real loan outcomes (Home Credit dataset)",
          },
          {
            dot: Colors.textMuted,
            text: "CIBIL score — not required. Works for credit-invisible borrowers.",
          },
        ].map((row, i) => (
          <View key={i} style={styles.infoRow}>
            <View style={[styles.infoDot, { backgroundColor: row.dot }]} />
            <Text
              style={[
                styles.infoText,
                row.dot === Colors.textMuted && styles.infoMuted,
              ]}
            >
              {row.text}
            </Text>
          </View>
        ))}
      </View>

      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bgPrimary },
  content: { padding: 16 },

  gaugeCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 0.5,
    borderColor: Colors.border,
    padding: 20,
    alignItems: "center",
    marginBottom: 20,
    ...Shadow.card,
  },
  gaugeLabel: {
    fontSize: FontSize.xs,
    fontWeight: "600",
    color: Colors.textSecondary,
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  gaugeRow: { flexDirection: "row", alignItems: "flex-end", marginBottom: 8 },
  gaugeValue: {
    fontSize: 56,
    fontWeight: "300",
    color: Colors.textSecondary,
    letterSpacing: -2,
    lineHeight: 60,
  },
  gaugeMax: {
    fontSize: 18,
    color: Colors.textMuted,
    marginBottom: 8,
    marginLeft: 2,
  },
  gaugeStatus: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 18,
    marginBottom: 4,
  },
  gaugeHint: {
    fontSize: FontSize.sm,
    color: Colors.brandMid,
    textAlign: "center",
    marginBottom: 10,
  },

  slotBadge: {
    backgroundColor: Colors.bgSecondary,
    borderRadius: Radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: "flex-start",
    borderWidth: 0.5,
    borderColor: Colors.borderMid,
    marginTop: 8,
  },
  slotText: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    fontFamily: "Courier",
  },

  sectionHeader: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textSecondary,
    letterSpacing: 0.4,
    marginBottom: 10,
  },

  lockedCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 0.5,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 10,
    ...Shadow.card,
  },
  lockedTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 4,
  },
  lockedTitle: {
    fontSize: FontSize.base,
    fontWeight: "600",
    color: Colors.textSecondary,
    marginBottom: 3,
  },
  lockedDesc: {
    fontSize: FontSize.sm,
    color: Colors.textMuted,
    lineHeight: 17,
  },

  infoCard: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 0.5,
    borderColor: Colors.border,
    padding: 14,
    marginTop: 10,
    ...Shadow.card,
  },
  infoTitle: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 10,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginBottom: 8,
  },
  infoDot: { width: 6, height: 6, borderRadius: 3, marginTop: 5 },
  infoText: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    flex: 1,
    lineHeight: 18,
  },
  infoMuted: { color: Colors.textMuted },
});
