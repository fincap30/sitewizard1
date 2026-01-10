import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Send, MessageCircle, Clock } from "lucide-react";
import { toast } from "sonner";

export default function SupportChat({ websiteIntakeId, userEmail }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: chatHistory = [] } = useQuery({
    queryKey: ['support-messages', websiteIntakeId],
    queryFn: async () => {
      try {
        const msgs = await base44.entities.SupportEscalation.filter({
          website_intake_id: websiteIntakeId
        });
        return msgs.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
      } catch {
        return [];
      }
    },
    enabled: !!websiteIntakeId,
    refetchInterval: 5000
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (messageText) => {
      try {
        const newMsg = await base44.entities.SupportEscalation.create({
          client_email: userEmail,
          website_intake_id: websiteIntakeId,
          query: messageText,
          conversation_context: [
            ...chatHistory.map(m => ({
              role: m.created_by === userEmail ? 'user' : 'support',
              content: m.query
            })),
            { role: 'user', content: messageText }
          ],
          status: 'pending'
        });
        return newMsg;
      } catch (error) {
        throw new Error('Failed to send message');
      }
    },
    onSuccess: () => {
      setNewMessage('');
      queryClient.invalidateQueries({ queryKey: ['support-messages'] });
      toast.success('Message sent to support team');
    },
    onError: () => {
      toast.error('Failed to send message');
    }
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    setIsSending(true);
    sendMessageMutation.mutate(newMessage);
    setIsSending(false);
  };

  return (
    <Card className="border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5 text-blue-400" />
          Support Chat
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col h-[500px]">
        <div className="flex-1 overflow-y-auto mb-4 space-y-3 pb-4">
          {chatHistory.length === 0 ? (
            <div className="text-center text-slate-400 py-8">
              <MessageCircle className="w-12 h-12 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No messages yet. Start a conversation with our support team!</p>
            </div>
          ) : (
            chatHistory.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-2 ${
                  msg.created_by === userEmail ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`max-w-xs px-4 py-2 rounded-lg ${
                    msg.created_by === userEmail
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-700 text-slate-200'
                  }`}
                >
                  <p className="text-sm">{msg.query}</p>
                  <p className="text-xs mt-1 opacity-70 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(msg.created_date).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            disabled={isSending || sendMessageMutation.isPending}
            className="bg-slate-700 border-slate-600"
          />
          <Button
            type="submit"
            disabled={!newMessage.trim() || isSending || sendMessageMutation.isPending}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}