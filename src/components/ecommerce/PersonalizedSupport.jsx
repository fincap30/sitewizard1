import React, { useState } from 'react';
import { useQuery, useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, MessageSquare } from "lucide-react";
import { toast } from "sonner";

export default function PersonalizedSupport({ customerEmail, websiteIntakeId }) {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState(null);

  const { data: purchaseHistory = [] } = useQuery({
    queryKey: ['customer-purchases', customerEmail],
    queryFn: () => base44.entities.CustomerPurchaseHistory.filter({ customer_email: customerEmail }),
    enabled: !!customerEmail,
  });

  const { data: browsingBehavior = [] } = useQuery({
    queryKey: ['customer-browsing', customerEmail],
    queryFn: () => base44.entities.BrowsingBehavior.filter({ customer_email: customerEmail }),
    enabled: !!customerEmail,
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products-support', websiteIntakeId],
    queryFn: () => base44.entities.Product.filter({ website_intake_id: websiteIntakeId }),
    enabled: !!websiteIntakeId,
  });

  const generateResponseMutation = useMutation({
    mutationFn: async () => {
      const recentPurchases = purchaseHistory.slice(0, 5).map(p => {
        const product = products.find(pr => pr.id === p.product_id);
        return product?.name;
      }).filter(Boolean);

      const recentViews = browsingBehavior.slice(0, 5).map(b => {
        const product = products.find(p => p.id === b.product_id);
        return product?.name;
      }).filter(Boolean);

      const prompt = `Generate personalized customer support response.

Customer Profile:
- Total Purchases: ${purchaseHistory.length}
- Recent Purchases: ${recentPurchases.join(', ') || 'None'}
- Products Viewed: ${recentViews.join(', ') || 'None'}

Customer Query: ${query}

Provide a personalized, empathetic response that:
1. Acknowledges their purchase history
2. References relevant products they've bought/viewed
3. Offers specific help based on their context
4. Suggests related products if applicable
5. Maintains a friendly, professional tone

Keep it concise (2-3 paragraphs max).`;

      const aiResponse = await base44.integrations.Core.InvokeLLM({
        prompt
      });

      return aiResponse;
    },
    onSuccess: (data) => {
      setResponse(data);
      toast.success('Response generated!');
    },
  });

  return (
    <Card className="border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-purple-400" />
          AI Personalized Support
        </CardTitle>
        <CardDescription>Context-aware customer support responses</CardDescription>
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
                ${purchaseHistory.reduce((sum, p) => sum + (p.price_paid || 0), 0).toFixed(2)}
              </p>
              <p className="text-xs text-slate-400">Lifetime Value</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-sm text-slate-300 mb-1 block">Customer Query</label>
            <Textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter customer support query..."
              rows={3}
            />
          </div>

          <Button
            onClick={() => generateResponseMutation.mutate()}
            disabled={generateResponseMutation.isPending || !query}
            className="w-full"
          >
            {generateResponseMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
            Generate Personalized Response
          </Button>

          {response && (
            <Card className="bg-slate-700/30">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Badge className="bg-purple-600">AI Generated</Badge>
                  <Badge variant="outline">Personalized</Badge>
                </div>
                <p className="text-sm text-slate-200 whitespace-pre-wrap">{response}</p>
              </CardContent>
            </Card>
          )}
        </div>
      </CardContent>
    </Card>
  );
}