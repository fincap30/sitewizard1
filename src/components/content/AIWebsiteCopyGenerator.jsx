import React, { useState } from 'react';
import { useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sparkles, Loader2, Copy, Check } from "lucide-react";
import { toast } from "sonner";

export default function AIWebsiteCopyGenerator({ websiteIntake }) {
  const [generatedCopy, setGeneratedCopy] = useState({});
  const [copied, setCopied] = useState('');

  const generateCopyMutation = useMutation({
    mutationFn: async (section) => {
      const prompt = `Generate SEO-optimized, conversion-focused website copy.

Business: ${websiteIntake.company_name}
Industry: Inferred from business name
Goals: ${websiteIntake.business_goals?.join(', ')}
Style: ${websiteIntake.style_preference}

Section: ${section}

${section === 'about' ? `Generate compelling About Us page with:
- Opening paragraph (mission/story)
- What makes us unique (2-3 points)
- Team/values section
- Call-to-action` : ''}

${section === 'services' ? `Generate Services page with:
- Services overview intro
- 3-4 key services with descriptions
- Benefits of choosing us
- Call-to-action` : ''}

${section === 'contact' ? `Generate Contact page with:
- Welcoming opening paragraph
- Why get in touch
- Contact methods description
- Response time promise` : ''}

${section === 'hero' ? `Generate hero section with:
- Attention-grabbing headline (10 words max)
- Compelling subheadline (20 words max)
- Primary CTA text
- Secondary CTA text` : ''}

Write in a ${websiteIntake.style_preference || 'professional'} tone. Optimize for SEO and conversions.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true
      });

      return { section, content: response };
    },
    onSuccess: (data) => {
      setGeneratedCopy(prev => ({ ...prev, [data.section]: data.content }));
      toast.success(`${data.section} copy generated!`);
    },
  });

  const handleCopy = (section) => {
    navigator.clipboard.writeText(generatedCopy[section]);
    setCopied(section);
    setTimeout(() => setCopied(''), 2000);
    toast.success('Copied!');
  };

  const sections = [
    { id: 'hero', label: 'Hero Section', icon: '🎯' },
    { id: 'about', label: 'About Us', icon: '👥' },
    { id: 'services', label: 'Services', icon: '⚙️' },
    { id: 'contact', label: 'Contact', icon: '📧' }
  ];

  return (
    <Card className="border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          AI Website Copy Generator
        </CardTitle>
        <CardDescription>Auto-generate optimized content for all pages</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="hero">
          <TabsList className="grid w-full grid-cols-4">
            {sections.map(s => (
              <TabsTrigger key={s.id} value={s.id}>{s.icon}</TabsTrigger>
            ))}
          </TabsList>

          {sections.map(section => (
            <TabsContent key={section.id} value={section.id} className="space-y-3">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-white">{section.label}</h3>
                <Button
                  onClick={() => generateCopyMutation.mutate(section.id)}
                  disabled={generateCopyMutation.isPending}
                  size="sm"
                >
                  {generateCopyMutation.isPending && generateCopyMutation.variables === section.id ? 
                    <Loader2 className="w-3 h-3 animate-spin mr-2" /> : 
                    <Sparkles className="w-3 h-3 mr-2" />
                  }
                  Generate
                </Button>
              </div>

              {generatedCopy[section.id] && (
                <Card className="bg-slate-700/30">
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start mb-2">
                      <Badge className="bg-green-600">Generated</Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCopy(section.id)}
                      >
                        {copied === section.id ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      </Button>
                    </div>
                    <p className="text-sm text-slate-200 whitespace-pre-wrap">{generatedCopy[section.id]}</p>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </CardContent>
    </Card>
  );
}