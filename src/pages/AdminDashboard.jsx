import React, { useState, useEffect } from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Users, FileText, TrendingUp, Zap } from "lucide-react";

export default function AdminDashboard() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(user => {
      if (user.role !== 'admin') {
        window.location.href = '/';
      }
      setUser(user);
    }).catch(() => {
      base44.auth.redirectToLogin();
    });
  }, []);

  const { data: projects = [] } = useQuery({
    queryKey: ['all-projects'],
    queryFn: () => base44.entities.Project.list('-created_date'),
    enabled: !!user,
  });

  const { data: leads = [] } = useQuery({
    queryKey: ['all-leads'],
    queryFn: () => base44.entities.Lead.list('-created_date'),
    enabled: !!user,
  });

  const { data: modifications = [] } = useQuery({
    queryKey: ['all-modifications'],
    queryFn: () => base44.entities.ModificationRequest.list('-created_date'),
    enabled: !!user,
  });

  const stats = {
    totalProjects: projects.length,
    activeProjects: projects.filter(p => p.status === 'in_progress').length,
    completedProjects: projects.filter(p => p.status === 'completed').length,
    totalLeads: leads.length,
    facebookLeads: leads.filter(l => l.source === 'facebook').length,
    conversionRate: leads.length > 0 ? ((projects.length / leads.length) * 100).toFixed(1) : 0
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Admin Dashboard</h1>
          <p className="text-slate-600">Manage projects, leads, and client requests</p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Total Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold">{stats.totalProjects}</div>
                <FileText className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Active Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold">{stats.activeProjects}</div>
                <Zap className="w-8 h-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Facebook Leads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold">{stats.facebookLeads}</div>
                <Users className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">Conversion Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="text-3xl font-bold">{stats.conversionRate}%</div>
                <TrendingUp className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs for different views */}
        <Tabs defaultValue="projects" className="space-y-4">
          <TabsList>
            <TabsTrigger value="projects">Projects ({projects.length})</TabsTrigger>
            <TabsTrigger value="leads">Leads ({leads.length})</TabsTrigger>
            <TabsTrigger value="modifications">Modifications ({modifications.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="projects">
            <Card>
              <CardHeader>
                <CardTitle>All Projects</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-slate-500">
                  Project management interface will be enhanced with your GitHub code
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="leads">
            <Card>
              <CardHeader>
                <CardTitle>All Leads</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-slate-500">
                  Lead management interface will be enhanced with your GitHub code
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="modifications">
            <Card>
              <CardHeader>
                <CardTitle>Modification Requests</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-sm text-slate-500">
                  Modification request management will be enhanced with your GitHub code
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}