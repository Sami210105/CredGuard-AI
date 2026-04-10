import React from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { CredGuardColors, CredGuardTypography, commonCardStyle } from '@/constants/credguard-theme';

type DocumentState = 'idle' | 'uploading' | 'parsing' | 'complete' | 'flagged';
type VerificationCheck = { name: string; status: 'verified' | 'flagged' };

type DocumentCard = {
  id: string;
  title: string;
  required: boolean;
  state: DocumentState;
  fileName?: string;
  extractedFields?: Array<{ key: string; value: string }>;
  checks: VerificationCheck[];
  flagQuestion?: string;
};

const documents: DocumentCard[] = [
  {
    id: 'aadhaar',
    title: 'Aadhaar Card',
    required: true,
    state: 'idle',
    checks: [
      { name: 'Name match', status: 'verified' },
      { name: 'Address consistency', status: 'verified' },
      { name: 'Aadhaar number format', status: 'verified' },
      { name: 'Document authenticity', status: 'verified' },
    ],
  },
  {
    id: 'bank_statement',
    title: 'Bank Statement (last 3 months)',
    required: true,
    state: 'flagged',
    fileName: 'jan-mar-2026-statement.pdf',
    checks: [
      { name: 'Account holder match', status: 'verified' },
      { name: 'Income consistency', status: 'verified' },
      { name: 'UPI transaction pattern scan', status: 'verified' },
      { name: 'Large deposit detection', status: 'flagged' },
      { name: 'Irregular outflow detection', status: 'flagged' },
    ],
    flagQuestion: 'A deposit of ₹15,000 was detected on Jan 12. Can you tell us where this came from?',
  },
  {
    id: 'income_proof',
    title: 'Income Proof',
    required: true,
    state: 'parsing',
    fileName: 'salary-slip-feb-2026.jpg',
    checks: [
      { name: 'Employer name', status: 'verified' },
      { name: 'Declared income vs statement match', status: 'verified' },
      { name: 'GSTIN format (if self-employed)', status: 'verified' },
    ],
  },
  {
    id: 'rent_receipt',
    title: 'Rent Receipt',
    required: false,
    state: 'complete',
    fileName: 'rent-receipt-march.pdf',
    extractedFields: [
      { key: 'Tenant', value: 'Rahul Sharma' },
      { key: 'Landlord', value: 'Anita Verma' },
      { key: 'Rent amount', value: '₹8,500' },
      { key: 'Payment method', value: 'UPI' },
      { key: 'Period', value: 'March 2026' },
    ],
    checks: [{ name: 'Payment regularity', status: 'verified' }],
  },
];

export default function DocumentsScreen() {
  const [documentStates] = React.useState(documents);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.pageTitle}>Document Verification</Text>
      <Text style={styles.pageSubtitle}>Upload and pre-verify your profile to strengthen your CredScore.</Text>

      {documentStates.map((document) => (
        <View key={document.id} style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardTitle}>{document.title}</Text>
            <View style={[styles.requirementBadge, document.required ? styles.requiredBadge : styles.optionalBadge]}>
              <Text style={styles.requirementBadgeText}>{document.required ? 'Required' : 'Optional'}</Text>
            </View>
          </View>

          {document.state === 'idle' ? <UploadPrompt /> : null}
          {document.state === 'uploading' ? <UploadingState fileName={document.fileName ?? 'upload.pdf'} /> : null}
          {document.state === 'parsing' ? <ParsingState fileName={document.fileName ?? 'upload.pdf'} /> : null}
          {document.state === 'complete' ? (
            <CompleteState
              fileName={document.fileName ?? 'document.pdf'}
              extractedFields={document.extractedFields ?? []}
            />
          ) : null}
          {document.state === 'flagged' ? (
            <FlaggedState
              fileName={document.fileName ?? 'document.pdf'}
              checks={document.checks}
              flagQuestion={document.flagQuestion}
            />
          ) : null}
        </View>
      ))}

      <View style={styles.card}>
        <Text style={styles.crossTitle}>Cross-verification</Text>
        <View style={styles.crossRowOk}>
          <Text style={styles.crossText}>Declared income ₹22,000 · Statement shows avg credit ₹21,400 · Match ✓</Text>
        </View>
        <View style={styles.crossRowFlag}>
          <Text style={[styles.crossText, { color: CredGuardColors.dangerText }]}>
            Declared savings ₹5,000/month · Statement shows avg balance growth ₹800 · Mismatch — Aarav will ask
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

