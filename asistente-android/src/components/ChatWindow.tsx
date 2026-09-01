'use client';

import { useState, type FormEvent } from 'react';
import { useChat } from '@/lib/useChat';
import { MessageBubble } from './MessageBubble';

export function ChatWindow() {
  const { messages, sendMessage, isSending, error } = useChat();
  const [draft, setDraft] = useState('');

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    const value = draft;
    setDraft('');
    void sendMessage(value);
  };

  return (
    <div className="flex h-dvh flex-col bg-background">
      <header className="border-b border-slate-800 px-4 py-3">
        <h1 className="text-base font-semibold">Asistente Personal</h1>
        <p className="text-xs text-slate-400">Tareas, correo, agenda e indicadores en un solo lugar</p>
      </header>

      <main className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <p className="mt-8 text-center text-sm text-slate-500">
            Escríbele al asistente para empezar.
          </p>
        ) : (
          messages.map((message) => <MessageBubble key={message.id} message={message} />)
        )}
        {error ? <p className="text-center text-sm text-red-400">{error}</p> : null}
      </main>

      <form onSubmit={handleSubmit} className="border-t border-slate-800 p-3">
        <div className="flex items-center gap-2">
          <input
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Escribe un mensaje..."
            className="flex-1 rounded-full border border-slate-700 bg-surface px-4 py-2 text-sm text-slate-100 outline-none focus:border-accent"
            disabled={isSending}
          />
          <button
            type="submit"
            disabled={isSending || !draft.trim()}
            className="rounded-full bg-accent px-4 py-2 text-sm font-medium text-slate-900 disabled:opacity-50"
          >
            {isSending ? '...' : 'Enviar'}
          </button>
        </div>
      </form>
    </div>
  );
}
