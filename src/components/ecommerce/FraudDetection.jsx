import React from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Shield, Loader2, AlertTriangle, CheckCircle, Ban } from "lucide-react";
import { toast } from "sonner";

export default function FraudDetection({ websiteIntakeId }) {
  const queryClient = useQueryClient();

  const { data: fraudAlerts = [] } = useQuery({
    queryKey: ['fraud-alerts'],
    queryFn: () => base44.entities.FraudDetection.filter({ status: 'pending' }),
  });

  const analyzeFraudMutation = useMutation({
    mutationFn: async (transaction) => {
      const { data: customerHistory } = await base44.entities.CustomerPurchaseHistory.filter({
        customer_email: transaction.customer_email
      });

      const prompt = `Analyze transaction for fraud risk.

Transaction:
- Amount: $${transaction.amount}
- Customer: ${transaction.customer_email}
- Transaction ID: ${transaction.transaction_id}

Customer History:
- Previous Purchases: ${customerHistory.length}
- Total Spent: $${customerHistory.reduce((sum, p) => sum + p.price_paid, 0)}
- Avg Purchase: $${customerHistory.length > 0 ? (customerHistory.reduce((sum, p) => sum + p.price_paid, 0) / customerHistory.length).toFixed(2) : 0}

Analyze for:
1. Unusual transaction amount
2. First-time buyer patterns
3. Transaction velocity
4. Amount anomalies

Return fraud score (0-100), risk level, risk factors, and recommended action.`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt,
        response_json_schema: {
          type: "object",
          properties: {
            fraud_score: { type: "number" },
            risk_level: { type: "string" },
            risk_factors: { type: "array", items: { type: "string" } },
            recommended_action: { type: "string" }
          }
        }
      });

      await base44.entities.FraudDetection.create({
        ...transaction,
        fraud_score: response.fraud_score,
        risk_level: response.risk_level,
        risk_factors: response.risk_factors,
        recommended_action: response.recommended_action,
        status: 'pending'
      });

      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fraud-alerts'] });
      toast.success('Fraud analysis complete!');
    },
  });

  const updateTransactionMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      await base44.entities.FraudDetection.update(id, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fraud-alerts'] });
      toast.success('Transaction updated!');
    },
  });

  const getRiskColor = (level) => {
    switch (level) {
      case 'high': return 'bg-red-600';
      case 'medium': return 'bg-yellow-600';
      default: return 'bg-green-600';
    }
  };

  return (
    <Card className="border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-green-400" />
          AI Fraud Detection
        </CardTitle>
        <CardDescription>Real-time transaction monitoring and risk analysis</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-3 gap-4 mb-4">
          <Card className="bg-slate-700/30">
            <CardContent className="pt-4">
              <p className="text-2xl font-bold text-white">{fraudAlerts.length}</p>
              <p className="text-xs text-slate-400">Pending Review</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-700/30">
            <CardContent className="pt-4">
              <p className="text-2xl font-bold text-red-400">
                {fraudAlerts.filter(f => f.risk_level === 'high').length}
              </p>
              <p className="text-xs text-slate-400">High Risk</p>
            </CardContent>
          </Card>
          <Card className="bg-slate-700/30">
            <CardContent className="pt-4">
              <p className="text-2xl font-bold text-yellow-400">
                {fraudAlerts.filter(f => f.risk_level === 'medium').length}
              </p>
              <p className="text-xs text-slate-400">Medium Risk</p>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-2">
          {fraudAlerts.slice(0, 10).map((alert) => (
            <Card key={alert.id} className="bg-slate-700/30">
              <CardContent className="pt-3">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-semibold text-white">${alert.amount}</p>
                    <p className="text-xs text-slate-400">{alert.customer_email}</p>
                    <p className="text-xs text-slate-500">ID: {alert.transaction_id}</p>
                  </div>
                  <Badge className={getRiskColor(alert.risk_level)}>
                    {alert.fraud_score}/100
                  </Badge>
                </div>

                {alert.risk_factors && alert.risk_factors.length > 0 && (
                  <div className="mb-2">
                    <p className="text-xs text-slate-400 mb-1">Risk Factors:</p>
                    <div className="flex flex-wrap gap-1">
                      {alert.risk_factors.map((factor, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {factor}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => updateTransactionMutation.mutate({ id: alert.id, status: 'approved' })}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => updateTransactionMutation.mutate({ id: alert.id, status: 'blocked' })}
                    className="flex-1 bg-red-600 hover:bg-red-700"
                  >
                    <Ban className="w-3 h-3 mr-1" />
                    Block
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}