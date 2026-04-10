import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { CredGuardColors, CredGuardTypography, commonCardStyle } from '@/constants/credguard-theme';

type DiceCounterfactual = {
  featureName: string;
  currentValue: string | number;
  suggestedValue: string | number;
  impactDirection: 'increase' | 'decrease';
};

export default function CredScoreScreen() {
  const modelOutputSlot: number | null = null;
  const diceOutputSlot: DiceCounterfactual[] = [];
  const geminiNarrativeSlot = '';
  void modelOutputSlot;
  void diceOutputSlot;
  void geminiNarrativeSlot;

  return (
    <View style={styles.screen}>
      <View style={styles.heroCard}>
        <Text style={styles.title}>Your CredScore</Text>
        <Text style={styles.subtitle}>
          Complete your assessment and upload documents to generate your score
        </Text>
        <View style={styles.gaugeWrap}>
          <View style={styles.gaugeRing}>
            <Text style={styles.gaugeValue}>0</Text>
          </View>
          <Text style={styles.gaugeHint}>Complete assessment to unlock your CredScore</Text>
        </View>
      </View>

      <LockedFeatureCard title="Eligibility probability" label="Model output" slot="[MODEL SLOT]" />
      <LockedFeatureCard title="Key factors" label="DiCE explainability" slot="[DICE SLOT]" />
      <LockedFeatureCard title="90-day improvement plan" label="Powered by Gemini" slot="[LLM SLOT]" />
      {/* TODO: replace with model endpoint (XGBoost/LightGBM) */}
      {/* TODO: replace with DiCE explainability output */}
      {/* TODO: replace with Gemini API call */}
    </View>
  );
}

function LockedFeatureCard({ title, label, slot }: { title: string; label: string; slot: string }) {
  return (
    <View style={styles.lockedCard}>
      <View style={styles.lockedHead}>
        <View style={styles.lockRow}>
          <Ionicons name="lock-closed" size={14} color={CredGuardColors.textSecondary} />
          <Text style={styles.lockedTitle}>{title}</Text>
        </View>
        <Text style={styles.lockedLabel}>{label}</Text>
      </View>
      <Text style={styles.slotBadge}>{slot}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: CredGuardColors.background,
    paddingTop: 56,
    paddingHorizontal: 14,
    gap: 12,
  },
  heroCard: {
    ...commonCardStyle,
    padding: 14,
    alignItems: 'center',
  },
  title: {
    fontFamily: CredGuardTypography.heading,
    color: CredGuardColors.textPrimary,
    fontSize: 25,
  },
  subtitle: {
    fontFamily: CredGuardTypography.body,
    color: CredGuardColors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 280,
  },
  gaugeWrap: {
    marginTop: 14,
    alignItems: 'center',
    gap: 8,
  },
  gaugeRing: {
    width: 138,
    height: 138,
    borderRadius: 999,
    borderWidth: 10,
    borderColor: '#D9D9D9',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4F4F4',
  },
  gaugeValue: {
    fontFamily: CredGuardTypography.heading,
    fontSize: 30,
    color: CredGuardColors.textSecondary,
  },
  gaugeHint: {
    fontFamily: CredGuardTypography.body,
    fontSize: 11,
    color: CredGuardColors.textSecondary,
  },
  lockedCard: {
    ...commonCardStyle,
    padding: 12,
    gap: 8,
    backgroundColor: '#FAFAFA',
  },
  lockedHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  lockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  lockedTitle: {
    fontFamily: CredGuardTypography.body,
    fontSize: 13,
    color: CredGuardColors.textPrimary,
    fontWeight: '700',
  },
  lockedLabel: {
    fontFamily: CredGuardTypography.body,
    fontSize: 10,
    color: CredGuardColors.textSecondary,
  },
  slotBadge: {
    alignSelf: 'flex-start',
    borderRadius: 999,
    backgroundColor: CredGuardColors.pendingBackground,
    color: CredGuardColors.textSecondary,
    fontFamily: CredGuardTypography.mono,
    fontSize: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
});
