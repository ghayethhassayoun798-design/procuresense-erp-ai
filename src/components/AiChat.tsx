"use client";
import { useState } from "react";

type Message = { role: "user" | "assistant"; text: string; mode?: string };

const suggestions = ["Quels produits sont sous le minimum ?", "Résume les ventes", "Quels produits se vendent le mieux ?"];

export default function AiChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [question, setQuestion] = useState("");
  const [busy, setBusy] = useState(false);

  async function send(value = question) {
    const message = value.trim();
    if (!message || busy) return;
    setQuestion("");
    setMessages(current => [...current, { role: "user", text: message }]);
    setBusy(true);
    try {
      const response = await fetch("/api/ai/chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ message }) });
      const result = await response.json();
      setMessages(current => [...current, { role: "assistant", text: response.ok ? result.answer : result.error || "Réponse indisponible.", mode: result.mode }]);
    } catch {
      setMessages(current => [...current, { role: "assistant", text: "Connexion au serveur impossible." }]);
    } finally {
      setBusy(false);
    }
  }

  return <section className="panel ai-chat">
    <div className="ai-chat-heading"><div><h2>Assistant ProcureSense</h2><p>Pose une question sur les stocks et les indicateurs ERP. L’assistant consulte uniquement des données en lecture. Si un modèle externe est configuré, la question et des indicateurs sans données clients lui sont transmis.</p></div><span>✦ IA</span></div>
    {!messages.length && <div className="ai-suggestions">{suggestions.map(item => <button key={item} onClick={() => void send(item)}>{item}</button>)}</div>}
    <div className="ai-chat-messages" aria-live="polite">
      {messages.map((item, index) => <div className={`ai-chat-message ${item.role}`} key={`${item.role}-${index}`}><small>{item.role === "user" ? "Vous" : item.mode === "AI_API" ? "Assistant IA" : "Assistant · mode local"}</small><p>{item.text}</p></div>)}
      {busy && <div className="ai-chat-message assistant"><small>Assistant</small><p>Analyse des données…</p></div>}
    </div>
    <form className="ai-chat-form" onSubmit={event => { event.preventDefault(); void send(); }}>
      <input value={question} onChange={event => setQuestion(event.target.value)} maxLength={1000} placeholder="Écris ta question…" aria-label="Question à l’assistant" />
      <button className="primary" disabled={busy || !question.trim()}>{busy ? "Patiente…" : "Envoyer"}</button>
    </form>
  </section>;
}
