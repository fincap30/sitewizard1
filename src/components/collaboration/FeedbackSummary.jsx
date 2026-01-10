import React from 'react';
import { useQuery, useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function FeedbackSummary({ websiteIntakeId }) {
  const [summary, setSummary] = React.useState(null);

  const { data: comments = [] } = useQuery({
    queryKey: ['comments-summary', websiteIntakeId],
    queryFn: () => base44.entities.WebsiteComment.filter({ website_intake_id: websiteIntakeId }),
    enabled: !!websiteIntakeId,
  });

  const generateSummaryMutation = useMutation({
    mutationFn: async () => {
      const prompt = `Summarize client feedback and extract insights.

Total Feedback Items: ${comments.length}
Open Items: ${comments.filter(c => c.status === 'open').length}

Feedback:
${comments.slice(0, 20).map(c => `[${c.comment_type}] ${c.comment_text}`).join('\n')}

Provide:
1. Executive summary (2-3 sentences)
2. Common themes
3. Sentiment (positive/neutral/negative)
4. Action items
5. Client satisfaction level (0-10)

Return as JSON.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            themes: { type: "array", items: { type: "string" } },
            sentiment: { type: "string" },
            action_items: { type: "array", items: { type: "string" } },
            satisfaction_score: { type: "number" }
          }
        }
      });

      return response;
    },
    onSuccess: (data) => {
      setSummary(data);
      toast.success('Feedback summarized!');
    },
  });

  return (
    <div className="space-y-3">
      <Button
        onClick={() => generateSummaryMutation.mutate()}
        disabled={generateSummaryMutation.isPending || comments.length === 0}
        className="w-full"
      >
        {generateSummaryMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
        Generate AI Summary
      </Button>

      {summary && (
        <div className="space-y-3">
          <Alert className="bg-blue-600/10 border-blue-500/30">
            <AlertDescription className="text-blue-300">
              <strong>Summary:</strong>
              <p className="mt-1 text-sm">{summary.summary}</p>
              <div className="flex gap-2 mt-2">
                <Badge className="bg-purple-600">Sentiment: {summary.sentiment}</Badge>
                <Badge className="bg-green-600">Satisfaction: {summary.satisfaction_score}/10</Badge>
              </div>
            </AlertDescription>
          </Alert>

          <Alert className="bg-purple-600/10 border-purple-500/30">
            <AlertDescription className="text-purple-300 text-sm">
              <strong>Common Themes:</strong>
              <ul className="list-disc list-inside mt-1">
                {summary.themes?.map((theme, idx) => (
                  <li key={idx}>{theme}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>

          <Alert className="bg-orange-600/10 border-orange-500/30">
            <AlertDescription className="text-orange-300 text-sm">
              <strong>Action Items:</strong>
              <ul className="list-disc list-inside mt-1">
                {summary.action_items?.map((item, idx) => (
                  <li key={idx}>{item}</li>
                ))}
              </ul>
            </AlertDescription>
          </Alert>
        </div>
      )}

      <div>
        <h4 className="font-semibold text-white mb-2">Recent Feedback</h4>
        {comments.slice(0, 5).map((comment) => (
          <Card key={comment.id} className="bg-slate-700/30 mb-2">
            <CardContent className="pt-3">
              <div className="flex justify-between items-start mb-1">
                <Badge className="bg-blue-600">{comment.comment_type}</Badge>
                <Badge variant="outline">{comment.status}</Badge>
              </div>
              <p className="text-sm text-slate-300">{comment.comment_text}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}