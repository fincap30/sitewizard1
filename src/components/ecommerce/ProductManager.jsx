import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, Plus, Edit, ShoppingBag } from "lucide-react";
import { toast } from "sonner";

export default function ProductManager({ websiteIntakeId }) {
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    short_description: '',
    price: '',
    category: '',
    stock_quantity: ''
  });
  const queryClient = useQueryClient();

  const { data: products = [] } = useQuery({
    queryKey: ['products', websiteIntakeId],
    queryFn: () => base44.entities.Product.filter({ website_intake_id: websiteIntakeId }),
    enabled: !!websiteIntakeId,
  });

  const { data: websiteIntake } = useQuery({
    queryKey: ['website-intake', websiteIntakeId],
    queryFn: () => base44.entities.WebsiteIntake.filter({ id: websiteIntakeId }).then(r => r[0]),
    enabled: !!websiteIntakeId,
  });

  const generateProductContentMutation = useMutation({
    mutationFn: async () => {
      const prompt = `Generate professional e-commerce product content.

Product: ${formData.name}
Category: ${formData.category}
Price: $${formData.price}
Business: ${websiteIntake.company_name}

Create:
1. Compelling product description (150-200 words)
2. Short tagline (10-15 words)
3. Key features list (5-7 bullet points)
4. SEO-optimized keywords (8-10)
5. Product tags for categorization
6. Related product suggestions
7. Meta description for product page

Make it persuasive and conversion-focused.`;

      const content = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            description: { type: "string" },
            short_description: { type: "string" },
            features: { type: "array", items: { type: "string" } },
            seo_keywords: { type: "array", items: { type: "string" } },
            tags: { type: "array", items: { type: "string" } },
            meta_description: { type: "string" }
          }
        }
      });

      return content;
    },
    onSuccess: (content) => {
      setFormData({
        ...formData,
        description: content.description,
        short_description: content.short_description,
        seo_keywords: content.seo_keywords,
        tags: content.tags
      });
      toast.success('Product content generated!');
    }
  });

  const saveProductMutation = useMutation({
    mutationFn: async () => {
      const productData = {
        website_intake_id: websiteIntakeId,
        ...formData,
        price: parseFloat(formData.price),
        stock_quantity: parseInt(formData.stock_quantity)
      };

      if (editingProduct) {
        await base44.entities.Product.update(editingProduct.id, productData);
      } else {
        await base44.entities.Product.create(productData);
      }
    },
    onSuccess: () => {
      toast.success(editingProduct ? 'Product updated!' : 'Product created!');
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setShowForm(false);
      setEditingProduct(null);
      setFormData({ name: '', short_description: '', price: '', category: '', stock_quantity: '' });
    }
  });

  return (
    <Card className="border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-green-400" />
            Product Manager
          </span>
          <Button
            onClick={() => {
              setShowForm(true);
              setEditingProduct(null);
              setFormData({ name: '', short_description: '', price: '', category: '', stock_quantity: '' });
            }}
            className="bg-green-600 hover:bg-green-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {showForm ? (
          <Card className="bg-slate-700/30 mb-4">
            <CardContent className="pt-4 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-300 mb-1 block">Product Name *</label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g., Premium Leather Wallet"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-300 mb-1 block">Price *</label>
                  <Input
                    type="number"
                    value={formData.price}
                    onChange={(e) => setFormData({...formData, price: e.target.value})}
                    placeholder="29.99"
                  />
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-slate-300 mb-1 block">Category</label>
                  <Input
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                    placeholder="e.g., Accessories"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-300 mb-1 block">Stock Quantity</label>
                  <Input
                    type="number"
                    value={formData.stock_quantity}
                    onChange={(e) => setFormData({...formData, stock_quantity: e.target.value})}
                    placeholder="100"
                  />
                </div>
              </div>

              <div>
                <label className="text-sm text-slate-300 mb-1 block">Short Description</label>
                <Textarea
                  value={formData.short_description}
                  onChange={(e) => setFormData({...formData, short_description: e.target.value})}
                  placeholder="Brief product tagline..."
                  rows={2}
                />
              </div>

              <Button
                onClick={() => generateProductContentMutation.mutate()}
                disabled={generateProductContentMutation.isPending || !formData.name}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {generateProductContentMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Generating Content...</>
                ) : (
                  <><Sparkles className="w-4 h-4 mr-2" /> AI Generate Content</>
                )}
              </Button>

              {formData.description && (
                <div>
                  <label className="text-sm text-slate-300 mb-1 block">Full Description</label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    rows={6}
                  />
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  onClick={() => setShowForm(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => saveProductMutation.mutate()}
                  disabled={saveProductMutation.isPending || !formData.name || !formData.price}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  {saveProductMutation.isPending ? 'Saving...' : editingProduct ? 'Update' : 'Create Product'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : null}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <Card key={product.id} className="bg-slate-700/30">
              <CardContent className="pt-4">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-white">{product.name}</h4>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      setEditingProduct(product);
                      setFormData({
                        name: product.name,
                        short_description: product.short_description,
                        description: product.description,
                        price: product.price.toString(),
                        category: product.category,
                        stock_quantity: product.stock_quantity?.toString() || ''
                      });
                      setShowForm(true);
                    }}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-sm text-slate-300 mb-3">{product.short_description}</p>
                <div className="flex items-center justify-between">
                  <p className="text-2xl font-bold text-green-400">${product.price}</p>
                  {product.stock_quantity > 0 ? (
                    <Badge className="bg-green-600">{product.stock_quantity} in stock</Badge>
                  ) : (
                    <Badge className="bg-red-600">Out of stock</Badge>
                  )}
                </div>
                {product.category && (
                  <Badge variant="outline" className="mt-2">{product.category}</Badge>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {products.length === 0 && !showForm && (
          <div className="text-center py-12">
            <ShoppingBag className="w-16 h-16 mx-auto mb-4 text-slate-400" />
            <p className="text-slate-300 mb-2">No products yet</p>
            <p className="text-sm text-slate-400">Add your first product to start selling</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}