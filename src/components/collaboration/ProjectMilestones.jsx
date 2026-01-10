import React from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Clock, PlayCircle, Flag } from "lucide-react";

export default function ProjectMilestones({ websiteIntakeId }) {
  const { data: milestones = [] } = useQuery({
    queryKey: ['milestones', websiteIntakeId],
    queryFn: () => base44.entities.ProjectMilestone.filter({ website_intake_id: websiteIntakeId }),
    enabled: !!websiteIntakeId,
  });

  const getStatusConfig = (status) => {
    switch (status) {
      case 'completed':
        return { icon: CheckCircle, color: 'text-green-500', bgColor: 'bg-green-100', textColor: 'text-green-800', label: 'Completed' };
      case 'in_progress':
        return { icon: PlayCircle, color: 'text-blue-500', bgColor: 'bg-blue-100', textColor: 'text-blue-800', label: 'In Progress' };
      default:
        return { icon: Clock, color: 'text-slate-400', bgColor: 'bg-slate-100', textColor: 'text-slate-800', label: 'Pending' };
    }
  };

  const sortedMilestones = [...milestones].sort((a, b) => 
    new Date(a.created_date) - new Date(b.created_date)
  );

  return (
    <Card className="border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flag className="w-5 h-5 text-purple-400" />
          Project Milestones
        </CardTitle>
        <CardDescription>Track your website development progress</CardDescription>
      </CardHeader>
      <CardContent>
        {sortedMilestones.length === 0 ? (
          <p className="text-center py-8 text-slate-400">No milestones yet</p>
        ) : (
          <div className="space-y-3">
            {sortedMilestones.map((milestone, idx) => {
              const config = getStatusConfig(milestone.status);
              const Icon = config.icon;
              
              return (
                <div key={milestone.id} className="flex items-start gap-3">
                  <div className="flex flex-col items-center">
                    <div className={`p-2 rounded-full ${milestone.status === 'completed' ? 'bg-green-600' : 'bg-slate-700'}`}>
                      <Icon className={`w-4 h-4 ${milestone.status === 'completed' ? 'text-white' : config.color}`} />
                    </div>
                    {idx < sortedMilestones.length - 1 && (
                      <div className="w-0.5 h-8 bg-slate-700 my-1" />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-white">{milestone.milestone_name}</h4>
                        {milestone.notes && (
                          <p className="text-sm text-slate-400 mt-1">{milestone.notes}</p>
                        )}
                        {milestone.completed_date && (
                          <p className="text-xs text-slate-500 mt-1">
                            Completed: {new Date(milestone.completed_date).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                      <Badge className={`${config.bgColor} ${config.textColor}`}>
                        {config.label}
                      </Badge>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}