function UploadingState({ fileName }: { fileName: string }) {
  return (
    <View style={styles.stateBlock}>
      <View style={styles.fileRow}>
        <Text style={styles.fileName}>{fileName}</Text>
        <ActivityIndicator size="small" color={CredGuardColors.textSecondary} />
      </View>
      <Text style={styles.helperText}>Uploading file...</Text>
      <StatusPill label="Pending" tone="pending" />
    </View>
  );
}

function UploadPrompt() {
  return (
    <Pressable style={styles.uploadPrompt}>
      <Ionicons name="cloud-upload-outline" size={20} color={CredGuardColors.textSecondary} />
      <Text style={styles.uploadTitle}>Tap to upload</Text>
      <Text style={styles.uploadSubtitle}>PDF, JPG, PNG</Text>
    </Pressable>
  );
}

function ParsingState({ fileName }: { fileName: string }) {
  return (
    <View style={styles.stateBlock}>
      <View style={styles.fileRow}>
        <Text style={styles.fileName}>{fileName}</Text>
        <ActivityIndicator size="small" color={CredGuardColors.warningText} />
      </View>
      <Text style={styles.helperText}>Extracting data...</Text>
      <StatusPill label="Parsing..." tone="warning" />
    </View>
  );
}

function CompleteState({
  fileName,
  extractedFields,
}: {
  fileName: string;
  extractedFields: Array<{ key: string; value: string }>;
}) {
  return (
    <View style={styles.stateBlock}>
      <View style={styles.fileRow}>
        <Text style={styles.fileName}>{fileName}</Text>
      </View>
      <Text style={styles.microLabel}>EXTRACTED & PREFILLED</Text>
      <View style={styles.table}>
        {extractedFields.map((field) => (
          <View key={field.key} style={styles.tableRow}>
            <Text style={styles.tableKey}>{field.key}</Text>
            <Text style={styles.tableValue}>{field.value}</Text>
          </View>
        ))}
      </View>
      <StatusPill label="Complete" tone="success" />
    </View>
  );
}

function FlaggedState({
  fileName,
  checks,
  flagQuestion,
}: {
  fileName: string;
  checks: VerificationCheck[];
  flagQuestion?: string;
}) {
  return (
    <View style={styles.stateBlock}>
      <View style={styles.fileRow}>
        <Text style={styles.fileName}>{fileName}</Text>
      </View>
      <Text style={styles.microLabel}>AI PRE-VERIFICATION</Text>
      <View style={styles.checkList}>
        {checks.map((check) => (
          <View key={check.name} style={styles.checkRow}>
            <Text style={styles.checkName}>{check.name}</Text>
            {check.status === 'verified' ? (
              <View style={styles.statusInline}>
                <Ionicons name="checkmark-circle" size={14} color={CredGuardColors.active} />
                <Text style={styles.verifiedText}>Verified</Text>
              </View>
            ) : (
              <View style={styles.statusInline}>
                <Ionicons name="alert-circle" size={14} color={CredGuardColors.warningText} />
                <Text style={styles.flaggedText}>Flagged</Text>
              </View>
            )}
          </View>
        ))}
      </View>

      {flagQuestion ? (
        <View style={styles.flagCard}>
          <Text style={styles.flagCardHeader}>AARAV IS ASKING...</Text>
          <Text style={styles.flagQuestion}>{flagQuestion}</Text>
          <StatusPill label="Review needed" tone="danger" />
        </View>
      ) : null}
    </View>
  );
}

