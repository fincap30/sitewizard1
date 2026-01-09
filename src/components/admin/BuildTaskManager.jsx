import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { CheckSquare, Clock, AlertCircle, PlayCircle } from "lucide-react";
import { toast } from "sonner";

export default function BuildTaskManager({ websiteIntakeId }) {
  const [showAddTask, setShowAddTask] = useState(false);
  const [newTaskType, setNewTaskType] = useState('integrate_analytics');
  const queryClient = useQueryClient();

  const { data: tasks = [] } = useQuery({
    queryKey: ['build-tasks', websiteIntakeId],
    queryFn: () => base44.entities.BuildTask.filter({ website_intake_id: websiteIntakeId }),
    enabled: !!websiteIntakeId,
  });

  const createTaskMutation = useMutation({
    mutationFn: async (taskType) => {
      const taskNames = {
        integrate_analytics: 'Integrate Analytics',
        optimize_images: 'Optimize Images',
        setup_seo: 'Setup SEO',
        configure_forms: 'Configure Forms',
        test_functionality: 'Test Functionality',
        deploy_staging: 'Deploy to Staging',
        final_review: 'Final Review',
        deploy_live: 'Deploy Live'
      };

      await base44.entities.BuildTask.create({
        website_intake_id: websiteIntakeId,
        task_name: taskNames[taskType],
        task_type: taskType,
        status: 'pending',
        priority: taskType === 'deploy_live' ? 'high' : 'medium'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['build-tasks'] });
      setShowAddTask(false);
      toast.success('Task added!');
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: ({ taskId, status }) => 
      base44.entities.BuildTask.update(taskId, { 
        status,
        completed_date: status === 'completed' ? new Date().toISOString() : null
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['build-tasks'] });
      toast.success('Task updated!');
    },
  });

  const autoDeployStaging = useMutation({
    mutationFn: async () => {
      await base44.functions.invoke('deployToStaging', { intake_id: websiteIntakeId });
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['build-tasks'] });
      toast.success('Deployed to staging!');
    },
  });

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return CheckSquare;
      case 'in_progress': return PlayCircle;
      case 'blocked': return AlertCircle;
      default: return Clock;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'in_progress': return 'bg-blue-100 text-blue-800';
      case 'blocked': return 'bg-red-100 text-red-800';
      default: return 'bg-yellow-100 text-yellow-800';
    }
  };

  return (
    <>
      <Card className="border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Build Tasks</CardTitle>
              <CardDescription>Track website build progress</CardDescription>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => setShowAddTask(true)}>
                Add Task
              </Button>
              <Button 
                size="sm" 
                onClick={() => autoDeployStaging.mutate()}
                disabled={autoDeployStaging.isPending}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Deploy Staging
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <p className="text-center py-8 text-slate-400">No tasks yet. Add tasks to track build progress.</p>
          ) : (
            <div className="space-y-3">
              {tasks.map(task => {
                const StatusIcon = getStatusIcon(task.status);
                return (
                  <div key={task.id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                    <div className="flex items-center gap-3 flex-1">
                      <StatusIcon className="w-5 h-5 text-slate-400" />
                      <div>
                        <p className="font-medium text-white">{task.task_name}</p>
                        {task.staging_url && (
                          <a href={task.staging_url} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-400 hover:underline">
                            {task.staging_url}
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(task.status)}>{task.status}</Badge>
                      <Select 
                        value={task.status} 
                        onValueChange={(status) => updateTaskMutation.mutate({ taskId: task.id, status })}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="in_progress">In Progress</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="blocked">Blocked</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showAddTask} onOpenChange={setShowAddTask}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Build Task</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Select value={newTaskType} onValueChange={setNewTaskType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="integrate_analytics">Integrate Analytics</SelectItem>
                <SelectItem value="optimize_images">Optimize Images</SelectItem>
                <SelectItem value="setup_seo">Setup SEO</SelectItem>
                <SelectItem value="configure_forms">Configure Forms</SelectItem>
                <SelectItem value="test_functionality">Test Functionality</SelectItem>
                <SelectItem value="deploy_staging">Deploy to Staging</SelectItem>
                <SelectItem value="final_review">Final Review</SelectItem>
                <SelectItem value="deploy_live">Deploy Live</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddTask(false)}>Cancel</Button>
            <Button onClick={() => createTaskMutation.mutate(newTaskType)}>Add Task</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}