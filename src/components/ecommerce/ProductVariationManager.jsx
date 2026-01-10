import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Edit2 } from "lucide-react";
import { toast } from "sonner";

export default function ProductVariationManager({ product, onVariationsChange }) {
  const [variations, setVariations] = useState(product?.variations || []);
  const [editingIdx, setEditingIdx] = useState(null);
  const [newVariation, setNewVariation] = useState({
    name: '',
    type: 'size', // size, color, material, etc.
    options: [] // e.g., ['S', 'M', 'L', 'XL']
  });
  const [inputValue, setInputValue] = useState('');

  const handleAddOption = () => {
    if (inputValue.trim()) {
      setNewVariation({
        ...newVariation,
        options: [...newVariation.options, inputValue.trim()]
      });
      setInputValue('');
    }
  };

  const handleRemoveOption = (idx) => {
    setNewVariation({
      ...newVariation,
      options: newVariation.options.filter((_, i) => i !== idx)
    });
  };

  const handleSaveVariation = () => {
    if (!newVariation.name || newVariation.options.length === 0) {
      toast.error('Please fill in all fields');
      return;
    }

    if (editingIdx !== null) {
      const updated = [...variations];
      updated[editingIdx] = newVariation;
      setVariations(updated);
      setEditingIdx(null);
    } else {
      setVariations([...variations, newVariation]);
    }

    setNewVariation({ name: '', type: 'size', options: [] });
    onVariationsChange(variations);
    toast.success('Variation saved!');
  };

  const handleEdit = (idx) => {
    setNewVariation(variations[idx]);
    setEditingIdx(idx);
  };

  const handleDelete = (idx) => {
    setVariations(variations.filter((_, i) => i !== idx));
    onVariationsChange(variations);
  };

  return (
    <Card className="border-2 border-slate-700/50 bg-slate-800/30">
      <CardHeader>
        <CardTitle className="text-base">Product Variations</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add/Edit Variation Form */}
        <div className="bg-slate-700/30 rounded-lg p-4 space-y-3">
          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">
              Variation Name
            </label>
            <Input
              placeholder="e.g., Size, Color, Material"
              value={newVariation.name}
              onChange={(e) => setNewVariation({ ...newVariation, name: e.target.value })}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-1">Type</label>
            <select
              value={newVariation.type}
              onChange={(e) => setNewVariation({ ...newVariation, type: e.target.value })}
              className="w-full border rounded-md px-3 py-2 bg-slate-700 text-white text-sm"
            >
              <option value="size">Size</option>
              <option value="color">Color</option>
              <option value="material">Material</option>
              <option value="style">Style</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-medium text-slate-300 block mb-2">
              Options (e.g., S, M, L, XL)
            </label>
            <div className="flex gap-2 mb-2">
              <Input
                placeholder="Add option"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAddOption()}
                className="text-sm"
              />
              <Button
                onClick={handleAddOption}
                size="sm"
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>

            {newVariation.options.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {newVariation.options.map((option, idx) => (
                  <Badge
                    key={idx}
                    variant="outline"
                    className="cursor-pointer hover:bg-red-900/20"
                    onClick={() => handleRemoveOption(idx)}
                  >
                    {option} ✕
                  </Badge>
                ))}
              </div>
            )}
          </div>

          <Button
            onClick={handleSaveVariation}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            {editingIdx !== null ? 'Update Variation' : 'Add Variation'}
          </Button>
        </div>

        {/* Existing Variations */}
        <div className="space-y-2">
          {variations.length === 0 ? (
            <p className="text-xs text-slate-400 text-center py-4">
              No variations added yet
            </p>
          ) : (
            variations.map((variation, idx) => (
              <div
                key={idx}
                className="flex items-start justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700"
              >
                <div className="flex-1">
                  <p className="font-medium text-white text-sm">{variation.name}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {variation.options.map((opt, i) => (
                      <Badge key={i} variant="outline" className="text-xs">
                        {opt}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-slate-400 mt-1">{variation.type}</p>
                </div>
                <div className="flex gap-2 ml-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleEdit(idx)}
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleDelete(idx)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}