function StatusPill({ label, tone }: { label: string; tone: 'success' | 'warning' | 'danger' | 'pending' }) {
  const toneMap: Record<string, ViewStyle> = {
    success: { backgroundColor: CredGuardColors.lightAccentSurface },
    warning: { backgroundColor: CredGuardColors.warningBackground },
    danger: { backgroundColor: CredGuardColors.dangerBackground },
    pending: { backgroundColor: CredGuardColors.pendingBackground },
  };
  const textColorMap: Record<string, string> = {
    success: CredGuardColors.active,
    warning: CredGuardColors.warningText,
    danger: CredGuardColors.dangerText,
    pending: CredGuardColors.pendingText,
  };
  return (
    <View style={[styles.statusPill, toneMap[tone]]}>
      <Text style={[styles.statusPillText, { color: textColorMap[tone] }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: CredGuardColors.background,
  },
  content: {
    paddingTop: 56,
    paddingHorizontal: 14,
    paddingBottom: 24,
    gap: 12,
  },
  pageTitle: {
    fontFamily: CredGuardTypography.heading,
    color: CredGuardColors.textPrimary,
    fontSize: 24,
  },
  pageSubtitle: {
    fontFamily: CredGuardTypography.body,
    color: CredGuardColors.textSecondary,
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 4,
  },
  card: {
    ...commonCardStyle,
    padding: 12,
    gap: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  cardTitle: {
    flex: 1,
    fontFamily: CredGuardTypography.body,
    fontSize: 13,
    color: CredGuardColors.textPrimary,
    fontWeight: '700',
  },
  requirementBadge: {
    borderRadius: 999,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  requiredBadge: {
    backgroundColor: CredGuardColors.lightAccentSurface,
  },
  optionalBadge: {
    backgroundColor: CredGuardColors.pendingBackground,
  },
  requirementBadgeText: {
    fontFamily: CredGuardTypography.body,
    fontSize: 10,
    color: CredGuardColors.textSecondary,
  },
  uploadPrompt: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: CredGuardColors.cardBorder,
    borderRadius: 14,
    backgroundColor: CredGuardColors.background,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 22,
    gap: 2,
  },
  uploadTitle: {
    fontFamily: CredGuardTypography.body,
    color: CredGuardColors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  uploadSubtitle: {
    fontFamily: CredGuardTypography.body,
    color: CredGuardColors.textSecondary,
    fontSize: 10,
  },
  stateBlock: {
    gap: 8,
  },
  fileRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fileName: {
    fontFamily: CredGuardTypography.body,
    color: CredGuardColors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  helperText: {
    fontFamily: CredGuardTypography.body,
    color: CredGuardColors.textSecondary,
    fontSize: 11,
  },
  microLabel: {
    fontFamily: CredGuardTypography.body,
    color: CredGuardColors.textSecondary,
    fontSize: 10,
    letterSpacing: 0.5,
  },
  table: {
    borderWidth: 0.5,
    borderColor: CredGuardColors.cardBorder,
    borderRadius: 12,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: CredGuardColors.mutedLine,
  },
  tableKey: {
    fontFamily: CredGuardTypography.body,
    color: CredGuardColors.textSecondary,
    fontSize: 11,
    flex: 1,
  },
  tableValue: {
    fontFamily: CredGuardTypography.body,
    color: CredGuardColors.textPrimary,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'right',
    flex: 1,
  },
  statusPill: {
    borderRadius: 999,
    paddingVertical: 5,
    paddingHorizontal: 10,
    alignSelf: 'flex-start',
  },
  statusPillText: {
    fontFamily: CredGuardTypography.body,
    fontSize: 10,
    fontWeight: '700',
  },
  checkList: {
    borderWidth: 0.5,
    borderColor: CredGuardColors.cardBorder,
    borderRadius: 12,
    overflow: 'hidden',
  },
  checkRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: CredGuardColors.mutedLine,
    gap: 8,
  },
  checkName: {
    fontFamily: CredGuardTypography.body,
    color: CredGuardColors.textPrimary,
    fontSize: 11,
    flex: 1,
  },
  statusInline: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  verifiedText: {
    fontFamily: CredGuardTypography.body,
    color: CredGuardColors.active,
    fontSize: 10,
  },
  flaggedText: {
    fontFamily: CredGuardTypography.body,
    color: CredGuardColors.warningText,
    fontSize: 10,
  },
  flagCard: {
    borderRadius: 12,
    borderWidth: 0.5,
    borderColor: CredGuardColors.dangerText,
    backgroundColor: CredGuardColors.dangerBackground,
    padding: 10,
    gap: 8,
  },
  flagCardHeader: {
    fontFamily: CredGuardTypography.body,
    color: CredGuardColors.dangerText,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  flagQuestion: {
    fontFamily: CredGuardTypography.body,
    color: CredGuardColors.textPrimary,
    fontSize: 12,
    lineHeight: 17,
  },
  crossTitle: {
    fontFamily: CredGuardTypography.heading,
    color: CredGuardColors.textPrimary,
    fontSize: 18,
  },
  crossRowOk: {
    borderRadius: 10,
    backgroundColor: CredGuardColors.lightAccentSurface,
    padding: 10,
  },
  crossRowFlag: {
    borderRadius: 10,
    backgroundColor: CredGuardColors.dangerBackground,
    padding: 10,
  },
  crossText: {
    fontFamily: CredGuardTypography.body,
    color: CredGuardColors.primary,
    fontSize: 12,
    lineHeight: 18,
  },
});
