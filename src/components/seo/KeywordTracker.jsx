import React from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { toast } from "sonner";

export default function KeywordTracker({ websiteIntakeId }) {
  const queryClient = useQueryClient();

  const { data: keywords = [] } = useQuery({
    queryKey: ['keyword-performance', websiteIntakeId],
    queryFn: () => base44.entities.KeywordPerformance.filter({ website_intake_id: websiteIntakeId }),
    enabled: !!websiteIntakeId,
  });

  const trackKeywordsMutation = useMutation({
    mutationFn: async () => {
      const { data: websiteIntake } = await base44.entities.WebsiteIntake.filter({ id: websiteIntakeId }).then(w => ({ data: w[0] }));

      const prompt = `Analyze keyword performance and opportunities.

Business: ${websiteIntake.company_name}
Industry: Based on business
Current Keywords: ${keywords.map(k => k.keyword).join(', ') || 'None tracked yet'}

Identify and analyze:
1. Top 10 keywords to target
2. For each: search volume, difficulty (0-100), current ranking estimate
3. Trend direction (up/down/stable)
4. Specific optimization opportunities

Return as JSON array.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            keywords: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  keyword: { type: "string" },
                  search_volume: { type: "number" },
                  ranking_position: { type: "number" },
                  difficulty_score: { type: "number" },
                  trend: { type: "string" },
                  opportunities: { type: "array", items: { type: "string" } }
                }
              }
            }
          }
        }
      });

      for (const kw of response.keywords) {
        await base44.entities.KeywordPerformance.create({
          website_intake_id: websiteIntakeId,
          ...kw
        });
      }

      return response.keywords;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keyword-performance'] });
      toast.success('Keywords tracked!');
    },
  });

  const getTrendIcon = (trend) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-green-400" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-red-400" />;
      default: return <Minus className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <Card className="border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              Keyword Performance Tracker
            </CardTitle>
            <CardDescription>Monitor keyword rankings and opportunities</CardDescription>
          </div>
          <Button
            onClick={() => trackKeywordsMutation.mutate()}
            disabled={trackKeywordsMutation.isPending}
            size="sm"
          >
            {trackKeywordsMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Sparkles className="w-3 h-3 mr-2" />}
            Update
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {keywords.slice(0, 15).map((kw) => (
            <Card key={kw.id} className="bg-slate-700/30">
              <CardContent className="pt-3">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-center gap-2">
                    {getTrendIcon(kw.trend)}
                    <p className="font-semibold text-white">{kw.keyword}</p>
                  </div>
                  <Badge className={
                    kw.difficulty_score > 70 ? 'bg-red-600' :
                    kw.difficulty_score > 40 ? 'bg-yellow-600' :
                    'bg-green-600'
                  }>
                    Difficulty: {kw.difficulty_score}
                  </Badge>
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs mb-2">
                  <div className="bg-slate-600/30 p-2 rounded">
                    <p className="text-slate-400">Volume</p>
                    <p className="font-semibold text-white">{kw.search_volume?.toLocaleString()}/mo</p>
                  </div>
                  <div className="bg-slate-600/30 p-2 rounded">
                    <p className="text-slate-400">Position</p>
                    <p className="font-semibold text-white">#{kw.ranking_position || '—'}</p>
                  </div>
                  <div className="bg-slate-600/30 p-2 rounded">
                    <p className="text-slate-400">Trend</p>
                    <p className="font-semibold text-white capitalize">{kw.trend}</p>
                  </div>
                </div>
                {kw.opportunities && kw.opportunities.length > 0 && (
                  <div className="text-xs text-green-300">
                    <p className="font-semibold">Opportunities:</p>
                    <ul className="list-disc list-inside">
                      {kw.opportunities.slice(0, 2).map((opp, idx) => (
                        <li key={idx}>{opp}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}