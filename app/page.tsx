'use client';

import { useState, useEffect } from "react";
import type { SortTicketResponse } from "@/types";

// Pre-defined templates for testing
const TEMPLATES = [
  {
    label: "Wrong Transfer",
    icon: "💸",
    message: "Hello, I made a transfer of $250 earlier today to what I now realize was the wrong account number. The recipient account was supposed to be 123456789 but I entered 123456788. Can you please reverse this transfer immediately?",
  },
  {
    label: "Payment Failed",
    icon: "💳",
    message: "I tried to purchase a subscription on your site, but it failed and said 'Transaction Declined'. However, I checked my bank account and I was still charged $49. Please refund me or activate my subscription.",
  },
  {
    label: "Phishing Scam",
    icon: "⚠️",
    message: "I received a text message from what looked like your service saying my account was locked. It gave me a link to click and asked me to enter my password and OTP code to unlock it. I'm worried it's a scam.",
  },
  {
    label: "Refund Request",
    icon: "🔄",
    message: "I ordered a replacement part last week, but I would like to cancel the order and request a refund because it has not shipped yet and I found the part locally.",
  },
  {
    label: "General Support",
    icon: "💬",
    message: "Hi, I just wanted to ask how I can update my primary email address on my profile. I couldn't find the option in the mobile app settings.",
  },
];

// Generate a random Ticket ID
const generateTicketId = () => `TICKET-${Math.floor(100000 + Math.random() * 900000)}`;

