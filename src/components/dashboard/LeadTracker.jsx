import React from 'react';
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { TrendingUp, Mail, Phone, Calendar } from "lucide-react";

export default function LeadTracker({ websiteIntakeId }) {
  const { data: leadData = {} } = useQuery({
    queryKey: ['website-leads', websiteIntakeId],
    queryFn: async () => {
      try {
        const behaviors = await base44.entities.UserBehavior.filter({
          website_intake_id: websiteIntakeId
        });

        const leads = behaviors.filter(b => b.conversion_action);
        
        // Group by date for trend
        const leadsByDate = {};
        leads.forEach(lead => {
          const date = new Date(lead.created_date).toLocaleDateString();
          leadsByDate[date] = (leadsByDate[date] || 0) + 1;
        });

        const trendData = Object.entries(leadsByDate)
          .map(([date, count]) => ({ date, leads: count }))
          .slice(-7);

        // Categorize leads
        const contactSubmissions = leads.filter(l => l.conversion_action === 'contact_form').length;
        const emailSignups = leads.filter(l => l.conversion_action === 'email_signup').length;
        const phoneClicks = leads.filter(l => l.conversion_action === 'phone_click').length;
        const cartAdds = leads.filter(l => l.conversion_action === 'add_to_cart').length;

        return {
          totalLeads: leads.length,
          contactSubmissions,
          emailSignups,
          phoneClicks,
          cartAdds,
          trendData,
          leadSources: {}
        };
      } catch {
        return { totalLeads: 0, contactSubmissions: 0, emailSignups: 0, phoneClicks: 0, cartAdds: 0, trendData: [] };
      }
    },
    enabled: !!websiteIntakeId
  });

  const conversionMetrics = [
    { label: 'Contact Forms', value: leadData.contactSubmissions, icon: Mail, color: 'text-blue-400' },
    { label: 'Email Signups', value: leadData.emailSignups, icon: Mail, color: 'text-green-400' },
    { label: 'Phone Clicks', value: leadData.phoneClicks, icon: Phone, color: 'text-orange-400' },
    { label: 'Cart Additions', value: leadData.cartAdds, icon: TrendingUp, color: 'text-purple-400' }
  ];

  return (
    <div className="space-y-6">
      <Card className="border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            Lead Generation Overview
          </CardTitle>
          <CardDescription>Track leads generated through your website</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Total Leads */}
          <div className="text-center p-6 bg-gradient-to-r from-green-600/10 to-green-900/10 rounded-lg border border-green-500/30">
            <p className="text-slate-400 text-sm mb-2">Total Leads Generated</p>
            <p className="text-5xl font-bold text-green-400">{leadData.totalLeads}</p>
            <p className="text-xs text-slate-400 mt-2">All-time total</p>
          </div>

          {/* Conversion Metrics Grid */}
          <div className="grid md:grid-cols-4 gap-4">
            {conversionMetrics.map((metric, idx) => {
              const Icon = metric.icon;
              return (
                <div key={idx} className="bg-slate-700/30 rounded-lg p-4 text-center">
                  <Icon className={`w-6 h-6 ${metric.color} mx-auto mb-2`} />
                  <p className="text-2xl font-bold text-white mb-1">{metric.value}</p>
                  <p className="text-xs text-slate-400">{metric.label}</p>
                </div>
              );
            })}
          </div>

          {/* Lead Trend */}
          {leadData.trendData && leadData.trendData.length > 0 && (
            <div className="bg-slate-700/20 rounded-lg p-4">
              <p className="text-sm font-medium text-white mb-4">Lead Trend (Last 7 Days)</p>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={leadData.trendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="date" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                  <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1e293b',
                      border: '1px solid #475569',
                      borderRadius: '8px'
                    }}
                    labelStyle={{ color: '#f1f5f9' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="leads"
                    stroke="#22c55e"
                    strokeWidth={2}
                    dot={{ fill: '#22c55e', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Conversion Rate Breakdown */}
      <Card className="border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
        <CardHeader>
          <CardTitle>Lead Conversion Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          {leadData.totalLeads > 0 ? (
            <div className="space-y-3">
              {conversionMetrics.map((metric, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-slate-600">{metric.label}</Badge>
                    <span className="text-sm text-slate-300">{metric.value} leads</span>
                  </div>
                  <div className="flex-1 mx-4 h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{
                        width: leadData.totalLeads > 0 ? `${(metric.value / leadData.totalLeads) * 100}%` : '0%'
                      }}
                    />
                  </div>
                  <span className="text-sm text-slate-400 w-12 text-right">
                    {leadData.totalLeads > 0 ? `${((metric.value / leadData.totalLeads) * 100).toFixed(1)}%` : '0%'}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-slate-400 py-8">No leads yet. Your website is live and ready to generate leads!</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}