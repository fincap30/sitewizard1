import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function AITaskManager({ websiteIntakeId }) {
  const [newTask, setNewTask] = useState('');
  const queryClient = useQueryClient();

  const { data: tasks = [] } = useQuery({
    queryKey: ['tasks', websiteIntakeId],
    queryFn: () => base44.entities.CollaborationTask.filter({ website_intake_id: websiteIntakeId }),
    enabled: !!websiteIntakeId,
  });

  const { data: websiteIntake } = useQuery({
    queryKey: ['website-tasks', websiteIntakeId],
    queryFn: () => base44.entities.WebsiteIntake.filter({ id: websiteIntakeId }).then(w => w[0]),
    enabled: !!websiteIntakeId,
  });

  const createTaskMutation = useMutation({
    mutationFn: async () => {
      const prompt = `Analyze task and suggest priority with reasoning.

Project: ${websiteIntake?.company_name}
Project Status: ${websiteIntake?.website_status}
Goals: ${websiteIntake?.business_goals?.join(', ')}
Existing Tasks: ${tasks.length}

New Task: ${newTask}

Determine:
1. Priority (low/medium/high/urgent)
2. Reasoning for priority
3. Suggested due date (days from now)

Return as JSON.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            priority: { type: "string" },
            reasoning: { type: "string" },
            due_days: { type: "number" }
          }
        }
      });

      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + response.due_days);

      await base44.entities.CollaborationTask.create({
        website_intake_id: websiteIntakeId,
        title: newTask,
        priority: response.priority,
        ai_reasoning: response.reasoning,
        due_date: dueDate.toISOString().split('T')[0]
      });

      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      setNewTask('');
      toast.success('Task created with AI priority!');
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      await base44.entities.CollaborationTask.update(id, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-600';
      case 'high': return 'bg-orange-600';
      case 'medium': return 'bg-yellow-600';
      default: return 'bg-blue-600';
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          placeholder="Add new task..."
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
        />
        <Button
          onClick={() => createTaskMutation.mutate()}
          disabled={createTaskMutation.isPending || !newTask}
        >
          {createTaskMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
        </Button>
      </div>

      <div className="space-y-2">
        {tasks.map((task) => (
          <Card key={task.id} className="bg-slate-700/30">
            <CardContent className="pt-3">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <p className="font-semibold text-white">{task.title}</p>
                  {task.ai_reasoning && (
                    <p className="text-xs text-slate-400 mt-1">AI: {task.ai_reasoning}</p>
                  )}
                </div>
                <Badge className={getPriorityColor(task.priority)}>
                  {task.priority}
                </Badge>
              </div>
              <div className="flex gap-2">
                {['todo', 'in_progress', 'completed'].map((status) => (
                  <Button
                    key={status}
                    size="sm"
                    variant={task.status === status ? 'default' : 'outline'}
                    onClick={() => updateTaskMutation.mutate({ id: task.id, status })}
                    className="text-xs"
                  >
                    {status.replace('_', ' ')}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}