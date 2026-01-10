import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sparkles, Loader2, Package, ShoppingCart, TrendingUp } from "lucide-react";
import { toast } from "sonner";

export default function AIProductManager({ websiteIntakeId }) {
  const [newProduct, setNewProduct] = useState({ name: '', price: '', category: '' });
  const [selectedProduct, setSelectedProduct] = useState(null);
  const queryClient = useQueryClient();

  const { data: products = [] } = useQuery({
    queryKey: ['products', websiteIntakeId],
    queryFn: () => base44.entities.Product.filter({ website_intake_id: websiteIntakeId }),
    enabled: !!websiteIntakeId,
  });

  const generateDescriptionMutation = useMutation({
    mutationFn: async (productId) => {
      const product = products.find(p => p.id === productId);

      const prompt = `Generate compelling product descriptions.

Product: ${product.name}
Price: $${product.price}
Category: ${product.category}

Create:
1. Full description (150-200 words, persuasive, benefit-focused)
2. Short description (50 words, punchy)
3. SEO keywords (10 keywords)

Return as JSON.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            description: { type: "string" },
            short_description: { type: "string" },
            seo_keywords: { type: "array", items: { type: "string" } }
          }
        }
      });

      await base44.entities.Product.update(productId, {
        description: response.description,
        short_description: response.short_description,
        seo_keywords: response.seo_keywords
      });

      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product description generated!');
    },
  });

  const generateCrossSellMutation = useMutation({
    mutationFn: async (productId) => {
      const product = products.find(p => p.id === productId);

      const prompt = `Suggest cross-sell and upsell products.

Target Product: ${product.name} ($${product.price})
Category: ${product.category}

Available Products:
${products.filter(p => p.id !== productId).map(p => `- ${p.name} ($${p.price}) - ${p.category}`).join('\n')}

Suggest:
1. Cross-sell items (complementary products)
2. Upsell items (premium alternatives)

Return product IDs as JSON arrays.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            cross_sell_ids: { type: "array", items: { type: "string" } },
            upsell_ids: { type: "array", items: { type: "string" } },
            reasoning: { type: "string" }
          }
        }
      });

      await base44.entities.Product.update(productId, {
        cross_sell_products: response.cross_sell_ids,
        upsell_products: response.upsell_ids
      });

      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Cross-sell suggestions generated!');
    },
  });

  const optimizeCategorizationMutation = useMutation({
    mutationFn: async () => {
      const prompt = `Optimize product categorization.

Products:
${products.map(p => `- ${p.name} (Current: ${p.category || 'Uncategorized'})`).join('\n')}

Suggest optimal categories and tags for better organization and SEO.
Return as JSON array with product_id, category, and tags.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            categorizations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  product_name: { type: "string" },
                  category: { type: "string" },
                  tags: { type: "array", items: { type: "string" } }
                }
              }
            }
          }
        }
      });

      // Update products
      for (const cat of response.categorizations) {
        const product = products.find(p => p.name === cat.product_name);
        if (product) {
          await base44.entities.Product.update(product.id, {
            category: cat.category,
            tags: cat.tags
          });
        }
      }

      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Categorization optimized!');
    },
  });

  const createProductMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.Product.create({
        website_intake_id: websiteIntakeId,
        name: newProduct.name,
        price: parseFloat(newProduct.price),
        category: newProduct.category
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setNewProduct({ name: '', price: '', category: '' });
      toast.success('Product created!');
    },
  });

  return (
    <Card className="border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-green-400" />
          AI Product Manager
        </CardTitle>
        <CardDescription>Auto-generate descriptions, optimize categories, suggest cross-sells</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="products">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="products">Products ({products.length})</TabsTrigger>
            <TabsTrigger value="add">Add Product</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-4">
            <div className="flex justify-end gap-2">
              <Button
                size="sm"
                onClick={() => optimizeCategorizationMutation.mutate()}
                disabled={optimizeCategorizationMutation.isPending || products.length === 0}
                variant="outline"
              >
                {optimizeCategorizationMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Sparkles className="w-3 h-3 mr-2" />}
                Optimize All Categories
              </Button>
            </div>

            {products.length === 0 ? (
              <p className="text-center text-slate-400 py-8">No products yet. Add your first product!</p>
            ) : (
              <div className="space-y-3">
                {products.map(product => (
                  <Card key={product.id} className="bg-slate-700/30">
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-semibold text-white">{product.name}</h4>
                          <p className="text-lg text-green-400">${product.price}</p>
                          {product.category && (
                            <Badge className="mt-1 bg-blue-600">{product.category}</Badge>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => generateDescriptionMutation.mutate(product.id)}
                            disabled={generateDescriptionMutation.isPending}
                          >
                            {generateDescriptionMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Generate Description'}
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => generateCrossSellMutation.mutate(product.id)}
                            disabled={generateCrossSellMutation.isPending}
                          >
                            Cross-Sell
                          </Button>
                        </div>
                      </div>
                      {product.short_description && (
                        <p className="text-sm text-slate-300 mb-2">{product.short_description}</p>
                      )}
                      {product.tags && product.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {product.tags.map((tag, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">{tag}</Badge>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="add" className="space-y-4">
            <Input
              placeholder="Product Name *"
              value={newProduct.name}
              onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
            />
            <Input
              type="number"
              placeholder="Price *"
              value={newProduct.price}
              onChange={(e) => setNewProduct({...newProduct, price: e.target.value})}
            />
            <Input
              placeholder="Category"
              value={newProduct.category}
              onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
            />
            <Button
              onClick={() => createProductMutation.mutate()}
              disabled={!newProduct.name || !newProduct.price || createProductMutation.isPending}
              className="w-full"
            >
              Create Product
            </Button>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}