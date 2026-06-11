/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { apiFetch } from '../lib/apiFetch';
import { useState, useEffect, useRef } from 'react';
import { Send, Bot, X, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';

interface AIAnalystModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPrompt?: string;
}

interface Message {
  sender: 'user' | 'bot';
  text: string;
  timestamp: string;
}

export default function AIAnalystModal({ isOpen, onClose, initialPrompt }: AIAnalystModalProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'bot',
      text: `### Welcome to the WC26 Fan Intelligence Lounge! 🎙️

I am your tactical AI analyst. Ask me any advanced football intelligence or statistics questions about the upcoming FIFA World Cup 2026:

*   *"How does Spain's squad compare to Argentina's central defensive block?"*
*   *"Who are the main candidates in terms of tournament win probability? Analyze their tactical structures."*
*   *"Identify the highest-rated standard dark horses in Group D."*
*   *"Draft a potential tactical lineup for Thomas Tuchel's England."*`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Trigger initial prompt if set
  useEffect(() => {
    if (initialPrompt && isOpen) {
      handleSendMessage(initialPrompt);
    }
  }, [initialPrompt, isOpen]);

  // Keep scroll aligned to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    const rawText = textToSend || inputText;
    if (!rawText.trim()) return;

    if (!textToSend) setInputText('');

    const newMsg: Message = {
      sender: 'user',
      text: rawText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, newMsg]);
    setIsLoading(true);

    try {
      const result = await apiFetch('/api/gemini/analyst', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ prompt: rawText })
});
      
      let botResponse = '';
      if (result.status === 'ok' || result.status === 'fallback') {
        botResponse = result.text;
      } else {
        botResponse = `⚠️ *System Note*: Service error - ${result.error || 'Server rejected request'}`;
      }

      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: botResponse,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          sender: 'bot',
          text: `⚠️ **Connection Offline**: Unable to query tactical analysts. Ensure Server processes are online.`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };
   const renderInline = (text: string) => {
  const parts = text.split(/\*\*(.*?)\*\*/g);
  return parts.map((part, i) =>
    i % 2 === 1
      ? <strong key={i} className="text-accent font-bold">{part}</strong>
      : part
  );
};

  const clearChat = () => {
    setMessages([
      {
        sender: 'bot',
        text: `### System Reloaded 🎙️\n\nResetting database tactical context. Ask me anything about World Cup 2026!`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs">
      <div className="w-full max-w-lg bg-[#0A1628] border-l border-[#6B7A99]/25 flex flex-col h-full shadow-2xl relative">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#6B7A99]/15 bg-[#111C2E]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-accent/20 rounded">
              <Bot className="h-5 w-5 text-accent animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold tracking-wider text-[#E8EDF5] uppercase">
                AI Fan Intelligence Analyst
              </h3>
              <p className="text-[10px] text-accent font-medium tracking-widest uppercase">
                Powered by AI models
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={clearChat}
              title="Clear conversation"
              className="p-1 text-[#6B7A99] hover:text-[#E8EDF5] rounded transition-all active:scale-95"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-[#111C2E] text-[#6B7A99] hover:text-[#E8EDF5] rounded"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Message Panel */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#07101E]">
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-2.5 max-w-[85%] ${
                m.sender === 'user' ? 'ml-auto' : 'mr-auto'
              }`}
            >
              {m.sender === 'bot' && (
                <div className="p-1.5 shrink-0 bg-[#111C2E] border border-accent/20 rounded mt-1">
                  <Sparkles className="h-3.5 w-3.5 text-accent" />
                </div>
              )}
              <div
                className={`p-3 rounded-lg text-sm text-[#E8EDF5] leading-relaxed relative ${
                  m.sender === 'user'
                    ? 'bg-[#1F304A] border border-[#6B7A99]/10 rounded-tr-none'
                    : 'bg-[#111C2E] border border-[#6B7A99]/15 rounded-tl-none glow-gold'
                }`}
              >
                {/* Parse Markdown representation with basic splits to keep formatting gorgeous */}
                <div className="space-y-2 whitespace-pre-wrap">
                 
                  {m.text.split('\n').map((line, lIdx) => {
  if (line.startsWith('###')) {
    return <h4 key={lIdx} className="text-accent text-sm font-bold mt-2 tracking-wide font-sans">{line.replace('###', '').trim()}</h4>;
  }
  if (line.startsWith('* ')) {
    return <li key={lIdx} className="ml-2 text-xs list-disc text-[#E8EDF5]/95">{renderInline(line.replace('* ', '').trim())}</li>;
  }
  if (line.trim().startsWith('- ')) {
    return <li key={lIdx} className="ml-2 text-xs list-dash text-[#E8EDF5]/90">{renderInline(line.replace('- ', '').trim())}</li>;
  }
  return <p key={lIdx} className="text-xs font-sans text-[#E8EDF5]/90">{renderInline(line)}</p>;
})}
                </div>
                <span className="block mt-1 text-[9px] text-[#6B7A99] text-right font-mono select-none">
                  {m.timestamp}
                </span>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 max-w-[85%] mr-auto">
              <div className="p-1.5 shrink-0 bg-[#111C2E] border border-accent/20 rounded animate-spin">
                <RefreshCw className="h-3.5 w-3.5 text-accent" />
              </div>
              <div className="p-3 bg-[#111C2E] text-xs text-[#E8EDF5] border border-[#6B7A99]/15 rounded-lg rounded-tl-none animate-pulse">
                Analytically evaluating tactical vectors...
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="p-4 border-t border-[#6B7A99]/20 bg-[#111C2E]">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              required
              placeholder="Ask about team setups, H2H, or win expectations..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              disabled={isLoading}
              className="flex-1 bg-[#07101E] border border-[#6B7A99]/25 rounded-md px-3.5 py-2.5 text-xs text-[#E8EDF5] placeholder-[#6B7A99] focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="p-2.5 rounded bg-accent text-primary font-bold hover:bg-amber-300 disabled:opacity-50 hover:scale-105 active:scale-95 transition-all shadow-md glow-gold"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
          <div className="flex items-center gap-1.5 mt-2 justify-center">
            <AlertCircle className="h-3 w-3 text-[#6B7A99]" />
            <span className="text-[9px] text-[#6B7A99] uppercase tracking-wider font-mono">
              AI recommendations are analytical models, not definitive sports bets.
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
