/**
 * CredScoreScreen
 * ───────────────
 * Displays the CredGuard AI inference result:
 *   1. Animated gauge (CredScore / 100)
 *   2. Eligibility probability + risk tier
 *   3. Top factors ranked by model weight
 *   4. DiCE counterfactual suggestions
 *   5. LLM insights — result explanation, situation summary, 90-day plan
 *
 * State machine:  idle → loading → result | error
 *
 * API:  POST http://localhost:8000/api/v1/score
 */

import { Ionicons } from '@expo/vector-icons';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { CredGuardColors, CredGuardTypography, commonCardStyle } from '@/constants/credguard-theme';

// ── Types ────────────────────────────────────────────────────────────────────

type TopFactor = {
  feature: string;
  label: string;
  weight: number;
  direction: 'positive' | 'negative' | 'neutral';
};

type Counterfactual = {
  feature: string;
  label: string;
  current_value: number | null;
  suggested_value: number;
  impact_direction: 'increase' | 'decrease';
};

type LLMInsights = {
  result_explanation: string;
  situation_summary: string;
  improvement_plan: string;
};

type InferenceResult = {
  cred_score: number;
  prob_default: number;
  prob_approval: number;
  risk_tier: 'Low' | 'Medium' | 'High' | 'Very High';
  decision: string;
  model_confidence: number;
  top_factors: TopFactor[];
  counterfactuals: Counterfactual[];
  llm_insights: LLMInsights;
  ensemble_model_count: number;
  oof_auc: number;
};

type ScreenState = 'idle' | 'loading' | 'result' | 'error';

// ── Constants ─────────────────────────────────────────────────────────────────

const API_BASE = 'http://localhost:8000';

/** Demo payload — replace with real user form data when available */
const DEMO_PAYLOAD = {
  age_years: 34,
  gender: 'M',
  family_members: 3,
  children: 1,
  owns_car: 'Y',
  owns_realty: 'N',
  employed_years: 4.5,
  income_type: 'Working',
  education_type: 'Higher education',
  income: 270000,
  credit_amount: 450000,
  annuity_amount: 22500,
  goods_price: 400000,
  ext_source_1: 0.48,
  ext_source_2: 0.55,
  ext_source_3: 0.41,
};

const RISK_COLORS: Record<string, string> = {
  Low:       CredGuardColors.active,
  Medium:    '#D4810A',
  High:      '#C0392B',
  'Very High': '#7B0000',
};

const RISK_BACKGROUNDS: Record<string, string> = {
  Low:       CredGuardColors.lightAccentSurface,
  Medium:    CredGuardColors.warningBackground,
  High:      CredGuardColors.dangerBackground,
  'Very High': '#F8D7DA',
};

// ── Main Screen Component ─────────────────────────────────────────────────────

