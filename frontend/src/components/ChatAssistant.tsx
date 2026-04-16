"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageSquare, X, Send, Sparkles, User, Loader2 } from "lucide-react";

export default function ChatAssistant() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [chatHistory, setChatHistory] = useState<{ role: "user" | "ai"; text: string }[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory, isLoading]);

  const handleSend = async () => {
    if (!message.trim() || isLoading) return;

    const userMsg = message.trim();
    setMessage("");
    setChatHistory((prev) => [...prev, { role: "user", text: userMsg }]);
    setIsLoading(true);

    try {
      const resp = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg }),
      });
      const data = await resp.json();
      setChatHistory((prev) => [...prev, { role: "ai", text: data.response }]);
    } catch (error) {
      setChatHistory((prev) => [...prev, { role: "ai", text: "Neural link interrupted. Please try again." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute bottom-20 right-0 w-80 sm:w-96 glass-panel rounded-2xl overflow-hidden shadow-2xl flex flex-col border border-cyan-500/20"
            style={{ height: "500px" }}
          >
            {/* Header */}
            <div className="p-4 border-b border-slate-800 bg-slate-950/50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-cyan-500/10">
                  <Sparkles size={16} className="text-cyan-400" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest">Cortex Assistant</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1 h-1 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[8px] text-slate-500 font-mono uppercase">Neural Link Active</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/5 rounded-lg text-slate-500 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 p-4 overflow-y-auto space-y-4 bg-slate-950/20 custom-scrollbar">
              {chatHistory.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-40">
                  <Sparkles size={32} className="text-cyan-500/50 mb-3" />
                  <p className="text-xs font-mono text-slate-400 px-8">
                    Ask me about amenities, wait times, or venue navigation.
                  </p>
                </div>
              )}
              {chatHistory.map((item, i) => (
                <div key={i} className={`flex ${item.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] p-3 rounded-xl text-xs leading-relaxed ${
                    item.role === "user" 
                    ? "bg-cyan-600/20 border border-cyan-500/30 text-cyan-50" 
                    : "bg-slate-800/50 border border-slate-700/50 text-slate-200"
                  }`}>
                    {item.text}
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-slate-800/50 border border-slate-700/50 p-3 rounded-xl">
                    <Loader2 size={14} className="text-cyan-400 animate-spin" />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/50">
              <div className="relative">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Inquire stadium services..."
                  className="w-full bg-slate-900/50 border border-slate-700 rounded-xl py-2.5 pl-4 pr-10 text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-cyan-500/50 transition-colors"
                />
                <button 
                  onClick={handleSend}
                  disabled={isLoading}
                  className="absolute right-2 top-1.5 p-1.5 text-cyan-500 hover:text-cyan-400 disabled:opacity-30 transition-colors"
                >
                  <Send size={16} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toggle Button (Glowing Orb) */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`relative w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
          isOpen ? "bg-slate-800" : "bg-cyan-500/10"
        }`}
      >
        {/* Glow Effects */}
        {!isOpen && (
          <>
            <div className="absolute inset-0 rounded-full bg-cyan-400/20 animate-pulse blur-md" />
            <div className="absolute inset-0 rounded-full border border-cyan-400/30 shadow-[0_0_15px_rgba(34,211,238,0.2)]" />
          </>
        )}
        
        {isOpen ? (
          <X className="text-slate-200" size={24} />
        ) : (
          <Sparkles className="text-cyan-400" size={24} />
        )}
      </motion.button>
    </div>
  );
}
