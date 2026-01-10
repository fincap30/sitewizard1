import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles, Loader2, Link as LinkIcon, TrendingUp } from "lucide-react";
import { toast } from "sonner";

export default function BacklinkAnalyzer({ websiteIntakeId }) {
  const [competitorUrl, setCompetitorUrl] = useState('');
  const queryClient = useQueryClient();

  const { data: analyses = [] } = useQuery({
    queryKey: ['backlink-analyses', websiteIntakeId],
    queryFn: () => base44.entities.BacklinkAnalysis.filter({ website_intake_id: websiteIntakeId }),
    enabled: !!websiteIntakeId,
  });

  const analyzeBacklinksMutation = useMutation({
    mutationFn: async () => {
      const prompt = `Analyze competitor backlinks and identify link building opportunities.

Competitor URL: ${competitorUrl}

Analyze and provide:
1. Estimated total backlinks
2. Top 10 high-quality backlink sources with:
   - Source domain
   - Authority score (0-100)
   - Link type (editorial, directory, guest post, etc.)
3. Link building opportunities we can replicate
4. Content themes that attract backlinks
5. Industry-specific link strategies

Return as JSON with actionable insights.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            total_backlinks: { type: "number" },
            high_quality_backlinks: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  source_domain: { type: "string" },
                  authority_score: { type: "number" },
                  link_type: { type: "string" }
                }
              }
            },
            opportunities: { type: "array", items: { type: "string" } },
            content_themes: { type: "array", items: { type: "string" } }
          }
        }
      });

      await base44.entities.BacklinkAnalysis.create({
        website_intake_id: websiteIntakeId,
        competitor_url: competitorUrl,
        total_backlinks: response.total_backlinks,
        high_quality_backlinks: response.high_quality_backlinks,
        opportunities: response.opportunities
      });

      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backlink-analyses'] });
      toast.success('Backlink analysis complete!');
    },
  });

  return (
    <Card className="border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LinkIcon className="w-5 h-5 text-blue-400" />
          Competitor Backlink Analysis
        </CardTitle>
        <CardDescription>Identify link building opportunities</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            placeholder="Competitor URL (e.g., competitor.com)"
            value={competitorUrl}
            onChange={(e) => setCompetitorUrl(e.target.value)}
          />
          <Button
            onClick={() => analyzeBacklinksMutation.mutate()}
            disabled={analyzeBacklinksMutation.isPending || !competitorUrl}
          >
            {analyzeBacklinksMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          </Button>
        </div>

        {analyzeBacklinksMutation.data && (
          <div className="space-y-3">
            <Alert className="bg-blue-600/10 border-blue-500/30">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              <AlertDescription className="text-blue-300">
                <strong>Total Backlinks:</strong> {analyzeBacklinksMutation.data.total_backlinks?.toLocaleString()}
              </AlertDescription>
            </Alert>

            <div>
              <h4 className="font-semibold text-white mb-2">High Quality Backlinks</h4>
              <div className="space-y-2">
                {analyzeBacklinksMutation.data.high_quality_backlinks?.map((link, idx) => (
                  <Card key={idx} className="bg-slate-700/30">
                    <CardContent className="pt-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-white text-sm">{link.source_domain}</p>
                          <p className="text-xs text-slate-400">{link.link_type}</p>
                        </div>
                        <Badge className="bg-green-600">Authority: {link.authority_score}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <Alert className="bg-green-600/10 border-green-500/30">
              <AlertDescription className="text-green-300">
                <strong>Link Building Opportunities:</strong>
                <ul className="list-disc list-inside mt-1 text-sm">
                  {analyzeBacklinksMutation.data.opportunities?.map((opp, idx) => (
                    <li key={idx}>{opp}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {analyses.length > 0 && (
          <div>
            <h4 className="font-semibold text-white mb-2">Previous Analyses</h4>
            {analyses.slice(0, 3).map((analysis) => (
              <Card key={analysis.id} className="bg-slate-700/30 mb-2">
                <CardContent className="pt-3">
                  <p className="text-sm text-white">{analysis.competitor_url}</p>
                  <p className="text-xs text-slate-400">{analysis.total_backlinks} backlinks found</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}