import React, { useState } from 'react';
import { useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, Check } from "lucide-react";
import { toast } from "sonner";

export default function TemplateSelector({ websiteIntake, onTemplateSelected }) {
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  const templates = [
    { id: 'modern-business', name: 'Modern Business', style: 'Clean, professional', industries: ['consulting', 'finance', 'tech'] },
    { id: 'creative-portfolio', name: 'Creative Portfolio', style: 'Bold, visual', industries: ['design', 'photography', 'art'] },
    { id: 'ecommerce-store', name: 'E-commerce', style: 'Product-focused', industries: ['retail', 'fashion', 'goods'] },
    { id: 'restaurant-cafe', name: 'Restaurant', style: 'Warm, inviting', industries: ['food', 'hospitality', 'cafe'] },
    { id: 'minimal-corporate', name: 'Minimal Corporate', style: 'Simple, elegant', industries: ['corporate', 'legal', 'accounting'] },
    { id: 'bold-startup', name: 'Bold Startup', style: 'Dynamic, energetic', industries: ['startup', 'saas', 'tech'] }
  ];

  const customizeTemplateMutation = useMutation({
    mutationFn: async (template) => {
      const prompt = `Customize website template based on client needs.

Template: ${template.name}
Base Style: ${template.style}

Client Business: ${websiteIntake.company_name}
Industry: Inferred from business name
Brand Colors: ${websiteIntake.brand_colors}
Style Preference: ${websiteIntake.style_preference}
Goals: ${websiteIntake.business_goals?.join(', ')}

Generate customized template with:
1. Page structure (pages and sections)
2. Adapted color scheme based on brand colors
3. Typography recommendations
4. Content modules for each page
5. Design element suggestions
6. Layout configurations

Return as JSON.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            pages: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  sections: { type: "array", items: { type: "string" } },
                  modules: { type: "array", items: { type: "string" } }
                }
              }
            },
            color_scheme: {
              type: "object",
              properties: {
                primary: { type: "string" },
                secondary: { type: "string" },
                accent: { type: "string" }
              }
            },
            typography: { type: "string" },
            design_elements: { type: "array", items: { type: "string" } }
          }
        }
      });

      return response;
    },
    onSuccess: (data) => {
      onTemplateSelected({ template: selectedTemplate, customization: data });
      toast.success('Template customized!');
    },
  });

  return (
    <Card className="border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          Select Your Starting Template
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          {templates.map((template) => (
            <Card
              key={template.id}
              className={`cursor-pointer transition-all ${
                selectedTemplate?.id === template.id
                  ? 'border-2 border-blue-500 bg-blue-600/10'
                  : 'border border-slate-600 hover:border-blue-400 bg-slate-700/30'
              }`}
              onClick={() => setSelectedTemplate(template)}
            >
              <CardContent className="pt-4">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="font-semibold text-white">{template.name}</h3>
                  {selectedTemplate?.id === template.id && (
                    <Check className="w-5 h-5 text-blue-400" />
                  )}
                </div>
                <p className="text-sm text-slate-400 mb-3">{template.style}</p>
                <div className="flex flex-wrap gap-1">
                  {template.industries.map((ind) => (
                    <Badge key={ind} variant="outline" className="text-xs">
                      {ind}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Button
          onClick={() => customizeTemplateMutation.mutate(selectedTemplate)}
          disabled={!selectedTemplate || customizeTemplateMutation.isPending}
          className="w-full bg-blue-600 hover:bg-blue-700"
        >
          {customizeTemplateMutation.isPending ? (
            <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Customizing Template...</>
          ) : (
            <><Sparkles className="w-4 h-4 mr-2" /> Customize with AI</>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}