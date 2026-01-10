import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { FileText, Edit2, Save, X, Plus } from "lucide-react";
import { toast } from "sonner";

export default function ContentManager({ websiteIntakeId }) {
  const [editingId, setEditingId] = useState(null);
  const [editData, setEditData] = useState({});
  const [showForm, setShowForm] = useState(false);
  const queryClient = useQueryClient();

  const { data: pages = [] } = useQuery({
    queryKey: ['website-pages', websiteIntakeId],
    queryFn: async () => {
      try {
        const intakes = await base44.entities.WebsiteIntake.filter({ id: websiteIntakeId });
        if (intakes[0]?.website_structure) {
          const structure = JSON.parse(intakes[0].website_structure);
          return structure.pages || [];
        }
        return [];
      } catch {
        return [];
      }
    },
    enabled: !!websiteIntakeId
  });

  const updatePageMutation = useMutation({
    mutationFn: async (updatedPage) => {
      const intakes = await base44.entities.WebsiteIntake.filter({ id: websiteIntakeId });
      if (intakes[0]) {
        const structure = intakes[0].website_structure ? JSON.parse(intakes[0].website_structure) : { pages: [] };
        const pageIdx = structure.pages.findIndex(p => p.id === updatedPage.id);
        if (pageIdx >= 0) {
          structure.pages[pageIdx] = updatedPage;
        }
        await base44.entities.WebsiteIntake.update(websiteIntakeId, {
          website_structure: JSON.stringify(structure)
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['website-pages'] });
      setEditingId(null);
      toast.success('Page content updated!');
    }
  });

  const handleEditPage = (page) => {
    setEditingId(page.id);
    setEditData({ ...page });
  };

  const handleSavePage = () => {
    updatePageMutation.mutate(editData);
  };

  const handleCancel = () => {
    setEditingId(null);
    setEditData({});
  };

  return (
    <Card className="border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-400" />
              Website Content Manager
            </CardTitle>
            <CardDescription>Edit and manage your website pages and content</CardDescription>
          </div>
          <Button
            onClick={() => setShowForm(!showForm)}
            className="bg-blue-600 hover:bg-blue-700"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Page
          </Button>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {pages.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            <FileText className="w-12 h-12 mx-auto mb-2 opacity-30" />
            <p>No pages yet. Your website structure will appear here once it's generated.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {pages.map((page) => (
              <div
                key={page.id || page.name}
                className="bg-slate-700/30 rounded-lg p-4 border border-slate-600"
              >
                {editingId === (page.id || page.name) ? (
                  <div className="space-y-3">
                    <Input
                      label="Page Title"
                      value={editData.name || ''}
                      onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                      className="bg-slate-800"
                    />
                    <Textarea
                      label="Page Description"
                      value={editData.description || ''}
                      onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                      rows={4}
                      className="bg-slate-800"
                    />
                    <div className="flex gap-2">
                      <Button
                        onClick={handleSavePage}
                        disabled={updatePageMutation.isPending}
                        className="bg-green-600 hover:bg-green-700 flex-1"
                        size="sm"
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save Changes
                      </Button>
                      <Button
                        onClick={handleCancel}
                        variant="outline"
                        className="flex-1"
                        size="sm"
                      >
                        <X className="w-4 h-4 mr-2" />
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-semibold text-white mb-2">{page.name}</h4>
                      {page.sections && (
                        <div className="text-sm text-slate-300 mb-2">
                          <p className="text-xs text-slate-400 mb-1">Sections:</p>
                          <div className="flex flex-wrap gap-1">
                            {page.sections.map((section, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {section.heading || `Section ${idx + 1}`}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                      {page.description && (
                        <p className="text-sm text-slate-400 line-clamp-2">{page.description}</p>
                      )}
                    </div>
                    <Button
                      onClick={() => handleEditPage(page)}
                      variant="outline"
                      size="sm"
                      className="ml-4"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}