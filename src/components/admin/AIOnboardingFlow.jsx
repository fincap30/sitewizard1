import React, { useState } from 'react';
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles, Loader2, ArrowRight, Check } from "lucide-react";
import { toast } from "sonner";

export default function AIOnboardingFlow() {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    clientEmail: '',
    businessName: '',
    industry: '',
    description: '',
    goals: [],
    targetAudience: '',
    competitors: '',
    brandColors: '',
    stylePreference: 'modern'
  });
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const queryClient = useQueryClient();

  const generateSuggestionsMutation = useMutation({
    mutationFn: async () => {
      const prompt = `Analyze client business and create personalized onboarding plan.

Business: ${formData.businessName}
Industry: ${formData.industry}
Description: ${formData.description}
Goals: ${formData.goals.join(', ')}
Target Audience: ${formData.targetAudience}
Competitors: ${formData.competitors}
Brand Colors: ${formData.brandColors}
Style: ${formData.stylePreference}

Generate comprehensive recommendations:
1. Website structure (pages and hierarchy)
2. Content themes for each page
3. Design recommendations (colors, typography, imagery)
4. Key messaging and positioning
5. SEO keywords to target
6. Recommended package tier
7. Automated setup tasks to perform
8. Industry-specific features to enable

Return detailed, actionable recommendations as JSON.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            website_structure: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  page_name: { type: "string" },
                  sections: { type: "array", items: { type: "string" } }
                }
              }
            },
            design_recommendations: {
              type: "object",
              properties: {
                color_palette: { type: "array", items: { type: "string" } },
                typography: { type: "string" },
                imagery_style: { type: "string" }
              }
            },
            key_messaging: { type: "string" },
            content_themes: { type: "array", items: { type: "string" } },
            seo_keywords: { type: "array", items: { type: "string" } },
            recommended_package: { type: "string" },
            automated_tasks: { type: "array", items: { type: "string" } },
            features_to_enable: { type: "array", items: { type: "string" } }
          }
        }
      });

      return response;
    },
    onSuccess: (data) => {
      setAiSuggestions(data);
      setStep(3);
      toast.success('AI recommendations generated!');
    },
  });

  const createIntakeMutation = useMutation({
    mutationFn: async () => {
      // Create subscription first
      const subscription = await base44.entities.ClientSubscription.create({
        client_email: formData.clientEmail,
        package_id: 'default', // Set appropriate package
        status: 'trial'
      });

      // Create pre-filled intake
      await base44.entities.WebsiteIntake.create({
        subscription_id: subscription.id,
        client_email: formData.clientEmail,
        company_name: formData.businessName,
        business_goals: formData.goals,
        brand_colors: formData.brandColors,
        style_preference: formData.stylePreference,
        competitor_urls: formData.competitors.split(',').map(c => c.trim()).filter(Boolean),
        website_status: 'pending',
        preview_url: JSON.stringify({
          aiSuggestions,
          clientNotes: formData.description
        })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-websites'] });
      toast.success('Client onboarding complete! Intake created.');
      // Reset form
      setStep(1);
      setFormData({
        clientEmail: '',
        businessName: '',
        industry: '',
        description: '',
        goals: [],
        targetAudience: '',
        competitors: '',
        brandColors: '',
        stylePreference: 'modern'
      });
      setAiSuggestions(null);
    },
  });

  const goalOptions = ['get_leads', 'sell_products', 'book_appointments', 'build_trust', 'automate_business'];

  return (
    <Card className="border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          AI Client Onboarding
        </CardTitle>
        <CardDescription>Interactive questionnaire with AI-powered recommendations</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress */}
        <div className="flex items-center gap-2">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                step >= s ? 'bg-purple-600 text-white' : 'bg-slate-700 text-slate-400'
              }`}>
                {step > s ? <Check className="w-4 h-4" /> : s}
              </div>
              {s < 3 && <div className={`h-1 w-12 ${step > s ? 'bg-purple-600' : 'bg-slate-700'}`} />}
            </div>
          ))}
        </div>

        {/* Step 1: Business Information */}
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-white">Business Information</h3>
            <Input
              placeholder="Client Email *"
              value={formData.clientEmail}
              onChange={(e) => setFormData({...formData, clientEmail: e.target.value})}
            />
            <Input
              placeholder="Business Name *"
              value={formData.businessName}
              onChange={(e) => setFormData({...formData, businessName: e.target.value})}
            />
            <Input
              placeholder="Industry (e.g., Restaurant, Real Estate) *"
              value={formData.industry}
              onChange={(e) => setFormData({...formData, industry: e.target.value})}
            />
            <Textarea
              placeholder="Business Description *"
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              rows={4}
            />
            <div>
              <label className="text-sm text-slate-300 mb-2 block">Business Goals *</label>
              <div className="flex flex-wrap gap-2">
                {goalOptions.map(goal => (
                  <Badge
                    key={goal}
                    className={`cursor-pointer ${
                      formData.goals.includes(goal) ? 'bg-purple-600' : 'bg-slate-700'
                    }`}
                    onClick={() => {
                      setFormData({
                        ...formData,
                        goals: formData.goals.includes(goal)
                          ? formData.goals.filter(g => g !== goal)
                          : [...formData.goals, goal]
                      });
                    }}
                  >
                    {goal.replace(/_/g, ' ')}
                  </Badge>
                ))}
              </div>
            </div>
            <Button
              onClick={() => setStep(2)}
              disabled={!formData.clientEmail || !formData.businessName || !formData.industry || formData.goals.length === 0}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              Next <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        )}

        {/* Step 2: Brand & Audience */}
        {step === 2 && (
          <div className="space-y-4">
            <h3 className="font-semibold text-white">Brand & Target Audience</h3>
            <Input
              placeholder="Target Audience (e.g., Young professionals aged 25-40)"
              value={formData.targetAudience}
              onChange={(e) => setFormData({...formData, targetAudience: e.target.value})}
            />
            <Input
              placeholder="Competitor URLs (comma-separated)"
              value={formData.competitors}
              onChange={(e) => setFormData({...formData, competitors: e.target.value})}
            />
            <Input
              placeholder="Brand Colors (e.g., #FF5733, Blue, Red)"
              value={formData.brandColors}
              onChange={(e) => setFormData({...formData, brandColors: e.target.value})}
            />
            <div>
              <label className="text-sm text-slate-300 mb-2 block">Style Preference</label>
              <select
                className="w-full border rounded-md px-3 py-2 bg-slate-700 text-white"
                value={formData.stylePreference}
                onChange={(e) => setFormData({...formData, stylePreference: e.target.value})}
              >
                <option value="modern">Modern</option>
                <option value="corporate">Corporate</option>
                <option value="minimal">Minimal</option>
                <option value="bold">Bold</option>
              </select>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                Back
              </Button>
              <Button
                onClick={() => generateSuggestionsMutation.mutate()}
                disabled={generateSuggestionsMutation.isPending}
                className="flex-1 bg-purple-600 hover:bg-purple-700"
              >
                {generateSuggestionsMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                Generate AI Recommendations
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: AI Recommendations */}
        {step === 3 && aiSuggestions && (
          <div className="space-y-4">
            <h3 className="font-semibold text-white">AI Recommendations</h3>
            
            <Alert className="bg-blue-600/10 border-blue-500/30">
              <AlertDescription className="text-blue-300">
                <strong className="text-blue-200">Recommended Website Structure:</strong>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  {aiSuggestions.website_structure?.map((page, idx) => (
                    <li key={idx}>
                      <strong>{page.page_name}</strong>: {page.sections?.join(', ')}
                    </li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>

            <Alert className="bg-purple-600/10 border-purple-500/30">
              <AlertDescription className="text-purple-300">
                <strong className="text-purple-200">Design Recommendations:</strong>
                <div className="mt-2 space-y-1 text-sm">
                  <p><strong>Colors:</strong> {aiSuggestions.design_recommendations?.color_palette?.join(', ')}</p>
                  <p><strong>Typography:</strong> {aiSuggestions.design_recommendations?.typography}</p>
                  <p><strong>Imagery:</strong> {aiSuggestions.design_recommendations?.imagery_style}</p>
                </div>
              </AlertDescription>
            </Alert>

            <Alert className="bg-green-600/10 border-green-500/30">
              <AlertDescription className="text-green-300">
                <strong className="text-green-200">Key Messaging:</strong>
                <p className="mt-1 text-sm">{aiSuggestions.key_messaging}</p>
              </AlertDescription>
            </Alert>

            <Alert className="bg-yellow-600/10 border-yellow-500/30">
              <AlertDescription className="text-yellow-300">
                <strong className="text-yellow-200">SEO Keywords:</strong>
                <div className="flex flex-wrap gap-1 mt-2">
                  {aiSuggestions.seo_keywords?.map((keyword, idx) => (
                    <Badge key={idx} className="bg-yellow-600">{keyword}</Badge>
                  ))}
                </div>
              </AlertDescription>
            </Alert>

            <Alert className="bg-indigo-600/10 border-indigo-500/30">
              <AlertDescription className="text-indigo-300">
                <strong className="text-indigo-200">Recommended Package:</strong>
                <p className="mt-1 text-sm font-semibold">{aiSuggestions.recommended_package}</p>
              </AlertDescription>
            </Alert>

            <Alert className="bg-cyan-600/10 border-cyan-500/30">
              <AlertDescription className="text-cyan-300">
                <strong className="text-cyan-200">Automated Setup Tasks:</strong>
                <ul className="list-disc list-inside mt-1 text-sm">
                  {aiSuggestions.automated_tasks?.map((task, idx) => (
                    <li key={idx}>{task}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>

            <Alert className="bg-orange-600/10 border-orange-500/30">
              <AlertDescription className="text-orange-300">
                <strong className="text-orange-200">Features to Enable:</strong>
                <div className="flex flex-wrap gap-1 mt-2">
                  {aiSuggestions.features_to_enable?.map((feature, idx) => (
                    <Badge key={idx} variant="outline">{feature}</Badge>
                  ))}
                </div>
              </AlertDescription>
            </Alert>

            <Button
              onClick={() => createIntakeMutation.mutate()}
              disabled={createIntakeMutation.isPending}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              {createIntakeMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Check className="w-4 h-4 mr-2" />}
              Create Pre-filled Intake
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}