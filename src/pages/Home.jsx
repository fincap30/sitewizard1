import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Zap, CheckCircle, Clock, Star, ArrowRight, Quote, Mail, Phone, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { toast } from "sonner";
import SEOAnalysisDisplay from "../components/analysis/SEOAnalysisDisplay";

export default function Home() {
  const [user, setUser] = useState(null);
  const [existingProject, setExistingProject] = useState(null);
  const [projectChoice, setProjectChoice] = useState(null);
  const [showAllFaqs, setShowAllFaqs] = useState(false);
  const [formData, setFormData] = useState({
    client_name: '',
    client_email: '',
    business_name: '',
    phone: '',
    requirements: '',
    website_type: 'business',
    current_website: '',
    facebook_page: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const faqs = [
    { q: "What's included in the free trial?", a: "You get full access to all features for 14 days, including AI website generation, hosting, and basic support." },
    { q: "How long does it take to build my website?", a: "Most websites are delivered within 7-14 days, with a maximum of 30 days guaranteed or your money back." },
    { q: "Can I make changes after the website is live?", a: "Yes! You can request unlimited revisions based on your subscription plan, and our team will implement them." },
    { q: "Do you provide hosting?", a: "Yes, all plans include secure, fast hosting with 99.9% uptime guarantee." },
    { q: "What if I need custom features?", a: "We can develop custom features for your website. Contact us to discuss your specific requirements and pricing." },
    { q: "Is my website mobile-friendly?", a: "Absolutely! All our websites are fully responsive and optimized for mobile, tablet, and desktop devices." },
    { q: "Can I cancel anytime?", a: "Yes, you can cancel your subscription at any time. No long-term contracts or hidden fees." },
    { q: "Do you offer SEO services?", a: "Yes! Higher-tier plans include advanced SEO optimization, keyword research, and ongoing SEO support." },
    { q: "What payment methods do you accept?", a: "We accept all major credit cards, PayPal, and bank transfers for annual subscriptions." },
    { q: "Can you migrate my existing website?", a: "Yes, we can migrate your content from your existing website. This service is included in Premium plans." },
    { q: "Do you provide content writing?", a: "Yes! Our AI can generate initial content, and our team can write professional copy based on your plan level." },
    { q: "What about domain names?", a: "You can use your existing domain or purchase a new one. We'll help you connect it to your website." },
    { q: "Is e-commerce supported?", a: "Yes! Our Growth and Premium plans include full e-commerce functionality with payment processing." },
    { q: "How secure are the websites?", a: "All websites include SSL certificates, regular security updates, and DDoS protection as standard." },
    { q: "Can I have multiple team members access the site?", a: "Yes, you can add team members with different permission levels based on your subscription plan." },
    { q: "What kind of support do you offer?", a: "We provide email support for all plans, with priority support and phone/video calls for Premium subscribers." },
    { q: "Can you integrate third-party tools?", a: "Yes, we can integrate various tools like CRM, email marketing, analytics, and payment gateways." },
    { q: "Do you offer training?", a: "Yes! All plans include basic training. Premium plans include comprehensive video tutorials and one-on-one sessions." },
    { q: "What happens to my data if I cancel?", a: "You can export all your data before canceling. We retain backups for 30 days after cancellation." },
    { q: "Can you redesign my website later?", a: "Yes! You can request a redesign at any time. Major redesigns may incur additional fees depending on scope." }
  ];

  const testimonials = [
    { name: "Sarah Johnson", company: "Tech Solutions Inc", text: "SiteWizard delivered our website in just 10 days! The AI-powered design exceeded our expectations.", rating: 5 },
    { name: "Michael Chen", company: "Urban Fitness", text: "The automated SEO tools helped us rank on Google's first page within 2 months. Incredible value!", rating: 5 },
    { name: "Emily Rodriguez", company: "Bloom Boutique", text: "Our e-commerce site is beautiful and easy to manage. Sales increased by 40% in the first month!", rating: 5 }
  ];

  useEffect(() => {
    base44.auth.me().then(async (userData) => {
      if (userData) {
        setUser(userData);
        // Pre-fill with user data
        setFormData(prev => ({
          ...prev,
          client_name: userData.full_name || '',
          client_email: userData.email || ''
        }));

        // Check for existing project
        const intakes = await base44.entities.WebsiteIntake.filter({ client_email: userData.email });
        if (intakes.length > 0) {
          const latest = intakes.sort((a, b) => new Date(b.created_date) - new Date(a.created_date))[0];
          setExistingProject(latest);
        }
      }
    }).catch(() => {
      // Not logged in, that's fine
    });
  }, []);

  const handleContinueExisting = () => {
    window.location.href = '/ClientDashboard';
  };

  const handleStartNew = () => {
    setProjectChoice('new');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Store form data
    const websiteData = {
      client_email: formData.client_email,
      company_name: formData.business_name,
      contact_person: formData.client_name,
      phone: formData.phone || '',
      current_website: formData.current_website || '',
      facebook_page: formData.facebook_page || '',
      goal_description: formData.requirements || '',
      website_type: formData.website_type || 'business'
    };
    sessionStorage.setItem('website_data', JSON.stringify(websiteData));

    try {
      // Build the website immediately with AI
      const buildPrompt = `Build a professional ${formData.website_type} website for ${formData.business_name}.

  ${formData.current_website ? `Research their current site: ${formData.current_website}` : 'Starting from scratch - no existing website'}
  ${formData.facebook_page ? `Check their Facebook: ${formData.facebook_page}` : ''}
  Business goals: ${formData.requirements || 'General business website'}

  Create a complete 3-page website with REAL content:

  1. HOME PAGE (4 sections):
  - Hero: Compelling headline + 50-word intro about what they do
  - Services/Products: 3 offerings with 30-word descriptions each
  - Why Choose Us: 3 benefits with 20-word explanations
  - Call-to-Action: Strong closing message

  2. ABOUT PAGE (3 sections):
  - Company story (60 words)
  - Mission & values (40 words)
  - Team intro (30 words)

  3. CONTACT PAGE:
  - Contact info and form details

  IMPORTANT: Write actual copy, not placeholders. Make it professional and compelling.

  Return this EXACT JSON structure:
  {
  "pages": [
  {"name": "Home", "content": "Full multi-paragraph content here..."},
  {"name": "About", "content": "Full about content here..."},
  {"name": "Contact", "content": "Contact details here..."}
  ],
  "seo_analysis": {
  "current_score": 25,
  "target_keywords": ["keyword 1 (volume)", "keyword 2 (volume)"],
  "competitors": ["competitor1.com", "competitor2.com"],
  "quick_wins": ["Win 1 with timeline", "Win 2 with results"]
  },
  "primary_color": "#0066FF"
  }`;

      const result = await base44.integrations.Core.InvokeLLM({
        prompt: buildPrompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            pages: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  content: { type: "string" }
                }
              }
            },
            seo_analysis: {
              type: "object",
              properties: {
                current_score: { type: "number" },
                target_keywords: { type: "array", items: { type: "string" } },
                competitors: { type: "array", items: { type: "string" } },
                quick_wins: { type: "array", items: { type: "string" } }
              }
            },
            primary_color: { type: "string" }
          }
        }
      });

      sessionStorage.setItem('generated_website', JSON.stringify(result));
      setAnalysis(result);
      setShowAnalysis(true);
      toast.success('✅ Your website is ready!');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to build website');
      setIsSubmitting(false);
    }
  };

  const handleContinueToIntake = () => {
    window.location.href = '/WebsiteIntakeForm';
  };

  if (showAnalysis && analysis) {
    return (
      <div className="min-h-screen bg-transparent py-12 px-4">
        <div className="container mx-auto max-w-5xl">
          <Card className="border-2 border-green-500/50 bg-slate-800/50 backdrop-blur-sm mb-6">
            <CardHeader>
              <CardTitle className="text-3xl flex items-center gap-2">
                <CheckCircle className="w-8 h-8 text-green-400" />
                Your FREE Website is Built!
              </CardTitle>
              <CardDescription>No payment required • {analysis.pages?.length || 3} pages • Ready to go live</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* SEO Quick Summary */}
              {analysis.seo_analysis && (
                <div className="bg-blue-600/10 border border-blue-500/30 rounded-lg p-6">
                  <h3 className="text-xl font-bold text-white mb-4">📊 SEO Analysis</h3>
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-slate-400 mb-2">Current SEO Score:</p>
                      <p className="text-2xl font-bold text-white">{analysis.seo_analysis.current_score}/100</p>
                    </div>
                    <div>
                      <p className="text-slate-400 mb-2">Target Keywords:</p>
                      <div className="flex flex-wrap gap-2">
                        {analysis.seo_analysis.target_keywords?.slice(0, 3).map((kw, i) => (
                          <Badge key={i} className="bg-blue-600">{kw}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  {analysis.seo_analysis.quick_wins && (
                    <div className="mt-4">
                      <p className="text-slate-400 mb-2">Quick SEO Wins:</p>
                      <ul className="space-y-1">
                        {analysis.seo_analysis.quick_wins.slice(0, 3).map((win, i) => (
                          <li key={i} className="text-slate-300 text-sm">✓ {win}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Website Preview */}
              <div className="bg-white rounded-lg p-8">
                <h3 className="text-2xl font-bold text-slate-900 mb-6" style={{color: analysis.primary_color}}>
                  Your Website Preview
                </h3>
                {analysis.pages?.map((page, idx) => (
                  <div key={idx} className="mb-8 pb-8 border-b border-slate-200 last:border-0">
                    <h4 className="text-xl font-bold mb-4 text-slate-800">{page.name}</h4>
                    <div className="prose prose-slate max-w-none">
                      <p className="text-slate-700 leading-relaxed whitespace-pre-wrap">{page.content}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="bg-gradient-to-r from-green-600/20 to-blue-600/20 border-2 border-green-500/50 rounded-lg p-8 text-center">
                <p className="text-3xl font-bold text-white mb-3">💚 Love it? Let's Launch!</p>
                <p className="text-slate-300 mb-6 text-lg">No payment until you approve. Zero risk. Full control.</p>
                <Button
                  onClick={handleContinueToIntake}
                  className="bg-green-600 hover:bg-green-700 text-white text-xl py-6 px-10"
                >
                  Approve & Continue
                  <ArrowRight className="ml-2 w-6 h-6" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

              if (isSubmitting) {
              return (
              <div className="min-h-screen flex items-center justify-center bg-transparent">
              <Card className="max-w-md border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
              <CardContent className="pt-6 text-center space-y-4">
              <div className="flex justify-center">
              <div className="relative">
                <Zap className="w-16 h-16 text-blue-400 animate-pulse" />
                <div className="absolute inset-0 bg-blue-400/20 blur-xl animate-pulse" />
              </div>
              </div>
              <h3 className="text-2xl font-bold text-white">Analyzing Your Business...</h3>
              <p className="text-slate-300">Our AI is reviewing your information and creating recommendations.</p>
              <div className="space-y-2 text-sm text-slate-400">
              <p>✓ Scanning competitive landscape</p>
              <p>✓ Identifying growth opportunities</p>
              <p>✓ Generating recommendations</p>
              </div>
              </CardContent>
              </Card>
              </div>
              );
              }

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
            Get a professional website <span className="text-blue-400 font-semibold">FREE</span>. Pay only for upgrades & growth.
            <br />
            <span className="font-semibold text-white">No upfront cost. Hosting included. 14-day trial.</span>
          </p>
          <div className="flex gap-4 justify-center">
            <Button 
              onClick={() => document.getElementById('analysis-form').scrollIntoView({ behavior: 'smooth' })}
              className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-6"
            >
              Start Free Trial
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            <Link to="/HowItWorks">
              <Button variant="outline" className="text-lg px-8 py-6 border-slate-600 hover:border-blue-500">
                How It Works
              </Button>
            </Link>
          </div>
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
        <div className="max-w-2xl mx-auto" id="analysis-form">
          <Card className="border-2 border-slate-700/50 shadow-xl bg-slate-800/50 backdrop-blur-sm">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Get Your Free Analysis</CardTitle>
              <CardDescription>
                Step 1: Basic info → Step 2: Detailed questionnaire → Step 3: AI generates your website
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Existing Project Choice */}
              {user && existingProject && !projectChoice && (
                <div className="space-y-4">
                  <div className="text-center mb-4">
                    <p className="text-slate-300 mb-2">Welcome back, {user.full_name}!</p>
                    <p className="text-sm text-slate-400">We found your existing project:</p>
                    <Badge className="mt-2 bg-blue-600">{existingProject.company_name}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      onClick={handleContinueExisting}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      Continue Existing Project
                    </Button>
                    <Button
                      onClick={handleStartNew}
                      variant="outline"
                      className="border-slate-600 hover:border-blue-500"
                    >
                      Start New Project
                    </Button>
                  </div>
                </div>
              )}

              {/* Show form if: no user, no existing project, or chose 'new' */}
              {(!user || !existingProject || projectChoice === 'new') && (
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
                    className="w-full border border-slate-300 rounded-md px-3 py-2 bg-white text-slate-900"
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
                    Current Website (if any)
                  </label>
                  <Input
                    type="url"
                    value={formData.current_website}
                    onChange={(e) => setFormData({...formData, current_website: e.target.value})}
                    placeholder="https://yourwebsite.com"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-300 mb-1 block">
                    Facebook Page (if any)
                  </label>
                  <Input
                    type="url"
                    value={formData.facebook_page}
                    onChange={(e) => setFormData({...formData, facebook_page: e.target.value})}
                    placeholder="https://facebook.com/yourpage"
                  />
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
                    <>
                      <Clock className="w-5 h-5 mr-2 animate-spin" />
                      Analyzing Your Business...
                    </>
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
              )}
            </CardContent>
          </Card>
        </div>

        {/* Testimonials */}
        <div className="max-w-6xl mx-auto mt-24 mb-16">
          <h2 className="text-3xl font-bold text-white text-center mb-12">What Our Clients Say</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((testimonial, idx) => (
              <Card key={idx} className="border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
                <CardContent className="pt-6">
                  <div className="flex gap-1 mb-3">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <Quote className="w-8 h-8 text-blue-400 mb-3" />
                  <p className="text-slate-300 mb-4">{testimonial.text}</p>
                  <div className="border-t border-slate-700 pt-4">
                    <p className="font-semibold text-white">{testimonial.name}</p>
                    <p className="text-sm text-slate-400">{testimonial.company}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto mt-24 mb-16">
          <h2 className="text-3xl font-bold text-white text-center mb-12">Frequently Asked Questions</h2>
          <Card className="border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
            <CardContent className="pt-6">
              <Accordion type="single" collapsible className="space-y-2">
                {faqs.slice(0, showAllFaqs ? faqs.length : 5).map((faq, idx) => (
                  <AccordionItem key={idx} value={`item-${idx}`} className="border-slate-700">
                    <AccordionTrigger className="text-white hover:text-blue-400">
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="text-slate-300">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
              {!showAllFaqs && (
                <Button
                  onClick={() => setShowAllFaqs(true)}
                  variant="outline"
                  className="w-full mt-4 border-blue-500/30 hover:bg-blue-600/10"
                >
                  Show {faqs.length - 5} More Questions
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900/50 border-t border-slate-700 mt-24">
        <div className="container mx-auto px-4 py-12">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="text-xl font-bold text-white mb-4">SiteWizard<span className="text-blue-400">.pro</span></h3>
              <p className="text-slate-400 text-sm">Professional websites built by AI, perfected by humans.</p>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Services</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><Link to="/Pricing" className="hover:text-blue-400">Pricing</Link></li>
                <li><Link to="/HowItWorks" className="hover:text-blue-400">How It Works</Link></li>
                <li><a href="#" className="hover:text-blue-400">Portfolio</a></li>
                <li><a href="#" className="hover:text-blue-400">Templates</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Company</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li><a href="#" className="hover:text-blue-400">About Us</a></li>
                <li><a href="#" className="hover:text-blue-400">Blog</a></li>
                <li><a href="#" className="hover:text-blue-400">Careers</a></li>
                <li><a href="#" className="hover:text-blue-400">Contact</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-white mb-4">Contact</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <a href="mailto:hello@sitewizard.pro" className="hover:text-blue-400">hello@sitewizard.pro</a>
                </li>
                <li className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <a href="tel:+1234567890" className="hover:text-blue-400">+1 (234) 567-890</a>
                </li>
                <li className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <span>San Francisco, CA</span>
                </li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-700 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-slate-400 text-sm mb-4 md:mb-0">© 2026 SiteWizard.pro. All rights reserved.</p>
            <div className="flex gap-6 text-sm text-slate-400">
              <a href="#" className="hover:text-blue-400">Privacy Policy</a>
              <a href="#" className="hover:text-blue-400">Terms of Service</a>
              <a href="#" className="hover:text-blue-400">Cookie Policy</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}