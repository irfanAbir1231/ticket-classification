import type {
  CaseType,
  Department,
  Severity,
  TicketClassification,
} from "@/types";

type CaseRule = {
  caseType: CaseType;
  patterns: RegExp[];
};

const CASE_RULES: CaseRule[] = [
  {
    caseType: "phishing_or_social_engineering",
    patterns: [
      /\botp\b/i,
      /\bpin\b/i,
      /password/i,
      /passcode/i,
      /credential/i,
      /phish/i,
      /scam/i,
      /social engineering/i,
      /asked.*(code|credential|card)/i,
      /share.*(otp|pin|password|card)/i,
    ],
  },
  {
    caseType: "wrong_transfer",
    patterns: [
      /wrong (transfer|account|recipient|number)/i,
      /sent .* wrong/i,
      /transferred .* wrong/i,
      /mistaken transfer/i,
      /incorrect recipient/i,
    ],
  },
  {
    caseType: "payment_failed",
    patterns: [
      /payment failed/i,
      /transaction failed/i,
      /payment declined/i,
      /could not pay/i,
      /payment.*not.*(complete|successful|working)/i,
      /charged.*but.*failed/i,
      /balance.*deducted/i,
    ],
  },
  {
    caseType: "refund_request",
    patterns: [
      /refund/i,
      /money back/i,
      /reverse.*charge/i,
      /cancel.*payment/i,
      /charged twice/i,
      /duplicate charge/i,
    ],
  },
];

const CRITICAL_PATTERNS = [
  /\botp\b/i,
  /\bpin\b/i,
  /password/i,
  /passcode/i,
  /credential/i,
  /account takeover/i,
  /fraud/i,
  /scam/i,
  /phish/i,
];

const HIGH_PATTERNS = [
  /wrong transfer/i,
  /large amount/i,
  /urgent/i,
  /asap/i,
  /blocked/i,
  /charged twice/i,
  /duplicate charge/i,
];

const MEDIUM_PATTERNS = [
  /failed/i,
  /declined/i,
  /refund/i,
  /not received/i,
  /pending/i,
  /issue/i,
  /problem/i,
];

function countMatches(message: string, patterns: RegExp[]) {
  return patterns.filter((pattern) => pattern.test(message)).length;
}

function detectCaseType(message: string): {
  caseType: CaseType;
  score: number;
} {
  const matches = CASE_RULES.map((rule) => ({
    caseType: rule.caseType,
    score: countMatches(message, rule.patterns),
  })).sort((a, b) => b.score - a.score);

  return matches[0].score > 0
    ? matches[0]
    : { caseType: "other", score: 0 };
}

function detectSeverity(message: string, caseType: CaseType): Severity {
  if (
    caseType === "phishing_or_social_engineering" ||
    countMatches(message, CRITICAL_PATTERNS) > 0
  ) {
    return "critical";
  }

  if (countMatches(message, HIGH_PATTERNS) > 0) {
    return "high";
  }

  if (countMatches(message, MEDIUM_PATTERNS) > 0) {
    return "medium";
  }

  return "low";
}

function mapDepartment(caseType: CaseType): Department {
  switch (caseType) {
    case "wrong_transfer":
      return "dispute_resolution";
    case "payment_failed":
      return "payments_ops";
    case "refund_request":
      return "customer_support";
    case "phishing_or_social_engineering":
      return "fraud_risk";
    case "other":
    default:
      return "customer_support";
  }
}

function summarize(message: string, caseType: CaseType, severity: Severity) {
  const cleanedMessage = message.replace(/\s+/g, " ").trim();
  const shortMessage =
    cleanedMessage.length > 180
      ? `${cleanedMessage.slice(0, 177).trim()}...`
      : cleanedMessage;

  return `Customer reports a ${caseType.replaceAll("_", " ")} issue: ${shortMessage}. Current severity is ${severity}.`;
}

function confidenceFor(caseScore: number, severity: Severity) {
  const severityBoost = severity === "critical" ? 0.1 : 0;
  return Math.min(
    0.95,
    Number((0.45 + caseScore * 0.18 + severityBoost).toFixed(2)),
  );
}

export function classifyTicket(message: string): TicketClassification {
  const text = message.trim();
  const caseMatch = detectCaseType(text);
  const severity = detectSeverity(text, caseMatch.caseType);

  return {
    case_type: caseMatch.caseType,
    severity,
    department: mapDepartment(caseMatch.caseType),
    agent_summary: summarize(text, caseMatch.caseType, severity),
    human_review_required:
      severity === "critical" ||
      caseMatch.caseType === "phishing_or_social_engineering",
    confidence: confidenceFor(caseMatch.score, severity),
  };
}
