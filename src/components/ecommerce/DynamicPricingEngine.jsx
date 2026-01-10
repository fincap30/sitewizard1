import React from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles, Loader2, DollarSign, TrendingUp } from "lucide-react";
import { toast } from "sonner";

export default function DynamicPricingEngine({ websiteIntakeId }) {
  const queryClient = useQueryClient();

  const { data: products = [] } = useQuery({
    queryKey: ['products-pricing', websiteIntakeId],
    queryFn: () => base44.entities.Product.filter({ website_intake_id: websiteIntakeId }),
    enabled: !!websiteIntakeId,
  });

  const { data: dynamicPricing = [] } = useQuery({
    queryKey: ['dynamic-pricing', websiteIntakeId],
    queryFn: async () => {
      const allPricing = await base44.entities.DynamicPricing.list();
      return allPricing.filter(p => products.some(pr => pr.id === p.product_id));
    },
    enabled: products.length > 0,
  });

  const optimizePricingMutation = useMutation({
    mutationFn: async () => {
      const prompt = `Optimize dynamic pricing strategy.

Products:
${products.slice(0, 20).map(p => `- ${p.name}: $${p.price} (Category: ${p.category})`).join('\n')}

Analyze and recommend:
1. Demand-based pricing adjustments
2. Competitive positioning
3. Price elasticity considerations
4. Seasonal pricing strategies

For each product return:
- Recommended price
- Demand score (0-100)
- Pricing strategy (competitive/premium/value/dynamic)
- Expected impact on sales

Return as JSON array.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            pricing_recommendations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  product_name: { type: "string" },
                  recommended_price: { type: "number" },
                  demand_score: { type: "number" },
                  strategy: { type: "string" },
                  impact: { type: "string" },
                  competitor_avg: { type: "number" }
                }
              }
            }
          }
        }
      });

      // Update pricing
      for (const rec of response.pricing_recommendations) {
        const product = products.find(p => p.name === rec.product_name);
        if (product) {
          await base44.entities.DynamicPricing.create({
            product_id: product.id,
            base_price: product.price,
            current_price: rec.recommended_price,
            demand_score: rec.demand_score,
            competitor_avg_price: rec.competitor_avg,
            pricing_strategy: rec.strategy,
            last_updated: new Date().toISOString()
          });
        }
      }

      return response.pricing_recommendations;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dynamic-pricing'] });
      toast.success('Pricing optimized!');
    },
  });

  return (
    <Card className="border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-yellow-400" />
              Dynamic Pricing Engine
            </CardTitle>
            <CardDescription>AI-powered pricing optimization based on demand and competition</CardDescription>
          </div>
          <Button
            onClick={() => optimizePricingMutation.mutate()}
            disabled={optimizePricingMutation.isPending || products.length === 0}
          >
            {optimizePricingMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
            Optimize Pricing
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {optimizePricingMutation.data && (
          <div className="space-y-3 mb-4">
            <Alert className="bg-blue-600/10 border-blue-500/30">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              <AlertDescription className="text-blue-300">
                <strong>Pricing Strategy Recommendations</strong>
                <p className="text-xs mt-1">
                  Based on demand analysis and competitive intelligence
                </p>
              </AlertDescription>
            </Alert>
          </div>
        )}

        <div className="space-y-2">
          {(optimizePricingMutation.data || dynamicPricing).slice(0, 15).map((pricing, idx) => {
            const product = optimizePricingMutation.data 
              ? products.find(p => p.name === pricing.product_name)
              : products.find(p => p.id === pricing.product_id);
            
            return (
              <Card key={idx} className="bg-slate-700/30">
                <CardContent className="pt-3">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-white">
                        {optimizePricingMutation.data ? pricing.product_name : product?.name}
                      </p>
                      <p className="text-xs text-slate-400">
                        Base: ${optimizePricingMutation.data ? product?.price : pricing.base_price}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-green-400">
                        ${optimizePricingMutation.data ? pricing.recommended_price : pricing.current_price}
                      </p>
                      <Badge className="bg-purple-600 mt-1">
                        {optimizePricingMutation.data ? pricing.strategy : pricing.pricing_strategy}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="outline">
                      Demand: {optimizePricingMutation.data ? pricing.demand_score : pricing.demand_score}/100
                    </Badge>
                    {(optimizePricingMutation.data ? pricing.competitor_avg : pricing.competitor_avg_price) && (
                      <Badge variant="outline">
                        Market Avg: ${optimizePricingMutation.data ? pricing.competitor_avg : pricing.competitor_avg_price}
                      </Badge>
                    )}
                  </div>
                  {optimizePricingMutation.data && pricing.impact && (
                    <p className="text-xs text-green-300 mt-2">{pricing.impact}</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}