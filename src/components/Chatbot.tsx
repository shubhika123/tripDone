'use client'

import { useState, useRef, useEffect } from 'react';
import { MessageCircle, X, Send, Bot } from 'lucide-react';

export default function Chatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{role: 'user' | 'bot', text: string}[]>([
    { role: 'bot', text: 'Hi there! I am your TripDone assistant. How can I help you plan your trip today?' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = () => {
    if (!inputValue.trim()) return;

    // Add user message
    const newMessages = [...messages, { role: 'user' as const, text: inputValue }];
    setMessages(newMessages);
    setInputValue('');

    // Mock bot response
    setTimeout(() => {
      setMessages(prev => [...prev, { role: 'bot', text: "I can help with that! Let's get you exactly what you need for your journey." }]);
    }, 1000);
  };

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className={`fixed bottom-6 right-6 z-50 p-4 bg-indigo-600 text-white rounded-full shadow-2xl hover:bg-indigo-700 hover:scale-105 transition-all outline-none \${isOpen ? 'scale-0 opacity-0 pointer-events-none' : 'scale-100 opacity-100'}`}
        aria-label="Open support chat"
      >
        <MessageCircle className="w-6 h-6" />
      </button>

      {/* Chat Window */}
      <div 
        className={`fixed bottom-6 right-6 z-50 w-80 sm:w-96 bg-white rounded-2xl shadow-[0_10px_40px_-15px_rgba(0,0,0,0.2)] border border-gray-100 flex flex-col overflow-hidden transition-all duration-300 origin-bottom-right \${isOpen ? 'scale-100 opacity-100' : 'scale-0 opacity-0 pointer-events-none'}`}
        style={{ height: '500px', maxHeight: '80vh' }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4 flex justify-between items-center text-white">
          <div className="flex items-center space-x-2">
            <div className="bg-white/20 p-2 rounded-lg">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-sm">TripDone Assistant</h3>
              <p className="text-xs text-indigo-100">Always online</p>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-white/20 rounded-full transition-colors outline-none"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex \${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div 
                className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm \${
                  msg.role === 'user' 
                  ? 'bg-indigo-600 text-white rounded-br-sm' 
                  : 'bg-white border border-gray-100 text-gray-800 shadow-sm rounded-bl-sm'
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 bg-white border-t border-gray-100">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex items-center space-x-2"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 px-4 py-2.5 bg-gray-100 focus:bg-white border border-transparent focus:border-indigo-300 rounded-xl outline-none text-sm font-medium transition-all"
            />
            <button 
              type="submit"
              disabled={!inputValue.trim()}
              className="p-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors outline-none"
            >
              <Send className="w-4 h-4 ml-1" />
            </button>
          </form>
        </div>
      </div>
    </>
  );
}
