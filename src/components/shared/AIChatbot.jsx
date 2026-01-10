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
    { role: 'assistant', content: 'Hi! I\'m your AI support assistant. I can help you with:\n• Website building & editing\n• SEO optimization\n• E-commerce features\n• Project status updates\n• Analytics insights\n\nWhat would you like to know?' }
  ]);
  const [input, setInput] = useState('');
  const [showEscalation, setShowEscalation] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const chatMutation = useMutation({
    mutationFn: async (userMessage) => {
      const contextInfo = `You are an AI support assistant for SiteWizard.pro, an AI-powered website builder platform.

Context: ${context}
Website: ${websiteIntake?.company_name || 'New website'}
Industry: ${websiteIntake?.style_preference || 'General'}
Goals: ${websiteIntake?.business_goals?.join(', ') || 'Not specified'}
Status: ${websiteIntake?.website_status || 'Not started'}

Chat History:
${messages.slice(-4).map(m => `${m.role}: ${m.content}`).join('\n')}

User Question: ${userMessage}

You can answer questions about:
- Website building, editing, and customization
- SEO optimization and content strategy
- E-commerce features (products, pricing, recommendations)
- Project status and timelines
- Analytics and performance
- Subscription and billing

If the question is:
- A simple FAQ: Answer directly and helpfully
- Complex/technical/billing issue: Respond with "ESCALATE:" prefix followed by brief explanation
- Outside your scope: Suggest escalation to human support

Provide clear, actionable responses. Be friendly and professional.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: contextInfo,
        add_context_from_internet: false
      });

      return response;
    },
    onSuccess: (response) => {
      if (response.startsWith('ESCALATE:')) {
        setShowEscalation(true);
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: response.replace('ESCALATE:', '').trim() + '\n\nWould you like me to escalate this to our support team?' 
        }]);
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: response }]);
      }
    },
  });

  const escalateMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.SupportEscalation.create({
        client_email: websiteIntake?.client_email,
        website_intake_id: websiteIntake?.id,
        query: messages[messages.length - 2]?.content,
        conversation_context: messages.slice(-6),
        escalation_reason: 'Complex query - AI recommended human support'
      });
    },
    onSuccess: () => {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Your request has been escalated to our support team. They\'ll reach out to you via email within 24 hours. Is there anything else I can help you with?' 
      }]);
      setShowEscalation(false);
      toast.success('Escalated to support team!');
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
    { label: 'Edit website', action: 'How do I edit my website content?' },
    { label: 'SEO tips', action: 'Give me SEO optimization tips' },
    { label: 'E-commerce setup', action: 'How do I set up e-commerce on my site?' },
    { label: 'Project status', action: 'What is my current project status?' },
    { label: 'Analytics help', action: 'Explain my website analytics' }
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
            {showEscalation ? (
              <Button 
                type="button" 
                onClick={() => escalateMutation.mutate()}
                disabled={escalateMutation.isPending}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {escalateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Escalate'}
              </Button>
            ) : (
              <Button type="submit" size="icon" disabled={chatMutation.isPending}>
                <Send className="w-4 h-4" />
              </Button>
            )}
          </form>
        </div>
      </CardContent>
    </Card>
  );
}