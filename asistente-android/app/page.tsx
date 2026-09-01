"use client";

import React, { useState, useEffect, useRef } from "react";
import { Send, Mic, MicOff, Trash2, CheckCheck, Sparkles } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const saved = localStorage.getItem("asistente_chat_history");
    if (saved) {
      try {
        setMessages(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    } else {
      setMessages([
        {
          id: "1",
          role: "assistant",
          content: "¡Hola! Soy tu asistente personal. ¿En qué te puedo ayudar hoy?",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem("asistente_chat_history", JSON.stringify(messages));
    }
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    if (typeof window !== "undefined" && ("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.lang = "es-CO";

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput((prev) => (prev ? `${prev} ${transcript}` : transcript));
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => setIsListening(false);
      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, []);

  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert("El dictado por voz no está disponible en este navegador.");
      return;
    }
    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      setIsListening(true);
      recognitionRef.current.start();
    }
  };

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: userTime,
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    const assistantId = (Date.now() + 1).toString();
    const assistantTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    setMessages((prev) => [
      ...prev,
      { id: assistantId, role: "assistant", content: "", timestamp: assistantTime },
    ]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!response.body) throw new Error("Sin respuesta del servidor");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulatedText = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        accumulatedText += decoder.decode(value, { stream: true });

        setMessages((prev) =>
          prev.map((msg) => (msg.id === assistantId ? { ...msg, content: accumulatedText } : msg))
        );
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantId
            ? { ...msg, content: "Hubo un problema de conexión con el asistente. Por favor verifica tu clave de API en Vercel o Netlify." }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    if (confirm("¿Deseas vaciar el historial de mensajes?")) {
      const initial: Message[] = [
        {
          id: "1",
          role: "assistant",
          content: "Historial reiniciado. ¿En qué te puedo colaborar?",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ];
      setMessages(initial);
      localStorage.setItem("asistente_chat_history", JSON.stringify(initial));
    }
  };

  return (
    <div className="flex justify-center h-screen bg-slate-200">
      <main className="flex flex-col w-full max-w-md h-full bg-white shadow-2xl overflow-hidden">
        {/* Cabecera estilo Android Google Messages */}
        <header className="flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 shadow-sm z-10">
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-10 h-10 rounded-full bg-blue-600 text-white font-bold shadow-md">
              <Sparkles className="w-5 h-5 text-yellow-300" />
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white rounded-full"></span>
            </div>
            <div>
              <h1 className="text-base font-semibold text-slate-800 leading-tight">Asistente Personal</h1>
              <p className="text-xs text-emerald-600 font-medium">En línea</p>
            </div>
          </div>
          <button
            onClick={handleClear}
            title="Vaciar chat"
            className="p-2 text-slate-500 hover:text-red-500 hover:bg-slate-100 rounded-full transition-colors"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </header>

        {/* Zona de Mensajes */}
        <section className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#f8fafc]">
          {messages.map((msg) => {
            const isUser = msg.role === "user";
            return (
              <div key={msg.id} className={`flex flex-col ${isUser ? "items-end" : "items-start"}`}>
                <div
                  className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed shadow-sm transition-all ${
                    isUser
                      ? "bg-[#1a73e8] text-white rounded-br-xs font-normal"
                      : "bg-white text-slate-800 border border-slate-200/80 rounded-bl-xs"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">
                    {msg.content || (
                      <span className="inline-flex gap-1 items-center text-slate-400">
                        <span className="animate-bounce">●</span>
                        <span className="animate-bounce delay-100">●</span>
                        <span className="animate-bounce delay-200">●</span>
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-1 mt-1 px-1 text-[11px] text-slate-400">
                  <span>{msg.timestamp}</span>
                  {isUser && <CheckCheck className="w-3.5 h-3.5 text-blue-500" />}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </section>

        {/* Barra de entrada inferior */}
        <footer className="p-3 bg-white border-t border-slate-200">
          <form onSubmit={handleSend} className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleVoiceInput}
              className={`p-2.5 rounded-full transition-all ${
                isListening
                  ? "bg-red-500 text-white animate-pulse shadow-md"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
              title="Dictado por voz"
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isListening ? "Escuchando tu voz..." : "Escribe un mensaje..."}
              className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-800 placeholder-slate-400 text-sm rounded-full outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />

            <button
              type="submit"
              disabled={!input.trim() || isLoading}
              className={`p-2.5 rounded-full transition-colors ${
                input.trim() && !isLoading
                  ? "bg-[#1a73e8] text-white shadow-md hover:bg-blue-700"
                  : "bg-slate-200 text-slate-400 cursor-not-allowed"
              }`}
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        </footer>
      </main>
    </div>
  );
}
