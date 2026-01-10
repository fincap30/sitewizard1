import React, { useState } from 'react';
import { useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function AICustomizer({ websiteIntake, currentStructure, onApplyChanges }) {
  const [suggestions, setSuggestions] = useState(null);

  const generateSuggestionsMutation = useMutation({
    mutationFn: async (type) => {
      let prompt = '';
      
      if (type === 'layouts') {
        prompt = `Suggest 3 alternative page layout structures for a ${websiteIntake.style_preference} style website.

Business: ${websiteIntake.company_name}
Goals: ${websiteIntake.business_goals?.join(', ')}

For each layout, provide:
- Layout name
- Description
- Section structure (array of section types)
- Best for (use case)

Return JSON array of 3 layouts.`;
      } else if (type === 'colors') {
        prompt = `Generate 4 professional color scheme options.

Business: ${websiteIntake.company_name}
Current Colors: ${websiteIntake.brand_colors || 'Not specified'}
Style: ${websiteIntake.style_preference}
Industry: Based on company name

For each scheme, provide:
- Name
- Primary color (hex)
- Secondary color (hex)
- Accent color (hex)
- Background color (hex)
- Text color (hex)

Return JSON array of 4 color schemes.`;
      } else if (type === 'copy') {
        prompt = `Analyze and improve website copy and CTAs.

Current Structure: ${JSON.stringify(currentStructure?.pages?.[0]?.sections || [])}
Business: ${websiteIntake.company_name}
Goals: ${websiteIntake.business_goals?.join(', ')}

Provide:
- Improved headlines (3 options)
- Stronger CTAs (3 options)
- Copy improvements (specific suggestions)

Return JSON with improvements.`;
      }

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: type === 'layouts' ? {
            layouts: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  description: { type: "string" },
                  sections: { type: "array", items: { type: "string" } },
                  best_for: { type: "string" }
                }
              }
            }
          } : type === 'colors' ? {
            schemes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  primary: { type: "string" },
                  secondary: { type: "string" },
                  accent: { type: "string" },
                  background: { type: "string" },
                  text: { type: "string" }
                }
              }
            }
          } : {
            headlines: { type: "array", items: { type: "string" } },
            ctas: { type: "array", items: { type: "string" } },
            improvements: { type: "array", items: { type: "string" } }
          }
        }
      });

      return { type, data: response };
    },
    onSuccess: (result) => {
      setSuggestions(result);
      toast.success('AI suggestions generated!');
    },
  });

  const handleApplyLayout = (layout) => {
    if (onApplyChanges) {
      onApplyChanges({ type: 'layout', data: layout });
      toast.success('Layout applied!');
    }
  };

  const handleApplyColorScheme = (scheme) => {
    if (onApplyChanges) {
      onApplyChanges({ type: 'colors', data: scheme });
      toast.success('Color scheme applied!');
    }
  };

  return (
    <Card className="border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          AI Customization Assistant
        </CardTitle>
        <CardDescription>Get AI-powered suggestions to enhance your website</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="layouts">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="layouts">Layouts</TabsTrigger>
            <TabsTrigger value="colors">Colors</TabsTrigger>
            <TabsTrigger value="copy">Copy</TabsTrigger>
          </TabsList>

          <TabsContent value="layouts" className="space-y-4">
            <Button
              onClick={() => generateSuggestionsMutation.mutate('layouts')}
              disabled={generateSuggestionsMutation.isPending}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {generateSuggestionsMutation.isPending ? 
                <Loader2 className="w-4 h-4 animate-spin mr-2" /> : 
                <RefreshCw className="w-4 h-4 mr-2" />
              }
              Generate Layout Options
            </Button>

            {suggestions?.type === 'layouts' && suggestions?.data?.layouts?.map((layout, idx) => (
              <Card key={idx} className="border border-slate-600 bg-slate-700/30">
                <CardHeader>
                  <CardTitle className="text-base">{layout.name}</CardTitle>
                  <CardDescription>{layout.description}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-xs text-slate-400 mb-2">Sections:</p>
                    <div className="flex flex-wrap gap-1">
                      {layout.sections?.map((section, sidx) => (
                        <Badge key={sidx} variant="outline">{section}</Badge>
                      ))}
                    </div>
                  </div>
                  <p className="text-sm text-slate-300">
                    <strong>Best for:</strong> {layout.best_for}
                  </p>
                  <Button size="sm" onClick={() => handleApplyLayout(layout)} className="w-full">
                    Apply This Layout
                  </Button>
                </CardContent>
              </Card>
            ))}
          </TabsContent>

          <TabsContent value="colors" className="space-y-4">
            <Button
              onClick={() => generateSuggestionsMutation.mutate('colors')}
              disabled={generateSuggestionsMutation.isPending}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {generateSuggestionsMutation.isPending ? 
                <Loader2 className="w-4 h-4 animate-spin mr-2" /> : 
                <RefreshCw className="w-4 h-4 mr-2" />
              }
              Generate Color Schemes
            </Button>

            {suggestions?.type === 'colors' && (
              <div className="grid md:grid-cols-2 gap-3">
                {suggestions?.data?.schemes?.map((scheme, idx) => (
                  <Card key={idx} className="border border-slate-600 bg-slate-700/30">
                    <CardHeader>
                      <CardTitle className="text-base">{scheme.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="grid grid-cols-5 gap-2">
                        {['primary', 'secondary', 'accent', 'background', 'text'].map(color => (
                          <div key={color}>
                            <div 
                              className="w-full h-12 rounded border border-slate-600"
                              style={{ backgroundColor: scheme[color] }}
                            />
                            <p className="text-xs text-slate-400 mt-1 capitalize">{color}</p>
                          </div>
                        ))}
                      </div>
                      <Button size="sm" onClick={() => handleApplyColorScheme(scheme)} className="w-full">
                        Apply Colors
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="copy" className="space-y-4">
            <Button
              onClick={() => generateSuggestionsMutation.mutate('copy')}
              disabled={generateSuggestionsMutation.isPending}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {generateSuggestionsMutation.isPending ? 
                <Loader2 className="w-4 h-4 animate-spin mr-2" /> : 
                <RefreshCw className="w-4 h-4 mr-2" />
              }
              Analyze & Improve Copy
            </Button>

            {suggestions?.type === 'copy' && (
              <div className="space-y-4">
                <Card className="border border-slate-600 bg-slate-700/30">
                  <CardHeader>
                    <CardTitle className="text-base">Improved Headlines</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {suggestions?.data?.headlines?.map((headline, idx) => (
                        <li key={idx} className="text-sm text-white p-2 bg-slate-800/50 rounded">
                          {headline}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border border-slate-600 bg-slate-700/30">
                  <CardHeader>
                    <CardTitle className="text-base">Stronger CTAs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {suggestions?.data?.ctas?.map((cta, idx) => (
                        <li key={idx} className="text-sm text-white p-2 bg-slate-800/50 rounded">
                          {cta}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border border-slate-600 bg-slate-700/30">
                  <CardHeader>
                    <CardTitle className="text-base">Copy Improvements</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="list-disc list-inside space-y-1 text-sm text-slate-300">
                      {suggestions?.data?.improvements?.map((improvement, idx) => (
                        <li key={idx}>{improvement}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}