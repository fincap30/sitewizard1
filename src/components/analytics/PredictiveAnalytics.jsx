import React, { useState } from 'react';
import { useQuery, useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2, TrendingUp, DollarSign, AlertTriangle, Target } from "lucide-react";
import { toast } from "sonner";

export default function PredictiveAnalytics({ websiteIntakeId, isAdmin = false }) {
  const [predictions, setPredictions] = useState(null);

  const { data: analytics = [] } = useQuery({
    queryKey: ['analytics-predictive', websiteIntakeId],
    queryFn: () => base44.entities.WebsiteAnalytics.filter({ website_intake_id: websiteIntakeId }),
    enabled: !!websiteIntakeId,
  });

  const { data: websiteIntake } = useQuery({
    queryKey: ['website-predictive', websiteIntakeId],
    queryFn: () => base44.entities.WebsiteIntake.filter({ id: websiteIntakeId }).then(w => w[0]),
    enabled: !!websiteIntakeId,
  });

  const { data: milestones = [] } = useQuery({
    queryKey: ['milestones-predictive', websiteIntakeId],
    queryFn: () => base44.entities.ProjectMilestone.filter({ website_intake_id: websiteIntakeId }),
    enabled: !!websiteIntakeId && isAdmin,
  });

  const generatePredictionsMutation = useMutation({
    mutationFn: async () => {
      const last30Days = analytics.slice(-30);
      const last7Days = analytics.slice(-7);

      const totalViews30d = last30Days.reduce((sum, a) => sum + (a.page_views || 0), 0);
      const totalVisitors30d = last30Days.reduce((sum, a) => sum + (a.unique_visitors || 0), 0);
      const totalViews7d = last7Days.reduce((sum, a) => sum + (a.page_views || 0), 0);

      const prompt = `Generate predictive analytics and forecasts.

Website: ${websiteIntake?.company_name}
Status: ${websiteIntake?.website_status}
Goals: ${websiteIntake?.business_goals?.join(', ')}

Historical Data (30 days):
- Total Page Views: ${totalViews30d}
- Total Visitors: ${totalVisitors30d}
- Avg Daily Views: ${(totalViews30d / 30).toFixed(0)}

Recent Trend (7 days):
- Page Views: ${totalViews7d}
- Daily Average: ${(totalViews7d / 7).toFixed(0)}

${isAdmin ? `
Project Milestones:
- Completed: ${milestones.filter(m => m.status === 'completed').length}
- In Progress: ${milestones.filter(m => m.status === 'in_progress').length}
- Pending: ${milestones.filter(m => m.status === 'pending').length}
` : ''}

Provide:
1. Traffic Forecast (next 30 days)
2. Conversion Predictions
3. ROI Estimates (if applicable)
4. Emerging Trends
5. Risk Factors
6. Growth Opportunities
7. Recommended Actions

Return as JSON with detailed predictions.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            traffic_forecast: {
              type: "object",
              properties: {
                predicted_views: { type: "number" },
                predicted_visitors: { type: "number" },
                growth_rate: { type: "number" },
                confidence: { type: "string" }
              }
            },
            conversion_prediction: {
              type: "object",
              properties: {
                predicted_conversions: { type: "number" },
                conversion_rate: { type: "number" }
              }
            },
            roi_estimate: {
              type: "object",
              properties: {
                estimated_roi: { type: "string" },
                timeframe: { type: "string" }
              }
            },
            emerging_trends: { type: "array", items: { type: "string" } },
            risk_factors: { type: "array", items: { type: "string" } },
            growth_opportunities: { type: "array", items: { type: "string" } },
            recommended_actions: { type: "array", items: { type: "string" } }
          }
        }
      });

      return response;
    },
    onSuccess: (data) => {
      setPredictions(data);
      toast.success('Predictions generated!');
    },
  });

  return (
    <Card className="border-2 border-purple-500/50 bg-slate-800/50 backdrop-blur-sm">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-purple-400" />
              Predictive Analytics & Forecasting
            </CardTitle>
            <CardDescription>AI-powered predictions and trend analysis</CardDescription>
          </div>
          <Button
            onClick={() => generatePredictionsMutation.mutate()}
            disabled={generatePredictionsMutation.isPending || analytics.length < 7}
            className="bg-purple-600 hover:bg-purple-700"
          >
            {generatePredictionsMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
            Generate Forecast
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {analytics.length < 7 ? (
          <Alert className="bg-yellow-600/10 border-yellow-500/30">
            <AlertDescription className="text-yellow-300">
              Need at least 7 days of data to generate accurate predictions.
            </AlertDescription>
          </Alert>
        ) : !predictions ? (
          <div className="text-center py-12">
            <TrendingUp className="w-12 h-12 text-purple-400 mx-auto mb-3" />
            <p className="text-slate-300 mb-2">Ready to forecast your website's future</p>
            <p className="text-sm text-slate-400">
              Click "Generate Forecast" to get AI-powered predictions
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Traffic Forecast */}
            <div className="grid md:grid-cols-3 gap-4">
              <Card className="bg-blue-600/10 border-blue-500/30">
                <CardContent className="pt-4">
                  <Target className="w-5 h-5 text-blue-400 mb-2" />
                  <p className="text-2xl font-bold text-white">
                    {predictions.traffic_forecast?.predicted_views?.toLocaleString()}
                  </p>
                  <p className="text-xs text-slate-400">Predicted Views (30d)</p>
                  <Badge className="mt-2 bg-blue-600">
                    +{(predictions.traffic_forecast?.growth_rate * 100).toFixed(1)}% growth
                  </Badge>
                </CardContent>
              </Card>

              <Card className="bg-green-600/10 border-green-500/30">
                <CardContent className="pt-4">
                  <TrendingUp className="w-5 h-5 text-green-400 mb-2" />
                  <p className="text-2xl font-bold text-white">
                    {predictions.conversion_prediction?.predicted_conversions}
                  </p>
                  <p className="text-xs text-slate-400">Predicted Conversions</p>
                  <Badge className="mt-2 bg-green-600">
                    {(predictions.conversion_prediction?.conversion_rate * 100).toFixed(1)}% rate
                  </Badge>
                </CardContent>
              </Card>

              <Card className="bg-purple-600/10 border-purple-500/30">
                <CardContent className="pt-4">
                  <DollarSign className="w-5 h-5 text-purple-400 mb-2" />
                  <p className="text-2xl font-bold text-white">
                    {predictions.roi_estimate?.estimated_roi}
                  </p>
                  <p className="text-xs text-slate-400">Estimated ROI</p>
                  <Badge className="mt-2 bg-purple-600">
                    {predictions.roi_estimate?.timeframe}
                  </Badge>
                </CardContent>
              </Card>
            </div>

            {/* Emerging Trends */}
            <Alert className="bg-blue-600/10 border-blue-500/30">
              <TrendingUp className="w-4 h-4 text-blue-400" />
              <AlertDescription className="text-blue-300">
                <strong className="text-blue-200">Emerging Trends:</strong>
                <ul className="list-disc list-inside mt-1 space-y-0.5">
                  {predictions.emerging_trends?.map((trend, idx) => (
                    <li key={idx}>{trend}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>

            {/* Risk Factors */}
            {predictions.risk_factors && predictions.risk_factors.length > 0 && (
              <Alert className="bg-red-600/10 border-red-500/30">
                <AlertTriangle className="w-4 h-4 text-red-400" />
                <AlertDescription className="text-red-300">
                  <strong className="text-red-200">Risk Factors:</strong>
                  <ul className="list-disc list-inside mt-1 space-y-0.5">
                    {predictions.risk_factors.map((risk, idx) => (
                      <li key={idx}>{risk}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Growth Opportunities */}
            <Alert className="bg-green-600/10 border-green-500/30">
              <AlertDescription className="text-green-300">
                <strong className="text-green-200">Growth Opportunities:</strong>
                <ul className="list-disc list-inside mt-1 space-y-0.5">
                  {predictions.growth_opportunities?.map((opp, idx) => (
                    <li key={idx}>{opp}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>

            {/* Recommended Actions */}
            <Alert className="bg-purple-600/10 border-purple-500/30">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <AlertDescription className="text-purple-300">
                <strong className="text-purple-200">Recommended Actions:</strong>
                <ul className="list-disc list-inside mt-1 space-y-0.5">
                  {predictions.recommended_actions?.map((action, idx) => (
                    <li key={idx}>{action}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          </div>
        )}
      </CardContent>
    </Card>
  );
}