import {
  CaseType,
  Department,
  Severity,
  type TicketClassification,
} from "@/types";

const CASE_RULES: Array<{
  caseType: CaseType;
  patterns: RegExp[];
}> = [
  {
    caseType: CaseType.PhishingOrSocialEngineering,
    patterns: [
      /\botp\b/i,
      /\bpin\b/i,
      /password/i,
      /phish/i,
      /scam/i,
      /social engineering/i,
      /asked.*(code|credential|card)/i,
      /share.*(otp|pin|password|card)/i,
    ],
  },
  {
    caseType: CaseType.WrongTransfer,
    patterns: [
      /wrong (transfer|account|recipient|number)/i,
      /sent .* wrong/i,
      /transferred .* wrong/i,
      /mistaken transfer/i,
      /incorrect recipient/i,
    ],
  },
  {
    caseType: CaseType.PaymentFailed,
    patterns: [
      /payment failed/i,
      /transaction failed/i,
      /payment declined/i,
      /could not pay/i,
      /payment.*not.*(complete|successful|working)/i,
      /charged.*but.*failed/i,
    ],
  },
  {
    caseType: CaseType.RefundRequest,
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

function detectCaseType(message: string) {
  const matches = CASE_RULES.map((rule) => ({
    caseType: rule.caseType,
    score: countMatches(message, rule.patterns),
  })).sort((a, b) => b.score - a.score);

  return matches[0].score > 0 ? matches[0] : { caseType: CaseType.Other, score: 0 };
}

function detectSeverity(message: string, caseType: CaseType) {
  if (
    caseType === CaseType.PhishingOrSocialEngineering ||
    countMatches(message, CRITICAL_PATTERNS) > 0
  ) {
    return Severity.Critical;
  }

  if (countMatches(message, HIGH_PATTERNS) > 0) {
    return Severity.High;
  }

  if (countMatches(message, MEDIUM_PATTERNS) > 0) {
    return Severity.Medium;
  }

  return Severity.Low;
}

function mapDepartment(caseType: CaseType) {
  switch (caseType) {
    case CaseType.WrongTransfer:
      return Department.DisputeResolution;
    case CaseType.PaymentFailed:
      return Department.PaymentsOps;
    case CaseType.RefundRequest:
      return Department.CustomerSupport;
    case CaseType.PhishingOrSocialEngineering:
      return Department.FraudRisk;
    case CaseType.Other:
    default:
      return Department.CustomerSupport;
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
  const severityBoost = severity === Severity.Critical ? 0.1 : 0;
  return Math.min(0.95, Number((0.45 + caseScore * 0.18 + severityBoost).toFixed(2)));
}

export function classifyTicket(message: string): TicketClassification {
  const normalizedMessage = message.trim();
  const caseMatch = detectCaseType(normalizedMessage);
  const severity = detectSeverity(normalizedMessage, caseMatch.caseType);

  return {
    case_type: caseMatch.caseType,
    severity,
    department: mapDepartment(caseMatch.caseType),
    agent_summary: summarize(normalizedMessage, caseMatch.caseType, severity),
    human_review_required:
      severity === Severity.Critical ||
      caseMatch.caseType === CaseType.PhishingOrSocialEngineering,
    confidence: confidenceFor(caseMatch.score, severity),
  };
}
