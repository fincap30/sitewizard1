import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Zap, CheckCircle, Clock, Star, ArrowRight } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";

export default function Home() {
  const [formData, setFormData] = useState({
    client_name: '',
    client_email: '',
    business_name: '',
    phone: '',
    requirements: '',
    website_type: 'business'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await base44.entities.Project.create({
        ...formData,
        status: 'new_lead',
        source: 'website',
        analysis_completed: false
      });

      toast.success('Request submitted! We\'ll contact you within 24 hours.');
      
      setFormData({
        client_name: '',
        client_email: '',
        business_name: '',
        phone: '',
        requirements: '',
        website_type: 'business'
      });
    } catch (error) {
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-transparent">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-blue-600/20 text-blue-400 px-4 py-2 rounded-full text-sm font-medium mb-6 border border-blue-500/30">
            <Zap className="w-4 h-4" />
            Professional Website Solutions
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6">
            SiteWizard<span className="text-blue-400">.pro</span>
          </h1>
          <p className="text-xl text-slate-300 max-w-2xl mx-auto mb-8">
            From Facebook lead to delivered website in 30 days guaranteed.
            <br />
            <span className="font-semibold text-white">Exclusive 5-Point Professional Analysis</span> included.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          <Card className="border-2 border-slate-700/50 hover:border-blue-500/50 transition-all bg-slate-800/50 backdrop-blur-sm">
            <CardHeader>
              <CheckCircle className="w-10 h-10 text-green-500 mb-3" />
              <CardTitle>5-Point Analysis</CardTitle>
              <CardDescription>
                Professional assessment of your business needs before we start
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 border-slate-700/50 hover:border-blue-500/50 transition-all bg-slate-800/50 backdrop-blur-sm">
            <CardHeader>
              <Clock className="w-10 h-10 text-blue-400 mb-3" />
              <CardTitle>30-Day Guarantee</CardTitle>
              <CardDescription>
                Your website delivered within 30 days or your money back
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="border-2 border-slate-700/50 hover:border-blue-500/50 transition-all bg-slate-800/50 backdrop-blur-sm">
            <CardHeader>
              <Star className="w-10 h-10 text-yellow-400 mb-3" />
              <CardTitle>Apple-Level Design</CardTitle>
              <CardDescription>
                Professional, mobile-responsive design that looks stunning
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* Registration Form */}
        <div className="max-w-2xl mx-auto">
          <Card className="border-2 border-slate-700/50 shadow-xl bg-slate-800/50 backdrop-blur-sm">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Get Started Today</CardTitle>
              <CardDescription>
                Fill out the form below and we'll contact you within 24 hours
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-1 block">
                    Your Name *
                  </label>
                  <Input
                    required
                    value={formData.client_name}
                    onChange={(e) => setFormData({...formData, client_name: e.target.value})}
                    placeholder="John Doe"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-300 mb-1 block">
                    Email Address *
                  </label>
                  <Input
                    type="email"
                    required
                    value={formData.client_email}
                    onChange={(e) => setFormData({...formData, client_email: e.target.value})}
                    placeholder="john@example.com"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-300 mb-1 block">
                    Business Name *
                  </label>
                  <Input
                    required
                    value={formData.business_name}
                    onChange={(e) => setFormData({...formData, business_name: e.target.value})}
                    placeholder="Your Business LLC"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-300 mb-1 block">
                    Phone Number
                  </label>
                  <Input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-300 mb-1 block">
                    Website Type *
                  </label>
                  <select
                    required
                    className="w-full border border-slate-300 rounded-md px-3 py-2"
                    value={formData.website_type}
                    onChange={(e) => setFormData({...formData, website_type: e.target.value})}
                  >
                    <option value="business">Business Website</option>
                    <option value="portfolio">Portfolio</option>
                    <option value="ecommerce">E-commerce</option>
                    <option value="blog">Blog</option>
                    <option value="landing_page">Landing Page</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-300 mb-1 block">
                    Tell Us About Your Project
                  </label>
                  <Textarea
                    value={formData.requirements}
                    onChange={(e) => setFormData({...formData, requirements: e.target.value})}
                    placeholder="What features do you need? Any specific requirements?"
                    rows={4}
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-6"
                >
                  {isSubmitting ? (
                    'Submitting...'
                  ) : (
                    <>
                      Get Your Free Analysis
                      <ArrowRight className="ml-2 w-5 h-5" />
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-slate-400">
                  By submitting, you agree to receive communications about your project.
                </p>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}