import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Clock, CheckCircle, XCircle, Loader2, FileText } from "lucide-react";

export default function RevisionRequestList({ revisions }) {
  const getStatusConfig = (status) => {
    switch (status) {
      case 'pending':
        return { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pending' };
      case 'in_progress':
        return { color: 'bg-blue-100 text-blue-800', icon: Loader2, label: 'In Progress' };
      case 'completed':
        return { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Completed' };
      case 'rejected':
        return { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Rejected' };
      default:
        return { color: 'bg-slate-100 text-slate-800', icon: Clock, label: status };
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-blue-100 text-blue-800';
      case 'low': return 'bg-slate-100 text-slate-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  if (revisions.length === 0) {
    return (
      <Card className="border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
        <CardContent className="py-12 text-center">
          <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
          <p className="text-slate-300 mb-2">No revision requests yet</p>
          <p className="text-sm text-slate-400">
            Once your website is live, you can request changes here
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle>Revision Requests History</CardTitle>
        <CardDescription>Track all your modification requests</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {revisions.map((revision) => {
          const statusConfig = getStatusConfig(revision.status);
          const StatusIcon = statusConfig.icon;

          return (
            <Card key={revision.id} className="border border-slate-700/50 bg-slate-800/30">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="capitalize">{revision.request_type?.replace(/_/g, ' ')}</Badge>
                      <Badge className={getPriorityColor(revision.priority)}>
                        {revision.priority}
                      </Badge>
                    </div>
                    <CardTitle className="text-base text-white">
                      {revision.description.split('\n')[0].substring(0, 100)}
                      {revision.description.length > 100 && '...'}
                    </CardTitle>
                    <CardDescription className="text-slate-400">
                      Submitted {new Date(revision.created_date).toLocaleDateString()}
                    </CardDescription>
                  </div>
                  <Badge className={statusConfig.color}>
                    <StatusIcon className={`w-3 h-3 mr-1 ${revision.status === 'in_progress' ? 'animate-spin' : ''}`} />
                    {statusConfig.label}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-300 whitespace-pre-wrap">{revision.description}</p>
                
                {revision.admin_response && (
                  <Alert className="mt-3 bg-blue-600/10 border-blue-500/30">
                    <AlertDescription className="text-blue-300">
                      <strong className="text-blue-200">Admin Response:</strong>
                      <p className="mt-1">{revision.admin_response}</p>
                    </AlertDescription>
                  </Alert>
                )}

                {revision.completed_date && (
                  <p className="text-xs text-slate-500 mt-2">
                    Completed on {new Date(revision.completed_date).toLocaleDateString()}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </CardContent>
    </Card>
  );
}