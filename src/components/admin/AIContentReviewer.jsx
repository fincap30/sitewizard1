import React, { useState } from 'react';
import { useQuery, useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, AlertTriangle, CheckCircle, RefreshCw } from "lucide-react";
import { toast } from "sonner";

export default function AIContentReviewer() {
  const [selectedWebsite, setSelectedWebsite] = useState('');
  const [contentToReview, setContentToReview] = useState('');
  const [reviewResult, setReviewResult] = useState(null);

  const { data: websites = [] } = useQuery({
    queryKey: ['websites-for-content-review'],
    queryFn: () => base44.entities.WebsiteIntake.list('-created_date'),
  });

  const reviewContentMutation = useMutation({
    mutationFn: async () => {
      const website = websites.find(w => w.id === selectedWebsite);

      const prompt = `Review this AI-generated website content for quality and brand consistency.

Business: ${website.company_name}
Industry: Based on name
Goals: ${website.business_goals?.join(', ')}
Style: ${website.style_preference}

Content to Review:
${contentToReview}

Analyze and provide:
1. Brand Consistency Score (1-10)
2. Quality Assessment (excellent/good/needs_improvement/poor)
3. Specific issues found (repetitive phrases, off-brand tone, unclear messaging)
4. Goal Alignment (does it support business goals?)
5. Suggested Edits (specific improvements)
6. Alternative Draft (if needed)

Return as JSON with detailed feedback.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            brand_consistency_score: { type: "number" },
            quality_assessment: { type: "string" },
            issues_found: { type: "array", items: { type: "string" } },
            goal_alignment: { type: "string" },
            suggested_edits: { type: "array", items: { type: "string" } },
            alternative_draft: { type: "string" }
          }
        }
      });

      return response;
    },
    onSuccess: (data) => {
      setReviewResult(data);
      toast.success('Content review complete!');
    },
  });

  const scanAllContentMutation = useMutation({
    mutationFn: async (websiteId) => {
      const website = websites.find(w => w.id === websiteId);
      const structure = website.preview_url ? JSON.parse(website.preview_url) : null;

      if (!structure) {
        throw new Error('No content to scan');
      }

      const allContent = structure.pages?.map(page => 
        page.sections?.map(section => section.content).join('\n')
      ).join('\n\n') || '';

      const prompt = `Scan entire website content for quality issues.

Business: ${website.company_name}
Goals: ${website.business_goals?.join(', ')}

Full Website Content:
${allContent.slice(0, 5000)}

Identify:
1. Low-quality sections (vague, generic, unclear)
2. Repetitive content (similar phrases used multiple times)
3. Off-brand messaging
4. Missing CTAs or weak calls-to-action
5. Overall quality score (1-10)

Return as JSON with actionable flags.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            overall_quality_score: { type: "number" },
            low_quality_sections: { type: "array", items: { type: "string" } },
            repetitive_content: { type: "array", items: { type: "string" } },
            off_brand_messaging: { type: "array", items: { type: "string" } },
            cta_issues: { type: "array", items: { type: "string" } }
          }
        }
      });

      return response;
    },
  });

  const getQualityColor = (quality) => {
    switch (quality) {
      case 'excellent': return 'bg-green-600';
      case 'good': return 'bg-blue-600';
      case 'needs_improvement': return 'bg-yellow-600';
      case 'poor': return 'bg-red-600';
      default: return 'bg-slate-600';
    }
  };

  return (
    <Card className="border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-400" />
          AI Content Reviewer
        </CardTitle>
        <CardDescription>Review AI-generated content for quality and brand consistency</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <label className="text-sm font-medium text-slate-300 mb-2 block">Select Website</label>
          <select
            className="w-full border rounded-md px-3 py-2 mb-3 bg-slate-700 text-white"
            value={selectedWebsite}
            onChange={(e) => setSelectedWebsite(e.target.value)}
          >
            <option value="">-- Select Website --</option>
            {websites.map(w => (
              <option key={w.id} value={w.id}>{w.company_name} ({w.website_status})</option>
            ))}
          </select>

          {selectedWebsite && (
            <div className="flex gap-2 mb-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  scanAllContentMutation.mutate(selectedWebsite, {
                    onSuccess: (result) => {
                      toast.success('Content scan complete!');
                      // Show scan results
                      setReviewResult({
                        ...result,
                        quality_assessment: result.overall_quality_score >= 8 ? 'excellent' : 
                                          result.overall_quality_score >= 6 ? 'good' : 
                                          result.overall_quality_score >= 4 ? 'needs_improvement' : 'poor',
                        brand_consistency_score: result.overall_quality_score
                      });
                    }
                  });
                }}
                disabled={scanAllContentMutation.isPending}
              >
                {scanAllContentMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <RefreshCw className="w-3 h-3 mr-2" />}
                Scan All Content
              </Button>
            </div>
          )}
        </div>

        <div>
          <label className="text-sm font-medium text-slate-300 mb-2 block">Content to Review</label>
          <Textarea
            value={contentToReview}
            onChange={(e) => setContentToReview(e.target.value)}
            placeholder="Paste AI-generated content here for review..."
            rows={8}
            className="mb-3"
          />
          <Button
            onClick={() => reviewContentMutation.mutate()}
            disabled={!contentToReview.trim() || !selectedWebsite || reviewContentMutation.isPending}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            {reviewContentMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
            Review Content
          </Button>
        </div>

        {reviewResult && (
          <div className="space-y-3 pt-4 border-t">
            <div className="flex items-center gap-3">
              <Badge className={getQualityColor(reviewResult.quality_assessment)} className="text-white">
                {reviewResult.quality_assessment?.replace(/_/g, ' ')}
              </Badge>
              <div className="flex items-center gap-2">
                <span className="text-sm text-slate-300">Brand Consistency:</span>
                <Badge className={reviewResult.brand_consistency_score >= 7 ? 'bg-green-600' : 'bg-yellow-600'}>
                  {reviewResult.brand_consistency_score}/10
                </Badge>
              </div>
            </div>

            {reviewResult.issues_found && reviewResult.issues_found.length > 0 && (
              <Alert className="bg-red-600/10 border-red-500/30">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <AlertDescription className="text-red-300">
                  <strong className="text-red-200">Issues Found:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    {reviewResult.issues_found.map((issue, idx) => (
                      <li key={idx}>{issue}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {reviewResult.low_quality_sections && reviewResult.low_quality_sections.length > 0 && (
              <Alert className="bg-yellow-600/10 border-yellow-500/30">
                <AlertTriangle className="w-4 h-4 text-yellow-400" />
                <AlertDescription className="text-yellow-300">
                  <strong className="text-yellow-200">Low Quality Sections:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    {reviewResult.low_quality_sections.map((section, idx) => (
                      <li key={idx}>{section}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {reviewResult.repetitive_content && reviewResult.repetitive_content.length > 0 && (
              <Alert className="bg-orange-600/10 border-orange-500/30">
                <AlertDescription className="text-orange-300">
                  <strong className="text-orange-200">Repetitive Content:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    {reviewResult.repetitive_content.map((rep, idx) => (
                      <li key={idx}>{rep}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {reviewResult.goal_alignment && (
              <Alert className="bg-blue-600/10 border-blue-500/30">
                <CheckCircle className="w-4 h-4 text-blue-400" />
                <AlertDescription className="text-blue-300">
                  <strong className="text-blue-200">Goal Alignment:</strong>
                  <p className="mt-1">{reviewResult.goal_alignment}</p>
                </AlertDescription>
              </Alert>
            )}

            {reviewResult.suggested_edits && reviewResult.suggested_edits.length > 0 && (
              <Alert className="bg-green-600/10 border-green-500/30">
                <AlertDescription className="text-green-300">
                  <strong className="text-green-200">Suggested Edits:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    {reviewResult.suggested_edits.map((edit, idx) => (
                      <li key={idx}>{edit}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {reviewResult.alternative_draft && (
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">Alternative Draft</label>
                <Textarea
                  value={reviewResult.alternative_draft}
                  onChange={(e) => setReviewResult({...reviewResult, alternative_draft: e.target.value})}
                  rows={10}
                  className="bg-slate-700/50"
                />
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}