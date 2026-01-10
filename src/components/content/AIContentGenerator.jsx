import React, { useState } from 'react';
import { useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, Sparkles, Copy, CheckCircle } from "lucide-react";
import { toast } from "sonner";

export default function AIContentGenerator({ websiteIntake, template }) {
  const [generatedContent, setGeneratedContent] = useState(null);
  const [selectedSection, setSelectedSection] = useState(null);
  const [copied, setCopied] = useState(null);

  const generateFullContentMutation = useMutation({
    mutationFn: async () => {
      const templateTone = template?.style_preference || 'professional';
      const templateStyle = {
        modern: 'contemporary, clean, minimal',
        corporate: 'professional, authoritative, formal',
        bold: 'energetic, vibrant, attention-grabbing',
        minimal: 'elegant, refined, understated'
      }[templateTone] || 'professional';

      const prompt = `Generate complete, SEO-optimized website content for all key pages.

Business: ${websiteIntake?.company_name}
Industry: ${websiteIntake?.goal_description}
Goals: ${websiteIntake?.business_goals?.join(', ')}
Style: ${templateStyle}
Target Audience: Professional audience in ${websiteIntake?.country}

Create content for each section below with:
- Natural language and SEO keywords
- Compelling headlines and CTAs
- Business-focused messaging
- Professional tone matching: ${templateStyle}

SECTIONS REQUIRED:

1. HERO SECTION (Homepage)
   - Headline (max 60 chars, benefit-focused)
   - Subheadline (max 120 chars)
   - Body copy (150-200 words)
   - CTA button text
   - Hero background description

2. FEATURES SECTION
   - 5-6 key features
   - Each with title, description (30-50 words), and icon suggestion

3. ABOUT US PAGE
   - Company story (150-200 words, compelling narrative)
   - Mission statement (20-30 words)
   - Team intro (100 words)
   - Why choose us (3-4 key differentiators)

4. SERVICES/PRODUCTS INTRO
   - Overview headline
   - Category descriptions (2-3 sentences each for 4 categories)
   - Value proposition per category

5. TESTIMONIALS SECTION
   - 3 sample testimonials with customer name, quote, result
   - Company/role for each

6. FAQ SECTION
   - 5-6 common questions with detailed answers

7. FOOTER CONTENT
   - Company tagline (10-15 words)
   - Quick links organization
   - Footer CTA
   - Copyright message

Return as structured JSON with all sections.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            hero: {
              type: "object",
              properties: {
                headline: { type: "string" },
                subheadline: { type: "string" },
                body: { type: "string" },
                cta_text: { type: "string" },
                background: { type: "string" }
              }
            },
            features: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  description: { type: "string" },
                  icon: { type: "string" }
                }
              }
            },
            about_us: {
              type: "object",
              properties: {
                story: { type: "string" },
                mission: { type: "string" },
                team_intro: { type: "string" },
                differentiators: { type: "array", items: { type: "string" } }
              }
            },
            services: {
              type: "object",
              properties: {
                overview: { type: "string" },
                categories: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      name: { type: "string" },
                      description: { type: "string" },
                      value_prop: { type: "string" }
                    }
                  }
                }
              }
            },
            testimonials: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  quote: { type: "string" },
                  author: { type: "string" },
                  role: { type: "string" },
                  company: { type: "string" },
                  result: { type: "string" }
                }
              }
            },
            faq: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  question: { type: "string" },
                  answer: { type: "string" }
                }
              }
            },
            footer: {
              type: "object",
              properties: {
                tagline: { type: "string" },
                quick_links: { type: "array", items: { type: "string" } },
                cta: { type: "string" },
                copyright: { type: "string" }
              }
            }
          }
        }
      });

      return response;
    },
    onSuccess: (content) => {
      setGeneratedContent(content);
      setSelectedSection('hero');
      toast.success('Website content generated!');
    },
    onError: () => {
      toast.error('Failed to generate content');
    }
  });

  const handleCopy = (text, sectionId) => {
    navigator.clipboard.writeText(text);
    setCopied(sectionId);
    setTimeout(() => setCopied(null), 2000);
  };

  const renderSection = (section) => {
    switch (section) {
      case 'hero':
        return (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-2">Headline</label>
              <div className="bg-slate-800/50 rounded p-3 text-white break-words">
                {generatedContent.hero.headline}
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleCopy(generatedContent.hero.headline, 'hero-headline')}
                className="mt-2"
              >
                {copied === 'hero-headline' ? 'Copied!' : 'Copy'}
              </Button>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-2">Subheadline</label>
              <div className="bg-slate-800/50 rounded p-3 text-slate-200 break-words">
                {generatedContent.hero.subheadline}
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleCopy(generatedContent.hero.subheadline, 'hero-sub')}
                className="mt-2"
              >
                {copied === 'hero-sub' ? 'Copied!' : 'Copy'}
              </Button>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-2">Body Copy</label>
              <div className="bg-slate-800/50 rounded p-3 text-slate-300 break-words text-sm">
                {generatedContent.hero.body}
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleCopy(generatedContent.hero.body, 'hero-body')}
                className="mt-2"
              >
                {copied === 'hero-body' ? 'Copied!' : 'Copy'}
              </Button>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-2">CTA Button Text</label>
              <Badge className="bg-blue-600">{generatedContent.hero.cta_text}</Badge>
            </div>
          </div>
        );

      case 'features':
        return (
          <div className="space-y-4">
            {generatedContent.features.map((feature, idx) => (
              <div key={idx} className="bg-slate-800/30 rounded-lg p-4 border border-slate-700">
                <div className="flex items-start justify-between mb-2">
                  <h5 className="font-semibold text-white">{feature.title}</h5>
                  <Badge variant="outline" className="text-xs">Icon: {feature.icon}</Badge>
                </div>
                <p className="text-slate-300 text-sm mb-3">{feature.description}</p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => handleCopy(feature.description, `feature-${idx}`)}
                >
                  {copied === `feature-${idx}` ? 'Copied!' : 'Copy'}
                </Button>
              </div>
            ))}
          </div>
        );

      case 'about':
        return (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-2">Company Story</label>
              <div className="bg-slate-800/50 rounded p-3 text-slate-300 break-words text-sm">
                {generatedContent.about_us.story}
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => handleCopy(generatedContent.about_us.story, 'about-story')}
                className="mt-2"
              >
                {copied === 'about-story' ? 'Copied!' : 'Copy'}
              </Button>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-2">Mission Statement</label>
              <div className="bg-slate-800/50 rounded p-3 text-white break-words">
                {generatedContent.about_us.mission}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-2">Why Choose Us</label>
              <ul className="space-y-2">
                {generatedContent.about_us.differentiators.map((diff, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-slate-300 text-sm">
                    <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                    <span>{diff}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        );

      case 'services':
        return (
          <div className="space-y-4">
            <div className="bg-slate-800/50 rounded p-4 border border-slate-700">
              <h5 className="font-semibold text-white mb-2">Overview</h5>
              <p className="text-slate-300 text-sm">{generatedContent.services.overview}</p>
            </div>
            {generatedContent.services.categories.map((cat, idx) => (
              <div key={idx} className="bg-slate-800/30 rounded-lg p-4 border border-slate-700">
                <h6 className="font-semibold text-white mb-2">{cat.name}</h6>
                <p className="text-slate-300 text-sm mb-2">{cat.description}</p>
                <p className="text-blue-400 text-sm italic">Value: {cat.value_prop}</p>
              </div>
            ))}
          </div>
        );

      case 'testimonials':
        return (
          <div className="space-y-4">
            {generatedContent.testimonials.map((testi, idx) => (
              <div key={idx} className="bg-slate-800/30 rounded-lg p-4 border border-slate-700">
                <p className="text-slate-300 italic mb-3">"{testi.quote}"</p>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-white text-sm">{testi.author}</p>
                    <p className="text-slate-400 text-xs">{testi.role} at {testi.company}</p>
                  </div>
                  <Badge className="bg-green-600">{testi.result}</Badge>
                </div>
              </div>
            ))}
          </div>
        );

      case 'faq':
        return (
          <div className="space-y-3">
            {generatedContent.faq.map((item, idx) => (
              <div key={idx} className="bg-slate-800/30 rounded-lg p-4 border border-slate-700">
                <h6 className="font-semibold text-white mb-2">Q: {item.question}</h6>
                <p className="text-slate-300 text-sm">A: {item.answer}</p>
              </div>
            ))}
          </div>
        );

      case 'footer':
        return (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-2">Tagline</label>
              <div className="bg-slate-800/50 rounded p-3 text-white break-words">
                {generatedContent.footer.tagline}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-2">Quick Links</label>
              <div className="flex flex-wrap gap-2">
                {generatedContent.footer.quick_links.map((link, idx) => (
                  <Badge key={idx} variant="outline">{link}</Badge>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-slate-400 block mb-2">Footer CTA</label>
              <div className="bg-blue-900/20 rounded p-3 text-blue-300 break-words text-sm">
                {generatedContent.footer.cta}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card className="border-2 border-purple-500/30 bg-purple-900/10">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          AI Website Content Generator
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {!generatedContent ? (
          <div className="space-y-4">
            <p className="text-slate-300 text-sm">
              Generate complete, SEO-optimized content for all your website pages aligned with your template style.
            </p>
            <Button
              onClick={() => generateFullContentMutation.mutate()}
              disabled={generateFullContentMutation.isPending}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {generateFullContentMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating Content...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2" />
                  Generate All Website Content
                </>
              )}
            </Button>
          </div>
        ) : (
          <Tabs value={selectedSection} onValueChange={setSelectedSection} className="w-full">
            <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7">
              <TabsTrigger value="hero">Hero</TabsTrigger>
              <TabsTrigger value="features">Features</TabsTrigger>
              <TabsTrigger value="about">About</TabsTrigger>
              <TabsTrigger value="services">Services</TabsTrigger>
              <TabsTrigger value="testimonials">Reviews</TabsTrigger>
              <TabsTrigger value="faq">FAQ</TabsTrigger>
              <TabsTrigger value="footer">Footer</TabsTrigger>
            </TabsList>

            {selectedSection && (
              <TabsContent value={selectedSection} className="space-y-4 mt-4">
                {renderSection(selectedSection)}
              </TabsContent>
            )}
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
}