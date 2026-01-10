import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, Send } from "lucide-react";
import { toast } from "sonner";

export default function CommunicationCenter({ websiteIntakeId, userEmail }) {
  const [message, setMessage] = useState('');
  const queryClient = useQueryClient();

  const { data: escalations = [] } = useQuery({
    queryKey: ['escalations', websiteIntakeId],
    queryFn: () => base44.entities.SupportEscalation.filter({ website_intake_id: websiteIntakeId }),
    enabled: !!websiteIntakeId,
  });

  const analyzeSentimentMutation = useMutation({
    mutationFn: async (conversationText) => {
      const prompt = `Analyze conversation sentiment and generate summary.

Conversation:
${conversationText}

Provide:
1. Overall sentiment (positive/neutral/negative)
2. Key points discussed
3. Action items needed
4. Urgency level (low/medium/high)

Return as JSON.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            sentiment: { type: "string" },
            key_points: { type: "array", items: { type: "string" } },
            action_items: { type: "array", items: { type: "string" } },
            urgency: { type: "string" }
          }
        }
      });

      return response;
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.SupportEscalation.create({
        website_intake_id: websiteIntakeId,
        client_email: userEmail,
        query: message,
        conversation_context: [{ role: 'user', content: message }],
        escalation_reason: 'Direct message from collaboration hub'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escalations'] });
      setMessage('');
      toast.success('Message sent to support team!');
    },
  });

  return (
    <div className="space-y-3">
      <div className="space-y-2">
        <Textarea
          placeholder="Type your message..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
        />
        <Button
          onClick={() => sendMessageMutation.mutate()}
          disabled={sendMessageMutation.isPending || !message}
          className="w-full"
        >
          {sendMessageMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
          Send to Support
        </Button>
      </div>

      <div>
        <h4 className="font-semibold text-white mb-2">Recent Conversations</h4>
        {escalations.slice(0, 5).map((esc) => (
          <Card key={esc.id} className="bg-slate-700/30 mb-2">
            <CardContent className="pt-3">
              <div className="flex justify-between items-start mb-2">
                <Badge className={
                  esc.status === 'resolved' ? 'bg-green-600' :
                  esc.status === 'assigned' ? 'bg-blue-600' :
                  'bg-yellow-600'
                }>
                  {esc.status}
                </Badge>
                <p className="text-xs text-slate-400">{new Date(esc.created_date).toLocaleDateString()}</p>
              </div>
              <p className="text-sm text-slate-300">{esc.query}</p>
              {esc.resolution && (
                <p className="text-xs text-green-300 mt-2">Response: {esc.resolution}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}