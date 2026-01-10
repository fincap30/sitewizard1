import React, { useState } from 'react';
import { useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Loader2, Sparkles, Copy, RefreshCw, Check } from "lucide-react";
import { toast } from "sonner";

const COPY_TEMPLATES = {
  headline: {
    label: 'Headlines',
    icon: '📝',
    prompt: 'Generate 5 compelling headlines for: {context}. Each should be unique, benefit-focused, and under 60 characters.',
    examples: ['Increase Sales', 'Save Time', 'Get Started']
  },
  subheading: {
    label: 'Subheadings',
    icon: '📄',
    prompt: 'Create 5 engaging subheadings for: {context}. They should clarify and expand on the main headline.',
    examples: ['Learn more', 'Discover how', 'See the difference']
  },
  bodycopy: {
    label: 'Body Copy',
    icon: '📋',
    prompt: 'Write compelling body copy (150-200 words) for: {context}. Focus on benefits, addressing customer pain points, and building trust.',
    examples: ['Our solution helps...', 'Imagine if you could...']
  },
  cta: {
    label: 'Call-to-Action',
    icon: '🎯',
    prompt: 'Generate 8 powerful CTAs for: {context}. Include variety: urgent, benefit-focused, curiosity-driven, and action-oriented.',
    examples: ['Get Started Free', 'Join 10,000+ Users', 'Start Your Free Trial']
  },
  product_description: {
    label: 'Product Descriptions',
    icon: '📦',
    prompt: 'Write an engaging product description (100-150 words) for: {context}. Highlight features, benefits, and unique selling points.',
    examples: ['Premium quality', 'Trusted by experts', 'Limited time offer']
  },
  email_subject: {
    label: 'Email Subject Lines',
    icon: '✉️',
    prompt: 'Create 6 attention-grabbing email subject lines for: {context}. Include open rate boosters like curiosity, urgency, and personalization.',
    examples: ['Your exclusive offer', 'Quick question?', 'Last chance']
  },
  social_post: {
    label: 'Social Posts',
    icon: '📱',
    prompt: 'Write 4 engaging social media posts for: {context}. Vary the tone and include hooks, emojis, and clear CTAs.',
    examples: ['Did you know?', 'The best part?', 'Let\'s talk about...']
  },
  testimonial_prompt: {
    label: 'Testimonial Prompts',
    icon: '⭐',
    prompt: 'Generate 5 questions to ask customers for testimonials about: {context}. Make them open-ended and actionable.',
    examples: ['What\'s your favorite feature?', 'How has it changed your...?']
  }
};

