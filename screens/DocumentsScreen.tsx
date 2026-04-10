import React from "react";
import {
    ActivityIndicator,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { Colors, FontSize, Radius, Shadow } from "../constants/credguard-theme";

// ── Types ────────────────────────────────────────────────────

type DocStatus = "idle" | "parsing" | "complete" | "flagged";

type ExtractedField = { key: string; value: string };
type VerifyCheck = { label: string; status: "verified" | "flagged" };
type CrossCheck = {
  id: string;
  label: string;
  declared: string;
  observed: string;
  status: "match" | "mismatch";
  note?: string;
};

type Doc = {
  id: string;
  title: string;
  subtitle: string;
  required: boolean;
  status: DocStatus;
  fileName: string | null;
  extractedFields: ExtractedField[];
  verificationChecks: VerifyCheck[];
  flag: { question: string } | null;
};

// ── Mock data ────────────────────────────────────────────────
// TODO: replace with real upload + OCR pipeline

const DOCUMENTS: Doc[] = [
  {
    id: "aadhaar",
    title: "Aadhaar Card",
    subtitle: "Identity & address verification",
    required: true,
    status: "complete",
    fileName: "Aadhaar_Card.pdf",
    extractedFields: [
      { key: "Name", value: "Ravi Kumar" },
      { key: "Aadhaar Number", value: "XXXX XXXX 3821" },
      { key: "Address", value: "Nashik, Maharashtra" },
      { key: "Date of Birth", value: "14 March 1994" },
    ],
    verificationChecks: [
      { label: "Document authenticity", status: "verified" },
      { label: "Aadhaar format valid", status: "verified" },
      { label: "Name consistency", status: "verified" },
      { label: "Address match", status: "verified" },
    ],
    flag: null,
  },
  {
    id: "bank",
    title: "Bank Statement",
    subtitle: "Last 3 months — income & behavior",
    required: true,
    status: "flagged",
    fileName: "Bank_Statement_Jan2025.pdf",
    extractedFields: [
      { key: "Account Holder", value: "Ravi Kumar" },
      { key: "Bank", value: "State Bank of India" },
      { key: "Avg Monthly Credit", value: "₹21,400" },
      { key: "Period", value: "Oct – Dec 2024" },
    ],
    verificationChecks: [
      { label: "Document authenticity", status: "verified" },
      { label: "Account holder match", status: "verified" },
      { label: "Income consistency", status: "verified" },
      { label: "Large deposit detected", status: "flagged" },
    ],
    flag: {
      question:
        "A deposit of ₹15,000 was detected on Dec 12. Can you tell us where this came from?",
    },
  },
  {
    id: "income",
    title: "Income Proof",
    subtitle: "Salary slip, ITR, or GST return",
    required: true,
    status: "parsing",
    fileName: "Salary_Slip_Dec2024.pdf",
    extractedFields: [],
    verificationChecks: [],
    flag: null,
  },
  {
    id: "rent",
    title: "Rent Receipt",
    subtitle: "Optional — strengthens your profile",
    required: false,
    status: "idle",
    fileName: null,
    extractedFields: [],
    verificationChecks: [],
    flag: null,
  },
];

const CROSS_CHECKS: CrossCheck[] = [
  {
    id: "income",
    label: "Declared income",
    declared: "₹22,000",
    observed: "Avg credit ₹21,400",
    status: "match",
  },
  {
    id: "savings",
    label: "Declared savings",
    declared: "₹5,000/month",
    observed: "Avg balance growth ₹800",
    status: "mismatch",
    note: "Aarav will ask about this",
  },
  {
    id: "address",
    label: "Stated address",
    declared: "Nashik, Maharashtra",
    observed: "Aadhaar address matches",
    status: "match",
  },
];

// ── Status pill ──────────────────────────────────────────────

const STATUS_CONFIG: Record<
  DocStatus,
  { bg: string; text: string; dot: string; label: string }
> = {
  complete: {
    bg: Colors.successBg,
    text: Colors.successText,
    dot: Colors.successDot,
    label: "Complete",
  },
  parsing: {
    bg: Colors.warningBg,
    text: Colors.warningText,
    dot: Colors.warningDot,
    label: "Parsing...",
  },
  flagged: {
    bg: Colors.dangerBg,
    text: Colors.dangerText,
    dot: Colors.dangerDot,
    label: "Review needed",
  },
  idle: {
    bg: Colors.lockedBg,
    text: Colors.lockedText,
    dot: Colors.lockedText,
    label: "Not uploaded",
  },
};

function StatusPill({ status }: { status: DocStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <View style={[styles.pill, { backgroundColor: cfg.bg }]}>
      <View style={[styles.pillDot, { backgroundColor: cfg.dot }]} />
      <Text style={[styles.pillText, { color: cfg.text }]}>{cfg.label}</Text>
    </View>
  );
}

// ── Document card ────────────────────────────────────────────

function DocCard({ doc }: { doc: Doc }) {
  return (
    <View style={styles.card}>
      {/* Header */}
      <View style={styles.cardHeader}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <Text style={styles.cardTitle}>{doc.title}</Text>
          <Text style={styles.cardSub}>{doc.subtitle}</Text>
        </View>
        <View style={{ alignItems: "flex-end", gap: 4 }}>
          <StatusPill status={doc.status} />
          {!doc.required && <Text style={styles.optional}>Optional</Text>}
        </View>
      </View>

      {/* Idle */}
      {doc.status === "idle" && (
        <TouchableOpacity style={styles.uploadArea} activeOpacity={0.7}>
          <Text style={styles.uploadIcon}>↑</Text>
          <Text style={styles.uploadText}>Tap to upload</Text>
          <Text style={styles.uploadSub}>PDF, JPG, PNG</Text>
        </TouchableOpacity>
      )}

      {/* Parsing */}
      {doc.status === "parsing" && (
        <View style={styles.fileRow}>
          <View style={styles.fileIcon}>
            <ActivityIndicator size="small" color={Colors.brandMint} />
          </View>
          <View>
            <Text style={styles.fileName}>{doc.fileName}</Text>
            <Text style={styles.fileSub}>Extracting data...</Text>
          </View>
        </View>
      )}

      {/* Complete / Flagged */}
      {(doc.status === "complete" || doc.status === "flagged") && (
        <>
          <View style={styles.fileRow}>
            <View style={styles.fileIcon}>
              <Text style={styles.fileIconLabel}>PDF</Text>
            </View>
            <View>
              <Text style={styles.fileName}>{doc.fileName}</Text>
              <Text style={styles.fileSub}>Uploaded</Text>
            </View>
          </View>

          {doc.extractedFields.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>EXTRACTED & PREFILLED</Text>
              <View style={styles.table}>
                {doc.extractedFields.map((f, i) => (
                  <View key={i} style={styles.tableRow}>
                    <Text style={styles.tableKey}>{f.key}</Text>
                    <Text style={styles.tableVal}>{f.value}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {doc.verificationChecks.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>AI PRE-VERIFICATION</Text>
              <View style={styles.table}>
                {doc.verificationChecks.map((c, i) => (
                  <View key={i} style={styles.tableRow}>
                    <Text style={styles.tableKey}>{c.label}</Text>
                    <Text
                      style={
                        c.status === "flagged"
                          ? styles.statusFlag
                          : styles.statusOk
                      }
                    >
                      {c.status === "flagged" ? "⚠ Flagged" : "✓ Verified"}
                    </Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {doc.flag && (
            <View style={styles.flagCard}>
              <Text style={styles.flagHeader}>AARAV IS ASKING...</Text>
              <Text style={styles.flagQuestion}>{doc.flag.question}</Text>
            </View>
          )}
        </>
      )}
    </View>
  );
}

// ── Cross-check card ─────────────────────────────────────────

function CrossCheckCard() {
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Cross-verification</Text>
      <Text style={[styles.cardSub, { marginBottom: 12 }]}>
        Comparing what you told Aarav with what documents show.
      </Text>
      {CROSS_CHECKS.map((c) => (
        <View key={c.id} style={styles.crossRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.crossLabel}>{c.label}</Text>
            <Text style={styles.crossLine}>Declared: {c.declared}</Text>
            <Text style={styles.crossLine}>Observed: {c.observed}</Text>
            {c.note && <Text style={styles.crossNote}>{c.note}</Text>}
          </View>
          <Text
            style={c.status === "match" ? styles.statusOk : styles.statusFlag}
          >
            {c.status === "match" ? "✓ Match" : "⚠ Mismatch"}
          </Text>
        </View>
      ))}
      {/* TODO: replace with real cross-check logic from model pipeline */}
      <Text style={styles.mockNote}>
        Mock data — real cross-check wired in later
      </Text>
    </View>
  );
}

// ── Screen ───────────────────────────────────────────────────

export default function DocumentsScreen() {
  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.intro}>
        Upload documents to verify your profile. Aarav will flag anything that
        needs clarification.
      </Text>
      {DOCUMENTS.map((doc) => (
        <DocCard key={doc.id} doc={doc} />
      ))}
      <CrossCheckCard />
      <View style={{ height: 30 }} />
    </ScrollView>
  );
}

// ── Styles ───────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.bgPrimary },
  content: { padding: 16 },
  intro: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    marginBottom: 14,
    lineHeight: 19,
  },

  // Card
  card: {
    backgroundColor: Colors.bgCard,
    borderRadius: Radius.lg,
    borderWidth: 0.5,
    borderColor: Colors.border,
    padding: 14,
    marginBottom: 12,
    ...Shadow.card,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: FontSize.base,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  cardSub: { fontSize: FontSize.sm, color: Colors.textSecondary },
  optional: { fontSize: FontSize.xs, color: Colors.textMuted },

  // Status pill
  pill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    gap: 5,
  },
  pillDot: { width: 6, height: 6, borderRadius: 3 },
  pillText: { fontSize: FontSize.xs, fontWeight: "500" },

  // Upload
  uploadArea: {
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: Colors.borderMid,
    borderRadius: Radius.md,
    padding: 20,
    alignItems: "center",
    backgroundColor: Colors.bgSecondary,
  },
  uploadIcon: { fontSize: 20, color: Colors.textMuted, marginBottom: 6 },
  uploadText: {
    fontSize: FontSize.base,
    color: Colors.textSecondary,
    fontWeight: "500",
  },
  uploadSub: { fontSize: FontSize.sm, color: Colors.textMuted, marginTop: 3 },

  // File row
  fileRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: Colors.bgSecondary,
    borderRadius: Radius.md,
    padding: 10,
    marginBottom: 12,
  },
  fileIcon: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: Colors.brand,
    alignItems: "center",
    justifyContent: "center",
  },
  fileIconLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: Colors.brandMint,
    letterSpacing: 0.5,
  },
  fileName: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textPrimary,
  },
  fileSub: { fontSize: FontSize.xs, color: Colors.textSecondary, marginTop: 1 },

  // Section label
  sectionLabel: {
    fontSize: FontSize.xs,
    fontWeight: "600",
    color: Colors.textMuted,
    letterSpacing: 0.6,
    marginBottom: 6,
    marginTop: 4,
  },

  // Table
  table: {
    borderRadius: Radius.md,
    borderWidth: 0.5,
    borderColor: Colors.border,
    overflow: "hidden",
    marginBottom: 10,
  },
  tableRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  tableKey: { fontSize: FontSize.sm, color: Colors.textSecondary },
  tableVal: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textPrimary,
  },

  // Status text
  statusOk: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.brandMid,
  },
  statusFlag: { fontSize: FontSize.sm, fontWeight: "600", color: "#C0392B" },

  // Flag card
  flagCard: {
    backgroundColor: "#FFF8F7",
    borderWidth: 0.5,
    borderColor: "#F5C6C6",
    borderRadius: Radius.md,
    padding: 12,
    marginTop: 4,
  },
  flagHeader: {
    fontSize: FontSize.xs,
    fontWeight: "700",
    color: "#C0392B",
    letterSpacing: 0.4,
    marginBottom: 5,
  },
  flagQuestion: {
    fontSize: FontSize.base,
    color: Colors.textPrimary,
    lineHeight: 19,
  },

  // Cross-check
  crossRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  crossLabel: {
    fontSize: FontSize.sm,
    fontWeight: "600",
    color: Colors.textPrimary,
    marginBottom: 2,
  },
  crossLine: { fontSize: FontSize.sm, color: Colors.textSecondary },
  crossNote: {
    fontSize: FontSize.sm,
    color: "#C0392B",
    marginTop: 2,
    fontStyle: "italic",
  },
  mockNote: {
    fontSize: FontSize.xs,
    color: Colors.textMuted,
    marginTop: 10,
    fontStyle: "italic",
  },
});
