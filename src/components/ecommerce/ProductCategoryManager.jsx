import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Edit2 } from "lucide-react";
import { toast } from "sonner";

export default function ProductCategoryManager({ products = [], onCategoryChange }) {
  const [categories, setCategories] = useState([
    'Electronics',
    'Clothing',
    'Home & Garden',
    'Sports & Outdoors',
    'Books & Media',
    'Uncategorized'
  ]);
  const [newCategory, setNewCategory] = useState('');
  const [editingIdx, setEditingIdx] = useState(null);

  const handleAddCategory = () => {
    if (!newCategory.trim()) {
      toast.error('Category name cannot be empty');
      return;
    }

    if (categories.includes(newCategory)) {
      toast.error('Category already exists');
      return;
    }

    if (editingIdx !== null) {
      const updated = [...categories];
      updated[editingIdx] = newCategory;
      setCategories(updated);
      setEditingIdx(null);
      toast.success('Category updated!');
    } else {
      setCategories([...categories, newCategory]);
      toast.success('Category added!');
    }

    setNewCategory('');
    onCategoryChange(categories);
  };

  const handleDelete = (idx) => {
    if (categories[idx] === 'Uncategorized') {
      toast.error('Cannot delete Uncategorized');
      return;
    }

    setCategories(categories.filter((_, i) => i !== idx));
    toast.success('Category deleted');
  };

  const handleEdit = (idx) => {
    setNewCategory(categories[idx]);
    setEditingIdx(idx);
  };

  const getCategoryStats = (categoryName) => {
    return products.filter(p => p.category === categoryName).length;
  };

  return (
    <Card className="border-2 border-slate-700/50 bg-slate-800/30">
      <CardHeader>
        <CardTitle className="text-base">Product Categories</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Add New Category */}
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input
              placeholder={editingIdx !== null ? 'Edit category name' : 'New category name'}
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
            />
            <Button
              onClick={handleAddCategory}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4" />
            </Button>
            {editingIdx !== null && (
              <Button
                onClick={() => {
                  setNewCategory('');
                  setEditingIdx(null);
                }}
                variant="outline"
                className="border-slate-600"
              >
                Cancel
              </Button>
            )}
          </div>
        </div>

        {/* Category List */}
        <div className="space-y-2">
          {categories.map((category, idx) => (
            <div
              key={idx}
              className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-700 hover:border-slate-600 transition-all"
            >
              <div className="flex-1">
                <p className="font-medium text-white">{category}</p>
                <p className="text-xs text-slate-400">
                  {getCategoryStats(category)} {getCategoryStats(category) === 1 ? 'product' : 'products'}
                </p>
              </div>

              <div className="flex gap-2">
                {category !== 'Uncategorized' && (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleEdit(idx)}
                      className="h-8 w-8 p-0"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(idx)}
                      className="h-8 w-8 p-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </>
                )}
                {category === 'Uncategorized' && (
                  <Badge variant="outline" className="text-xs">System</Badge>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Category Organization Tips */}
        <div className="bg-slate-700/20 rounded-lg p-3 border border-slate-600">
          <p className="text-xs font-medium text-slate-300 mb-2">💡 Organization Tips:</p>
          <ul className="text-xs text-slate-400 space-y-1">
            <li>• Keep categories clear and descriptive</li>
            <li>• Avoid too many similar categories</li>
            <li>• Use 5-10 main categories for best UX</li>
            <li>• Assign all products to a category</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}