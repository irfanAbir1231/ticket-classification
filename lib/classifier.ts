import {
  type SortTicketRequest,
  type SortedTicket,
  type CaseType,
  type Severity,
  type Department,
} from "@/types";

function getDepartment(caseType: CaseType): Department {
  switch (caseType) {
    case "wrong_transfer":
      return "dispute_resolution";
    case "payment_failed":
    case "refund_request":
      return "payments_ops";
    case "phishing_or_social_engineering":
      return "fraud_risk";
    case "other":
    default:
      return "customer_support";
  }
}

function getMockClassification(text: string): {
  case_type: CaseType;
  severity: Severity;
  agent_summary: string;
} {
  const lowercaseText = text.toLowerCase();
  let case_type: CaseType = "other";
  let severity: Severity = "low";
  let agent_summary = "The customer is asking a general support question.";

  if (lowercaseText.includes("phish") || lowercaseText.includes("scam") || lowercaseText.includes("password") || lowercaseText.includes("link")) {
    case_type = "phishing_or_social_engineering";
    severity = "critical";
    agent_summary = "Potential security threat or phishing attempt identified in customer message.";
  } else if (lowercaseText.includes("transfer") || lowercaseText.includes("wire") || lowercaseText.includes("sent to") || lowercaseText.includes("wrong account")) {
    case_type = "wrong_transfer";
    severity = "high";
    agent_summary = "Customer reports money was transferred to an incorrect account.";
  } else if (lowercaseText.includes("refund") || lowercaseText.includes("chargeback") || lowercaseText.includes("money back")) {
    case_type = "refund_request";
    severity = "medium";
    agent_summary = "Customer is requesting a refund for a transaction.";
  } else if (lowercaseText.includes("fail") || lowercaseText.includes("decline") || lowercaseText.includes("error") || lowercaseText.includes("charged twice")) {
    case_type = "payment_failed";
    severity = "high";
    agent_summary = "Customer encountered a transaction failure or billing issue.";
  }

  return { case_type, severity, agent_summary };
}

export async function classifyTicket(ticket: SortTicketRequest): Promise<SortedTicket> {
  const text = `Title: ${ticket.title ?? ""}\nDescription: ${ticket.description}`.trim();
  const apiKey = process.env.GEMINI_API_KEY || process.env.OPENAI_API_KEY;

  if (!apiKey) {
    console.warn("WARNING: GEMINI_API_KEY (or OPENAI_API_KEY) is not set. Falling back to rule-based mock classifier.");
    const mock = getMockClassification(text);
    const department = getDepartment(mock.case_type);
    const human_review_required = mock.severity === "critical" || mock.case_type === "phishing_or_social_engineering";

    return {
      case_type: mock.case_type,
      severity: mock.severity,
      department,
      agent_summary: mock.agent_summary,
      human_review_required,
    };
  }

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Analyze the following customer support ticket and classify it. Make sure to respond with a valid JSON object matching the requested schema.

Ticket details:
${text}

Generate JSON matching the schema below:`,
              },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: {
            type: "OBJECT",
            properties: {
              case_type: {
                type: "STRING",
                enum: [
                  "wrong_transfer",
                  "payment_failed",
                  "refund_request",
                  "phishing_or_social_engineering",
                  "other",
                ],
              },
              severity: {
                type: "STRING",
                enum: ["low", "medium", "high", "critical"],
              },
              agent_summary: {
                type: "STRING",
                description: "A 1-2 sentence neutral summary of the issue.",
              },
            },
            required: ["case_type", "severity", "agent_summary"],
          },
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Gemini API returned status ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const resultText = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!resultText) {
      throw new Error("No output content returned from Gemini API");
    }

    const parsed = JSON.parse(resultText.trim());
    const case_type = parsed.case_type as CaseType;
    const severity = parsed.severity as Severity;
    const agent_summary = parsed.agent_summary as string;

    const department = getDepartment(case_type);
    const human_review_required = severity === "critical" || case_type === "phishing_or_social_engineering";

    return {
      case_type,
      severity,
      department,
      agent_summary,
      human_review_required,
    };
  } catch (error) {
    console.error("Error in classifyTicket via LLM:", error);
    console.warn("Falling back to rule-based mock classifier.");
    
    const mock = getMockClassification(text);
    const department = getDepartment(mock.case_type);
    const human_review_required = mock.severity === "critical" || mock.case_type === "phishing_or_social_engineering";

    return {
      case_type: mock.case_type,
      severity: mock.severity,
      department,
      agent_summary: mock.agent_summary,
      human_review_required,
    };
  }
}
