import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

export default function AIProductDescriptionGenerator({ websiteIntakeId }) {
  const queryClient = useQueryClient();

  const { data: products = [] } = useQuery({
    queryKey: ['products-description', websiteIntakeId],
    queryFn: () => base44.entities.Product.filter({ website_intake_id: websiteIntakeId }),
    enabled: !!websiteIntakeId,
  });

  const generateDescriptionMutation = useMutation({
    mutationFn: async (product) => {
      const prompt = `Generate compelling, SEO-optimized product description.

Product: ${product.name}
Category: ${product.category}
Price: $${product.price}
Current Description: ${product.description || 'None'}

Generate:
1. Short description (1-2 sentences, 50-80 words) - Product listing
2. Full description (3-4 paragraphs, 150-200 words) - Product page
3. Key features (5-7 bullet points)
4. SEO keywords (5-8 keywords)

Focus on:
- Benefits over features
- Emotional appeal
- Conversion optimization
- Natural keyword integration
- Compelling call-to-action

Return as JSON.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            short_description: { type: "string" },
            full_description: { type: "string" },
            features: { type: "array", items: { type: "string" } },
            seo_keywords: { type: "array", items: { type: "string" } }
          }
        }
      });

      // Update product
      await base44.entities.Product.update(product.id, {
        description: response.full_description,
        short_description: response.short_description,
        seo_keywords: response.seo_keywords
      });

      return { productId: product.id, ...response };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products-description'] });
      toast.success('Description generated!');
    },
  });

  const generateAllMutation = useMutation({
    mutationFn: async () => {
      for (const product of products.slice(0, 10)) {
        await generateDescriptionMutation.mutateAsync(product);
      }
    },
    onSuccess: () => {
      toast.success('All descriptions generated!');
    },
  });

  return (
    <Card className="border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-green-400" />
              AI Product Description Generator
            </CardTitle>
            <CardDescription>Auto-generate conversion-optimized product copy</CardDescription>
          </div>
          <Button
            onClick={() => generateAllMutation.mutate()}
            disabled={generateAllMutation.isPending || products.length === 0}
            size="sm"
          >
            {generateAllMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Sparkles className="w-3 h-3 mr-2" />}
            Generate All
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {products.slice(0, 15).map((product) => (
            <Card key={product.id} className="bg-slate-700/30">
              <CardContent className="pt-3">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold text-white">{product.name}</p>
                    <p className="text-xs text-slate-400">${product.price} • {product.category}</p>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => generateDescriptionMutation.mutate(product)}
                    disabled={generateDescriptionMutation.isPending}
                  >
                    {generateDescriptionMutation.isPending && generateDescriptionMutation.variables?.id === product.id ? 
                      <Loader2 className="w-3 h-3 animate-spin" /> : 
                      <Sparkles className="w-3 h-3" />
                    }
                  </Button>
                </div>
                {product.description && (
                  <div className="mt-2">
                    <Badge className="bg-green-600 mb-1">Has Description</Badge>
                    <p className="text-xs text-slate-300 line-clamp-2">{product.description}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}