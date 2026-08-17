import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import { ChevronRight, Loader2, CheckCircle2, XCircle } from "lucide-react";

function parse(v) {
  if (typeof v !== "string") return v;
  try { return JSON.parse(v); } catch { return v; }
}

function ToolCall({ toolCall }) {
  const [open, setOpen] = useState(false);
  const results = parse(toolCall.results);
  const running = ["pending", "running", "in_progress"].includes(toolCall.status);
  const failed =
    ["failed", "error"].includes(toolCall.status) ||
    (typeof toolCall.results === "string" && /error|failed/i.test(toolCall.results)) ||
    results?.success === false;
  const dp = toolCall.display_projection || {};
  const hidden = dp.hide_details && dp.details_redacted;
  const label = running ? (dp.active_label || "Querying") : failed ? (dp.error_label || "Query failed") : (dp.label || toolCall.name);

  return (
    <div className="mt-2 font-mono text-[10px]">
      <button
        onClick={() => !hidden && setOpen(!open)}
        className="flex items-center gap-1.5 uppercase tracking-[0.15em] text-muted-foreground hover:text-foreground"
      >
        {running ? <Loader2 size={11} className="animate-spin text-[#38bdf8]" />
          : failed ? <XCircle size={11} className="text-[#ff2d55]" />
          : <CheckCircle2 size={11} className="text-[#22c55e]" />}
        <span>{label}</span>
        {!hidden && <ChevronRight size={10} className={open ? "rotate-90" : ""} />}
      </button>
      {open && !hidden && (
        <div className="mt-1.5 border-l-2 border-border pl-2 space-y-1.5 text-muted-foreground">
          <pre className="whitespace-pre-wrap break-all max-h-32 overflow-y-auto">
            {JSON.stringify(parse(toolCall.arguments_string), null, 2)}
          </pre>
          <pre className="whitespace-pre-wrap break-all max-h-40 overflow-y-auto">
            {typeof results === "string" ? results : JSON.stringify(results, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

export default function MessageBubble({ message }) {
  const isUser = message.role === "user";
  return (
    <div className={isUser ? "flex justify-end" : "flex justify-start"}>
      <div
        className={`max-w-[85%] px-3 py-2 border ${
          isUser ? "bg-primary/15 border-primary/40" : "schematic-panel bg-card"
        }`}
      >
        {message.content && (isUser ? (
          <p className="font-mono text-xs whitespace-pre-wrap">{message.content}</p>
        ) : (
          <ReactMarkdown className="text-sm prose prose-sm prose-invert max-w-none prose-headings:font-display prose-headings:uppercase prose-headings:tracking-wide prose-headings:text-primary prose-strong:text-foreground">
            {message.content}
          </ReactMarkdown>
        ))}
        {message.tool_calls?.map((t, i) => <ToolCall key={i} toolCall={t} />)}
      </div>
    </div>
  );
}