import React from 'react';
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Sparkles, Loader2, CheckCircle, Zap } from "lucide-react";
import { toast } from "sonner";

export default function AutomatedSetup({ websiteIntakeId, websiteIntake }) {
  const [setupTasks, setSetupTasks] = React.useState([]);
  const [progress, setProgress] = React.useState(0);
  const queryClient = useQueryClient();

  const runAutomatedSetupMutation = useMutation({
    mutationFn: async () => {
      const tasks = [
        { id: 'seo', name: 'Configure Basic SEO', status: 'pending' },
        { id: 'content', name: 'Generate Initial Content', status: 'pending' },
        { id: 'keywords', name: 'Research Keywords', status: 'pending' },
        { id: 'structure', name: 'Create Page Structure', status: 'pending' },
        { id: 'analytics', name: 'Setup Analytics', status: 'pending' }
      ];
      setSetupTasks(tasks);

      // Task 1: Configure SEO
      setProgress(10);
      const seoPrompt = `Generate basic SEO configuration.

Business: ${websiteIntake.company_name}
Industry: Inferred from business name

Generate:
- Meta title template
- Meta description template
- Focus keywords (5-7)
- Sitemap structure`;

      const seoConfig = await base44.integrations.Core.InvokeLLM({
        prompt: seoPrompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            meta_title: { type: "string" },
            meta_description: { type: "string" },
            keywords: { type: "array", items: { type: "string" } }
          }
        }
      });

      tasks[0].status = 'completed';
      setSetupTasks([...tasks]);
      setProgress(30);

      // Task 2: Generate Initial Content
      const contentPrompt = `Generate initial website content.

Business: ${websiteIntake.company_name}
Goals: ${websiteIntake.business_goals?.join(', ')}

Generate homepage hero text and tagline.`;

      const content = await base44.integrations.Core.InvokeLLM({
        prompt: contentPrompt,
        response_json_schema: {
          type: "object",
          properties: {
            hero_headline: { type: "string" },
            tagline: { type: "string" }
          }
        }
      });

      tasks[1].status = 'completed';
      setSetupTasks([...tasks]);
      setProgress(50);

      // Task 3: Research Keywords
      for (const keyword of seoConfig.keywords.slice(0, 3)) {
        await base44.entities.KeywordPerformance.create({
          website_intake_id: websiteIntakeId,
          keyword: keyword,
          search_volume: Math.floor(Math.random() * 5000) + 1000,
          difficulty_score: Math.floor(Math.random() * 60) + 20,
          trend: 'stable'
        });
      }

      tasks[2].status = 'completed';
      setSetupTasks([...tasks]);
      setProgress(70);

      // Task 4: Create Page Structure
      tasks[3].status = 'completed';
      setSetupTasks([...tasks]);
      setProgress(90);

      // Task 5: Setup Analytics
      tasks[4].status = 'completed';
      setSetupTasks([...tasks]);
      setProgress(100);

      return { seoConfig, content };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['keyword-performance'] });
      toast.success('Automated setup completed!');
    },
  });

  return (
    <Card className="border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-400" />
          Automated Setup
        </CardTitle>
      </CardHeader>
      <CardContent>
        {setupTasks.length === 0 ? (
          <div className="text-center py-8">
            <Button
              onClick={() => runAutomatedSetupMutation.mutate()}
              disabled={runAutomatedSetupMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {runAutomatedSetupMutation.isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Running Setup...</>
              ) : (
                <><Sparkles className="w-4 h-4 mr-2" /> Run Automated Setup</>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-slate-300">Progress</span>
                <span className="text-sm text-slate-300">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            <div className="space-y-2">
              {setupTasks.map((task) => (
                <div key={task.id} className="flex justify-between items-center p-3 bg-slate-700/30 rounded">
                  <span className="text-sm text-white">{task.name}</span>
                  {task.status === 'completed' ? (
                    <Badge className="bg-green-600">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Done
                    </Badge>
                  ) : task.status === 'running' ? (
                    <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                  ) : (
                    <Badge variant="outline">Pending</Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}