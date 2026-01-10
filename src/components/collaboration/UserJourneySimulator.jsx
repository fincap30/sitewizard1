import React, { useState } from 'react';
import { useQuery, useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, Loader2, Route, Target, Eye } from "lucide-react";
import { toast } from "sonner";

export default function UserJourneySimulator({ websiteIntakeId }) {
  const [selectedSegment, setSelectedSegment] = useState('');
  const [journey, setJourney] = useState(null);

  const { data: segments = [] } = useQuery({
    queryKey: ['segments-journey', websiteIntakeId],
    queryFn: () => base44.entities.UserSegment.filter({ website_intake_id: websiteIntakeId }),
    enabled: !!websiteIntakeId,
  });

  const { data: websiteIntake } = useQuery({
    queryKey: ['website-journey', websiteIntakeId],
    queryFn: () => base44.entities.WebsiteIntake.filter({ id: websiteIntakeId }).then(w => w[0]),
    enabled: !!websiteIntakeId,
  });

  const simulateJourneyMutation = useMutation({
    mutationFn: async () => {
      const segment = segments.find(s => s.id === selectedSegment);

      const prompt = `Simulate user journey for personalized segment.

Business: ${websiteIntake?.company_name}
Goals: ${websiteIntake?.business_goals?.join(', ')}

User Segment: ${segment?.segment_name}
Criteria: ${JSON.stringify(segment?.criteria)}
Personalization:
- Hero: ${segment?.personalization_rules?.hero_text}
- CTA: ${segment?.personalization_rules?.cta_text}
- Offers: ${segment?.personalization_rules?.offers?.join(', ')}

Simulate typical user journey including:
1. Landing page experience
2. Navigation path
3. Interaction points
4. Personalization triggers
5. Conversion touchpoints
6. Expected outcomes

Provide step-by-step journey with personalization impact analysis.
Return as JSON.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            journey_steps: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  step: { type: "string" },
                  page: { type: "string" },
                  personalization: { type: "string" },
                  user_action: { type: "string" },
                  impact: { type: "string" }
                }
              }
            },
            conversion_probability: { type: "number" },
            key_insights: { type: "array", items: { type: "string" } },
            optimization_suggestions: { type: "array", items: { type: "string" } }
          }
        }
      });

      return response;
    },
    onSuccess: (data) => {
      setJourney(data);
      toast.success('Journey simulated!');
    },
  });

  return (
    <Card className="border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Route className="w-5 h-5 text-purple-400" />
          AI User Journey Simulator
        </CardTitle>
        <CardDescription>Visualize personalization impact on user experience</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Select value={selectedSegment} onValueChange={setSelectedSegment}>
            <SelectTrigger className="flex-1">
              <SelectValue placeholder="Select user segment" />
            </SelectTrigger>
            <SelectContent>
              {segments.map(segment => (
                <SelectItem key={segment.id} value={segment.id}>
                  {segment.segment_name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={() => simulateJourneyMutation.mutate()}
            disabled={!selectedSegment || simulateJourneyMutation.isPending}
          >
            {simulateJourneyMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
            Simulate
          </Button>
        </div>

        {journey && (
          <div className="space-y-4">
            <Card className="bg-purple-600/10 border-purple-500/30">
              <CardContent className="pt-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-slate-400">Conversion Probability</p>
                    <p className="text-3xl font-bold text-purple-300">
                      {(journey.conversion_probability * 100).toFixed(0)}%
                    </p>
                  </div>
                  <Target className="w-8 h-8 text-purple-400" />
                </div>
              </CardContent>
            </Card>

            <div className="space-y-3">
              <h4 className="font-semibold text-white">Journey Steps</h4>
              {journey.journey_steps?.map((step, idx) => (
                <Card key={idx} className="bg-slate-700/30">
                  <CardContent className="pt-4">
                    <div className="flex items-start gap-3">
                      <Badge className="bg-purple-600">{idx + 1}</Badge>
                      <div className="flex-1">
                        <h5 className="font-semibold text-white mb-1">{step.step}</h5>
                        <p className="text-xs text-slate-400 mb-1">Page: {step.page}</p>
                        <Alert className="bg-blue-600/10 border-blue-500/30 mb-2">
                          <Eye className="w-3 h-3 text-blue-400" />
                          <AlertDescription className="text-blue-300 text-xs">
                            <strong>Personalization:</strong> {step.personalization}
                          </AlertDescription>
                        </Alert>
                        <p className="text-sm text-slate-300 mb-1">
                          <strong>User Action:</strong> {step.user_action}
                        </p>
                        <p className="text-xs text-green-300">
                          <strong>Impact:</strong> {step.impact}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Alert className="bg-yellow-600/10 border-yellow-500/30">
              <AlertDescription className="text-yellow-300">
                <strong>Key Insights:</strong>
                <ul className="list-disc list-inside mt-1 text-sm">
                  {journey.key_insights?.map((insight, idx) => (
                    <li key={idx}>{insight}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>

            <Alert className="bg-green-600/10 border-green-500/30">
              <AlertDescription className="text-green-300">
                <strong>Optimization Suggestions:</strong>
                <ul className="list-disc list-inside mt-1 text-sm">
                  {journey.optimization_suggestions?.map((suggestion, idx) => (
                    <li key={idx}>{suggestion}</li>
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