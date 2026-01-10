import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Search, TrendingUp, Sparkles, Loader2, Save } from "lucide-react";
import { toast } from "sonner";

export default function AdminSEOTools() {
  const [selectedWebsite, setSelectedWebsite] = useState(null);
  const [metaEdits, setMetaEdits] = useState({});
  const [keywordInput, setKeywordInput] = useState('');
  const queryClient = useQueryClient();

  const { data: websites = [] } = useQuery({
    queryKey: ['live-websites'],
    queryFn: () => base44.entities.WebsiteIntake.filter({ website_status: 'live' }),
  });

  const generateKeywordsMutation = useMutation({
    mutationFn: async (website) => {
      const prompt = `Generate SEO keyword research for:

Business: ${website.company_name}
Industry: Based on company name
Goals: ${website.business_goals?.join(', ')}
Target Keywords: ${keywordInput}

Provide:
- Primary keywords (high volume, relevant)
- Long-tail keywords (specific, lower competition)
- LSI keywords (semantic variations)
- Content topic ideas
- Optimization recommendations

Return as JSON.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            primary_keywords: { type: "array", items: { type: "string" } },
            long_tail_keywords: { type: "array", items: { type: "string" } },
            lsi_keywords: { type: "array", items: { type: "string" } },
            content_ideas: { type: "array", items: { type: "string" } },
            recommendations: { type: "array", items: { type: "string" } }
          }
        }
      });

      return response;
    },
    onSuccess: () => {
      toast.success('Keyword research generated!');
    },
  });

  const generateSEOReportMutation = useMutation({
    mutationFn: async (website) => {
      const prompt = `Analyze and provide SEO optimization recommendations for:

Business: ${website.company_name}
Website: ${website.live_url}
Industry: Based on company name
Current Setup: ${website.style_preference} style website

Provide detailed recommendations for:
- On-page SEO improvements
- Technical SEO issues to address
- Content optimization strategies
- Link building opportunities
- Local SEO tactics (if applicable)

Return as JSON with actionable items.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            on_page: { type: "array", items: { type: "string" } },
            technical: { type: "array", items: { type: "string" } },
            content: { type: "array", items: { type: "string" } },
            link_building: { type: "array", items: { type: "string" } },
            local_seo: { type: "array", items: { type: "string" } }
          }
        }
      });

      return response;
    },
    onSuccess: () => {
      toast.success('SEO report generated!');
    },
  });

  const updateMetaMutation = useMutation({
    mutationFn: async ({ websiteId, metaData }) => {
      const currentData = websites.find(w => w.id === websiteId);
      const updatedStructure = currentData.preview_url ? JSON.parse(currentData.preview_url) : {};
      
      updatedStructure.seo_meta = metaData;

      await base44.entities.WebsiteIntake.update(websiteId, {
        preview_url: JSON.stringify(updatedStructure)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['live-websites'] });
      toast.success('Meta tags updated!');
    },
  });

  return (
    <div className="space-y-6">
      <Card className="border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5 text-blue-400" />
            Advanced SEO Management
          </CardTitle>
          <CardDescription>Manage SEO for all client websites</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="bulk-meta">
            <TabsList>
              <TabsTrigger value="bulk-meta">Bulk Meta Edit</TabsTrigger>
              <TabsTrigger value="keywords">Keyword Research</TabsTrigger>
              <TabsTrigger value="monitoring">SEO Monitoring</TabsTrigger>
            </TabsList>

            <TabsContent value="bulk-meta" className="space-y-4">
              <div className="space-y-3">
                {websites.length === 0 ? (
                  <p className="text-center py-8 text-slate-400">No live websites yet</p>
                ) : (
                  websites.map(website => (
                    <Card key={website.id} className="border border-slate-600 bg-slate-700/30">
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-base">{website.company_name}</CardTitle>
                            <CardDescription>{website.live_url}</CardDescription>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => setSelectedWebsite(selectedWebsite?.id === website.id ? null : website)}
                          >
                            {selectedWebsite?.id === website.id ? 'Close' : 'Edit Meta'}
                          </Button>
                        </div>
                      </CardHeader>
                      {selectedWebsite?.id === website.id && (
                        <CardContent className="space-y-3">
                          <div>
                            <label className="text-sm font-medium text-slate-300 mb-1 block">
                              Meta Title
                            </label>
                            <Input
                              placeholder="Enter meta title (50-60 chars)"
                              value={metaEdits[website.id]?.title || ''}
                              onChange={(e) => setMetaEdits({
                                ...metaEdits,
                                [website.id]: { ...metaEdits[website.id], title: e.target.value }
                              })}
                            />
                          </div>
                          <div>
                            <label className="text-sm font-medium text-slate-300 mb-1 block">
                              Meta Description
                            </label>
                            <Textarea
                              placeholder="Enter meta description (150-160 chars)"
                              value={metaEdits[website.id]?.description || ''}
                              onChange={(e) => setMetaEdits({
                                ...metaEdits,
                                [website.id]: { ...metaEdits[website.id], description: e.target.value }
                              })}
                              rows={3}
                            />
                          </div>
                          <Button
                            onClick={() => updateMetaMutation.mutate({
                              websiteId: website.id,
                              metaData: metaEdits[website.id]
                            })}
                            disabled={updateMetaMutation.isPending}
                            className="w-full"
                          >
                            <Save className="w-4 h-4 mr-2" />
                            Save Meta Tags
                          </Button>
                        </CardContent>
                      )}
                    </Card>
                  ))
                )}
              </div>
            </TabsContent>

            <TabsContent value="keywords" className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">
                  Select Website for Keyword Research
                </label>
                <select
                  className="w-full border rounded-md px-3 py-2 bg-slate-700 text-white mb-3"
                  onChange={(e) => setSelectedWebsite(websites.find(w => w.id === e.target.value))}
                  value={selectedWebsite?.id || ''}
                >
                  <option value="">-- Select Website --</option>
                  {websites.map(w => (
                    <option key={w.id} value={w.id}>{w.company_name}</option>
                  ))}
                </select>

                {selectedWebsite && (
                  <>
                    <Input
                      placeholder="Optional: Add seed keywords..."
                      value={keywordInput}
                      onChange={(e) => setKeywordInput(e.target.value)}
                      className="mb-3"
                    />
                    <Button
                      onClick={() => generateKeywordsMutation.mutate(selectedWebsite)}
                      disabled={generateKeywordsMutation.isPending}
                      className="w-full bg-purple-600 hover:bg-purple-700 mb-4"
                    >
                      {generateKeywordsMutation.isPending ? 
                        <Loader2 className="w-4 h-4 animate-spin mr-2" /> : 
                        <Sparkles className="w-4 h-4 mr-2" />
                      }
                      Generate Keyword Research
                    </Button>
                  </>
                )}
              </div>

              {generateKeywordsMutation.data && (
                <div className="space-y-3">
                  <Card className="border border-slate-600 bg-slate-700/30">
                    <CardHeader>
                      <CardTitle className="text-sm">Primary Keywords</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {generateKeywordsMutation.data.primary_keywords?.map((kw, idx) => (
                          <Badge key={idx} className="bg-blue-600">{kw}</Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border border-slate-600 bg-slate-700/30">
                    <CardHeader>
                      <CardTitle className="text-sm">Long-Tail Keywords</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {generateKeywordsMutation.data.long_tail_keywords?.map((kw, idx) => (
                          <Badge key={idx} variant="outline">{kw}</Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border border-slate-600 bg-slate-700/30">
                    <CardHeader>
                      <CardTitle className="text-sm">Content Ideas</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="list-disc list-inside space-y-1 text-sm text-slate-300">
                        {generateKeywordsMutation.data.content_ideas?.map((idea, idx) => (
                          <li key={idx}>{idea}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              )}
            </TabsContent>

            <TabsContent value="monitoring" className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">
                  Select Website for SEO Analysis
                </label>
                <select
                  className="w-full border rounded-md px-3 py-2 bg-slate-700 text-white mb-3"
                  onChange={(e) => setSelectedWebsite(websites.find(w => w.id === e.target.value))}
                  value={selectedWebsite?.id || ''}
                >
                  <option value="">-- Select Website --</option>
                  {websites.map(w => (
                    <option key={w.id} value={w.id}>{w.company_name}</option>
                  ))}
                </select>

                {selectedWebsite && (
                  <Button
                    onClick={() => generateSEOReportMutation.mutate(selectedWebsite)}
                    disabled={generateSEOReportMutation.isPending}
                    className="w-full bg-purple-600 hover:bg-purple-700 mb-4"
                  >
                    {generateSEOReportMutation.isPending ? 
                      <Loader2 className="w-4 h-4 animate-spin mr-2" /> : 
                      <TrendingUp className="w-4 h-4 mr-2" />
                    }
                    Generate SEO Report
                  </Button>
                )}
              </div>

              {generateSEOReportMutation.data && (
                <div className="space-y-3">
                  {Object.entries(generateSEOReportMutation.data).map(([category, items]) => (
                    <Card key={category} className="border border-slate-600 bg-slate-700/30">
                      <CardHeader>
                        <CardTitle className="text-sm capitalize">
                          {category.replace(/_/g, ' ')}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="list-disc list-inside space-y-1 text-sm text-slate-300">
                          {items?.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}