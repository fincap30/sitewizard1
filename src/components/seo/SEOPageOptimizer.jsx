import React, { useState } from 'react';
import { useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Sparkles, Copy, CheckCircle, AlertCircle, Code } from "lucide-react";
import { toast } from "sonner";

export default function SEOPageOptimizer({ page, websiteIntake, onUpdate = null }) {
  const [pageData, setPageData] = useState({
    title: page?.name || '',
    metaTitle: '',
    metaDescription: '',
    keywords: [],
    schemaMarkup: null,
    customKeywords: ''
  });
  const [suggestions, setSuggestions] = useState(null);
  const [selectedMetaTitle, setSelectedMetaTitle] = useState('');
  const [selectedMetaDesc, setSelectedMetaDesc] = useState('');
  const [copiedItem, setCopiedItem] = useState(null);

  const generateSEOSuggestions = useMutation({
    mutationFn: async () => {
      const prompt = `Generate SEO optimization for a website page.

Page: ${pageData.title}
Business: ${websiteIntake?.company_name || 'N/A'}
Industry: ${websiteIntake?.goal_description || 'N/A'}
Goals: ${websiteIntake?.business_goals?.join(', ') || 'General'}
Current Keywords: ${pageData.customKeywords || 'Not specified'}

Generate:
1. 5 compelling meta titles (50-60 characters, include primary keyword)
2. 5 meta descriptions (150-160 characters, include CTA)
3. 10-15 target keywords ranked by difficulty and search volume
4. Internal linking suggestions
5. Schema markup for ${pageData.title} (JSON-LD format)

Focus on:
- Natural language and user intent
- Search volume potential
- Competition level
- Conversion optimization`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            meta_titles: { type: "array", items: { type: "string" } },
            meta_descriptions: { type: "array", items: { type: "string" } },
            target_keywords: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  keyword: { type: "string" },
                  search_volume: { type: "number" },
                  difficulty: { type: "number" },
                  intent: { type: "string" }
                }
              }
            },
            internal_links: { type: "array", items: { type: "string" } },
            schema_markup: { type: "object" }
          }
        }
      });

      return response;
    },
    onSuccess: (data) => {
      setSuggestions(data);
      if (data.meta_titles?.[0]) setSelectedMetaTitle(data.meta_titles[0]);
      if (data.meta_descriptions?.[0]) setSelectedMetaDesc(data.meta_descriptions[0]);
      toast.success('SEO suggestions generated!');
    },
    onError: () => {
      toast.error('Failed to generate SEO suggestions');
    }
  });

  const handleCopy = (text, itemType) => {
    navigator.clipboard.writeText(text);
    setCopiedItem(itemType);
    setTimeout(() => setCopiedItem(null), 2000);
  };

  const handleApplySuggestions = () => {
    setPageData({
      ...pageData,
      metaTitle: selectedMetaTitle,
      metaDescription: selectedMetaDesc,
      schemaMarkup: suggestions?.schema_markup,
      keywords: suggestions?.target_keywords?.slice(0, 5).map(k => k.keyword) || []
    });

    if (onUpdate) {
      onUpdate({
        metaTitle: selectedMetaTitle,
        metaDescription: selectedMetaDesc,
        schema: suggestions?.schema_markup,
        keywords: suggestions?.target_keywords?.slice(0, 5).map(k => k.keyword) || []
      });
    }

    toast.success('SEO optimizations applied!');
  };

  return (
    <div className="space-y-6">
      <Card className="border-2 border-emerald-500/30 bg-emerald-900/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            SEO Page Optimizer
          </CardTitle>
          <CardDescription>AI-powered meta tags, keywords, and schema markup</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Page Input */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-300">Page Name</label>
            <Input
              value={pageData.title}
              onChange={(e) => setPageData({ ...pageData, title: e.target.value })}
              placeholder="e.g., Home, About, Products"
            />
          </div>

          {/* Custom Keywords Input */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-300">
              Target Keywords (optional, comma-separated)
            </label>
            <Textarea
              value={pageData.customKeywords}
              onChange={(e) => setPageData({ ...pageData, customKeywords: e.target.value })}
              placeholder="e.g., organic coffee, fair trade, sustainable"
              rows={2}
            />
          </div>

          {/* Generate Button */}
          <Button
            onClick={() => generateSEOSuggestions.mutate()}
            disabled={generateSEOSuggestions.isPending || !pageData.title}
            className="w-full bg-emerald-600 hover:bg-emerald-700"
          >
            {generateSEOSuggestions.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing Page...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate SEO Suggestions
              </>
            )}
          </Button>

          {/* Suggestions Display */}
          {suggestions && (
            <Tabs defaultValue="meta" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="meta">Meta Tags</TabsTrigger>
                <TabsTrigger value="keywords">Keywords</TabsTrigger>
                <TabsTrigger value="schema">Schema</TabsTrigger>
                <TabsTrigger value="links">Links</TabsTrigger>
              </TabsList>

              {/* Meta Tags Tab */}
              <TabsContent value="meta" className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <h4 className="font-semibold text-white mb-3">Meta Title Suggestions</h4>
                    <div className="space-y-2">
                      {suggestions.meta_titles?.map((title, idx) => (
                        <div
                          key={idx}
                          onClick={() => setSelectedMetaTitle(title)}
                          className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                            selectedMetaTitle === title
                              ? 'border-emerald-500 bg-emerald-900/20'
                              : 'border-slate-700 hover:border-emerald-500/50 bg-slate-800/30'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-slate-200 break-words">{title}</p>
                              <p className="text-xs text-slate-500 mt-1">{title.length} characters</p>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopy(title, `title-${idx}`);
                              }}
                              className="ml-2"
                            >
                              {copiedItem === `title-${idx}` ? (
                                <CheckCircle className="w-4 h-4 text-green-400" />
                              ) : (
                                <Copy className="w-4 h-4 text-slate-400" />
                              )}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-white mb-3">Meta Description Suggestions</h4>
                    <div className="space-y-2">
                      {suggestions.meta_descriptions?.map((desc, idx) => (
                        <div
                          key={idx}
                          onClick={() => setSelectedMetaDesc(desc)}
                          className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                            selectedMetaDesc === desc
                              ? 'border-emerald-500 bg-emerald-900/20'
                              : 'border-slate-700 hover:border-emerald-500/50 bg-slate-800/30'
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="text-slate-200 break-words text-sm">{desc}</p>
                              <p className="text-xs text-slate-500 mt-1">{desc.length} characters</p>
                            </div>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopy(desc, `desc-${idx}`);
                              }}
                              className="ml-2"
                            >
                              {copiedItem === `desc-${idx}` ? (
                                <CheckCircle className="w-4 h-4 text-green-400" />
                              ) : (
                                <Copy className="w-4 h-4 text-slate-400" />
                              )}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </TabsContent>

              {/* Keywords Tab */}
              <TabsContent value="keywords" className="space-y-4">
                <div className="space-y-3">
                  {suggestions.target_keywords?.map((kw, idx) => (
                    <div key={idx} className="bg-slate-800/50 rounded-lg p-4 border border-slate-700">
                      <div className="flex items-start justify-between mb-2">
                        <h5 className="font-semibold text-white">{kw.keyword}</h5>
                        <Badge className={
                          kw.difficulty < 30 ? 'bg-green-600' :
                          kw.difficulty < 60 ? 'bg-yellow-600' :
                          'bg-red-600'
                        }>
                          Difficulty: {Math.round(kw.difficulty)}
                        </Badge>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-slate-400 text-xs">Search Volume</p>
                          <p className="text-slate-200 font-medium">{kw.search_volume?.toLocaleString()}/mo</p>
                        </div>
                        <div>
                          <p className="text-slate-400 text-xs">Intent</p>
                          <p className="text-slate-200 font-medium capitalize">{kw.intent}</p>
                        </div>
                        <div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCopy(kw.keyword, `kw-${idx}`)}
                            className="border-slate-600"
                          >
                            {copiedItem === `kw-${idx}` ? '✓' : 'Copy'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>

              {/* Schema Tab */}
              <TabsContent value="schema" className="space-y-4">
                {suggestions.schema_markup && (
                  <div className="space-y-3">
                    <Alert className="bg-blue-900/10 border-blue-500/30">
                      <Code className="w-4 h-4 text-blue-400" />
                      <AlertDescription className="text-blue-300">
                        JSON-LD schema markup ready for implementation
                      </AlertDescription>
                    </Alert>

                    <div className="bg-slate-900 rounded-lg p-4 border border-slate-700 overflow-auto max-h-96">
                      <pre className="text-slate-200 text-xs whitespace-pre-wrap break-words">
                        {JSON.stringify(suggestions.schema_markup, null, 2)}
                      </pre>
                    </div>

                    <Button
                      onClick={() => handleCopy(JSON.stringify(suggestions.schema_markup, null, 2), 'schema')}
                      className="w-full bg-blue-600 hover:bg-blue-700"
                    >
                      {copiedItem === 'schema' ? 'Copied!' : 'Copy Schema Markup'}
                    </Button>
                  </div>
                )}
              </TabsContent>

              {/* Links Tab */}
              <TabsContent value="links" className="space-y-4">
                {suggestions.internal_links && suggestions.internal_links.length > 0 ? (
                  <div className="space-y-2">
                    <p className="text-sm text-slate-300 mb-3">Recommended internal links:</p>
                    {suggestions.internal_links.map((link, idx) => (
                      <div key={idx} className="flex items-center gap-2 p-3 bg-slate-800/30 rounded-lg border border-slate-700">
                        <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                        <p className="text-slate-300 text-sm flex-1">{link}</p>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleCopy(link, `link-${idx}`)}
                        >
                          {copiedItem === `link-${idx}` ? '✓' : 'Copy'}
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 text-sm">No internal link suggestions at this time</p>
                )}
              </TabsContent>
            </Tabs>
          )}

          {/* Apply Suggestions Button */}
          {suggestions && (
            <Button
              onClick={handleApplySuggestions}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              Apply Selected Suggestions
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Current SEO Status */}
      {pageData.metaTitle && (
        <Card className="border-2 border-slate-700/50 bg-slate-800/30">
          <CardHeader>
            <CardTitle className="text-base">Current SEO Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400">Meta Title</label>
              <div className="bg-slate-800/50 rounded p-3 text-slate-200 break-words">
                {pageData.metaTitle}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-medium text-slate-400">Meta Description</label>
              <div className="bg-slate-800/50 rounded p-3 text-slate-200 break-words">
                {pageData.metaDescription}
              </div>
            </div>
            {pageData.keywords.length > 0 && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400">Target Keywords</label>
                <div className="flex flex-wrap gap-2">
                  {pageData.keywords.map((kw, idx) => (
                    <Badge key={idx} variant="outline">{kw}</Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}