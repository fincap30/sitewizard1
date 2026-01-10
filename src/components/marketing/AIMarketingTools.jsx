import React, { useState } from 'react';
import { useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, Copy, Check, Share2, Mail, TrendingUp } from "lucide-react";
import { toast } from "sonner";

export default function AIMarketingTools({ websiteIntake }) {
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState({
    platform: 'facebook',
    blogTopic: '',
    newsletterTheme: ''
  });
  const [generatedContent, setGeneratedContent] = useState('');

  const generateMutation = useMutation({
    mutationFn: async (type) => {
      let prompt = '';
      
      if (type === 'social') {
        prompt = `Generate 5 engaging social media posts for ${formData.platform}.

Business: ${websiteIntake.company_name}
Industry: Based on company name
Goals: ${websiteIntake.business_goals?.join(', ')}
Website: ${websiteIntake.live_url || 'launching soon'}

Create posts that:
- Drive traffic to website
- Showcase services/products
- Build engagement
- Include relevant hashtags

Return as JSON array of posts with text and hashtag suggestions.`;
      } else if (type === 'newsletter') {
        prompt = `Draft an email newsletter.

Business: ${websiteIntake.company_name}
Theme: ${formData.newsletterTheme || 'Latest updates'}
Goals: ${websiteIntake.business_goals?.join(', ')}

Include:
- Catchy subject line
- Opening paragraph
- 2-3 main content sections
- Strong call-to-action
- Closing

Make it engaging and professional.`;
      } else if (type === 'seo-strategy') {
        prompt = `Provide SEO content optimization strategies for blog posts.

Business: ${websiteIntake.company_name}
Industry: Based on company name
Blog Topic: ${formData.blogTopic}

Provide:
- Target keywords to include
- Recommended heading structure (H2, H3)
- Internal linking suggestions
- Meta description tips
- Content length recommendation
- Call-to-action placement

Return as JSON with actionable strategies.`;
      }

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: type === 'social' ? {
          type: "object",
          properties: {
            posts: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  text: { type: "string" },
                  hashtags: { type: "array", items: { type: "string" } }
                }
              }
            }
          }
        } : type === 'seo-strategy' ? {
          type: "object",
          properties: {
            keywords: { type: "array", items: { type: "string" } },
            heading_structure: { type: "array", items: { type: "string" } },
            internal_links: { type: "array", items: { type: "string" } },
            meta_tips: { type: "string" },
            content_length: { type: "string" },
            cta_placement: { type: "string" }
          }
        } : null
      });

      return type === 'newsletter' ? response : JSON.stringify(response, null, 2);
    },
    onSuccess: (content) => {
      setGeneratedContent(content);
      toast.success('Marketing content generated!');
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
          <Share2 className="w-5 h-5 text-pink-400" />
          AI Marketing Assistant
        </CardTitle>
        <CardDescription>Generate marketing content to promote your website</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="social">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="social">Social Media</TabsTrigger>
            <TabsTrigger value="newsletter">Newsletter</TabsTrigger>
            <TabsTrigger value="seo">SEO Strategy</TabsTrigger>
          </TabsList>

          <TabsContent value="social" className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">Platform</label>
              <select
                className="w-full border rounded-md px-3 py-2 bg-slate-700 text-white"
                value={formData.platform}
                onChange={(e) => setFormData({...formData, platform: e.target.value})}
              >
                <option value="facebook">Facebook</option>
                <option value="instagram">Instagram</option>
                <option value="twitter">Twitter/X</option>
                <option value="linkedin">LinkedIn</option>
              </select>
            </div>
            <Button
              onClick={() => generateMutation.mutate('social')}
              disabled={generateMutation.isPending}
              className="w-full bg-pink-600 hover:bg-pink-700"
            >
              {generateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
              Generate Social Posts
            </Button>
          </TabsContent>

          <TabsContent value="newsletter" className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">Newsletter Theme</label>
              <Input
                value={formData.newsletterTheme}
                onChange={(e) => setFormData({...formData, newsletterTheme: e.target.value})}
                placeholder="e.g., New product launch, Monthly update"
              />
            </div>
            <Button
              onClick={() => generateMutation.mutate('newsletter')}
              disabled={generateMutation.isPending}
              className="w-full bg-pink-600 hover:bg-pink-700"
            >
              {generateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Mail className="w-4 h-4 mr-2" />}
              Generate Newsletter
            </Button>
          </TabsContent>

          <TabsContent value="seo" className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-300 mb-2 block">Blog Post Topic *</label>
              <Input
                value={formData.blogTopic}
                onChange={(e) => setFormData({...formData, blogTopic: e.target.value})}
                placeholder="e.g., 10 Tips for Better Customer Service"
                required
              />
            </div>
            <Button
              onClick={() => generateMutation.mutate('seo-strategy')}
              disabled={generateMutation.isPending || !formData.blogTopic}
              className="w-full bg-pink-600 hover:bg-pink-700"
            >
              {generateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <TrendingUp className="w-4 h-4 mr-2" />}
              Get SEO Strategy
            </Button>
          </TabsContent>
        </Tabs>

        {generatedContent && (
          <div className="mt-6 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-300">Generated Content</label>
              <Button size="sm" variant="outline" onClick={handleCopy}>
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
          </div>
        )}
      </CardContent>
    </Card>
  );
}