export default function CredScoreScreen() {
  const [screenState, setScreenState] = useState<ScreenState>('idle');
  const [result, setResult] = useState<InferenceResult | null>(null);
  const [error, setError] = useState<string>('');

  const runInference = useCallback(async () => {
    setScreenState('loading');
    setError('');
    try {
      const response = await fetch(`${API_BASE}/api/v1/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(DEMO_PAYLOAD),
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(`HTTP ${response.status}: ${text.slice(0, 200)}`);
      }
      const data: InferenceResult = await response.json();
      setResult(data);
      setScreenState('result');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setError(msg);
      setScreenState('error');
    }
  }, []);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {/* ── Hero / Score Card ──────────────────────────────────────────── */}
      <View style={styles.heroCard}>
        <Text style={styles.title}>Your CredScore</Text>
        <Text style={styles.subtitle}>
          {screenState === 'idle'
            ? 'Tap below to generate your AI-powered credit assessment'
            : screenState === 'loading'
            ? 'Our 25-model ensemble is analysing your profile…'
            : screenState === 'error'
            ? 'Assessment failed — please try again'
            : 'Powered by 25 LightGBM models + Gemini AI'}
        </Text>

        <ScoreGauge
          score={result?.cred_score ?? 0}
          riskTier={result?.risk_tier}
          loading={screenState === 'loading'}
        />

        {screenState !== 'loading' && (
          <Pressable
            style={[styles.cta, screenState === 'result' && styles.ctaSecondary]}
            onPress={runInference}
          >
            <Ionicons
              name={screenState === 'result' ? 'refresh' : 'flash'}
              size={14}
              color={screenState === 'result' ? CredGuardColors.textSecondary : '#fff'}
            />
            <Text style={[styles.ctaText, screenState === 'result' && styles.ctaTextSecondary]}>
              {screenState === 'result' ? 'Re-run assessment' : 'Generate CredScore'}
            </Text>
          </Pressable>
        )}
      </View>

      {/* ── Error State ────────────────────────────────────────────────── */}
      {screenState === 'error' && (
        <View style={styles.errorCard}>
          <Ionicons name="alert-circle" size={18} color={CredGuardColors.dangerText} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* ── Result Panels ──────────────────────────────────────────────── */}
      {screenState === 'result' && result && (
        <>
          <EligibilityCard result={result} />
          <TopFactorsCard factors={result.top_factors} />
          <CounterfactualsCard counterfactuals={result.counterfactuals} />
          <LLMInsightsCard insights={result.llm_insights} />
          <ModelMetaCard count={result.ensemble_model_count} auc={result.oof_auc} />
        </>
      )}

      {/* ── Idle State locked cards ─────────────────────────────────────── */}
      {screenState === 'idle' && (
        <>
          <LockedCard title="Eligibility probability" label="Model output" />
          <LockedCard title="Key factors" label="DiCE explainability" />
          <LockedCard title="Score improvement plan" label="Powered by Gemini" />
        </>
      )}
    </ScrollView>
  );
}

// ── Score Gauge ───────────────────────────────────────────────────────────────

function ScoreGauge({
  score,
  riskTier,
  loading,
}: {
  score: number;
  riskTier?: string;
  loading: boolean;
}) {
  const animValue = useRef(new Animated.Value(0)).current;
  const displayScore = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (score > 0) {
      Animated.timing(animValue, {
        toValue: score / 100,
        duration: 1200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
      Animated.timing(displayScore, {
        toValue: score,
        duration: 1200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }).start();
    }
  }, [score]);

  const ringColor = riskTier ? (RISK_COLORS[riskTier] ?? CredGuardColors.active) : '#D9D9D9';

  const animBorderColor = animValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['#D9D9D9', '#D4810A', CredGuardColors.active],
  });

  return (
    <View style={styles.gaugeWrap}>
      <Animated.View
        style={[
          styles.gaugeRing,
          { borderColor: score > 0 ? ringColor : '#D9D9D9' },
        ]}
      >
        {loading ? (
          <ActivityIndicator size="large" color={CredGuardColors.active} />
        ) : (
          <>
            <Animated.Text style={styles.gaugeValue}>
              {score > 0
                ? displayScore.interpolate({
                    inputRange: [0, 100],
                    outputRange: ['0', '100'],
                  })
                : '—'}
            </Animated.Text>
            {score > 0 && <Text style={styles.gaugeMax}>/100</Text>}
          </>
        )}
      </Animated.View>

      {riskTier && !loading && (
        <View style={[styles.tierBadge, { backgroundColor: RISK_BACKGROUNDS[riskTier] }]}>
          <Text style={[styles.tierText, { color: RISK_COLORS[riskTier] }]}>
            {riskTier} Risk
          </Text>
        </View>
      )}

      {!riskTier && !loading && (
        <Text style={styles.gaugeHint}>Complete assessment to unlock your CredScore</Text>
      )}
    </View>
  );
}

// ── Eligibility Card ──────────────────────────────────────────────────────────

function EligibilityCard({ result }: { result: InferenceResult }) {
  const approvalPct = Math.round(result.prob_approval * 100);
  const defaultPct  = Math.round(result.prob_default * 100);
  const confPct     = Math.round(result.model_confidence * 100);

  return (
    <View style={styles.card}>
      <SectionHeader icon="stats-chart" label="Model output" title="Eligibility Probability" />

      <View style={styles.eligibilityRow}>
        <StatBox label="Approval chance" value={`${approvalPct}%`} positive />
        <StatBox label="Default risk" value={`${defaultPct}%`} />
        <StatBox label="Model confidence" value={`${confPct}%`} positive={confPct > 70} />
      </View>

      <View style={[styles.decisionBadge, { backgroundColor: RISK_BACKGROUNDS[result.risk_tier] }]}>
        <Text style={[styles.decisionText, { color: RISK_COLORS[result.risk_tier] }]}>
          {result.decision}
        </Text>
      </View>
    </View>
  );
}

// ── Top Factors Card ──────────────────────────────────────────────────────────

function TopFactorsCard({ factors }: { factors: TopFactor[] }) {
  if (!factors.length) return null;
  const maxWeight = Math.max(...factors.map((f) => f.weight));

  return (
    <View style={styles.card}>
      <SectionHeader icon="analytics" label="DiCE explainability" title="Key Factors" />
      {factors.map((f, i) => (
        <FactorRow key={f.feature} factor={f} maxWeight={maxWeight} rank={i + 1} />
      ))}
    </View>
  );
}

function FactorRow({
  factor,
  maxWeight,
  rank,
}: {
  factor: TopFactor;
  maxWeight: number;
  rank: number;
}) {
  const barWidth = maxWeight > 0 ? (factor.weight / maxWeight) * 100 : 0;
  const barColor =
    factor.direction === 'positive'
      ? CredGuardColors.active
      : factor.direction === 'negative'
      ? CredGuardColors.dangerText
      : CredGuardColors.textSecondary;

  const dirIcon =
    factor.direction === 'positive'
      ? 'trending-up'
      : factor.direction === 'negative'
      ? 'trending-down'
      : 'remove';

  return (
    <View style={styles.factorRow}>
      <Text style={styles.factorRank}>{rank}</Text>
      <View style={styles.factorBody}>
        <View style={styles.factorLabelRow}>
          <Text style={styles.factorLabel}>{factor.label}</Text>
          <View style={styles.factorDirRow}>
            <Ionicons name={dirIcon as any} size={12} color={barColor} />
            <Text style={[styles.factorWeight, { color: barColor }]}>
              {(factor.weight * 100).toFixed(1)}%
            </Text>
          </View>
        </View>
        <View style={styles.barTrack}>
          <View style={[styles.barFill, { width: `${barWidth}%` as any, backgroundColor: barColor }]} />
        </View>
      </View>
    </View>
  );
}

// ── Counterfactuals Card ──────────────────────────────────────────────────────

function CounterfactualsCard({ counterfactuals }: { counterfactuals: Counterfactual[] }) {
  if (!counterfactuals.length) return null;

  return (
    <View style={styles.card}>
      <SectionHeader
        icon="git-compare"
        label="What-if simulation"
        title="What Would Improve Your Score"
      />
      <Text style={styles.cfSubtitle}>
        Changes that would flip or significantly improve your eligibility outcome:
      </Text>
      {counterfactuals.map((cf) => (
        <CounterfactualRow key={cf.feature} cf={cf} />
      ))}
    </View>
  );
}

function CounterfactualRow({ cf }: { cf: Counterfactual }) {
  const isIncrease = cf.impact_direction === 'increase';
  const arrowIcon  = isIncrease ? 'arrow-up-circle' : 'arrow-down-circle';
  const arrowColor = isIncrease ? CredGuardColors.active : '#D4810A';

  return (
    <View style={styles.cfRow}>
      <Ionicons name={arrowIcon} size={16} color={arrowColor} />
      <View style={styles.cfBody}>
        <Text style={styles.cfLabel}>{cf.label}</Text>
        <View style={styles.cfValues}>
          <Text style={styles.cfCurrent}>
            {cf.current_value !== null ? cf.current_value.toFixed(3) : 'N/A'}
          </Text>
          <Ionicons name="arrow-forward" size={10} color={CredGuardColors.textSecondary} />
          <Text style={[styles.cfSuggested, { color: arrowColor }]}>
            {cf.suggested_value.toFixed(3)}
          </Text>
        </View>
      </View>
      <View style={[styles.dirPill, { backgroundColor: isIncrease ? CredGuardColors.lightAccentSurface : CredGuardColors.warningBackground }]}>
        <Text style={[styles.dirPillText, { color: arrowColor }]}>
          {isIncrease ? '↑ Increase' : '↓ Decrease'}
        </Text>
      </View>
    </View>
  );
}

// ── LLM Insights Card ─────────────────────────────────────────────────────────

function LLMInsightsCard({ insights }: { insights: LLMInsights }) {
  const [activeTab, setActiveTab] = useState<0 | 1 | 2>(0);
  const tabs = ['Result', 'Situation', '90-day Plan'];

  const content = [
    insights.result_explanation,
    insights.situation_summary,
    insights.improvement_plan,
  ];

  return (
    <View style={styles.card}>
      <SectionHeader icon="sparkles" label="Powered by Gemini" title="AI Insights" />

      <View style={styles.tabRow}>
        {tabs.map((tab, i) => (
          <Pressable
            key={tab}
            style={[styles.tab, activeTab === i && styles.tabActive]}
            onPress={() => setActiveTab(i as 0 | 1 | 2)}
          >
            <Text style={[styles.tabText, activeTab === i && styles.tabTextActive]}>
              {tab}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.insightText}>{content[activeTab]}</Text>
    </View>
  );
}

// ── Model Meta Card ───────────────────────────────────────────────────────────

function ModelMetaCard({ count, auc }: { count: number; auc: number }) {
  return (
    <View style={styles.metaCard}>
      <Text style={styles.metaText}>
        Ensemble: {count} LightGBM models · OOF AUC {auc.toFixed(4)} · 5-fold × 5-seed
      </Text>
    </View>
  );
}

// ── Locked Card (idle state) ──────────────────────────────────────────────────

function LockedCard({ title, label }: { title: string; label: string }) {
  return (
    <View style={styles.lockedCard}>
      <View style={styles.lockedHead}>
        <View style={styles.lockRow}>
          <Ionicons name="lock-closed" size={14} color={CredGuardColors.textSecondary} />
          <Text style={styles.lockedTitle}>{title}</Text>
        </View>
        <Text style={styles.lockedLabel}>{label}</Text>
      </View>
      <Text style={styles.slotBadge}>Run assessment to unlock</Text>
    </View>
  );
}

// ── Shared sub-components ─────────────────────────────────────────────────────

function SectionHeader({
  icon,
  label,
  title,
}: {
  icon: string;
  label: string;
  title: string;
}) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionHeaderLeft}>
        <Ionicons name={icon as any} size={14} color={CredGuardColors.active} />
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      <Text style={styles.sectionLabel}>{label}</Text>
    </View>
  );
}

function StatBox({
  label,
  value,
  positive,
}: {
  label: string;
  value: string;
  positive?: boolean;
}) {
  return (
    <View style={styles.statBox}>
      <Text style={[styles.statValue, positive === false && { color: CredGuardColors.dangerText }]}>
        {value}
      </Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: CredGuardColors.background,
  },
  content: {
    paddingTop: 56,
    paddingHorizontal: 14,
    paddingBottom: 40,
    gap: 12,
  },

  // Hero card
  heroCard: {
    ...commonCardStyle,
    padding: 20,
    alignItems: 'center',
    gap: 12,
  },
  title: {
    fontFamily: CredGuardTypography.heading,
    color: CredGuardColors.textPrimary,
    fontSize: 26,
  },
  subtitle: {
    fontFamily: CredGuardTypography.body,
    color: CredGuardColors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    maxWidth: 280,
  },

  // Gauge
  gaugeWrap: {
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  gaugeRing: {
    width: 148,
    height: 148,
    borderRadius: 999,
    borderWidth: 10,
    borderColor: '#D9D9D9',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F9F9F9',
  },
  gaugeValue: {
    fontFamily: CredGuardTypography.heading,
    fontSize: 38,
    color: CredGuardColors.textPrimary,
  },
  gaugeMax: {
    fontFamily: CredGuardTypography.body,
    fontSize: 11,
    color: CredGuardColors.textSecondary,
    marginTop: -4,
  },
  gaugeHint: {
    fontFamily: CredGuardTypography.body,
    fontSize: 11,
    color: CredGuardColors.textSecondary,
    textAlign: 'center',
  },
  tierBadge: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  tierText: {
    fontFamily: CredGuardTypography.body,
    fontSize: 12,
    fontWeight: '700',
  },

  // CTA button
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: CredGuardColors.primary,
    borderRadius: 999,
    paddingVertical: 11,
    paddingHorizontal: 24,
    marginTop: 4,
  },
  ctaSecondary: {
    backgroundColor: CredGuardColors.pendingBackground,
  },
  ctaText: {
    fontFamily: CredGuardTypography.body,
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  ctaTextSecondary: {
    color: CredGuardColors.textSecondary,
  },

  // Error
  errorCard: {
    ...commonCardStyle,
    flexDirection: 'row',
    padding: 12,
    gap: 10,
    backgroundColor: CredGuardColors.dangerBackground,
    alignItems: 'flex-start',
  },
  errorText: {
    fontFamily: CredGuardTypography.body,
    fontSize: 12,
    color: CredGuardColors.dangerText,
    flex: 1,
    lineHeight: 17,
  },

  // General card
  card: {
    ...commonCardStyle,
    padding: 14,
    gap: 12,
  },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    fontFamily: CredGuardTypography.body,
    fontSize: 14,
    fontWeight: '700',
    color: CredGuardColors.textPrimary,
  },
  sectionLabel: {
    fontFamily: CredGuardTypography.body,
    fontSize: 10,
    color: CredGuardColors.textSecondary,
  },

  // Eligibility
  eligibilityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
    borderRadius: 10,
    backgroundColor: CredGuardColors.background,
    paddingVertical: 10,
  },
  statValue: {
    fontFamily: CredGuardTypography.heading,
    fontSize: 22,
    color: CredGuardColors.primary,
  },
  statLabel: {
    fontFamily: CredGuardTypography.body,
    fontSize: 10,
    color: CredGuardColors.textSecondary,
    textAlign: 'center',
  },
  decisionBadge: {
    borderRadius: 10,
    padding: 10,
    alignItems: 'center',
  },
  decisionText: {
    fontFamily: CredGuardTypography.body,
    fontSize: 13,
    fontWeight: '700',
  },

  // Factor rows
  factorRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  factorRank: {
    fontFamily: CredGuardTypography.mono,
    fontSize: 10,
    color: CredGuardColors.textSecondary,
    width: 14,
    marginTop: 2,
  },
  factorBody: {
    flex: 1,
    gap: 4,
  },
  factorLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  factorLabel: {
    fontFamily: CredGuardTypography.body,
    fontSize: 12,
    color: CredGuardColors.textPrimary,
    flex: 1,
  },
  factorDirRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  factorWeight: {
    fontFamily: CredGuardTypography.mono,
    fontSize: 10,
  },
  barTrack: {
    height: 4,
    backgroundColor: CredGuardColors.pendingBackground,
    borderRadius: 999,
    overflow: 'hidden',
  },
  barFill: {
    height: 4,
    borderRadius: 999,
  },

  // Counterfactuals
  cfSubtitle: {
    fontFamily: CredGuardTypography.body,
    fontSize: 11,
    color: CredGuardColors.textSecondary,
    lineHeight: 16,
    marginTop: -4,
  },
  cfRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    backgroundColor: CredGuardColors.background,
    padding: 10,
  },
  cfBody: {
    flex: 1,
    gap: 2,
  },
  cfLabel: {
    fontFamily: CredGuardTypography.body,
    fontSize: 12,
    fontWeight: '600',
    color: CredGuardColors.textPrimary,
  },
  cfValues: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  cfCurrent: {
    fontFamily: CredGuardTypography.mono,
    fontSize: 10,
    color: CredGuardColors.textSecondary,
  },
  cfSuggested: {
    fontFamily: CredGuardTypography.mono,
    fontSize: 10,
    fontWeight: '700',
  },
  dirPill: {
    borderRadius: 999,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  dirPillText: {
    fontFamily: CredGuardTypography.body,
    fontSize: 10,
    fontWeight: '700',
  },

  // LLM Insights tabs
  tabRow: {
    flexDirection: 'row',
    borderRadius: 10,
    backgroundColor: CredGuardColors.pendingBackground,
    padding: 3,
    gap: 2,
  },
  tab: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabActive: {
    backgroundColor: CredGuardColors.cardBackground,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 1,
  },
  tabText: {
    fontFamily: CredGuardTypography.body,
    fontSize: 11,
    color: CredGuardColors.textSecondary,
    fontWeight: '600',
  },
  tabTextActive: {
    color: CredGuardColors.textPrimary,
  },
  insightText: {
    fontFamily: CredGuardTypography.body,
    fontSize: 13,
    color: CredGuardColors.textPrimary,
    lineHeight: 20,
  },

  // Model meta
  metaCard: {
    borderRadius: 10,
    backgroundColor: CredGuardColors.pendingBackground,
    padding: 10,
    alignItems: 'center',
  },
  metaText: {
    fontFamily: CredGuardTypography.mono,
    fontSize: 9,
    color: CredGuardColors.textSecondary,
    textAlign: 'center',
  },

  // Locked cards (idle state)
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
