import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle, Sparkles, Globe, Rocket } from "lucide-react";
import { Link } from "react-router-dom";

export default function HowItWorks() {
  const steps = [
    {
      icon: Sparkles,
      title: "Choose Your Plan",
      description: "Select from 9 packages ($9-$200/month). Start with a 14-day free trial.",
      color: "text-blue-400"
    },
    {
      icon: CheckCircle,
      title: "Add Payment Method",
      description: "Secure your trial with a payment method. No charge for 14 days.",
      color: "text-green-400"
    },
    {
      icon: Globe,
      title: "Tell Us About Your Business",
      description: "Fill out our simple form. We'll gather all the details to build your perfect site.",
      color: "text-purple-400"
    },
    {
      icon: Rocket,
      title: "Get Your Website",
      description: "AI generates your site in minutes. Review, revise, and go live!",
      color: "text-yellow-400"
    }
  ];

  return (
    <div className="min-h-screen bg-transparent">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-4">
            From Idea to Live Website in 4 Steps
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto">
            It's never been easier to get a professional website for your business
          </p>
        </div>

        {/* Steps */}
        <div className="max-w-4xl mx-auto space-y-8">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <Card key={idx} className="border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm hover:border-blue-500/50 transition-all">
                <CardHeader>
                  <div className="flex items-start gap-4">
                    <div className="bg-slate-700/50 rounded-full p-3">
                      <Icon className={`w-8 h-8 ${step.color}`} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl font-bold text-slate-500">0{idx + 1}</span>
                        <CardTitle className="text-2xl">{step.title}</CardTitle>
                      </div>
                      <p className="text-slate-300 text-lg">{step.description}</p>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>

        {/* CTA */}
        <div className="text-center mt-16">
          <Link to="/Pricing">
            <Button className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-6">
              View Pricing & Start Free Trial
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mt-16 max-w-5xl mx-auto">
          <Card className="border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm">
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold text-white mb-2">Free Hosting</h3>
              <p className="text-slate-400 text-sm">No hidden costs. Hosting is included in every plan.</p>
            </CardContent>
          </Card>
          <Card className="border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm">
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold text-white mb-2">AI-Powered</h3>
              <p className="text-slate-400 text-sm">Smart automation builds your site based on your answers.</p>
            </CardContent>
          </Card>
          <Card className="border border-slate-700/50 bg-slate-800/30 backdrop-blur-sm">
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold text-white mb-2">Upgrade Anytime</h3>
              <p className="text-slate-400 text-sm">Start small, grow big. Switch plans as your business grows.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}