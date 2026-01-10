import React from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles, Loader2, Package, AlertTriangle, TrendingDown } from "lucide-react";
import { toast } from "sonner";

export default function InventoryManagement({ websiteIntakeId }) {
  const queryClient = useQueryClient();

  const { data: products = [] } = useQuery({
    queryKey: ['products-inventory', websiteIntakeId],
    queryFn: () => base44.entities.Product.filter({ website_intake_id: websiteIntakeId }),
    enabled: !!websiteIntakeId,
  });

  const { data: inventory = [] } = useQuery({
    queryKey: ['inventory', websiteIntakeId],
    queryFn: async () => {
      const allInventory = await base44.entities.InventoryManagement.list();
      return allInventory.filter(inv => products.some(p => p.id === inv.product_id));
    },
    enabled: products.length > 0,
  });

  const { data: purchaseHistory = [] } = useQuery({
    queryKey: ['all-purchases'],
    queryFn: () => base44.entities.CustomerPurchaseHistory.list(),
  });

  const predictInventoryMutation = useMutation({
    mutationFn: async () => {
      const prompt = `Analyze inventory and predict stock levels.

Products & Current Stock:
${products.slice(0, 20).map(p => {
  const sales = purchaseHistory.filter(ph => ph.product_id === p.id);
  const avgDaily = sales.length > 0 ? (sales.reduce((sum, s) => sum + s.quantity, 0) / 30) : 0.5;
  return `- ${p.name}: Stock ${p.stock_quantity || 0}, Avg Daily Sales: ${avgDaily.toFixed(1)}`;
}).join('\n')}

For each product predict:
1. Stock level in 30 days
2. Reorder point (when to reorder)
3. Optimal reorder quantity
4. Stockout risk (low/medium/high/critical)

Consider:
- Sales velocity
- Seasonal trends
- Lead time (assume 7-14 days)

Return as JSON array.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            predictions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  product_name: { type: "string" },
                  predicted_stock: { type: "number" },
                  reorder_point: { type: "number" },
                  optimal_quantity: { type: "number" },
                  stockout_risk: { type: "string" },
                  daily_avg_sales: { type: "number" }
                }
              }
            }
          }
        }
      });

      // Save predictions
      for (const pred of response.predictions) {
        const product = products.find(p => p.name === pred.product_name);
        if (product) {
          await base44.entities.InventoryManagement.create({
            product_id: product.id,
            current_stock: product.stock_quantity || 0,
            predicted_stock: pred.predicted_stock,
            reorder_point: pred.reorder_point,
            optimal_reorder_quantity: pred.optimal_quantity,
            stockout_risk: pred.stockout_risk,
            daily_avg_sales: pred.daily_avg_sales,
            lead_time_days: 10
          });
        }
      }

      return response.predictions;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      toast.success('Inventory predictions updated!');
    },
  });

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'critical': return 'bg-red-600';
      case 'high': return 'bg-orange-600';
      case 'medium': return 'bg-yellow-600';
      default: return 'bg-green-600';
    }
  };

  const criticalItems = inventory.filter(i => i.stockout_risk === 'critical' || i.stockout_risk === 'high');

  return (
    <Card className="border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Package className="w-5 h-5 text-blue-400" />
              AI Inventory Management
            </CardTitle>
            <CardDescription>Predict stock levels and automate reordering</CardDescription>
          </div>
          <Button
            onClick={() => predictInventoryMutation.mutate()}
            disabled={predictInventoryMutation.isPending || products.length === 0}
          >
            {predictInventoryMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
            Predict Stock
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {criticalItems.length > 0 && (
          <Alert className="mb-4 bg-red-600/10 border-red-500/30">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <AlertDescription className="text-red-300">
              <strong>{criticalItems.length} products at risk of stockout!</strong>
              <p className="text-xs mt-1">Immediate action recommended</p>
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          {inventory.slice(0, 20).map((inv) => {
            const product = products.find(p => p.id === inv.product_id);
            const daysUntilStockout = inv.daily_avg_sales > 0 
              ? Math.floor(inv.current_stock / inv.daily_avg_sales) 
              : 999;

            return (
              <Card key={inv.id} className="bg-slate-700/30">
                <CardContent className="pt-3">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-semibold text-white">{product?.name}</p>
                      <p className="text-xs text-slate-400">
                        Current: {inv.current_stock} units
                      </p>
                    </div>
                    <Badge className={getRiskColor(inv.stockout_risk)}>
                      {inv.stockout_risk} risk
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="bg-slate-600/30 p-2 rounded">
                      <p className="text-slate-400">Predicted in 30d</p>
                      <p className="font-semibold text-white">{inv.predicted_stock} units</p>
                    </div>
                    <div className="bg-slate-600/30 p-2 rounded">
                      <p className="text-slate-400">Reorder Point</p>
                      <p className="font-semibold text-white">{inv.reorder_point} units</p>
                    </div>
                  </div>

                  {inv.current_stock <= inv.reorder_point && (
                    <Alert className="mt-2 bg-orange-600/10 border-orange-500/30">
                      <TrendingDown className="w-3 h-3 text-orange-400" />
                      <AlertDescription className="text-orange-300 text-xs">
                        <strong>Reorder now:</strong> {inv.optimal_reorder_quantity} units
                        <span className="ml-2">({daysUntilStockout} days left)</span>
                      </AlertDescription>
                    </Alert>
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