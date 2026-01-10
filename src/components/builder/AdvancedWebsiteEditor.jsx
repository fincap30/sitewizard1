import React, { useState } from 'react';
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { GripVertical, Edit2, Save, Plus, Trash2, Eye, Palette, Type } from "lucide-react";
import { toast } from "sonner";

export default function AdvancedWebsiteEditor({ websiteIntake, websiteData }) {
  const [editingSection, setEditingSection] = useState(null);
  const [pages, setPages] = useState(websiteData.structure.pages || []);
  const [designSettings, setDesignSettings] = useState({
    fonts: {
      headings: websiteData.structure.typography?.headings || 'Inter',
      body: websiteData.structure.typography?.body || 'Inter'
    },
    spacing: {
      section: '64px',
      element: '16px'
    },
    borderRadius: '8px'
  });
  const queryClient = useQueryClient();

  const saveChangesMutation = useMutation({
    mutationFn: async () => {
      const updatedWebsite = {
        ...websiteData,
        structure: {
          ...websiteData.structure,
          pages,
          typography: designSettings.fonts
        },
        design: {
          ...websiteData.design,
          spacing: designSettings.spacing,
          borderRadius: designSettings.borderRadius
        }
      };

      await base44.entities.WebsiteIntake.update(websiteIntake.id, {
        website_structure: JSON.stringify(updatedWebsite)
      });

      return updatedWebsite;
    },
    onSuccess: () => {
      toast.success('Changes saved!');
      queryClient.invalidateQueries({ queryKey: ['website-intake'] });
    }
  });

  const handleDragEnd = (result, pageIdx) => {
    if (!result.destination) return;

    const newPages = [...pages];
    const sections = Array.from(newPages[pageIdx].sections);
    const [removed] = sections.splice(result.source.index, 1);
    sections.splice(result.destination.index, 0, removed);
    newPages[pageIdx].sections = sections;
    setPages(newPages);
  };

  const addSection = (pageIdx) => {
    const newPages = [...pages];
    newPages[pageIdx].sections.push({
      type: 'content',
      heading: 'New Section',
      content: 'Add your content here...'
    });
    setPages(newPages);
  };

  const deleteSection = (pageIdx, sectionIdx) => {
    const newPages = [...pages];
    newPages[pageIdx].sections.splice(sectionIdx, 1);
    setPages(newPages);
  };

  const updateSection = (pageIdx, sectionIdx, field, value) => {
    const newPages = [...pages];
    newPages[pageIdx].sections[sectionIdx][field] = value;
    setPages(newPages);
  };

  return (
    <Card className="border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Edit2 className="w-5 h-5 text-purple-400" />
            Advanced Website Editor
          </span>
          <Button
            onClick={() => saveChangesMutation.mutate()}
            disabled={saveChangesMutation.isPending}
            className="bg-green-600 hover:bg-green-700"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="content">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="content">Content Editor</TabsTrigger>
            <TabsTrigger value="design">Design Settings</TabsTrigger>
            <TabsTrigger value="seo">SEO Optimizer</TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-4">
            {pages.map((page, pageIdx) => (
              <Card key={pageIdx} className="bg-slate-700/30">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-semibold text-white">{page.name}</h3>
                    <Button
                      size="sm"
                      onClick={() => addSection(pageIdx)}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add Section
                    </Button>
                  </div>

                  <DragDropContext onDragEnd={(result) => handleDragEnd(result, pageIdx)}>
                    <Droppable droppableId={`page-${pageIdx}`}>
                      {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                          {page.sections?.map((section, sectionIdx) => (
                            <Draggable
                              key={`${pageIdx}-${sectionIdx}`}
                              draggableId={`${pageIdx}-${sectionIdx}`}
                              index={sectionIdx}
                            >
                              {(provided) => (
                                <div
                                  ref={provided.innerRef}
                                  {...provided.draggableProps}
                                  className="bg-slate-800/50 p-4 rounded-lg border border-slate-600"
                                >
                                  <div className="flex items-start gap-3">
                                    <div {...provided.dragHandleProps}>
                                      <GripVertical className="w-5 h-5 text-slate-400 cursor-move" />
                                    </div>
                                    <div className="flex-1 space-y-2">
                                      <Input
                                        value={section.heading}
                                        onChange={(e) => updateSection(pageIdx, sectionIdx, 'heading', e.target.value)}
                                        className="font-semibold"
                                      />
                                      <Textarea
                                        value={section.content}
                                        onChange={(e) => updateSection(pageIdx, sectionIdx, 'content', e.target.value)}
                                        rows={3}
                                      />
                                      <div className="flex items-center gap-2">
                                        <Badge>{section.type}</Badge>
                                        {section.cta && (
                                          <Input
                                            value={section.cta}
                                            onChange={(e) => updateSection(pageIdx, sectionIdx, 'cta', e.target.value)}
                                            placeholder="CTA Text"
                                            className="w-48"
                                          />
                                        )}
                                      </div>
                                    </div>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => deleteSection(pageIdx, sectionIdx)}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </div>
                      )}
                    </Droppable>
                  </DragDropContext>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="design" className="space-y-4">
            <Card className="bg-slate-700/30">
              <CardContent className="pt-4 space-y-4">
                <div>
                  <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                    <Type className="w-4 h-4" />
                    Typography
                  </h4>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-slate-300 mb-1 block">Headings Font</label>
                      <select
                        value={designSettings.fonts.headings}
                        onChange={(e) => setDesignSettings({
                          ...designSettings,
                          fonts: { ...designSettings.fonts, headings: e.target.value }
                        })}
                        className="w-full border rounded-md px-3 py-2 bg-slate-700 text-white"
                      >
                        <option value="Inter">Inter</option>
                        <option value="Poppins">Poppins</option>
                        <option value="Playfair Display">Playfair Display</option>
                        <option value="Montserrat">Montserrat</option>
                        <option value="Roboto">Roboto</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm text-slate-300 mb-1 block">Body Font</label>
                      <select
                        value={designSettings.fonts.body}
                        onChange={(e) => setDesignSettings({
                          ...designSettings,
                          fonts: { ...designSettings.fonts, body: e.target.value }
                        })}
                        className="w-full border rounded-md px-3 py-2 bg-slate-700 text-white"
                      >
                        <option value="Inter">Inter</option>
                        <option value="Open Sans">Open Sans</option>
                        <option value="Lato">Lato</option>
                        <option value="Roboto">Roboto</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-white mb-3 flex items-center gap-2">
                    <Palette className="w-4 h-4" />
                    Spacing & Layout
                  </h4>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-sm text-slate-300 mb-1 block">Section Spacing</label>
                      <Input
                        value={designSettings.spacing.section}
                        onChange={(e) => setDesignSettings({
                          ...designSettings,
                          spacing: { ...designSettings.spacing, section: e.target.value }
                        })}
                        placeholder="64px"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-300 mb-1 block">Element Spacing</label>
                      <Input
                        value={designSettings.spacing.element}
                        onChange={(e) => setDesignSettings({
                          ...designSettings,
                          spacing: { ...designSettings.spacing, element: e.target.value }
                        })}
                        placeholder="16px"
                      />
                    </div>
                    <div>
                      <label className="text-sm text-slate-300 mb-1 block">Border Radius</label>
                      <Input
                        value={designSettings.borderRadius}
                        onChange={(e) => setDesignSettings({
                          ...designSettings,
                          borderRadius: e.target.value
                        })}
                        placeholder="8px"
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="seo">
            <SEOOptimizer websiteData={websiteData} pages={pages} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}

function SEOOptimizer({ websiteData, pages }) {
  const [analysis, setAnalysis] = useState(null);

  const analyzeSEO = useMutation({
    mutationFn: async () => {
      const prompt = `Analyze SEO optimization for website and provide real-time suggestions.

Pages: ${pages.map(p => p.name).join(', ')}
Current Keywords: ${websiteData.seo?.keywords?.join(', ')}
Meta Tags: ${JSON.stringify(websiteData.seo?.meta_tags)}

Analyze:
1. Keyword density and placement
2. Meta title and description optimization
3. Header structure (H1, H2, H3)
4. Content length recommendations
5. Internal linking opportunities
6. Image alt text suggestions
7. Mobile optimization score
8. Page speed recommendations

Return actionable suggestions for each page.`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            overall_score: { type: "number" },
            suggestions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  page: { type: "string" },
                  issues: { type: "array", items: { type: "string" } },
                  improvements: { type: "array", items: { type: "string" } },
                  priority: { type: "string" }
                }
              }
            },
            keywords_to_add: { type: "array", items: { type: "string" } },
            technical_seo: { type: "array", items: { type: "string" } }
          }
        }
      });

      return result;
    },
    onSuccess: (data) => {
      setAnalysis(data);
      toast.success('SEO analysis complete!');
    }
  });

  return (
    <Card className="bg-slate-700/30">
      <CardContent className="pt-4 space-y-4">
        <Button
          onClick={() => analyzeSEO.mutate()}
          disabled={analyzeSEO.isPending}
          className="w-full"
        >
          {analyzeSEO.isPending ? 'Analyzing SEO...' : 'Run SEO Analysis'}
        </Button>

        {analysis && (
          <>
            <div className="text-center p-4 bg-slate-800/50 rounded-lg">
              <p className="text-sm text-slate-400 mb-2">Overall SEO Score</p>
              <p className="text-4xl font-bold text-green-400">{analysis.overall_score}/100</p>
            </div>

            <div className="space-y-3">
              {analysis.suggestions?.map((suggestion, idx) => (
                <Card key={idx} className="bg-slate-800/50">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-semibold text-white">{suggestion.page}</h5>
                      <Badge className={
                        suggestion.priority === 'high' ? 'bg-red-600' :
                        suggestion.priority === 'medium' ? 'bg-yellow-600' :
                        'bg-green-600'
                      }>
                        {suggestion.priority}
                      </Badge>
                    </div>
                    <div className="text-sm space-y-2">
                      <div>
                        <p className="text-red-300 font-medium">Issues:</p>
                        {suggestion.issues?.map((issue, i) => (
                          <p key={i} className="text-slate-300">• {issue}</p>
                        ))}
                      </div>
                      <div>
                        <p className="text-green-300 font-medium">Improvements:</p>
                        {suggestion.improvements?.map((imp, i) => (
                          <p key={i} className="text-slate-300">✓ {imp}</p>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}