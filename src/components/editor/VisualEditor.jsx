import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Edit2, Plus, Trash2, Save } from "lucide-react";
import { toast } from "sonner";

export default function VisualEditor({ websiteStructure, onSave }) {
  const [editedStructure, setEditedStructure] = useState(websiteStructure);
  const [editingSection, setEditingSection] = useState(null);

  const templates = [
    { id: 'hero', name: 'Hero Section', content: { heading: 'Welcome to Our Company', content_outline: 'Compelling headline with call-to-action' } },
    { id: 'features', name: 'Features Grid', content: { heading: 'Our Features', content_outline: 'Showcase 3-4 key features with icons' } },
    { id: 'testimonials', name: 'Testimonials', content: { heading: 'What Clients Say', content_outline: 'Customer testimonials and reviews' } },
    { id: 'cta', name: 'Call to Action', content: { heading: 'Ready to Get Started?', content_outline: 'Strong CTA with contact button' } },
    { id: 'team', name: 'Team Section', content: { heading: 'Meet Our Team', content_outline: 'Team member profiles with photos' } },
    { id: 'pricing', name: 'Pricing Table', content: { heading: 'Our Pricing', content_outline: 'Pricing tiers and packages' } }
  ];

  const handleAddSection = (pageIndex, template) => {
    const newStructure = { ...editedStructure };
    newStructure.pages[pageIndex].sections.push(template.content);
    setEditedStructure(newStructure);
    toast.success('Section added!');
  };

  const handleEditSection = (pageIndex, sectionIndex) => {
    setEditingSection({ pageIndex, sectionIndex });
  };

  const handleSaveSection = (pageIndex, sectionIndex, newContent) => {
    const newStructure = { ...editedStructure };
    newStructure.pages[pageIndex].sections[sectionIndex] = newContent;
    setEditedStructure(newStructure);
    setEditingSection(null);
    toast.success('Section updated!');
  };

  const handleDeleteSection = (pageIndex, sectionIndex) => {
    const newStructure = { ...editedStructure };
    newStructure.pages[pageIndex].sections.splice(sectionIndex, 1);
    setEditedStructure(newStructure);
    toast.success('Section deleted');
  };

  const handleSaveAll = () => {
    onSave(editedStructure);
    toast.success('Website structure saved!');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-white">Visual Editor</h2>
        <Button onClick={handleSaveAll} className="bg-green-600 hover:bg-green-700">
          <Save className="w-4 h-4 mr-2" />
          Save All Changes
        </Button>
      </div>

      <Tabs defaultValue="0">
        <TabsList>
          {editedStructure.pages?.map((page, idx) => (
            <TabsTrigger key={idx} value={String(idx)}>
              {page.title}
            </TabsTrigger>
          ))}
        </TabsList>

        {editedStructure.pages?.map((page, pageIndex) => (
          <TabsContent key={pageIndex} value={String(pageIndex)} className="space-y-4">
            {/* Page Sections */}
            {page.sections?.map((section, sectionIndex) => (
              <Card key={sectionIndex} className="border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <CardTitle className="text-lg">{section.heading}</CardTitle>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleEditSection(pageIndex, sectionIndex)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDeleteSection(pageIndex, sectionIndex)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {editingSection?.pageIndex === pageIndex && editingSection?.sectionIndex === sectionIndex ? (
                    <div className="space-y-3">
                      <Input
                        value={section.heading}
                        onChange={(e) => {
                          const newSection = { ...section, heading: e.target.value };
                          handleSaveSection(pageIndex, sectionIndex, newSection);
                        }}
                        placeholder="Section heading"
                      />
                      <Textarea
                        value={section.content_outline}
                        onChange={(e) => {
                          const newSection = { ...section, content_outline: e.target.value };
                          handleSaveSection(pageIndex, sectionIndex, newSection);
                        }}
                        rows={4}
                        placeholder="Section content..."
                      />
                    </div>
                  ) : (
                    <p className="text-sm text-slate-300">{section.content_outline}</p>
                  )}
                </CardContent>
              </Card>
            ))}

            {/* Add Section */}
            <Card className="border-2 border-dashed border-slate-600 bg-slate-800/30">
              <CardContent className="pt-6">
                <h3 className="text-sm font-semibold text-white mb-3">Add Section Template</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {templates.map(template => (
                    <Button
                      key={template.id}
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddSection(pageIndex, template)}
                      className="justify-start"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {template.name}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}