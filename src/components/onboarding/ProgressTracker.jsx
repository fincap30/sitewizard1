import React from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Clock, AlertCircle } from "lucide-react";

export default function ProgressTracker({ websiteIntakeId }) {
  const { data: milestones = [] } = useQuery({
    queryKey: ['milestones', websiteIntakeId],
    queryFn: () => base44.entities.ProjectMilestone.filter({ website_intake_id: websiteIntakeId }),
    enabled: !!websiteIntakeId,
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['build-tasks', websiteIntakeId],
    queryFn: () => base44.entities.BuildTask.filter({ website_intake_id: websiteIntakeId }),
    enabled: !!websiteIntakeId,
  });

  const completedMilestones = milestones.filter(m => m.status === 'completed').length;
  const totalMilestones = milestones.length;
  const progressPercent = totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0;

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-400" />;
      case 'in_progress': return <Clock className="w-4 h-4 text-blue-400" />;
      default: return <AlertCircle className="w-4 h-4 text-slate-400" />;
    }
  };

  return (
    <Card className="border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>Project Progress</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between mb-2">
            <span className="text-sm text-slate-300">Overall Progress</span>
            <span className="text-sm text-slate-300">{Math.round(progressPercent)}%</span>
          </div>
          <Progress value={progressPercent} className="h-3" />
          <p className="text-xs text-slate-400 mt-1">
            {completedMilestones} of {totalMilestones} milestones completed
          </p>
        </div>

        <div>
          <h4 className="font-semibold text-white mb-3">Milestones</h4>
          <div className="space-y-2">
            {milestones.slice(0, 5).map((milestone) => (
              <div key={milestone.id} className="flex justify-between items-center p-2 bg-slate-700/30 rounded">
                <div className="flex items-center gap-2">
                  {getStatusIcon(milestone.status)}
                  <span className="text-sm text-white">{milestone.milestone_name}</span>
                </div>
                <Badge className={
                  milestone.status === 'completed' ? 'bg-green-600' :
                  milestone.status === 'in_progress' ? 'bg-blue-600' :
                  'bg-slate-600'
                }>
                  {milestone.status}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-semibold text-white mb-3">Active Tasks</h4>
          <div className="space-y-2">
            {tasks.filter(t => t.status !== 'completed').slice(0, 3).map((task) => (
              <div key={task.id} className="flex justify-between items-start p-2 bg-slate-700/30 rounded">
                <span className="text-sm text-slate-300">{task.task_name}</span>
                <Badge className={
                  task.priority === 'urgent' ? 'bg-red-600' :
                  task.priority === 'high' ? 'bg-orange-600' :
                  'bg-blue-600'
                }>
                  {task.priority}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}