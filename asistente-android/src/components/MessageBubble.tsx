import type { ChatMessage } from '@/lib/types';

export function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm leading-relaxed ${
          isUser
            ? 'bg-accent text-slate-900'
            : 'bg-surface text-slate-100 border border-slate-800'
        }`}
      >
        {message.content}
      </div>
    </div>
  );
}
