import React, { useState } from 'react';
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Loader2, CheckCircle, Layout, Palette, FileText, Search } from "lucide-react";
import { toast } from "sonner";

export default function AIWebsiteBuilder({ websiteIntake, onComplete }) {
  const [buildProgress, setBuildProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState('');
  const [generatedWebsite, setGeneratedWebsite] = useState(null);
  const queryClient = useQueryClient();

  const buildWebsiteMutation = useMutation({
    mutationFn: async () => {
      setBuildProgress(0);
      setCurrentStep('Analyzing your business...');

      // Step 1: Generate website structure
      setBuildProgress(20);
      setCurrentStep('Creating website structure...');
      
      const structurePrompt = `Generate complete professional website structure.

Company: ${websiteIntake.company_name}
Industry: ${websiteIntake.goal_description}
Goals: ${websiteIntake.business_goals?.join(', ')}
Style: ${websiteIntake.style_preference || 'modern'}
Colors: ${websiteIntake.brand_colors}
Current Site: ${websiteIntake.current_website || 'None'}
Facebook: ${websiteIntake.facebook_page || 'None'}

Create full website with:
1. Page structure (Home, About, Services/Products, Contact, etc.)
2. Navigation menu
3. Hero sections for each page
4. Content sections with copy
5. Call-to-action buttons
6. Footer content
7. Color scheme (primary, secondary, accent)
8. Typography choices

Return complete JSON structure ready for implementation.`;

      const structure = await base44.integrations.Core.InvokeLLM({
        prompt: structurePrompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            site_name: { type: "string" },
            tagline: { type: "string" },
            navigation: {
              type: "array",
              items: { type: "object", properties: { label: { type: "string" }, href: { type: "string" } } }
            },
            pages: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  hero: { type: "object", properties: { headline: { type: "string" }, subheadline: { type: "string" }, cta: { type: "string" } } },
                  sections: {
                    type: "array",
                    items: { type: "object", properties: { type: { type: "string" }, heading: { type: "string" }, content: { type: "string" } } }
                  }
                }
              }
            },
            color_scheme: {
              type: "object",
              properties: { primary: { type: "string" }, secondary: { type: "string" }, accent: { type: "string" } }
            },
            typography: { type: "object", properties: { headings: { type: "string" }, body: { type: "string" } } }
          }
        }
      });

      // Step 2: Generate SEO content
      setBuildProgress(40);
      setCurrentStep('Optimizing for search engines...');

      const seoPrompt = `Generate comprehensive SEO optimization for website.

Business: ${websiteIntake.company_name}
Industry: ${websiteIntake.goal_description}
Location: ${websiteIntake.city}, ${websiteIntake.country}

Create:
1. Meta titles and descriptions for each page
2. Target keywords (10-15 primary keywords)
3. Internal linking strategy
4. Schema markup recommendations
5. XML sitemap structure
6. Robots.txt directives
7. Alt text recommendations for images

Return as structured JSON.`;

      const seoData = await base44.integrations.Core.InvokeLLM({
        prompt: seoPrompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            meta_tags: {
              type: "array",
              items: { type: "object", properties: { page: { type: "string" }, title: { type: "string" }, description: { type: "string" } } }
            },
            keywords: { type: "array", items: { type: "string" } },
            internal_links: { type: "array", items: { type: "object" } },
            schema: { type: "object" },
            image_alt_texts: { type: "array", items: { type: "string" } }
          }
        }
      });

      // Step 3: Generate content assets
      setBuildProgress(60);
      setCurrentStep('Writing professional content...');

      const contentPrompt = `Generate compelling marketing content.

Business: ${websiteIntake.company_name}
Value Proposition: Based on ${websiteIntake.goal_description}
Target Audience: Based on business type

Create:
1. Value propositions (3-5 unique angles)
2. Feature/benefit descriptions (5-7)
3. Trust signals (testimonials, guarantees, certifications)
4. FAQ content (8-10 common questions)
5. Call-to-action variations (5-7 CTAs)
6. Social proof elements

Return as JSON.`;

      const content = await base44.integrations.Core.InvokeLLM({
        prompt: contentPrompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            value_propositions: { type: "array", items: { type: "string" } },
            features: { type: "array", items: { type: "object", properties: { title: { type: "string" }, description: { type: "string" } } } },
            trust_signals: { type: "array", items: { type: "string" } },
            faqs: { type: "array", items: { type: "object", properties: { question: { type: "string" }, answer: { type: "string" } } } },
            ctas: { type: "array", items: { type: "string" } }
          }
        }
      });

      // Step 4: Generate design system
      setBuildProgress(80);
      setCurrentStep('Finalizing design system...');

      const designPrompt = `Create comprehensive design system.

Style: ${websiteIntake.style_preference}
Brand Colors: ${websiteIntake.brand_colors}
Industry: ${websiteIntake.goal_description}

Define:
1. Component styles (buttons, cards, forms)
2. Spacing scale (margins, padding)
3. Border radius values
4. Shadow styles
5. Animation/transition guidelines
6. Responsive breakpoints
7. Icon style recommendations

Return as JSON design tokens.`;

      const designSystem = await base44.integrations.Core.InvokeLLM({
        prompt: designPrompt,
        response_json_schema: {
          type: "object",
          properties: {
            components: { type: "object" },
            spacing: { type: "object" },
            borders: { type: "object" },
            shadows: { type: "object" },
            animations: { type: "object" }
          }
        }
      });

      setBuildProgress(100);
      setCurrentStep('Build complete!');

      // Combine all generated data
      const fullWebsite = {
        structure,
        seo: seoData,
        content,
        design: designSystem,
        generated_at: new Date().toISOString()
      };

      // Save to WebsiteIntake
      await base44.entities.WebsiteIntake.update(websiteIntake.id, {
        website_structure: JSON.stringify(fullWebsite),
        website_status: 'review'
      });

      return fullWebsite;
    },
    onSuccess: (website) => {
      setGeneratedWebsite(website);
      queryClient.invalidateQueries({ queryKey: ['website-intake'] });
      toast.success('Website built successfully!');
      if (onComplete) onComplete(website);
    },
    onError: () => {
      toast.error('Build failed. Please try again.');
      setBuildProgress(0);
      setCurrentStep('');
    }
  });

  return (
    <Card className="border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-purple-400" />
          AI Website Builder
        </CardTitle>
        <CardDescription>
          Automatically generate your complete professional website with AI
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {!buildWebsiteMutation.isPending && !generatedWebsite && (
          <Alert className="bg-blue-600/10 border-blue-500/30">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <AlertDescription className="text-blue-300">
              Our AI will analyze your business and create a complete website with design, content, and SEO optimization.
              This usually takes 2-3 minutes.
            </AlertDescription>
          </Alert>
        )}

        {buildWebsiteMutation.isPending && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
              <span className="text-white font-medium">{currentStep}</span>
            </div>
            <Progress value={buildProgress} className="h-2" />
            <p className="text-sm text-slate-400">{buildProgress}% complete</p>
          </div>
        )}

        {generatedWebsite && (
          <Tabs defaultValue="overview">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="pages">Pages</TabsTrigger>
              <TabsTrigger value="seo">SEO</TabsTrigger>
              <TabsTrigger value="content">Content</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-3">
              <Card className="bg-slate-700/30">
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white">{generatedWebsite.structure.site_name}</h3>
                      <p className="text-slate-300">{generatedWebsite.structure.tagline}</p>
                    </div>
                    <Badge className="bg-green-600">Ready</Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-800/50 p-3 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Layout className="w-4 h-4 text-blue-400" />
                        <span className="text-sm font-medium text-slate-300">Pages</span>
                      </div>
                      <p className="text-2xl font-bold text-white">{generatedWebsite.structure.pages?.length}</p>
                    </div>

                    <div className="bg-slate-800/50 p-3 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Search className="w-4 h-4 text-green-400" />
                        <span className="text-sm font-medium text-slate-300">Keywords</span>
                      </div>
                      <p className="text-2xl font-bold text-white">{generatedWebsite.seo.keywords?.length}</p>
                    </div>

                    <div className="bg-slate-800/50 p-3 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Palette className="w-4 h-4 text-purple-400" />
                        <span className="text-sm font-medium text-slate-300">Colors</span>
                      </div>
                      <div className="flex gap-1 mt-2">
                        <div className="w-6 h-6 rounded" style={{ backgroundColor: generatedWebsite.structure.color_scheme.primary }} />
                        <div className="w-6 h-6 rounded" style={{ backgroundColor: generatedWebsite.structure.color_scheme.secondary }} />
                        <div className="w-6 h-6 rounded" style={{ backgroundColor: generatedWebsite.structure.color_scheme.accent }} />
                      </div>
                    </div>

                    <div className="bg-slate-800/50 p-3 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <FileText className="w-4 h-4 text-yellow-400" />
                        <span className="text-sm font-medium text-slate-300">Features</span>
                      </div>
                      <p className="text-2xl font-bold text-white">{generatedWebsite.content.features?.length}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="pages" className="space-y-3">
              {generatedWebsite.structure.pages?.map((page, idx) => (
                <Card key={idx} className="bg-slate-700/30">
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-white">{page.name}</h4>
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    </div>
                    <div className="space-y-2">
                      <div className="bg-slate-800/50 p-3 rounded">
                        <p className="text-sm font-medium text-blue-300">Hero Section</p>
                        <p className="text-white font-semibold mt-1">{page.hero?.headline}</p>
                        <p className="text-sm text-slate-300 mt-1">{page.hero?.subheadline}</p>
                      </div>
                      <p className="text-xs text-slate-400">{page.sections?.length} content sections</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </TabsContent>

            <TabsContent value="seo" className="space-y-3">
              <Card className="bg-slate-700/30">
                <CardContent className="pt-4">
                  <h4 className="font-semibold text-white mb-3">Target Keywords</h4>
                  <div className="flex flex-wrap gap-2">
                    {generatedWebsite.seo.keywords?.map((keyword, idx) => (
                      <Badge key={idx} variant="outline">{keyword}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-slate-700/30">
                <CardContent className="pt-4">
                  <h4 className="font-semibold text-white mb-3">Page Meta Tags</h4>
                  {generatedWebsite.seo.meta_tags?.map((meta, idx) => (
                    <div key={idx} className="bg-slate-800/50 p-3 rounded mb-2">
                      <p className="text-sm font-medium text-blue-300">{meta.page}</p>
                      <p className="text-white text-sm mt-1">{meta.title}</p>
                      <p className="text-xs text-slate-400 mt-1">{meta.description}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="content" className="space-y-3">
              <Card className="bg-slate-700/30">
                <CardContent className="pt-4">
                  <h4 className="font-semibold text-white mb-3">Value Propositions</h4>
                  {generatedWebsite.content.value_propositions?.map((prop, idx) => (
                    <p key={idx} className="text-slate-300 mb-2">• {prop}</p>
                  ))}
                </CardContent>
              </Card>

              <Card className="bg-slate-700/30">
                <CardContent className="pt-4">
                  <h4 className="font-semibold text-white mb-3">Key Features</h4>
                  {generatedWebsite.content.features?.map((feature, idx) => (
                    <div key={idx} className="bg-slate-800/50 p-3 rounded mb-2">
                      <p className="font-semibold text-white">{feature.title}</p>
                      <p className="text-sm text-slate-300 mt-1">{feature.description}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        )}

        {!generatedWebsite && (
          <Button
            onClick={() => buildWebsiteMutation.mutate()}
            disabled={buildWebsiteMutation.isPending}
            className="w-full bg-purple-600 hover:bg-purple-700 text-lg py-6"
          >
            {buildWebsiteMutation.isPending ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                Building Your Website...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Start Building Website
              </>
            )}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}