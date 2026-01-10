import React, { useState } from 'react';
import { useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2, Copy, Check, Search } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

export default function AIContentGenerator({ websiteIntake, onContentGenerated }) {
  const [activeTab, setActiveTab] = useState('page-copy');
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState({
    pageType: 'home',
    keywords: '',
    blogTopic: '',
    tone: 'professional',
    variationCount: 3
  });
  const [generatedContent, setGeneratedContent] = useState('');
  const [variations, setVariations] = useState([]);

  const generateMutation = useMutation({
    mutationFn: async (type) => {
      let prompt = '';
      
      if (type === 'page-copy') {
        prompt = `Write compelling website copy for a ${formData.pageType} page.

Business: ${websiteIntake.company_name}
Industry: Based on company name
Goals: ${websiteIntake.business_goals?.join(', ')}
Style: ${websiteIntake.style_preference}
Keywords: ${formData.keywords || 'relevant industry keywords'}
Tone: ${formData.tone}

Write engaging, conversion-focused copy with:
- Compelling headline
- 3-4 sections with subheadings
- Clear call-to-action
- SEO-friendly content`;
      } else if (type === 'seo-meta') {
        prompt = `Generate SEO-optimized meta tags for a ${formData.pageType} page.

Business: ${websiteIntake.company_name}
Goals: ${websiteIntake.business_goals?.join(', ')}
Keywords: ${formData.keywords}

Return JSON with:
{
  "title": "SEO title (50-60 chars)",
  "description": "Meta description (150-160 chars)",
  "keywords": ["keyword1", "keyword2", "keyword3"]
}`;
      } else if (type === 'blog-post') {
        prompt = `Write a complete blog post.

Business: ${websiteIntake.company_name}
Topic: ${formData.blogTopic}
Keywords: ${formData.keywords}
Tone: ${formData.tone}

Include:
- Engaging title
- Introduction (2-3 paragraphs)
- 3-4 main sections with subheadings
- Conclusion with CTA
- SEO-optimized content`;
      }

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: type === 'seo-meta' ? {
          type: "object",
          properties: {
            title: { type: "string" },
            description: { type: "string" },
            keywords: { type: "array", items: { type: "string" } }
          }
        } : null
      });

      return type === 'seo-meta' ? JSON.stringify(response, null, 2) : response;
    },
    onSuccess: (content) => {
      setGeneratedContent(content);
      toast.success('Content generated successfully!');
    },
  });

  const generateVariationsMutation = useMutation({
    mutationFn: async () => {
      const prompt = `Generate ${formData.variationCount} variations of this content with different angles and CTAs.

Original Content:
${generatedContent}

Business: ${websiteIntake.company_name}
Goals: ${websiteIntake.business_goals?.join(', ')}

Create variations that:
- Use different persuasive angles
- Have unique calls-to-action
- Maintain the same core message
- Appeal to different audience segments

Return as JSON array of variations.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            variations: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  angle: { type: "string" },
                  content: { type: "string" },
                  cta: { type: "string" }
                }
              }
            }
          }
        }
      });

      return response.variations;
    },
    onSuccess: (data) => {
      setVariations(data);
      toast.success('Variations generated!');
    },
  });

  const analyzeMutation = useMutation({
    mutationFn: async () => {
      const prompt = `Analyze existing page content and suggest improvements.

Current Content:
${generatedContent}

Business: ${websiteIntake.company_name}
Goals: ${websiteIntake.business_goals?.join(', ')}

Suggest:
1. New sections to add (for engagement)
2. Blog post ideas (for SEO and audience engagement)
3. Content gaps to fill
4. SEO optimization opportunities

Return as JSON with actionable suggestions.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            new_sections: { type: "array", items: { type: "string" } },
            blog_ideas: { type: "array", items: { type: "string" } },
            content_gaps: { type: "array", items: { type: "string" } },
            seo_opportunities: { type: "array", items: { type: "string" } }
          }
        }
      });

      return response;
    },
  });

  const handleCopy = () => {
    navigator.clipboard.writeText(generatedContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copied to clipboard!');
  };

  return (
    <Card className="border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          AI Content Generator
        </CardTitle>
        <CardDescription>Generate professional content for your website</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="page-copy">Page Copy</TabsTrigger>
            <TabsTrigger value="seo-meta">SEO Meta</TabsTrigger>
            <TabsTrigger value="blog-post">Blog Post</TabsTrigger>
          </TabsList>

          <TabsContent value="page-copy" className="space-y-4">
            <div>
              <Label>Page Type</Label>
              <select
                className="w-full border rounded-md px-3 py-2 mt-1 bg-slate-700 text-white"
                value={formData.pageType}
                onChange={(e) => setFormData({...formData, pageType: e.target.value})}
              >
                <option value="home">Home Page</option>
                <option value="about">About Us</option>
                <option value="services">Services</option>
                <option value="contact">Contact</option>
                <option value="pricing">Pricing</option>
              </select>
            </div>
            <div>
              <Label>Target Keywords (optional)</Label>
              <Input
                value={formData.keywords}
                onChange={(e) => setFormData({...formData, keywords: e.target.value})}
                placeholder="e.g., web design, professional services"
              />
            </div>
            <div>
              <Label>Tone</Label>
              <select
                className="w-full border rounded-md px-3 py-2 mt-1 bg-slate-700 text-white"
                value={formData.tone}
                onChange={(e) => setFormData({...formData, tone: e.target.value})}
              >
                <option value="professional">Professional</option>
                <option value="casual">Casual</option>
                <option value="friendly">Friendly</option>
                <option value="authoritative">Authoritative</option>
              </select>
            </div>
            <Button
              onClick={() => generateMutation.mutate('page-copy')}
              disabled={generateMutation.isPending}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {generateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
              Generate Page Copy
            </Button>
          </TabsContent>

          <TabsContent value="seo-meta" className="space-y-4">
            <div>
              <Label>Page Type</Label>
              <select
                className="w-full border rounded-md px-3 py-2 mt-1 bg-slate-700 text-white"
                value={formData.pageType}
                onChange={(e) => setFormData({...formData, pageType: e.target.value})}
              >
                <option value="home">Home Page</option>
                <option value="about">About Us</option>
                <option value="services">Services</option>
                <option value="contact">Contact</option>
              </select>
            </div>
            <div>
              <Label>Target Keywords *</Label>
              <Input
                value={formData.keywords}
                onChange={(e) => setFormData({...formData, keywords: e.target.value})}
                placeholder="e.g., web design services, professional websites"
                required
              />
            </div>
            <Button
              onClick={() => generateMutation.mutate('seo-meta')}
              disabled={generateMutation.isPending || !formData.keywords}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {generateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
              Generate SEO Meta Tags
            </Button>
          </TabsContent>

          <TabsContent value="blog-post" className="space-y-4">
            <div>
              <Label>Blog Topic *</Label>
              <Input
                value={formData.blogTopic}
                onChange={(e) => setFormData({...formData, blogTopic: e.target.value})}
                placeholder="e.g., 10 Tips for Better Website Design"
                required
              />
            </div>
            <div>
              <Label>Target Keywords</Label>
              <Input
                value={formData.keywords}
                onChange={(e) => setFormData({...formData, keywords: e.target.value})}
                placeholder="e.g., website design, UX best practices"
              />
            </div>
            <div>
              <Label>Tone</Label>
              <select
                className="w-full border rounded-md px-3 py-2 mt-1 bg-slate-700 text-white"
                value={formData.tone}
                onChange={(e) => setFormData({...formData, tone: e.target.value})}
              >
                <option value="professional">Professional</option>
                <option value="casual">Casual</option>
                <option value="informative">Informative</option>
                <option value="conversational">Conversational</option>
              </select>
            </div>
            <Button
              onClick={() => generateMutation.mutate('blog-post')}
              disabled={generateMutation.isPending || !formData.blogTopic}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {generateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
              Generate Blog Post
            </Button>
          </TabsContent>
        </Tabs>

        {generatedContent && (
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between">
              <Label>Generated Content</Label>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopy}
              >
                {copied ? <Check className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
            <Textarea
              value={generatedContent}
              onChange={(e) => setGeneratedContent(e.target.value)}
              rows={15}
              className="font-mono text-sm"
            />
            <div className="flex gap-2">
              <Button
                onClick={() => generateVariationsMutation.mutate()}
                disabled={generateVariationsMutation.isPending}
                variant="outline"
                className="flex-1"
              >
                {generateVariationsMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Sparkles className="w-3 h-3 mr-2" />}
                Generate Variations
              </Button>
              <Button
                onClick={() => analyzeMutation.mutate()}
                disabled={analyzeMutation.isPending}
                variant="outline"
                className="flex-1"
              >
                {analyzeMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Search className="w-3 h-3 mr-2" />}
                Analyze Content
              </Button>
            </div>
            {onContentGenerated && (
              <Button
                onClick={() => onContentGenerated(generatedContent)}
                className="w-full"
              >
                Use This Content
              </Button>
            )}
          </div>
        )}

        {variations.length > 0 && (
          <div className="mt-6 space-y-3 pt-4 border-t">
            <h4 className="font-semibold text-white">Content Variations</h4>
            {variations.map((variation, idx) => (
              <Card key={idx} className="bg-slate-700/30">
                <CardContent className="pt-4">
                  <div className="mb-2">
                    <span className="text-xs font-semibold text-purple-300">{variation.angle}</span>
                  </div>
                  <p className="text-sm text-slate-300 whitespace-pre-wrap mb-2">{variation.content}</p>
                  <p className="text-xs text-blue-300 italic">CTA: {variation.cta}</p>
                  <Button
                    size="sm"
                    onClick={() => setGeneratedContent(variation.content)}
                    className="mt-2 w-full"
                  >
                    Use This Variation
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {analyzeMutation.data && (
          <div className="mt-6 space-y-3 pt-4 border-t">
            <h4 className="font-semibold text-white">Content Analysis</h4>
            <Alert className="bg-blue-600/10 border-blue-500/30">
              <AlertDescription className="text-blue-300">
                <strong>New Sections to Add:</strong>
                <ul className="list-disc list-inside mt-1 text-sm">
                  {analyzeMutation.data.new_sections?.map((section, idx) => (
                    <li key={idx}>{section}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
            <Alert className="bg-green-600/10 border-green-500/30">
              <AlertDescription className="text-green-300">
                <strong>Blog Post Ideas:</strong>
                <ul className="list-disc list-inside mt-1 text-sm">
                  {analyzeMutation.data.blog_ideas?.map((idea, idx) => (
                    <li key={idx}>{idea}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          </div>
        )}
      </CardContent>
    </Card>
  );
}