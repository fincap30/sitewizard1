import React, { useState } from 'react';
import { useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2, FileText } from "lucide-react";
import { toast } from "sonner";

export default function AIBlogGenerator({ websiteIntake }) {
  const [topic, setTopic] = useState('');
  const [keywords, setKeywords] = useState('');
  const [outline, setOutline] = useState(null);
  const [fullDraft, setFullDraft] = useState('');

  const generateOutlineMutation = useMutation({
    mutationFn: async () => {
      const prompt = `Generate SEO-optimized blog post outline.

Business: ${websiteIntake.company_name}
Industry: Based on business
Target Keywords: ${keywords}
Topic: ${topic}

Create comprehensive outline with:
- SEO-optimized title (60 chars max)
- Meta description (150-160 chars)
- 5-7 main sections with H2 headings
- 2-3 subsections per main section
- Target keywords naturally integrated
- Call-to-action placement

Return as JSON.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            title: { type: "string" },
            meta_description: { type: "string" },
            sections: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  heading: { type: "string" },
                  subsections: { type: "array", items: { type: "string" } }
                }
              }
            }
          }
        }
      });

      return response;
    },
    onSuccess: (data) => {
      setOutline(data);
      toast.success('Outline generated!');
    },
  });

  const generateDraftMutation = useMutation({
    mutationFn: async () => {
      const prompt = `Write complete blog post.

Outline:
Title: ${outline.title}
Meta: ${outline.meta_description}

Sections:
${outline.sections.map(s => `${s.heading}\n${s.subsections.join('\n')}`).join('\n\n')}

Business: ${websiteIntake.company_name}
Keywords: ${keywords}

Write full blog post (800-1200 words) with:
- Engaging introduction
- Detailed sections following outline
- Natural keyword integration
- Expert insights
- Actionable takeaways
- Strong conclusion with CTA

Use conversational, authoritative tone.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true
      });

      return response;
    },
    onSuccess: (data) => {
      setFullDraft(data);
      toast.success('Full draft generated!');
    },
  });

  return (
    <Card className="border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-400" />
          AI Blog Post Generator
        </CardTitle>
        <CardDescription>Create SEO-optimized blog content from keywords</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="outline">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="outline">Outline</TabsTrigger>
            <TabsTrigger value="draft">Full Draft</TabsTrigger>
          </TabsList>

          <TabsContent value="outline" className="space-y-3">
            <div>
              <Label>Blog Topic *</Label>
              <Input
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., 10 Tips for Better Website SEO"
              />
            </div>
            <div>
              <Label>Target Keywords</Label>
              <Input
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="e.g., SEO tips, website optimization"
              />
            </div>
            <Button
              onClick={() => generateOutlineMutation.mutate()}
              disabled={generateOutlineMutation.isPending || !topic}
              className="w-full"
            >
              {generateOutlineMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
              Generate Outline
            </Button>

            {outline && (
              <Card className="bg-slate-700/30">
                <CardContent className="pt-4 space-y-3">
                  <div>
                    <Badge className="mb-2">Title</Badge>
                    <p className="text-white font-semibold">{outline.title}</p>
                  </div>
                  <div>
                    <Badge className="mb-2">Meta Description</Badge>
                    <p className="text-sm text-slate-300">{outline.meta_description}</p>
                  </div>
                  <div>
                    <Badge className="mb-2">Sections</Badge>
                    {outline.sections?.map((section, idx) => (
                      <div key={idx} className="mt-2">
                        <p className="font-semibold text-white">{section.heading}</p>
                        <ul className="list-disc list-inside text-sm text-slate-400 ml-4">
                          {section.subsections?.map((sub, i) => (
                            <li key={i}>{sub}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="draft" className="space-y-3">
            <Button
              onClick={() => generateDraftMutation.mutate()}
              disabled={generateDraftMutation.isPending || !outline}
              className="w-full"
            >
              {generateDraftMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
              Generate Full Draft
            </Button>

            {fullDraft && (
              <Card className="bg-slate-700/30">
                <CardContent className="pt-4">
                  <Textarea
                    value={fullDraft}
                    onChange={(e) => setFullDraft(e.target.value)}
                    rows={20}
                    className="font-mono text-sm"
                  />
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}