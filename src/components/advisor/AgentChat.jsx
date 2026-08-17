import React, { useEffect, useRef, useState } from "react";
import { base44 } from "@/api/base44Client";
import MessageBubble from "./MessageBubble";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2 } from "lucide-react";

export default function AgentChat({ agent }) {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    let active = true;
    setMessages([]);
    setConversation(null);
    (async () => {
      const c = await base44.agents.createConversation({
        agent_name: agent.name,
        metadata: { name: agent.label, description: agent.tagline },
      });
      if (active) setConversation(c);
    })();
    return () => { active = false; };
  }, [agent.name, agent.label, agent.tagline]);

  useEffect(() => {
    if (!conversation?.id) return;
    const unsubscribe = base44.agents.subscribeToConversation(conversation.id, (data) => {
      setMessages(data.messages || []);
    });
    return () => unsubscribe();
  }, [conversation?.id]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (text) => {
    const body = (text ?? input).trim();
    if (!body || !conversation || sending) return;
    setInput("");
    setSending(true);
    await base44.agents.addMessage(conversation, { role: "user", content: body });
    setSending(false);
  };

  return (
    <div className="schematic-panel flex flex-col h-[calc(100vh-13rem)]">
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="space-y-3">
            <div className="tech-label">Suggested queries</div>
            {agent.prompts.map((p) => (
              <button
                key={p}
                onClick={() => send(p)}
                disabled={!conversation}
                className="block w-full text-left px-3 py-2 border border-border font-mono text-xs text-muted-foreground hover:border-primary hover:text-foreground transition-colors disabled:opacity-50"
              >
                ▸ {p}
              </button>
            ))}
          </div>
        )}
        {messages.map((m, i) => <MessageBubble key={i} message={m} />)}
        <div ref={endRef} />
      </div>

      <div className="border-t border-border p-3 flex gap-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
          placeholder={conversation ? `Query ${agent.label}…` : "Opening channel…"}
          disabled={!conversation}
          rows={2}
          className="rounded-none font-mono text-xs resize-none"
        />
        <Button onClick={() => send()} disabled={!conversation || !input.trim() || sending} className="rounded-none h-auto px-4">
          {sending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
        </Button>
      </div>
    </div>
  );
}