import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles, Loader2, Users, Briefcase, MessageSquare } from "lucide-react";
import { toast } from "sonner";

export default function AIWorkflowAutomation() {
  const queryClient = useQueryClient();

  const { data: buildTasks = [] } = useQuery({
    queryKey: ['build-tasks-workflow'],
    queryFn: () => base44.entities.BuildTask.list('-created_date'),
  });

  const { data: teamMembers = [] } = useQuery({
    queryKey: ['team-members'],
    queryFn: () => base44.entities.TeamMember.list(),
  });

  const { data: websites = [] } = useQuery({
    queryKey: ['websites-workflow'],
    queryFn: () => base44.entities.WebsiteIntake.list('-created_date'),
  });

  const autoAssignTasksMutation = useMutation({
    mutationFn: async () => {
      const unassignedTasks = buildTasks.filter(t => !t.assigned_to && t.status === 'pending');

      const prompt = `Auto-assign tasks to team members based on workload and expertise.

Team Members:
${teamMembers.map(m => `
- ${m.name} (${m.role})
  Skills: ${m.skills?.join(', ')}
  Workload: ${m.current_workload || 0} tasks
  Status: ${m.availability}
`).join('\n')}

Unassigned Tasks:
${unassignedTasks.map(t => `
- ${t.task_name} (${t.task_type})
  Priority: ${t.priority}
`).join('\n')}

Assign each task to the most suitable team member considering:
1. Skill match
2. Current workload
3. Availability
4. Task priority

Return as JSON array with task_id and assigned_to_email.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            assignments: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  task_name: { type: "string" },
                  assigned_to_email: { type: "string" },
                  reasoning: { type: "string" }
                }
              }
            }
          }
        }
      });

      // Update tasks
      for (const assignment of response.assignments) {
        const task = unassignedTasks.find(t => t.task_name === assignment.task_name);
        if (task) {
          await base44.entities.BuildTask.update(task.id, {
            assigned_to: assignment.assigned_to_email
          });
        }
      }

      return response.assignments;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['build-tasks-workflow'] });
      toast.success('Tasks auto-assigned!');
    },
  });

  const predictResourcesMutation = useMutation({
    mutationFn: async () => {
      const activeProjects = websites.filter(w => w.website_status !== 'live' && w.website_status !== 'cancelled');

      const prompt = `Predict project resource needs.

Active Projects: ${activeProjects.length}
${activeProjects.slice(0, 5).map(w => `
- ${w.company_name} (${w.website_status})
  Goals: ${w.business_goals?.join(', ')}
`).join('\n')}

Current Team:
${teamMembers.map(m => `- ${m.name}: ${m.role}, ${m.current_workload || 0} tasks`).join('\n')}

Pending Tasks: ${buildTasks.filter(t => t.status === 'pending').length}
In Progress: ${buildTasks.filter(t => t.status === 'in_progress').length}

Predict:
1. Resource gaps (roles needed)
2. Estimated hours per role
3. Potential bottlenecks
4. Hiring/outsourcing recommendations

Return as JSON.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            resource_gaps: { type: "array", items: { type: "string" } },
            estimated_hours: {
              type: "object",
              properties: {
                developer: { type: "number" },
                designer: { type: "number" },
                content_writer: { type: "number" }
              }
            },
            bottlenecks: { type: "array", items: { type: "string" } },
            recommendations: { type: "array", items: { type: "string" } }
          }
        }
      });

      return response;
    },
  });

  const generateCommunicationMutation = useMutation({
    mutationFn: async ({ templateType, websiteId }) => {
      const website = websites.find(w => w.id === websiteId);

      const prompt = `Generate client communication template.

Template Type: ${templateType}
Client: ${website?.company_name}
Email: ${website?.client_email}
Status: ${website?.website_status}

Create professional, friendly message for ${templateType.replace(/_/g, ' ')}.
Include:
- Warm greeting
- Specific project details
- Clear next steps
- Professional closing

Return subject and message as JSON.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            subject: { type: "string" },
            message: { type: "string" }
          }
        }
      });

      await base44.entities.ClientCommunication.create({
        website_intake_id: websiteId,
        client_email: website.client_email,
        template_type: templateType,
        subject: response.subject,
        message: response.message
      });

      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['communications'] });
      toast.success('Communication template generated!');
    },
  });

  return (
    <div className="space-y-6">
      <Card className="border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-orange-400" />
            AI Workflow Automation
          </CardTitle>
          <CardDescription>Auto-assign tasks, predict resources, generate communications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="bg-slate-700/30">
              <CardContent className="pt-4">
                <Users className="w-4 h-4 text-blue-400 mb-2" />
                <p className="text-2xl font-bold text-white">{teamMembers.length}</p>
                <p className="text-xs text-slate-400">Team Members</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-700/30">
              <CardContent className="pt-4">
                <Briefcase className="w-4 h-4 text-green-400 mb-2" />
                <p className="text-2xl font-bold text-white">
                  {buildTasks.filter(t => t.status === 'pending').length}
                </p>
                <p className="text-xs text-slate-400">Pending Tasks</p>
              </CardContent>
            </Card>
            <Card className="bg-slate-700/30">
              <CardContent className="pt-4">
                <MessageSquare className="w-4 h-4 text-purple-400 mb-2" />
                <p className="text-2xl font-bold text-white">{websites.length}</p>
                <p className="text-xs text-slate-400">Active Projects</p>
              </CardContent>
            </Card>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => autoAssignTasksMutation.mutate()}
              disabled={autoAssignTasksMutation.isPending}
              className="flex-1"
            >
              {autoAssignTasksMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
              Auto-Assign Tasks
            </Button>
            <Button
              onClick={() => predictResourcesMutation.mutate()}
              disabled={predictResourcesMutation.isPending}
              variant="outline"
              className="flex-1"
            >
              {predictResourcesMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
              Predict Resources
            </Button>
          </div>

          {predictResourcesMutation.data && (
            <div className="space-y-3">
              <Alert className="bg-red-600/10 border-red-500/30">
                <AlertDescription className="text-red-300">
                  <strong>Resource Gaps:</strong>
                  <ul className="list-disc list-inside mt-1 text-sm">
                    {predictResourcesMutation.data.resource_gaps?.map((gap, idx) => (
                      <li key={idx}>{gap}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>

              <Alert className="bg-yellow-600/10 border-yellow-500/30">
                <AlertDescription className="text-yellow-300">
                  <strong>Potential Bottlenecks:</strong>
                  <ul className="list-disc list-inside mt-1 text-sm">
                    {predictResourcesMutation.data.bottlenecks?.map((bottleneck, idx) => (
                      <li key={idx}>{bottleneck}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>

              <Alert className="bg-green-600/10 border-green-500/30">
                <AlertDescription className="text-green-300">
                  <strong>Recommendations:</strong>
                  <ul className="list-disc list-inside mt-1 text-sm">
                    {predictResourcesMutation.data.recommendations?.map((rec, idx) => (
                      <li key={idx}>{rec}</li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Client Communication Templates</CardTitle>
          <CardDescription>Generate automated messages for common inquiries</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-3">
            {['project_update', 'milestone_complete', 'feedback_request', 'issue_resolution'].map(type => (
              <Button
                key={type}
                onClick={() => websites[0] && generateCommunicationMutation.mutate({ templateType: type, websiteId: websites[0].id })}
                disabled={generateCommunicationMutation.isPending || websites.length === 0}
                variant="outline"
                className="justify-start"
              >
                <MessageSquare className="w-4 h-4 mr-2" />
                {type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}