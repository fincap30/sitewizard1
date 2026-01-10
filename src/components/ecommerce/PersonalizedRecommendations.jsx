import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

export default function PersonalizedRecommendations({ websiteIntakeId, customerEmail }) {
  const queryClient = useQueryClient();

  const { data: purchaseHistory = [] } = useQuery({
    queryKey: ['purchase-history', customerEmail],
    queryFn: () => base44.entities.CustomerPurchaseHistory.filter({ customer_email: customerEmail }),
    enabled: !!customerEmail,
  });

  const { data: browsingBehavior = [] } = useQuery({
    queryKey: ['browsing-behavior', customerEmail],
    queryFn: () => base44.entities.BrowsingBehavior.filter({ customer_email: customerEmail }),
    enabled: !!customerEmail,
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products-recommendations', websiteIntakeId],
    queryFn: () => base44.entities.Product.filter({ website_intake_id: websiteIntakeId }),
    enabled: !!websiteIntakeId,
  });

  const generateRecommendationsMutation = useMutation({
    mutationFn: async () => {
      const prompt = `Generate personalized product recommendations.

Customer Profile:
- Purchase History: ${purchaseHistory.length} items
- Recent Purchases: ${purchaseHistory.slice(0, 5).map(p => products.find(pr => pr.id === p.product_id)?.name).join(', ')}
- Browsing Behavior: ${browsingBehavior.length} products viewed
- Most Viewed: ${browsingBehavior.slice(0, 5).map(b => products.find(p => p.id === b.product_id)?.name).join(', ')}

Available Products:
${products.slice(0, 30).map(p => `- ${p.name} ($${p.price}) - ${p.category}`).join('\n')}

Generate top 10 personalized recommendations based on:
1. Purchase patterns
2. Browsing behavior
3. Product affinity
4. Category preferences

For each recommendation include confidence score and reasoning.
Return as JSON array.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            recommendations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  product_name: { type: "string" },
                  confidence_score: { type: "number" },
                  reasoning: { type: "string" },
                  recommendation_type: { type: "string" }
                }
              }
            }
          }
        }
      });

      return response.recommendations;
    },
  });

  return (
    <Card className="border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-green-400" />
              Personalized Recommendations
            </CardTitle>
            <CardDescription>AI-powered product suggestions based on behavior</CardDescription>
          </div>
          <Button
            onClick={() => generateRecommendationsMutation.mutate()}
            disabled={generateRecommendationsMutation.isPending}
            size="sm"
          >
            {generateRecommendationsMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Sparkles className="w-3 h-3 mr-2" />}
            Generate
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-3 gap-4 mb-4">
          <Card className="bg-slate-700/30">
            <CardContent className="pt-4">
              <p className="text-2xl font-bold text-white">{purchaseHistory.length}</p>
              <p className="text-xs text-slate-400">Past Purchases</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-700/30">
            <CardContent className="pt-4">
              <p className="text-2xl font-bold text-white">{browsingBehavior.length}</p>
              <p className="text-xs text-slate-400">Products Viewed</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-700/30">
            <CardContent className="pt-4">
              <p className="text-2xl font-bold text-white">
                {generateRecommendationsMutation.data?.length || 0}
              </p>
              <p className="text-xs text-slate-400">Recommendations</p>
            </CardContent>
          </Card>
        </div>

        {generateRecommendationsMutation.data && (
          <div className="space-y-2">
            {generateRecommendationsMutation.data.map((rec, idx) => (
              <Card key={idx} className="bg-slate-700/30">
                <CardContent className="pt-3">
                  <div className="flex justify-between items-start mb-1">
                    <p className="font-semibold text-white">{rec.product_name}</p>
                    <Badge className="bg-green-600">{(rec.confidence_score * 100).toFixed(0)}%</Badge>
                  </div>
                  <p className="text-xs text-slate-400 mb-1">{rec.recommendation_type}</p>
                  <p className="text-xs text-slate-300">{rec.reasoning}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}