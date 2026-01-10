import React from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles, Loader2, MessageSquare, AlertTriangle, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function ReviewInsights({ productId }) {
  const queryClient = useQueryClient();

  const { data: reviews = [] } = useQuery({
    queryKey: ['reviews-insights', productId],
    queryFn: () => base44.entities.ProductReview.filter({ product_id: productId }),
    enabled: !!productId,
  });

  const { data: product } = useQuery({
    queryKey: ['product-insights', productId],
    queryFn: () => base44.entities.Product.filter({ id: productId }).then(p => p[0]),
    enabled: !!productId,
  });

  const generateInsightsMutation = useMutation({
    mutationFn: async () => {
      const prompt = `Analyze customer reviews for product improvement insights.

Product: ${product?.name}
Total Reviews: ${reviews.length}

Reviews:
${reviews.slice(0, 50).map(r => `
Rating: ${r.rating}/5
Review: ${r.review_text}
Sentiment: ${r.sentiment || 'unknown'}
`).join('\n---\n')}

Generate:
1. Summary of all reviews (2-3 sentences)
2. Common praise points
3. Common complaints/issues
4. Product improvement opportunities
5. Feature requests
6. Quality concerns
7. Customer satisfaction score (0-100)

Return as JSON.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            summary: { type: "string" },
            praise_points: { type: "array", items: { type: "string" } },
            complaints: { type: "array", items: { type: "string" } },
            improvement_opportunities: { type: "array", items: { type: "string" } },
            feature_requests: { type: "array", items: { type: "string" } },
            quality_concerns: { type: "array", items: { type: "string" } },
            satisfaction_score: { type: "number" }
          }
        }
      });

      return response;
    },
  });

  const avgRating = reviews.length > 0 
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) 
    : 0;

  const sentimentDistribution = {
    positive: reviews.filter(r => r.sentiment === 'positive').length,
    neutral: reviews.filter(r => r.sentiment === 'neutral').length,
    negative: reviews.filter(r => r.sentiment === 'negative').length
  };

  return (
    <Card className="border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-purple-400" />
              Review Insights & Analysis
            </CardTitle>
            <CardDescription>AI-powered sentiment analysis and improvement suggestions</CardDescription>
          </div>
          <Button
            onClick={() => generateInsightsMutation.mutate()}
            disabled={generateInsightsMutation.isPending || reviews.length === 0}
            size="sm"
          >
            {generateInsightsMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Sparkles className="w-3 h-3 mr-2" />}
            Analyze
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-4 gap-4 mb-4">
          <Card className="bg-slate-700/30">
            <CardContent className="pt-4">
              <p className="text-2xl font-bold text-white">{reviews.length}</p>
              <p className="text-xs text-slate-400">Total Reviews</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-700/30">
            <CardContent className="pt-4">
              <p className="text-2xl font-bold text-yellow-400">{avgRating}</p>
              <p className="text-xs text-slate-400">Avg Rating</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-700/30">
            <CardContent className="pt-4">
              <p className="text-2xl font-bold text-green-400">{sentimentDistribution.positive}</p>
              <p className="text-xs text-slate-400">Positive</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-700/30">
            <CardContent className="pt-4">
              <p className="text-2xl font-bold text-red-400">{sentimentDistribution.negative}</p>
              <p className="text-xs text-slate-400">Negative</p>
            </CardContent>
          </Card>
        </div>

        {generateInsightsMutation.data && (
          <div className="space-y-3">
            <Alert className="bg-blue-600/10 border-blue-500/30">
              <AlertDescription className="text-blue-300">
                <strong>Summary:</strong>
                <p className="mt-1 text-sm">{generateInsightsMutation.data.summary}</p>
                <div className="mt-2">
                  <Badge className="bg-green-600">
                    Satisfaction: {generateInsightsMutation.data.satisfaction_score}/100
                  </Badge>
                </div>
              </AlertDescription>
            </Alert>

            <Alert className="bg-green-600/10 border-green-500/30">
              <CheckCircle className="w-4 h-4 text-green-400" />
              <AlertDescription className="text-green-300">
                <strong>What Customers Love:</strong>
                <ul className="list-disc list-inside mt-1 text-sm">
                  {generateInsightsMutation.data.praise_points?.map((point, idx) => (
                    <li key={idx}>{point}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>

            <Alert className="bg-red-600/10 border-red-500/30">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              <AlertDescription className="text-red-300">
                <strong>Common Complaints:</strong>
                <ul className="list-disc list-inside mt-1 text-sm">
                  {generateInsightsMutation.data.complaints?.map((complaint, idx) => (
                    <li key={idx}>{complaint}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>

            <Alert className="bg-purple-600/10 border-purple-500/30">
              <AlertDescription className="text-purple-300">
                <strong>Improvement Opportunities:</strong>
                <ul className="list-disc list-inside mt-1 text-sm">
                  {generateInsightsMutation.data.improvement_opportunities?.map((opp, idx) => (
                    <li key={idx}>{opp}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>

            {generateInsightsMutation.data.feature_requests && generateInsightsMutation.data.feature_requests.length > 0 && (
              <Alert className="bg-yellow-600/10 border-yellow-500/30">
                <AlertDescription className="text-yellow-300">
                  <strong>Feature Requests:</strong>
                  <ul className="list-disc list-inside mt-1 text-sm">
                    {generateInsightsMutation.data.feature_requests.map((req, idx) => (
                      <li key={idx}>{req}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}