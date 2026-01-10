import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles, Loader2, Users, TrendingUp, Target } from "lucide-react";
import { toast } from "sonner";

export default function AIPersonalizationEngine({ websiteIntakeId }) {
  const [segmentName, setSegmentName] = useState('');
  const queryClient = useQueryClient();

  const { data: segments = [] } = useQuery({
    queryKey: ['segments', websiteIntakeId],
    queryFn: () => base44.entities.UserSegment.filter({ website_intake_id: websiteIntakeId }),
    enabled: !!websiteIntakeId,
  });

  const { data: behaviors = [] } = useQuery({
    queryKey: ['behaviors', websiteIntakeId],
    queryFn: () => base44.entities.UserBehavior.filter({ website_intake_id: websiteIntakeId }),
    enabled: !!websiteIntakeId,
  });

  const generateSegmentsMutation = useMutation({
    mutationFn: async () => {
      const prompt = `Analyze user behavior and create personalized segments.

User Behaviors:
${behaviors.slice(0, 50).map(b => `
- Referral: ${b.referral_source}
- Pages: ${b.pages_visited?.join(', ')}
- Time: ${b.time_on_site}s
- Interactions: ${b.interactions?.length || 0}
- Conversion: ${b.conversion_action || 'none'}
`).join('\n')}

Create 3-5 user segments based on:
- Referral source patterns
- Engagement levels
- Page visit patterns
- Conversion likelihood

For each segment, suggest:
- Personalized hero text
- Tailored CTAs
- Custom offers
- Product recommendations

Return as JSON array of segments.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            segments: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  criteria: { type: "string" },
                  hero_text: { type: "string" },
                  cta_text: { type: "string" },
                  offers: { type: "array", items: { type: "string" } }
                }
              }
            }
          }
        }
      });

      // Create segments
      for (const segment of response.segments) {
        await base44.entities.UserSegment.create({
          website_intake_id: websiteIntakeId,
          segment_name: segment.name,
          criteria: { description: segment.criteria },
          personalization_rules: {
            hero_text: segment.hero_text,
            cta_text: segment.cta_text,
            offers: segment.offers
          }
        });
      }

      return response.segments;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['segments'] });
      toast.success('User segments generated!');
    },
  });

  const optimizeSegmentMutation = useMutation({
    mutationFn: async (segmentId) => {
      const segment = segments.find(s => s.id === segmentId);
      const segmentBehaviors = behaviors.filter(b => b.segment_id === segmentId);

      const prompt = `Optimize personalization for user segment.

Segment: ${segment.segment_name}
Current Personalization:
- Hero: ${segment.personalization_rules?.hero_text}
- CTA: ${segment.personalization_rules?.cta_text}
- Offers: ${segment.personalization_rules?.offers?.join(', ')}

Recent User Behaviors:
${segmentBehaviors.slice(0, 20).map(b => `
- Referral: ${b.referral_source}
- Time: ${b.time_on_site}s
- Converted: ${b.conversion_action ? 'Yes' : 'No'}
`).join('\n')}

Suggest improved personalization based on actual behavior data.
Return as JSON with optimized rules.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            hero_text: { type: "string" },
            cta_text: { type: "string" },
            offers: { type: "array", items: { type: "string" } },
            reasoning: { type: "string" }
          }
        }
      });

      await base44.entities.UserSegment.update(segmentId, {
        personalization_rules: {
          hero_text: response.hero_text,
          cta_text: response.cta_text,
          offers: response.offers
        }
      });

      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['segments'] });
      toast.success('Segment optimized!');
    },
  });

  return (
    <div className="space-y-6">
      <Card className="border-2 border-purple-500/50 bg-slate-800/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-400" />
                AI Personalization Engine
              </CardTitle>
              <CardDescription>Dynamic content based on user behavior</CardDescription>
            </div>
            <Button
              onClick={() => generateSegmentsMutation.mutate()}
              disabled={generateSegmentsMutation.isPending || behaviors.length === 0}
              className="bg-purple-600 hover:bg-purple-700"
            >
              {generateSegmentsMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
              Generate Segments
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {behaviors.length === 0 ? (
            <Alert className="bg-yellow-600/10 border-yellow-500/30">
              <AlertDescription className="text-yellow-300">
                User behavior data will appear here once visitors interact with your website.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              <div className="grid md:grid-cols-3 gap-4 mb-4">
                <Card className="bg-slate-700/30">
                  <CardContent className="pt-4">
                    <Users className="w-4 h-4 text-blue-400 mb-2" />
                    <p className="text-2xl font-bold text-white">{behaviors.length}</p>
                    <p className="text-xs text-slate-400">Total Visitors</p>
                  </CardContent>
                </Card>
                <Card className="bg-slate-700/30">
                  <CardContent className="pt-4">
                    <Target className="w-4 h-4 text-green-400 mb-2" />
                    <p className="text-2xl font-bold text-white">{segments.length}</p>
                    <p className="text-xs text-slate-400">Active Segments</p>
                  </CardContent>
                </Card>
                <Card className="bg-slate-700/30">
                  <CardContent className="pt-4">
                    <TrendingUp className="w-4 h-4 text-purple-400 mb-2" />
                    <p className="text-2xl font-bold text-white">
                      {behaviors.filter(b => b.conversion_action).length}
                    </p>
                    <p className="text-xs text-slate-400">Conversions</p>
                  </CardContent>
                </Card>
              </div>

              {segments.map(segment => (
                <Card key={segment.id} className="bg-slate-700/30">
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-white">{segment.segment_name}</h4>
                        <p className="text-xs text-slate-400 mt-1">
                          {segment.segment_size || 0} users • {((segment.conversion_rate || 0) * 100).toFixed(1)}% conversion
                        </p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => optimizeSegmentMutation.mutate(segment.id)}
                        disabled={optimizeSegmentMutation.isPending}
                      >
                        Optimize
                      </Button>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-slate-400">Hero:</span>
                        <p className="text-white">{segment.personalization_rules?.hero_text}</p>
                      </div>
                      <div>
                        <span className="text-slate-400">CTA:</span>
                        <p className="text-white">{segment.personalization_rules?.cta_text}</p>
                      </div>
                      {segment.personalization_rules?.offers && (
                        <div className="flex flex-wrap gap-1">
                          {segment.personalization_rules.offers.map((offer, idx) => (
                            <Badge key={idx} className="bg-purple-600">{offer}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}