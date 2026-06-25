import type {
  CaseType,
  Department,
  Severity,
  SortTicketRequest,
  SortedTicket,
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

export async function classifyTicket(ticket: SortTicketRequest): Promise<SortedTicket> {
  const text = ticket.message.trim();
  const apiKey = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";

  if (!apiKey) {
    console.warn("WARNING: GROQ_API_KEY is not set. Falling back to rule-based mock classifier.");
    const case_type = detectCaseType(text).caseType;
    const severity = detectSeverity(text, case_type);
    const department = mapDepartment(case_type);
    const agent_summary = summarize(text, case_type, severity);
    const human_review_required = severity === "critical" || case_type === "phishing_or_social_engineering";

    return {
      case_type,
      severity,
      department,
      agent_summary,
      human_review_required,
      confidence: 1.0,
    };
  }

  try {
    const url = "https://api.groq.com/openai/v1/chat/completions";
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: model,
        messages: [
          {
            role: "system",
            content: `You are a ticket classification assistant. Analyze the customer support ticket and return a JSON object matching this schema:
{
  "case_type": "wrong_transfer" | "payment_failed" | "refund_request" | "phishing_or_social_engineering" | "other",
  "severity": "low" | "medium" | "high" | "critical",
  "agent_summary": "A 1-2 sentence neutral summary of the issue.",
  "confidence": <number between 0.0 and 1.0 representing classification confidence>
}
IMPORTANT: Only return the raw JSON object, do not wrap it in markdown blocks or any conversational text.`
          },
          {
            role: "user",
            content: text
          }
        ],
        response_format: {
          type: "json_object"
        },
        temperature: 0.0
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Groq API returned status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const resultText = data.choices?.[0]?.message?.content;

    if (!resultText) {
      throw new Error("No output content returned from Groq API");
    }

    const parsed = JSON.parse(resultText.trim());
    
    // Validate case_type
    const validCaseTypes: CaseType[] = ["wrong_transfer", "payment_failed", "refund_request", "phishing_or_social_engineering", "other"];
    const case_type = validCaseTypes.includes(parsed.case_type) ? (parsed.case_type as CaseType) : "other";

    // Validate severity
    const validSeverities: Severity[] = ["low", "medium", "high", "critical"];
    const severity = validSeverities.includes(parsed.severity) ? (parsed.severity as Severity) : "low";

    const agent_summary = (parsed.agent_summary as string) || "Customer support ticket query.";
    
    // Validate confidence
    let confidence = typeof parsed.confidence === "number" ? parsed.confidence : 0.85;
    if (confidence < 0 || confidence > 1) {
      confidence = 0.85;
    }

    const department = mapDepartment(case_type);
    const human_review_required = severity === "critical" || case_type === "phishing_or_social_engineering";

    return {
      case_type,
      severity,
      department,
      agent_summary,
      human_review_required,
      confidence,
    };
  } catch (error) {
    console.error("Error in classifyTicket via LLM:", error);
    console.warn("Falling back to rule-based mock classifier.");
    
    const case_type = detectCaseType(text).caseType;
    const severity = detectSeverity(text, case_type);
    const department = mapDepartment(case_type);
    const agent_summary = summarize(text, case_type, severity);
    const human_review_required = severity === "critical" || case_type === "phishing_or_social_engineering";

    return {
      case_type,
      severity,
      department,
      agent_summary,
      human_review_required,
      confidence: 0.5,
    };
  }
}
