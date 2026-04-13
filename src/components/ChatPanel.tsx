import { useState, useRef, useEffect } from "react";
import { MessageSquare, Send, Bot, User, X, Maximize2, Minimize2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface ChatMessage {
  id: string;
  role: "user" | "bot";
  content: string;
  searchQuery?: string;
}

interface ChatPanelProps {
  onSearchFromChat: (query: string) => void;
}

const INITIAL_MESSAGES: ChatMessage[] = [
  {
    id: "welcome",
    role: "bot",
    content: "👋 Hi! I'm your offline image search assistant. I can help you:\n\n• **Search images** — just describe what you're looking for\n• **Index folders** — tell me which folders to scan\n• **Find duplicates** — I'll detect similar images\n\nTry saying: *\"Show me sunset photos\"*",
  },
];

const ChatPanel = ({ onSearchFromChat }: ChatPanelProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const processMessage = (text: string): ChatMessage => {
    const lower = text.toLowerCase();

    // Search intent
    const searchPatterns = [/show\s*(me\s*)?(.+)/i, /find\s*(me\s*)?(.+)/i, /search\s*(for\s*)?(.+)/i, /look\s*(for\s*)?(.+)/i, /where\s*(?:are|is)\s*(my\s*)?(.+)/i];
    for (const pattern of searchPatterns) {
      const match = lower.match(pattern);
      if (match) {
        const query = match[match.length - 1].replace(/photos?|images?|pics?|pictures?/gi, "").trim();
        if (query) {
          return {
            id: Date.now().toString(),
            role: "bot",
            content: `🔍 Searching for: **"${query}"**`,
            searchQuery: query,
          };
        }
      }
    }

    // Help
    if (lower.includes("how") && lower.includes("search")) {
      return { id: Date.now().toString(), role: "bot", content: "To search images:\n1. Make sure you've indexed a folder first\n2. Type a description in the search bar (up to 20 words)\n3. I'll find matching images using AI similarity\n\nExample: *\"a cat sitting on a red couch\"*" };
    }
    if (lower.includes("how") && lower.includes("folder")) {
      return { id: Date.now().toString(), role: "bot", content: "To index a folder:\n1. Enter the full folder path in the **Local Gallery** panel\n2. Click **Index** — I'll scan all images recursively\n3. Embeddings are stored locally for fast search\n\nExample path: `C:/Users/You/Pictures`" };
    }
    if (lower.includes("no result") || lower.includes("why no")) {
      return { id: Date.now().toString(), role: "bot", content: "No results? Try:\n• Use broader terms (e.g., \"dog\" instead of \"golden retriever puppy\")\n• Make sure the folder is indexed\n• Check if images exist in the indexed folder\n• Try different descriptions" };
    }
    if (lower.includes("duplicate")) {
      return { id: Date.now().toString(), role: "bot", content: "Duplicate detection runs automatically during indexing. Images with >95% similarity are flagged as duplicates. Look for the **Dup** badge on search results." };
    }

    // Greetings
    if (/^(hi|hello|hey|greetings)/i.test(lower)) {
      return { id: Date.now().toString(), role: "bot", content: "Hello! 👋 How can I help you today? Try describing an image to search, or ask me about how to use the app." };
    }

    return { id: Date.now().toString(), role: "bot", content: "I can help you search images! Try:\n• *\"Show me beach photos\"*\n• *\"How to search images?\"*\n• *\"How to select a folder?\"*" };
  };

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg: ChatMessage = { id: `u-${Date.now()}`, role: "user", content: input };
    const botResponse = processMessage(input);
    setMessages((prev) => [...prev, userMsg, botResponse]);
    if (botResponse.searchQuery) {
      onSearchFromChat(botResponse.searchQuery);
    }
    setInput("");
  };

  return (
    <>
      {/* Toggle button */}
      <AnimatePresence>
        {!isOpen && (
          <motion.button
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            exit={{ scale: 0 }}
            onClick={() => setIsOpen(true)}
            className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg glow-primary hover:brightness-110 transition-all"
          >
            <MessageSquare className="h-6 w-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={`fixed z-50 ${isExpanded ? "inset-4" : "bottom-6 right-6 w-96 h-[500px]"} flex flex-col rounded-xl border border-border bg-card shadow-2xl transition-all duration-300`}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-primary animate-pulse-glow" />
                <span className="font-heading font-semibold text-sm text-foreground">AI Assistant</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">offline</span>
              </div>
              <div className="flex gap-1">
                <button onClick={() => setIsExpanded(!isExpanded)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors">
                  {isExpanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                </button>
                <button onClick={() => setIsOpen(false)} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground transition-colors">
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => (
                <div key={msg.id} className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : ""}`}>
                  {msg.role === "bot" && (
                    <div className="shrink-0 h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Bot className="h-3.5 w-3.5 text-primary" />
                    </div>
                  )}
                  <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${msg.role === "user" ? "bg-chat-user text-foreground" : "bg-chat-bot text-secondary-foreground"}`}>
                    {msg.content.split("\n").map((line, i) => (
                      <p key={i} className="mb-1 last:mb-0" dangerouslySetInnerHTML={{
                        __html: line
                          .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
                          .replace(/\*(.+?)\*/g, "<em>$1</em>")
                          .replace(/`(.+?)`/g, '<code class="px-1 py-0.5 rounded bg-muted text-primary text-xs font-mono">$1</code>')
                          .replace(/^• /, "• ")
                      }} />
                    ))}
                  </div>
                  {msg.role === "user" && (
                    <div className="shrink-0 h-7 w-7 rounded-lg bg-accent/20 flex items-center justify-center">
                      <User className="h-3.5 w-3.5 text-accent" />
                    </div>
                  )}
                </div>
              ))}
              <div ref={endRef} />
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Ask me anything..."
                  className="flex-1 bg-muted rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none border border-border focus:border-primary/50 transition-colors"
                />
                <button onClick={handleSend} disabled={!input.trim()} className="p-2 rounded-lg bg-primary text-primary-foreground disabled:opacity-40 hover:brightness-110 transition-all">
                  <Send className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatPanel;
