import { useState, useRef, useEffect } from "react";
import { Mic, Send, Sparkles, Lightbulb, BookOpen, Loader2, X, User as UserIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

type Msg = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  { icon: UserIcon, label: "Génère un QCM…", prompt: "Génère un QCM de 5 propositions sur " },
  { icon: Lightbulb, label: "Explique-moi…", prompt: "Explique-moi simplement " },
  { icon: BookOpen, label: "Aide-moi à retenir…", prompt: "Aide-moi à retenir " },
];

export function AISearchBar() {
  const [input, setInput] = useState("");
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Lock background scroll when modal open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [open]);

  const send = async (textOverride?: string) => {
    const text = (textOverride ?? input).trim();
    if (!text || isLoading) return;

    const userMsg: Msg = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setOpen(true);
    setIsLoading(true);

    let assistantSoFar = "";
    const upsertAssistant = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages((prev) => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) =>
            i === prev.length - 1 ? { ...m, content: assistantSoFar } : m
          );
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat-courses`;
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!resp.ok || !resp.body) {
        if (resp.status === 429) {
          toast.error("Trop de requêtes, réessayez dans un instant.");
        } else if (resp.status === 402) {
          toast.error("Crédits IA épuisés. Contactez l'admin.");
        } else {
          const errData = await resp.json().catch(() => ({}));
          toast.error(errData.error || "Erreur de l'IA");
        }
        setIsLoading(false);
        return;
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let nl: number;
        while ((nl = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, nl);
          textBuffer = textBuffer.slice(nl + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") { streamDone = true; break; }
          try {
            const parsed = JSON.parse(json);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) upsertAssistant(content);
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (e: any) {
      console.error("AI chat error:", e);
      toast.error("Erreur lors de la requête IA");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestion = (prompt: string) => {
    setInput(prompt);
    inputRef.current?.focus();
  };

  const reset = () => {
    setMessages([]);
    setInput("");
    setOpen(false);
  };

  return (
    <>
      {/* Search bar */}
      <div className="w-full max-w-2xl mx-auto">
        <div className="rounded-3xl bg-card border border-border shadow-sm hover:shadow-md transition-shadow p-4 md:p-5">
          <div className="flex items-center gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") send(); }}
              placeholder="Posez une question sur vos cours..."
              className="flex-1 bg-transparent border-0 outline-none text-base text-foreground placeholder:text-muted-foreground px-2 py-2"
              disabled={isLoading}
            />
            <Button
              size="icon"
              variant="ghost"
              className="rounded-full h-10 w-10 text-muted-foreground hover:text-foreground"
              onClick={() => toast.info("Saisie vocale bientôt disponible")}
              type="button"
            >
              <Mic className="h-5 w-5" />
            </Button>
            <Button
              size="icon"
              className="rounded-full h-10 w-10 bg-primary hover:bg-primary/90"
              onClick={() => send()}
              disabled={isLoading || !input.trim()}
            >
              {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2 mt-3 pl-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s.label}
                onClick={() => handleSuggestion(s.prompt)}
                className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background hover:bg-accent/40 px-3 py-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                <s.icon className="h-3.5 w-3.5" />
                {s.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Chat modal */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
            onClick={reset}
          >
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.97 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-3xl max-h-[85vh] bg-card rounded-3xl border border-border shadow-2xl flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
                    <Sparkles className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-foreground">Assistant IA</p>
                    <p className="text-xs text-muted-foreground">Propulsé par Claude</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" onClick={reset}>
                  <X className="h-5 w-5" />
                </Button>
              </div>

              <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4">
                {messages.map((m, i) => (
                  <div
                    key={i}
                    className={cn(
                      "flex gap-3",
                      m.role === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    {m.role === "assistant" && (
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                        <Sparkles className="h-4 w-4 text-primary" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "rounded-2xl px-4 py-3 text-sm leading-relaxed max-w-[80%] whitespace-pre-wrap",
                        m.role === "user"
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-foreground"
                      )}
                    >
                      {m.content || (isLoading && i === messages.length - 1 ? "…" : "")}
                    </div>
                  </div>
                ))}
                {isLoading && messages[messages.length - 1]?.role === "user" && (
                  <div className="flex gap-3">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                      <Loader2 className="h-4 w-4 text-primary animate-spin" />
                    </div>
                    <div className="rounded-2xl px-4 py-3 bg-muted text-muted-foreground text-sm">
                      L'IA réfléchit…
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-border p-4">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") send(); }}
                    placeholder="Posez une autre question…"
                    className="flex-1 rounded-full bg-muted border-0 outline-none px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground"
                    disabled={isLoading}
                    autoFocus
                  />
                  <Button
                    size="icon"
                    className="rounded-full h-10 w-10 bg-primary hover:bg-primary/90"
                    onClick={() => send()}
                    disabled={isLoading || !input.trim()}
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
