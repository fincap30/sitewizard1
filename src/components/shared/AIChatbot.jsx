import React, { useState, useRef, useEffect } from 'react';
import { useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, X, Send, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";

export default function AIChatbot({ websiteIntake, context = 'dashboard' }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! I\'m your AI assistant. I can help you with website features, content generation, and guide you through editing. What would you like to know?' }
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const chatMutation = useMutation({
    mutationFn: async (userMessage) => {
      const contextInfo = `
Context: ${context}
Website: ${websiteIntake?.company_name || 'New website'}
Industry: ${websiteIntake?.style_preference || 'General'}
Goals: ${websiteIntake?.business_goals?.join(', ') || 'Not specified'}
Status: ${websiteIntake?.website_status || 'Not started'}

Chat History:
${messages.slice(-4).map(m => `${m.role}: ${m.content}`).join('\n')}

User Question: ${userMessage}

Provide a helpful, concise response. If they ask about features, explain them clearly. If they need help with content, offer suggestions. If they're stuck, guide them step by step.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: contextInfo,
        add_context_from_internet: false
      });

      return response;
    },
    onSuccess: (response) => {
      setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    },
  });

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim() || chatMutation.isPending) return;

    const userMessage = input;
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    chatMutation.mutate(userMessage);
  };

  const quickActions = [
    { label: 'How do I edit my website?', action: 'How do I edit my website content?' },
    { label: 'Generate content ideas', action: 'Can you help me generate content ideas for my website?' },
    { label: 'Explain features', action: 'What features are available in my package?' },
    { label: 'SEO tips', action: 'Give me SEO optimization tips for my website' }
  ];

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 z-50"
      >
        <MessageCircle className="w-6 h-6" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-96 h-[500px] shadow-2xl z-50 flex flex-col border-2 border-blue-500/50">
      <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
        <CardTitle className="text-base flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-blue-400" />
          AI Assistant
        </CardTitle>
        <Button size="icon" variant="ghost" onClick={() => setIsOpen(false)}>
          <X className="w-4 h-4" />
        </Button>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0">
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-lg p-3 ${
                msg.role === 'user' 
                  ? 'bg-blue-600 text-white' 
                  : 'bg-slate-700 text-slate-100'
              }`}>
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}
          {chatMutation.isPending && (
            <div className="flex justify-start">
              <div className="bg-slate-700 rounded-lg p-3">
                <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="p-3 border-t">
          <div className="flex flex-wrap gap-1 mb-2">
            {quickActions.map((qa, idx) => (
              <Badge
                key={idx}
                variant="outline"
                className="cursor-pointer text-xs hover:bg-slate-700"
                onClick={() => {
                  setInput(qa.action);
                }}
              >
                {qa.label}
              </Badge>
            ))}
          </div>
          <form onSubmit={handleSend} className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything..."
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={chatMutation.isPending}>
              <Send className="w-4 h-4" />
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}