export default function AICopywritingAssistant({ websiteIntake, currentSection = null, onCopySelected = null }) {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [context, setContext] = useState('');
  const [generatedCopy, setGeneratedCopy] = useState([]);
  const [selectedCopy, setSelectedCopy] = useState(null);
  const [copied, setCopied] = useState(false);

  const generateCopyMutation = useMutation({
    mutationFn: async () => {
      if (!selectedTemplate || !context) {
        toast.error('Please select a template and enter context');
        return;
      }

      const template = COPY_TEMPLATES[selectedTemplate];
      const prompt = template.prompt.replace('{context}', context) + `\n\nBusiness: ${websiteIntake?.company_name || 'N/A'}\nGoals: ${websiteIntake?.business_goals?.join(', ') || 'General'}`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            copies: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      });

      return response.copies || [];
    },
    onSuccess: (copies) => {
      setGeneratedCopy(copies);
      setSelectedCopy(copies[0]);
      toast.success('Copy generated successfully!');
    },
    onError: () => {
      toast.error('Failed to generate copy');
    }
  });

  const handleCopyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Copied to clipboard!');
  };

  return (
    <div className="space-y-6">
      <Card className="border-2 border-purple-500/30 bg-purple-900/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-400" />
            AI Copywriting Assistant
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Template Selection */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-slate-300">
              What would you like to write?
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {Object.entries(COPY_TEMPLATES).map(([key, template]) => (
                <Button
                  key={key}
                  onClick={() => {
                    setSelectedTemplate(key);
                    setGeneratedCopy([]);
                  }}
                  variant={selectedTemplate === key ? "default" : "outline"}
                  className={`justify-start text-left h-auto py-3 ${
                    selectedTemplate === key 
                      ? 'bg-purple-600 border-purple-500' 
                      : 'border-slate-600 hover:border-purple-500'
                  }`}
                >
                  <div className="text-lg mr-2">{template.icon}</div>
                  <div className="text-xs font-medium">{template.label}</div>
                </Button>
              ))}
            </div>
          </div>

          {selectedTemplate && (
            <>
              {/* Context Input */}
              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-300">
                  Context / What are you selling or describing?
                </label>
                <Textarea
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  placeholder="E.g., 'Premium project management tool for remote teams' or 'Organic skincare products for sensitive skin'"
                  className="min-h-24"
                />
              </div>

              {/* Generate Button */}
              <Button
                onClick={() => generateCopyMutation.mutate()}
                disabled={generateCopyMutation.isPending || !context}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {generateCopyMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Generating Copy...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate {COPY_TEMPLATES[selectedTemplate].label}
                  </>
                )}
              </Button>

              {/* Generated Copy Display */}
              {generatedCopy.length > 0 && (
                <div className="space-y-4 border-t border-slate-700 pt-6">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-white">Generated Options ({generatedCopy.length})</h4>
                    <Button
                      onClick={() => generateCopyMutation.mutate()}
                      disabled={generateCopyMutation.isPending}
                      variant="outline"
                      size="sm"
                      className="border-slate-600"
                    >
                      <RefreshCw className="w-3 h-3 mr-2" />
                      Regenerate
                    </Button>
                  </div>

                  <div className="space-y-2">
                    {generatedCopy.map((copy, idx) => (
                      <div
                        key={idx}
                        onClick={() => setSelectedCopy(copy)}
                        className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          selectedCopy === copy
                            ? 'border-purple-500 bg-purple-900/20'
                            : 'border-slate-700 hover:border-purple-500/50 bg-slate-800/30'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <p className="text-slate-200 flex-1 pr-4">{copy}</p>
                          <Badge variant="outline" className="flex-shrink-0">
                            Option {idx + 1}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Selected Copy Actions */}
                  {selectedCopy && (
                    <div className="bg-slate-700/30 rounded-lg p-4 space-y-3 border border-slate-600">
                      <h5 className="font-semibold text-white text-sm">Selected Copy</h5>
                      <div className="bg-slate-800/50 rounded p-3 text-slate-200 break-words">
                        {selectedCopy}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleCopyToClipboard(selectedCopy)}
                          className="flex-1 bg-blue-600 hover:bg-blue-700"
                        >
                          {copied ? (
                            <>
                              <Check className="w-4 h-4 mr-2" />
                              Copied!
                            </>
                          ) : (
                            <>
                              <Copy className="w-4 h-4 mr-2" />
                              Copy to Clipboard
                            </>
                          )}
                        </Button>
                        {onCopySelected && (
                          <Button
                            onClick={() => onCopySelected(selectedCopy)}
                            variant="outline"
                            className="flex-1 border-slate-600"
                          >
                            Use in Editor
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Tips Section */}
      <Card className="border-2 border-slate-700/50 bg-slate-800/30">
        <CardHeader>
          <CardTitle className="text-base">💡 Copywriting Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-slate-300">
            <li>✓ <strong>Be specific:</strong> Provide details about your product/service for better results</li>
            <li>✓ <strong>Know your audience:</strong> Mention who you're targeting for personalized copy</li>
            <li>✓ <strong>Test variations:</strong> Use the regenerate feature to explore different angles</li>
            <li>✓ <strong>Focus on benefits:</strong> Tell customers what problems you solve, not just features</li>
            <li>✓ <strong>Use urgency wisely:</strong> CTAs work better with clear value propositions first</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}