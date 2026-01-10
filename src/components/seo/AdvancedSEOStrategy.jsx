import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sparkles, Loader2, Search, TrendingUp, Calendar } from "lucide-react";
import { toast } from "sonner";

export default function AdvancedSEOStrategy({ websiteIntakeId }) {
  const [competitorUrls, setCompetitorUrls] = useState('');
  const queryClient = useQueryClient();

  const { data: websiteIntake } = useQuery({
    queryKey: ['website-seo', websiteIntakeId],
    queryFn: () => base44.entities.WebsiteIntake.filter({ id: websiteIntakeId }).then(w => w[0]),
    enabled: !!websiteIntakeId,
  });

  const { data: contentCalendars = [] } = useQuery({
    queryKey: ['content-calendars', websiteIntakeId],
    queryFn: () => base44.entities.SEOContentCalendar.filter({ website_intake_id: websiteIntakeId }),
    enabled: !!websiteIntakeId,
  });

  const keywordGapAnalysisMutation = useMutation({
    mutationFn: async () => {
      const prompt = `Perform comprehensive keyword gap analysis.

Our Website: ${websiteIntake?.company_name}
Our Industry: Based on company name
Our Goals: ${websiteIntake?.business_goals?.join(', ')}

Competitor URLs: ${competitorUrls}

Analyze:
1. Keywords competitors rank for (high volume, low difficulty)
2. Content gaps in our strategy
3. Opportunity keywords (high ROI potential)
4. Topic clusters to target

Return as JSON with detailed keyword analysis.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            keyword_gaps: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  keyword: { type: "string" },
                  search_volume: { type: "number" },
                  difficulty: { type: "number" },
                  opportunity_score: { type: "number" }
                }
              }
            },
            content_gaps: { type: "array", items: { type: "string" } },
            topic_clusters: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  cluster_name: { type: "string" },
                  pillar_topic: { type: "string" },
                  supporting_topics: { type: "array", items: { type: "string" } }
                }
              }
            }
          }
        }
      });

      return response;
    },
  });

  const competitorAnalysisMutation = useMutation({
    mutationFn: async () => {
      const prompt = `Analyze competitor content strategies.

Competitors: ${competitorUrls}
Our Business: ${websiteIntake?.company_name}

Analyze:
1. Top performing content types
2. Content frequency and publishing patterns
3. Topic coverage
4. Engagement strategies
5. Content formats used (blog, video, infographic)
6. Keyword targeting approach

Return as JSON.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            top_content_types: { type: "array", items: { type: "string" } },
            publishing_frequency: { type: "string" },
            topic_coverage: { type: "array", items: { type: "string" } },
            engagement_tactics: { type: "array", items: { type: "string" } },
            content_formats: { type: "array", items: { type: "string" } },
            keyword_approach: { type: "string" }
          }
        }
      });

      return response;
    },
  });

  const generateContentCalendarMutation = useMutation({
    mutationFn: async () => {
      const keywordGaps = keywordGapAnalysisMutation.data?.keyword_gaps || [];
      const topicClusters = keywordGapAnalysisMutation.data?.topic_clusters || [];

      const prompt = `Generate detailed 3-month content calendar.

Business: ${websiteIntake?.company_name}
Goals: ${websiteIntake?.business_goals?.join(', ')}

Keyword Gaps: ${keywordGaps.slice(0, 20).map(k => `${k.keyword} (vol: ${k.search_volume})`).join(', ')}
Topic Clusters: ${topicClusters.map(t => t.cluster_name).join(', ')}

Create content calendar with:
- Blog posts
- Landing pages
- Case studies
- Guides/Resources

For each item include:
- Exact title
- Content format
- Target keywords (3-5)
- Suggested publish date
- Search volume
- Difficulty score

Return 3 months as JSON array.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            months: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  month: { type: "string" },
                  content_items: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        format: { type: "string" },
                        target_keywords: { type: "array", items: { type: "string" } },
                        publish_date: { type: "string" },
                        search_volume: { type: "number" },
                        difficulty_score: { type: "number" }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      });

      // Save calendars
      for (const month of response.months) {
        await base44.entities.SEOContentCalendar.create({
          website_intake_id: websiteIntakeId,
          month: month.month,
          topic_clusters: topicClusters,
          content_items: month.content_items,
          keyword_gaps: keywordGaps.map(k => k.keyword),
          competitor_insights: competitorAnalysisMutation.data || {}
        });
      }

      return response.months;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['content-calendars'] });
      toast.success('Content calendar generated!');
    },
  });

  return (
    <Card className="border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="w-5 h-5 text-blue-400" />
          Advanced SEO Strategy
        </CardTitle>
        <CardDescription>Keyword gap analysis, competitor insights, and content planning</CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="analysis">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="analysis">Gap Analysis</TabsTrigger>
            <TabsTrigger value="competitors">Competitors</TabsTrigger>
            <TabsTrigger value="calendar">Content Calendar</TabsTrigger>
          </TabsList>

          <TabsContent value="analysis" className="space-y-4">
            <Input
              placeholder="Competitor URLs (comma-separated)"
              value={competitorUrls}
              onChange={(e) => setCompetitorUrls(e.target.value)}
            />
            <Button
              onClick={() => keywordGapAnalysisMutation.mutate()}
              disabled={keywordGapAnalysisMutation.isPending || !competitorUrls}
              className="w-full"
            >
              {keywordGapAnalysisMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Search className="w-4 h-4 mr-2" />}
              Analyze Keyword Gaps
            </Button>

            {keywordGapAnalysisMutation.data && (
              <div className="space-y-3">
                <Alert className="bg-red-600/10 border-red-500/30">
                  <AlertDescription className="text-red-300">
                    <strong>Top Keyword Opportunities:</strong>
                    <div className="mt-2 space-y-1">
                      {keywordGapAnalysisMutation.data.keyword_gaps?.slice(0, 10).map((kw, idx) => (
                        <div key={idx} className="flex justify-between items-center text-sm">
                          <span>{kw.keyword}</span>
                          <div className="flex gap-2">
                            <Badge className="bg-blue-600">Vol: {kw.search_volume}</Badge>
                            <Badge className="bg-yellow-600">Diff: {kw.difficulty}</Badge>
                            <Badge className="bg-green-600">Score: {kw.opportunity_score}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>

                <Alert className="bg-purple-600/10 border-purple-500/30">
                  <AlertDescription className="text-purple-300">
                    <strong>Topic Clusters:</strong>
                    {keywordGapAnalysisMutation.data.topic_clusters?.map((cluster, idx) => (
                      <div key={idx} className="mt-2">
                        <p className="font-semibold">{cluster.cluster_name}</p>
                        <p className="text-xs">Pillar: {cluster.pillar_topic}</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {cluster.supporting_topics?.map((topic, i) => (
                            <Badge key={i} variant="outline">{topic}</Badge>
                          ))}
                        </div>
                      </div>
                    ))}
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </TabsContent>

          <TabsContent value="competitors" className="space-y-4">
            <Button
              onClick={() => competitorAnalysisMutation.mutate()}
              disabled={competitorAnalysisMutation.isPending || !competitorUrls}
              className="w-full"
            >
              {competitorAnalysisMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <TrendingUp className="w-4 h-4 mr-2" />}
              Analyze Competitors
            </Button>

            {competitorAnalysisMutation.data && (
              <div className="space-y-3">
                <Alert className="bg-blue-600/10 border-blue-500/30">
                  <AlertDescription className="text-blue-300">
                    <strong>Top Content Types:</strong>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {competitorAnalysisMutation.data.top_content_types?.map((type, idx) => (
                        <Badge key={idx} className="bg-blue-600">{type}</Badge>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>

                <Alert className="bg-green-600/10 border-green-500/30">
                  <AlertDescription className="text-green-300">
                    <strong>Publishing Frequency:</strong>
                    <p className="mt-1">{competitorAnalysisMutation.data.publishing_frequency}</p>
                  </AlertDescription>
                </Alert>

                <Alert className="bg-purple-600/10 border-purple-500/30">
                  <AlertDescription className="text-purple-300">
                    <strong>Engagement Tactics:</strong>
                    <ul className="list-disc list-inside mt-1 text-sm">
                      {competitorAnalysisMutation.data.engagement_tactics?.map((tactic, idx) => (
                        <li key={idx}>{tactic}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              </div>
            )}
          </TabsContent>

          <TabsContent value="calendar" className="space-y-4">
            <Button
              onClick={() => generateContentCalendarMutation.mutate()}
              disabled={generateContentCalendarMutation.isPending || !keywordGapAnalysisMutation.data}
              className="w-full"
            >
              {generateContentCalendarMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Calendar className="w-4 h-4 mr-2" />}
              Generate 3-Month Calendar
            </Button>

            {contentCalendars.length > 0 && (
              <div className="space-y-4">
                {contentCalendars.map(calendar => (
                  <Card key={calendar.id} className="bg-slate-700/30">
                    <CardContent className="pt-4">
                      <h4 className="font-semibold text-white mb-3">{calendar.month}</h4>
                      <div className="space-y-2">
                        {calendar.content_items?.map((item, idx) => (
                          <div key={idx} className="p-2 bg-slate-600/30 rounded">
                            <div className="flex justify-between items-start mb-1">
                              <p className="font-medium text-white text-sm">{item.title}</p>
                              <Badge className="bg-purple-600">{item.format}</Badge>
                            </div>
                            <p className="text-xs text-slate-400">{item.publish_date}</p>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {item.target_keywords?.map((kw, i) => (
                                <Badge key={i} variant="outline" className="text-xs">{kw}</Badge>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}