export default function Home() {
  const [ticketId, setTicketId] = useState("");
  const [channel, setChannel] = useState("web");
  const [locale, setLocale] = useState("en");
  const [message, setMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<SortTicketResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Initialize Ticket ID on client side only to prevent hydration mismatch
  useEffect(() => {
    const timer = setTimeout(() => {
      setTicketId(generateTicketId());
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const handleApplyTemplate = (templateMsg: string) => {
    setMessage(templateMsg);
  };

  const handleRandomizeId = () => {
    setTicketId(generateTicketId());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || !ticketId.trim()) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch("/api/sort-ticket", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ticket_id: ticketId,
          channel: channel || undefined,
          locale: locale || undefined,
          message: message,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.errors?.[0]?.message || "Something went wrong");
      }

      setResult(data);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // UI color helper based on case_type
  const getCaseTypeStyles = (caseType: string) => {
    switch (caseType) {
      case "wrong_transfer":
        return { bg: "bg-blue-500/10", text: "text-blue-400", border: "border-blue-500/30" };
      case "payment_failed":
        return { bg: "bg-amber-500/10", text: "text-amber-400", border: "border-amber-500/30" };
      case "refund_request":
        return { bg: "bg-emerald-500/10", text: "text-emerald-400", border: "border-emerald-500/30" };
      case "phishing_or_social_engineering":
        return { bg: "bg-rose-500/10", text: "text-rose-400", border: "border-rose-500/30" };
      default:
        return { bg: "bg-slate-500/10", text: "text-slate-400", border: "border-slate-500/30" };
    }
  };

  return (
    <div className="min-h-screen bg-slate-955 text-slate-100 flex flex-col items-center justify-start p-4 sm:p-8 relative overflow-hidden font-sans">
      {/* Background Glow effects */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Header */}
      <header className="w-full max-w-6xl mb-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800/80 pb-6 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-indigo-300">
              Antigravity Support Classifier
            </h1>
            <p className="text-xs text-slate-400">Powered by Groq LLM Engine</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-semibold text-slate-400">Engine Online</span>
        </div>
      </header>

      {/* Main Grid */}
      <main className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 z-10">
        {/* Left Column: Form & Templates */}
        <section className="lg:col-span-7 flex flex-col gap-6">
          {/* Templates widget */}
          <div className="bg-slate-900/50 backdrop-blur-md rounded-2xl border border-slate-800/80 p-6">
            <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
              Test Templates
            </h2>
            <div className="flex flex-wrap gap-2">
              {TEMPLATES.map((tmpl, idx) => (
                <button
                  key={idx}
                  onClick={() => handleApplyTemplate(tmpl.message)}
                  className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-medium bg-slate-900 hover:bg-slate-800 border border-slate-850 hover:border-slate-700 transition-all duration-200 active:scale-95 text-slate-200"
                >
                  <span>{tmpl.icon}</span>
                  <span>{tmpl.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Form */}
          <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 p-6 shadow-xl">
            <h2 className="text-lg font-bold text-white mb-6">Classify Support Ticket</h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              {/* Form Row 1 */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="sm:col-span-2">
                  <label htmlFor="ticket-id" className="block text-xs font-semibold text-slate-400 mb-2">
                    Ticket ID
                  </label>
                  <div className="flex gap-2">
                    <input
                      id="ticket-id"
                      type="text"
                      value={ticketId}
                      onChange={(e) => setTicketId(e.target.value)}
                      required
                      placeholder="e.g. TICKET-12345"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={handleRandomizeId}
                      title="Randomize Ticket ID"
                      className="px-3 bg-slate-950 border border-slate-800 hover:border-slate-700 hover:bg-slate-900 rounded-xl transition-colors text-slate-300"
                    >
                      🎲
                    </button>
                  </div>
                </div>
                <div>
                  <label htmlFor="channel" className="block text-xs font-semibold text-slate-400 mb-2">
                    Channel
                  </label>
                  <select
                    id="channel"
                    value={channel}
                    onChange={(e) => setChannel(e.target.value)}
                    className="w-full bg-slate-955 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                  >
                    <option value="web">Web</option>
                    <option value="mobile_app">Mobile App</option>
                    <option value="email">Email</option>
                    <option value="chat">Chat</option>
                  </select>
                </div>
              </div>

              {/* Form Row 2 */}
              <div>
                <label htmlFor="locale" className="block text-xs font-semibold text-slate-400 mb-2">
                  Language Locale (optional)
                </label>
                <select
                  id="locale"
                  value={locale}
                  onChange={(e) => setLocale(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors"
                >
                  <option value="en">English (en)</option>
                  <option value="es">Spanish (es)</option>
                  <option value="fr">French (fr)</option>
                  <option value="de">German (de)</option>
                  <option value="zh">Chinese (zh)</option>
                </select>
              </div>

              {/* Form Row 3 */}
              <div>
                <label htmlFor="message" className="block text-xs font-semibold text-slate-400 mb-2">
                  Customer Message
                </label>
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  rows={5}
                  placeholder="Paste the customer support inquiry or message here..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-sm text-slate-100 focus:outline-none focus:border-indigo-500 transition-colors resize-none placeholder-slate-500"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading || !message.trim()}
                className={`w-full py-3 px-4 rounded-xl font-semibold text-sm transition-all duration-200 flex items-center justify-center gap-2 ${
                  isLoading || !message.trim()
                    ? "bg-slate-850 text-slate-500 cursor-not-allowed border border-slate-800"
                    : "bg-indigo-600 hover:bg-indigo-500 active:scale-[0.99] text-white shadow-lg shadow-indigo-500/25"
                }`}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    <span>Classifying Ticket...</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                    <span>Analyze and Classify</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </section>

        {/* Right Column: Output / State */}
        <section className="lg:col-span-5 flex flex-col">
          {error && (
            <div className="bg-rose-950/40 border border-rose-800 text-rose-300 rounded-2xl p-4 mb-4 flex items-start gap-3">
              <span className="text-xl">⚠️</span>
              <div>
                <p className="font-bold text-sm">Classification Error</p>
                <p className="text-xs text-rose-400 mt-1">{error}</p>
              </div>
            </div>
          )}

          <div className="bg-slate-900/80 backdrop-blur-md rounded-2xl border border-slate-800 p-6 flex flex-col flex-1 shadow-xl min-h-[400px]">
            <h2 className="text-lg font-bold text-white mb-6 flex items-center justify-between">
              <span>Classification Report</span>
              {result && (
                <span className="text-[10px] font-mono bg-slate-800 text-slate-400 px-2.5 py-0.5 rounded-md border border-slate-750">
                  {result.ticket_id}
                </span>
              )}
            </h2>

            {!result && !isLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-60">
                <div className="w-16 h-16 rounded-full bg-slate-950 flex items-center justify-center mb-4 text-2xl border border-slate-800/80">
                  🤖
                </div>
                <p className="font-semibold text-slate-300 text-sm">No ticket analyzed yet</p>
                <p className="text-xs text-slate-400 max-w-xs mt-1">
                  Fill in the support request on the left or select a template to run the classification engine.
                </p>
              </div>
            ) : isLoading ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <div className="relative w-20 h-20 mb-6">
                  <div className="absolute inset-0 rounded-full border-4 border-indigo-500/10" />
                  <div className="absolute inset-0 rounded-full border-4 border-t-indigo-500 animate-spin" />
                  <div className="absolute inset-4 rounded-full bg-slate-950/50 flex items-center justify-center text-xl">
                    🧠
                  </div>
                </div>
                <p className="font-semibold text-slate-200 text-sm">Analyzing intent & severity</p>
                <p className="text-xs text-slate-400 max-w-xs mt-1 animate-pulse">
                  Routing ticket request...
                </p>
              </div>
            ) : result ? (
              <div className="flex-1 flex flex-col gap-6">
                {/* Visual Badges row */}
                <div className="grid grid-cols-2 gap-4">
                  <div className={`p-4 rounded-xl border flex flex-col gap-1.5 ${getCaseTypeStyles(result.case_type).bg} ${getCaseTypeStyles(result.case_type).border}`}>
                    <span className="text-xs font-semibold text-slate-400">Case Type</span>
                    <span className={`text-sm font-bold capitalize ${getCaseTypeStyles(result.case_type).text}`}>
                      {result.case_type.replaceAll("_", " ")}
                    </span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-955 border border-slate-800 flex flex-col gap-1.5">
                    <span className="text-xs font-semibold text-slate-400">Severity</span>
                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${result.severity === 'critical' ? 'bg-rose-500' : result.severity === 'high' ? 'bg-orange-500' : result.severity === 'medium' ? 'bg-amber-500' : 'bg-blue-500'}`} />
                      <span className="text-sm font-bold uppercase text-slate-100">
                        {result.severity}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Routed Department Card */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-indigo-950/50 text-indigo-400 flex items-center justify-center text-lg border border-indigo-900/30">
                      🏢
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-400">Routed Department</p>
                      <p className="text-sm font-bold capitalize text-slate-100">
                        {result.department.replaceAll("_", " ")}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Agent Summary Card */}
                <div className="flex-1 flex flex-col gap-2">
                  <span className="text-xs font-semibold text-slate-400">AI Summary</span>
                  <div className="p-4 bg-slate-955 border border-slate-800 rounded-xl flex-1 text-sm text-slate-200 leading-relaxed font-medium">
                    {result.agent_summary}
                  </div>
                </div>

                {/* Confidence & Review Banner */}
                <div className="flex flex-col gap-4 mt-auto pt-4 border-t border-slate-800">
                  {/* Confidence bar */}
                  <div>
                    <div className="flex justify-between text-xs mb-1.5">
                      <span className="font-semibold text-slate-400">Classifier Confidence</span>
                      <span className="font-bold text-slate-200">
                        {Math.round(result.confidence * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                      <div
                        className="bg-gradient-to-r from-indigo-500 to-purple-600 h-full rounded-full transition-all duration-500"
                        style={{ width: `${result.confidence * 100}%` }}
                      />
                    </div>
                  </div>

                  {/* Human review alert */}
                  {result.human_review_required ? (
                    <div className="bg-rose-955/20 border border-rose-900/30 rounded-xl p-3.5 flex items-center gap-3 text-rose-300">
                      <span className="text-lg">🚨</span>
                      <div className="text-left">
                        <p className="text-xs font-bold">Human Review Required</p>
                        <p className="text-[10px] text-rose-400 mt-0.5">High severity or phishing flag detected. Review manually.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-emerald-950/20 border border-emerald-900/30 rounded-xl p-3.5 flex items-center gap-3 text-emerald-300">
                      <span className="text-lg">✅</span>
                      <div className="text-left">
                        <p className="text-xs font-bold">Auto-Routed Successfully</p>
                        <p className="text-[10px] text-emerald-400 mt-0.5">No manual intervention required for this ticket.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </section>
      </main>

      <footer className="w-full max-w-6xl mt-12 text-center text-xs text-slate-500 border-t border-slate-800/80 pt-6">
        <p>Antigravity AI Ticket Classification Sandbox. Built with Next.js App Router and Tailwind CSS.</p>
      </footer>
    </div>
  );
}
