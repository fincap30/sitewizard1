import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, AlertCircle, CheckCircle } from "lucide-react";

export default function InventoryManager({ product, onInventoryChange }) {
  const [inventory, setInventory] = useState({
    current_stock: product?.stock_quantity || 0,
    low_stock_alert: product?.low_stock_alert || 10,
    reorder_point: product?.reorder_point || 20,
    reorder_quantity: product?.reorder_quantity || 50,
    track_inventory: product?.track_inventory !== false
  });

  const handleChange = (field, value) => {
    const updated = { ...inventory, [field]: parseInt(value) || 0 };
    setInventory(updated);
    onInventoryChange(updated);
  };

  const getStockStatus = () => {
    if (inventory.current_stock === 0) {
      return { status: 'out', label: 'Out of Stock', color: 'bg-red-600', icon: AlertTriangle };
    }
    if (inventory.current_stock <= inventory.low_stock_alert) {
      return { status: 'low', label: 'Low Stock', color: 'bg-orange-600', icon: AlertCircle };
    }
    return { status: 'available', label: 'In Stock', color: 'bg-green-600', icon: CheckCircle };
  };

  const stock = getStockStatus();
  const StockIcon = stock.icon;

  return (
    <Card className="border-2 border-slate-700/50 bg-slate-800/30">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <StockIcon className={`w-5 h-5`} style={{ color: stock.color.replace('bg-', 'text-') }} />
          Inventory Management
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stock Status Alert */}
        {stock.status === 'out' && (
          <Alert className="bg-red-900/10 border-red-500/30">
            <AlertTriangle className="w-4 h-4 text-red-400" />
            <AlertDescription className="text-red-300">
              Product is out of stock. Consider reordering.
            </AlertDescription>
          </Alert>
        )}
        {stock.status === 'low' && (
          <Alert className="bg-orange-900/10 border-orange-500/30">
            <AlertCircle className="w-4 h-4 text-orange-400" />
            <AlertDescription className="text-orange-300">
              Stock is running low. Reorder soon to avoid stockouts.
            </AlertDescription>
          </Alert>
        )}

        {/* Current Stock */}
        <div className="space-y-3">
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Current Stock Level
              </label>
              <Input
                type="number"
                min="0"
                value={inventory.current_stock}
                onChange={(e) => handleChange('current_stock', e.target.value)}
              />
            </div>
            <Badge className={`${stock.color} whitespace-nowrap`}>
              {stock.label}
            </Badge>
          </div>

          {/* Stock Thresholds */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Low Stock Alert Threshold
              </label>
              <Input
                type="number"
                min="0"
                value={inventory.low_stock_alert}
                onChange={(e) => handleChange('low_stock_alert', e.target.value)}
                placeholder="10"
              />
              <p className="text-xs text-slate-400 mt-1">Alert when stock drops below this</p>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-300 block mb-1">
                Reorder Point
              </label>
              <Input
                type="number"
                min="0"
                value={inventory.reorder_point}
                onChange={(e) => handleChange('reorder_point', e.target.value)}
                placeholder="20"
              />
              <p className="text-xs text-slate-400 mt-1">Minimum before reordering</p>
            </div>
          </div>

          {/* Reorder Quantity */}
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">
              Recommended Reorder Quantity
            </label>
            <Input
              type="number"
              min="0"
              value={inventory.reorder_quantity}
              onChange={(e) => handleChange('reorder_quantity', e.target.value)}
              placeholder="50"
            />
            <p className="text-xs text-slate-400 mt-1">Order this many units when stock is low</p>
          </div>

          {/* Track Inventory */}
          <div className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg border border-slate-600">
            <input
              type="checkbox"
              checked={inventory.track_inventory}
              onChange={(e) => {
                const updated = { ...inventory, track_inventory: e.target.checked };
                setInventory(updated);
                onInventoryChange(updated);
              }}
              className="w-4 h-4 rounded"
            />
            <div>
              <p className="text-sm font-medium text-white">Track Inventory</p>
              <p className="text-xs text-slate-400">Enable automatic inventory tracking</p>
            </div>
          </div>
        </div>

        {/* Stock Projection */}
        <div className="bg-slate-700/30 rounded-lg p-3 border border-slate-600">
          <p className="text-xs font-medium text-slate-300 mb-2">Stock Projection</p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">Current:</span>
              <span className="text-white font-medium">{inventory.current_stock} units</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Alert Threshold:</span>
              <span className="text-orange-400 font-medium">{inventory.low_stock_alert} units</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Reorder Point:</span>
              <span className="text-red-400 font-medium">{inventory.reorder_point} units</span>
            </div>
            <div className="pt-2 border-t border-slate-600 flex justify-between">
              <span className="text-slate-400">Units Until Alert:</span>
              <span className="text-white font-medium">
                {Math.max(0, inventory.current_stock - inventory.low_stock_alert)} units
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}