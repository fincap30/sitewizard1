import React from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, ThumbsUp, Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AIReviewManager({ productId }) {
  const queryClient = useQueryClient();

  const { data: reviews = [] } = useQuery({
    queryKey: ['reviews', productId],
    queryFn: () => base44.entities.ProductReview.filter({ product_id: productId }),
    enabled: !!productId,
  });

  const analyzeSentimentMutation = useMutation({
    mutationFn: async (reviewId) => {
      const review = reviews.find(r => r.id === reviewId);

      const prompt = `Analyze review sentiment and generate response.

Review: ${review.review_text}
Rating: ${review.rating}/5

1. Determine sentiment (positive/neutral/negative)
2. Generate professional, empathetic response

Return as JSON.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            sentiment: { type: "string" },
            ai_response: { type: "string" }
          }
        }
      });

      await base44.entities.ProductReview.update(reviewId, {
        sentiment: response.sentiment,
        ai_response: response.ai_response
      });

      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reviews'] });
      toast.success('Review analyzed!');
    },
  });

  const getSentimentColor = (sentiment) => {
    if (sentiment === 'positive') return 'bg-green-600';
    if (sentiment === 'negative') return 'bg-red-600';
    return 'bg-yellow-600';
  };

  return (
    <Card className="border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>AI Review Manager</CardTitle>
        <CardDescription>Sentiment analysis and auto-responses</CardDescription>
      </CardHeader>
      <CardContent>
        {reviews.length === 0 ? (
          <p className="text-center text-slate-400 py-8">No reviews yet</p>
        ) : (
          <div className="space-y-3">
            {reviews.map(review => (
              <Card key={review.id} className="bg-slate-700/30">
                <CardContent className="pt-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-white">{review.customer_name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${i < review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-slate-600'}`}
                            />
                          ))}
                        </div>
                        {review.sentiment && (
                          <Badge className={getSentimentColor(review.sentiment)}>
                            {review.sentiment}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => analyzeSentimentMutation.mutate(review.id)}
                      disabled={analyzeSentimentMutation.isPending}
                    >
                      {analyzeSentimentMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    </Button>
                  </div>
                  <p className="text-sm text-slate-300 mb-2">{review.review_text}</p>
                  {review.ai_response && (
                    <div className="mt-2 p-2 bg-blue-600/10 border border-blue-500/30 rounded">
                      <p className="text-xs text-blue-300">
                        <strong>AI Response:</strong> {review.ai_response}
                      </p>
                    </div>
                  )}
                  <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
                    <ThumbsUp className="w-3 h-3" />
                    {review.helpful_votes || 0} found helpful
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}