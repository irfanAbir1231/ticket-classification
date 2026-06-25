import {
  TicketCategory,
  TicketPriority,
  type SortTicketRequest,
  type SortedTicket,
} from "@/types";

const CATEGORY_RULES: Array<{
  category: TicketCategory;
  routedTo: string;
  keywords: RegExp[];
}> = [
  {
    category: TicketCategory.Billing,
    routedTo: "billing-support",
    keywords: [/bill/i, /invoice/i, /payment/i, /refund/i, /charge/i],
  },
  {
    category: TicketCategory.Technical,
    routedTo: "technical-support",
    keywords: [/bug/i, /error/i, /crash/i, /broken/i, /cannot log/i],
  },
  {
    category: TicketCategory.Account,
    routedTo: "account-support",
    keywords: [/account/i, /password/i, /login/i, /profile/i, /access/i],
  },
];

const PRIORITY_RULES: Array<{
  priority: TicketPriority;
  keywords: RegExp[];
}> = [
  {
    priority: TicketPriority.Urgent,
    keywords: [/urgent/i, /critical/i, /down/i, /outage/i, /immediately/i],
  },
  {
    priority: TicketPriority.High,
    keywords: [/blocked/i, /cannot/i, /failed/i, /asap/i],
  },
  {
    priority: TicketPriority.Medium,
    keywords: [/issue/i, /problem/i, /help/i],
  },
];

function countMatches(text: string, keywords: RegExp[]) {
  return keywords.filter((keyword) => keyword.test(text)).length;
}

export function classifyTicket(ticket: SortTicketRequest): SortedTicket {
  const text = `${ticket.title ?? ""} ${ticket.description}`.trim();

  const categoryMatch = CATEGORY_RULES.map((rule) => ({
    ...rule,
    score: countMatches(text, rule.keywords),
  })).sort((a, b) => b.score - a.score)[0];

  const priorityMatch = PRIORITY_RULES.map((rule) => ({
    ...rule,
    score: countMatches(text, rule.keywords),
  })).sort((a, b) => b.score - a.score)[0];

  const hasCategoryMatch = categoryMatch.score > 0;
  const hasPriorityMatch = priorityMatch.score > 0;
  const category = hasCategoryMatch
    ? categoryMatch.category
    : TicketCategory.General;
  const priority = hasPriorityMatch
    ? priorityMatch.priority
    : TicketPriority.Low;

  return {
    category,
    priority,
    confidence: hasCategoryMatch ? Math.min(0.95, 0.55 + categoryMatch.score * 0.15) : 0.35,
    reasons: [
      hasCategoryMatch
        ? `Matched ${categoryMatch.score} ${category} keyword(s).`
        : "No category-specific keywords matched.",
      hasPriorityMatch
        ? `Matched ${priorityMatch.score} ${priority} priority keyword(s).`
        : "No urgent priority keywords matched.",
    ],
    routedTo: hasCategoryMatch ? categoryMatch.routedTo : "general-support",
  };
}
