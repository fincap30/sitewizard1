import React from 'react';
import { useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles, Loader2, CheckCircle, Clock } from "lucide-react";
import { toast } from "sonner";

export default function ProjectRoadmap({ websiteIntake }) {
  const [roadmap, setRoadmap] = React.useState(null);

  const generateRoadmapMutation = useMutation({
    mutationFn: async () => {
      const prompt = `Create detailed project roadmap and timeline.

Project: ${websiteIntake.company_name}
Goals: ${websiteIntake.business_goals?.join(', ')}
Website Type: ${websiteIntake.website_type}
Features Needed: ${websiteIntake.key_features?.join(', ')}

Generate comprehensive roadmap with:
1. Project phases (with week estimates)
2. Key milestones
3. Deliverables for each phase
4. Timeline visualization
5. Dependencies between phases
6. Suggested features based on industry
7. Recommended services/upgrades

Return as JSON with detailed phases.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            total_duration_weeks: { type: "number" },
            phases: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  duration_weeks: { type: "number" },
                  deliverables: { type: "array", items: { type: "string" } },
                  status: { type: "string" }
                }
              }
            },
            milestones: { type: "array", items: { type: "string" } },
            suggested_features: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  feature: { type: "string" },
                  reason: { type: "string" },
                  priority: { type: "string" }
                }
              }
            }
          }
        }
      });

      return response;
    },
    onSuccess: (data) => {
      setRoadmap(data);
      toast.success('Roadmap generated!');
    },
  });

  return (
    <Card className="border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle>Your Project Roadmap</CardTitle>
          <Button
            onClick={() => generateRoadmapMutation.mutate()}
            disabled={generateRoadmapMutation.isPending}
            size="sm"
          >
            {generateRoadmapMutation.isPending ? (
              <><Loader2 className="w-3 h-3 animate-spin mr-2" /> Generating...</>
            ) : (
              <><Sparkles className="w-3 h-3 mr-2" /> Generate Roadmap</>
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {roadmap ? (
          <div className="space-y-6">
            <Alert className="bg-blue-600/10 border-blue-500/30">
              <Clock className="w-4 h-4 text-blue-400" />
              <AlertDescription className="text-blue-300">
                <strong>Estimated Timeline:</strong> {roadmap.total_duration_weeks} weeks
              </AlertDescription>
            </Alert>

            <div className="space-y-4">
              {roadmap.phases?.map((phase, idx) => (
                <Card key={idx} className="bg-slate-700/30">
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h4 className="font-semibold text-white">{phase.name}</h4>
                        <p className="text-xs text-slate-400">{phase.duration_weeks} weeks</p>
                      </div>
                      <Badge className={phase.status === 'completed' ? 'bg-green-600' : 'bg-blue-600'}>
                        {phase.status || 'upcoming'}
                      </Badge>
                    </div>
                    <div className="space-y-1">
                      {phase.deliverables?.map((deliverable, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm text-slate-300">
                          <CheckCircle className="w-4 h-4 text-green-400 mt-0.5" />
                          <span>{deliverable}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {roadmap.suggested_features && roadmap.suggested_features.length > 0 && (
              <Alert className="bg-purple-600/10 border-purple-500/30">
                <AlertDescription className="text-purple-300">
                  <strong className="text-purple-200">Recommended Features for Your Industry:</strong>
                  <div className="mt-2 space-y-2">
                    {roadmap.suggested_features.map((feature, idx) => (
                      <div key={idx} className="flex justify-between items-start">
                        <div>
                          <p className="text-sm font-semibold">{feature.feature}</p>
                          <p className="text-xs text-purple-400">{feature.reason}</p>
                        </div>
                        <Badge className={
                          feature.priority === 'high' ? 'bg-orange-600' :
                          feature.priority === 'medium' ? 'bg-yellow-600' :
                          'bg-blue-600'
                        }>
                          {feature.priority}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>
        ) : (
          <div className="text-center py-12 text-slate-400">
            <Clock className="w-12 h-12 mx-auto mb-3 text-blue-400" />
            <p>Generate your personalized project roadmap</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}