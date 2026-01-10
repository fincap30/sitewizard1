import React, { useState } from 'react';
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Clock, CheckCircle, XCircle, Loader2, MessageSquare } from "lucide-react";
import { toast } from "sonner";

export default function AdminRevisionManager({ revisions }) {
  const [selectedRevision, setSelectedRevision] = useState(null);
  const [adminResponse, setAdminResponse] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const queryClient = useQueryClient();

  const autoCategorizeMutation = useMutation({
    mutationFn: async (revision) => {
      const prompt = `Analyze this revision request and categorize it:

Request: ${revision.description}
Type: ${revision.request_type}

Determine:
1. Priority (low/medium/high/urgent)
2. Estimated complexity (simple/moderate/complex)
3. Suggested action (approve/needs_clarification/reject)
4. AI-generated draft response

Return JSON.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            priority: { type: "string" },
            complexity: { type: "string" },
            suggested_action: { type: "string" },
            draft_response: { type: "string" }
          }
        }
      });

      return response;
    },
  });

  const updateRevisionMutation = useMutation({
    mutationFn: async ({ revision_id, status, admin_response }) => {
      await base44.functions.invoke('updateRevisionStatus', {
        revision_id,
        status,
        admin_response
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-modifications'] });
      setSelectedRevision(null);
      setAdminResponse('');
      toast.success('Revision updated and client notified!');
    },
  });

  const handleUpdate = () => {
    if (!newStatus) {
      toast.error('Please select a status');
      return;
    }
    updateRevisionMutation.mutate({
      revision_id: selectedRevision.id,
      status: newStatus,
      admin_response: adminResponse
    });
  };

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
      case 'urgent': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-blue-500 text-white';
      case 'low': return 'bg-slate-400 text-white';
      default: return 'bg-slate-400 text-white';
    }
  };

  const sortedRevisions = [...revisions].sort((a, b) => {
    const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
    const statusOrder = { pending: 0, in_progress: 1, completed: 2, rejected: 2 };
    
    if (a.status !== b.status) {
      return statusOrder[a.status] - statusOrder[b.status];
    }
    return priorityOrder[a.priority] - priorityOrder[b.priority];
  });

  return (
    <>
      <Card className="border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-purple-400" />
            Revision Request Management
          </CardTitle>
          <CardDescription>View, prioritize, and manage client revision requests</CardDescription>
        </CardHeader>
        <CardContent>
          {revisions.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              No revision requests yet
            </div>
          ) : (
            <div className="space-y-3">
              {sortedRevisions.map(revision => {
                const statusConfig = getStatusConfig(revision.status);
                const StatusIcon = statusConfig.icon;

                return (
                  <Card key={revision.id} className="border border-slate-700/50 bg-slate-800/30 hover:bg-slate-800/50 transition-colors">
                    <CardContent className="pt-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <Badge className={getPriorityColor(revision.priority)}>
                              {revision.priority}
                            </Badge>
                            <Badge className="capitalize">{revision.request_type?.replace(/_/g, ' ')}</Badge>
                            <Badge className={statusConfig.color}>
                              <StatusIcon className={`w-3 h-3 mr-1 ${revision.status === 'in_progress' ? 'animate-spin' : ''}`} />
                              {statusConfig.label}
                            </Badge>
                          </div>
                          <p className="text-sm text-slate-300 mb-1">
                            <strong className="text-white">Client:</strong> {revision.client_email}
                          </p>
                          <p className="text-sm text-slate-400">
                            {new Date(revision.created_date).toLocaleDateString()} at {new Date(revision.created_date).toLocaleTimeString()}
                          </p>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              autoCategorizeMutation.mutate(revision, {
                                onSuccess: (result) => {
                                  setSelectedRevision(revision);
                                  setNewStatus(result.suggested_action === 'approve' ? 'in_progress' : revision.status);
                                  setAdminResponse(result.draft_response);
                                  toast.success('AI analysis complete!');
                                }
                              });
                            }}
                            disabled={autoCategorizeMutation.isPending}
                          >
                            AI Analyze
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              setSelectedRevision(revision);
                              setNewStatus(revision.status);
                              setAdminResponse(revision.admin_response || '');
                            }}
                          >
                            Manage
                          </Button>
                        </div>
                      </div>
                      <p className="text-sm text-white bg-slate-700/30 p-3 rounded-lg">
                        {revision.description}
                      </p>
                      {revision.admin_response && (
                        <div className="mt-2 p-2 bg-blue-600/10 border border-blue-500/30 rounded-lg">
                          <p className="text-xs text-blue-300">
                            <strong>Your Response:</strong> {revision.admin_response}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manage Dialog */}
      <Dialog open={!!selectedRevision} onOpenChange={() => setSelectedRevision(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Manage Revision Request</DialogTitle>
          </DialogHeader>
          
          {selectedRevision && (
            <div className="space-y-4 py-4">
              <div>
                <p className="text-sm font-medium text-slate-400 mb-1">Client</p>
                <p className="text-white">{selectedRevision.client_email}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-400 mb-1">Request Type</p>
                <Badge className="capitalize">{selectedRevision.request_type?.replace(/_/g, ' ')}</Badge>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-400 mb-1">Description</p>
                <p className="text-white bg-slate-800 p-3 rounded-lg">{selectedRevision.description}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-400 mb-2">Update Status</p>
                <Select value={newStatus} onValueChange={setNewStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in_progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <p className="text-sm font-medium text-slate-400 mb-2">Admin Response</p>
                <Textarea
                  value={adminResponse}
                  onChange={(e) => setAdminResponse(e.target.value)}
                  placeholder="Add notes or response to client..."
                  rows={4}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedRevision(null)}>
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              disabled={updateRevisionMutation.isPending}
            >
              {updateRevisionMutation.isPending ? 'Updating...' : 'Update & Notify Client'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}