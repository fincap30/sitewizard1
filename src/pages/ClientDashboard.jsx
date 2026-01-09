import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { FileText, Clock, CheckCircle, AlertCircle, Plus } from "lucide-react";
import { toast } from "sonner";

export default function ClientDashboard() {
  const [user, setUser] = useState(null);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [requestData, setRequestData] = useState({
    description: '',
    request_type: 'content_change',
    priority: 'medium'
  });

  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {
      base44.auth.redirectToLogin();
    });
  }, []);

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['client-projects', user?.email],
    queryFn: () => base44.entities.Project.filter({ client_email: user.email }),
    enabled: !!user,
  });

  const { data: modifications = [] } = useQuery({
    queryKey: ['client-modifications', user?.email],
    queryFn: () => base44.entities.ModificationRequest.filter({ client_email: user.email }),
    enabled: !!user,
  });

  const submitRequestMutation = useMutation({
    mutationFn: (data) => base44.entities.ModificationRequest.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['client-modifications'] });
      toast.success('Modification request submitted!');
      setShowRequestForm(false);
      setRequestData({ description: '', request_type: 'content_change', priority: 'medium' });
    },
  });

  const statusColors = {
    new_lead: 'bg-blue-100 text-blue-800',
    analysis_pending: 'bg-yellow-100 text-yellow-800',
    in_progress: 'bg-purple-100 text-purple-800',
    review: 'bg-orange-100 text-orange-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-gray-100 text-gray-800'
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome back, {user.full_name || user.email}
          </h1>
          <p className="text-slate-300">Track your projects and request modifications</p>
        </div>

        {/* Projects Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-600" />
            Your Projects
          </h2>

          {isLoading ? (
            <div className="text-center py-8">Loading projects...</div>
          ) : projects.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-slate-500">
                No projects yet. Submit a request on the homepage to get started!
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {projects.map((project) => (
                <Card key={project.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{project.business_name}</CardTitle>
                        <CardDescription>{project.website_type?.replace(/_/g, ' ')}</CardDescription>
                      </div>
                      <Badge className={statusColors[project.status]}>
                        {project.status?.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-500" />
                        <span>Started: {new Date(project.created_date).toLocaleDateString()}</span>
                      </div>
                      {project.deadline && (
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-slate-500" />
                          <span>Deadline: {new Date(project.deadline).toLocaleDateString()}</span>
                        </div>
                      )}
                      {project.analysis_completed && (
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          <span className="text-green-600 font-medium">5-Point Analysis Completed</span>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Modification Requests Section */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold flex items-center gap-2">
              Modification Requests
            </h2>
            {projects.length > 0 && (
              <Button onClick={() => setShowRequestForm(!showRequestForm)}>
                <Plus className="w-4 h-4 mr-2" />
                New Request
              </Button>
            )}
          </div>

          {showRequestForm && (
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Submit Modification Request</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1 block">Project</label>
                  <select
                    className="w-full border rounded-md px-3 py-2"
                    onChange={(e) => setRequestData({...requestData, project_id: e.target.value})}
                  >
                    <option value="">Select a project</option>
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.business_name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Request Type</label>
                  <select
                    className="w-full border rounded-md px-3 py-2"
                    value={requestData.request_type}
                    onChange={(e) => setRequestData({...requestData, request_type: e.target.value})}
                  >
                    <option value="content_change">Content Change</option>
                    <option value="design_change">Design Change</option>
                    <option value="functionality">New Functionality</option>
                    <option value="bug_fix">Bug Fix</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">Description</label>
                  <Textarea
                    value={requestData.description}
                    onChange={(e) => setRequestData({...requestData, description: e.target.value})}
                    placeholder="Describe what you'd like changed..."
                    rows={4}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={() => submitRequestMutation.mutate({
                      ...requestData,
                      client_email: user.email
                    })}
                    disabled={!requestData.project_id || !requestData.description}
                  >
                    Submit Request
                  </Button>
                  <Button variant="outline" onClick={() => setShowRequestForm(false)}>
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid gap-4">
            {modifications.map((mod) => (
              <Card key={mod.id}>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{mod.request_type?.replace(/_/g, ' ')}</CardTitle>
                      <CardDescription>
                        {new Date(mod.created_date).toLocaleDateString()}
                      </CardDescription>
                    </div>
                    <Badge className={
                      mod.status === 'completed' ? 'bg-green-100 text-green-800' :
                      mod.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                      mod.status === 'rejected' ? 'bg-red-100 text-red-800' :
                      'bg-yellow-100 text-yellow-800'
                    }>
                      {mod.status}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-slate-600 mb-2">{mod.description}</p>
                  {mod.admin_response && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-md">
                      <p className="text-sm font-medium text-blue-900 mb-1">Admin Response:</p>
                      <p className="text-sm text-blue-800">{mod.admin_response}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}