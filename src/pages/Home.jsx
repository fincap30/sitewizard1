import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Zap, CheckCircle, Clock, Star, ArrowRight, Quote, Mail, Phone, MapPin, Loader2 } from "lucide-react";
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
  const [generatedWebsite, setGeneratedWebsite] = useState(null);
  const [buildingWebsite, setBuildingWebsite] = useState(false);

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
      // STEP 1: Generate SEO Report
      const seoPrompt = `You are an SEO expert. Analyze this business and create a comprehensive SEO report.

    BUSINESS: ${formData.business_name}
    TYPE: ${formData.website_type}
    ${formData.current_website ? `CURRENT WEBSITE: Visit and analyze ${formData.current_website}` : 'NO CURRENT WEBSITE - starting from scratch'}
    ${formData.facebook_page ? `FACEBOOK: ${formData.facebook_page}` : ''}
    GOALS: ${formData.requirements || 'Improve online presence'}

    Visit the current website if provided. Analyze everything: technical SEO, content, keywords, competitors.

    Generate a COMPLETE SEO REPORT with these sections:

    1. SITE OVERVIEW
    - site_title: Business name
    - summary: 2 sentences about what they do

    2. TECHNICAL SEO
    - crawling_indexing: Status and issues
    - mobile_friendly: Yes/No with notes
    - security: HTTPS status
    - page_speed: Speed score and issues
    - sitemap_status: Found or missing
    - robots_txt_status: Status

    3. ON-PAGE SEO
    - title_tags: Quality and recommendations
    - meta_descriptions: Current state
    - headings: H1, H2 structure analysis
    - content_quality: Assessment

    4. KEYWORD STRATEGY
    - primary_keywords: 5 main keywords with search volume
    - long_tail_keywords: 5 long-tail keywords
    - keyword_gaps: Keywords they should target
    - competitor_keywords: Keywords competitors use

    5. CONTENT STRATEGY
    - content_depth: Assessment
    - recommended_pages: List of pages to create
    - blog_topics: 5 blog post ideas
    - internal_linking: Recommendations

    6. OFF-PAGE SEO
    - backlink_status: Current backlinks estimate
    - domain_authority: Estimate
    - recommended_link_sources: Where to get backlinks

    7. SEO SCORE
    - overall_score: 0-100
    - technical_score: 0-100
    - content_score: 0-100
    - authority_score: 0-100

    8. PRIORITY FIXES (ranked High/Medium/Low)
    - List top 10 issues to fix

    9. QUICK WINS
    - 5 immediate actions with expected results

    10. 90-DAY ROADMAP
    - Month 1, Month 2, Month 3 action plans

    Research the website, competitors, and industry. Use REAL data.`;

      const seoReport = await base44.integrations.Core.InvokeLLM({
        prompt: seoPrompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            site_overview: {
              type: "object",
              properties: {
                site_title: { type: "string" },
                summary: { type: "string" }
              }
            },
            technical_seo: {
              type: "object",
              properties: {
                crawling_indexing: { type: "string" },
                mobile_friendly: { type: "string" },
                security: { type: "string" },
                page_speed: { type: "string" },
                sitemap_status: { type: "string" },
                robots_txt_status: { type: "string" }
              }
            },
            on_page_seo: {
              type: "object",
              properties: {
                title_tags: { type: "string" },
                meta_descriptions: { type: "string" },
                headings: { type: "string" },
                content_quality: { type: "string" }
              }
            },
            keyword_strategy: {
              type: "object",
              properties: {
                primary_keywords: { type: "array", items: { type: "string" } },
                long_tail_keywords: { type: "array", items: { type: "string" } },
                keyword_gaps: { type: "array", items: { type: "string" } },
                competitor_keywords: { type: "array", items: { type: "string" } }
              }
            },
            content_strategy: {
              type: "object",
              properties: {
                content_depth: { type: "string" },
                recommended_pages: { type: "array", items: { type: "string" } },
                blog_topics: { type: "array", items: { type: "string" } },
                internal_linking: { type: "string" }
              }
            },
            off_page_seo: {
              type: "object",
              properties: {
                backlink_status: { type: "string" },
                domain_authority: { type: "string" },
                recommended_link_sources: { type: "array", items: { type: "string" } }
              }
            },
            seo_scores: {
              type: "object",
              properties: {
                overall_score: { type: "number" },
                technical_score: { type: "number" },
                content_score: { type: "number" },
                authority_score: { type: "number" }
              }
            },
            priority_fixes: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  priority: { type: "string" },
                  issue: { type: "string" },
                  fix: { type: "string" }
                }
              }
            },
            quick_wins: { type: "array", items: { type: "string" } },
            roadmap_90_days: {
              type: "object",
              properties: {
                month_1: { type: "array", items: { type: "string" } },
                month_2: { type: "array", items: { type: "string" } },
                month_3: { type: "array", items: { type: "string" } }
              }
            }
          }
        }
      });

      sessionStorage.setItem('seo_report', JSON.stringify(seoReport));
      setAnalysis(seoReport);
      setShowAnalysis(true);
      toast.success('✅ SEO Report generated!');
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to generate SEO report');
      setIsSubmitting(false);
    }
  };

  const handleBuildWebsite = async () => {
    setBuildingWebsite(true);

    try {
      const buildPrompt = `Build a professional ${formData.website_type} website for ${formData.business_name}.

  ${formData.current_website ? `Current website: ${formData.current_website} - Research it and improve upon it` : 'Starting from scratch'}

  SEO INSIGHTS FROM REPORT:
  - Target these keywords: ${analysis?.keyword_strategy?.primary_keywords?.join(', ') || 'industry keywords'}
  - Fix these issues: ${analysis?.priority_fixes?.map(f => f.issue).join(', ') || 'basic SEO'}
  - Quick wins to implement: ${analysis?.quick_wins?.join(', ') || 'SEO optimization'}

  Build a complete 5-page website with REAL, compelling content:

  1. HOME PAGE (5 sections, 300+ words total):
  - Hero: Eye-catching headline about ${formData.business_name} + 70-word value proposition
  - Features/Services: 3 main offerings with 40-word descriptions each
  - Why Choose Us: 4 benefits with 25-word explanations each
  - Social Proof: 2 testimonial quotes (make them realistic)
  - Strong Call-to-Action

  2. ABOUT PAGE (200+ words):
  - Company story and mission (100 words)
  - What makes them different (50 words)
  - Team/founder intro (50 words)

  3. SERVICES PAGE (250+ words):
  - 3-5 services with detailed 50-word descriptions
  - Benefits of each service
  - Clear pricing indicators or "Contact for quote"

  4. CONTACT PAGE:
  - Contact form fields
  - Business address, phone, email
  - Operating hours
  - Map embed mention

  5. BLOG/RESOURCES PAGE:
  - 3 blog post titles and 30-word summaries
  - Relevant to their industry

  IMPORTANT: 
  - Write actual professional copy, no placeholders
  - Include SEO keywords naturally in content
  - Make it conversion-focused
  - Use persuasive language

  Return JSON with pages array and color scheme.`;

      const website = await base44.integrations.Core.InvokeLLM({
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
                  sections: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        content: { type: "string" }
                      }
                    }
                  }
                }
              }
            },
            primary_color: { type: "string" },
            secondary_color: { type: "string" }
          }
        }
      });

      console.log('Generated website:', website);
      sessionStorage.setItem('generated_website', JSON.stringify(website));
      setGeneratedWebsite(website);
      setIsSubmitting(false);
      toast.success('🎉 Your website is built!');
    } catch (error) {
      console.error('Build error:', error);
      toast.error('Failed to build website');
    } finally {
      setBuildingWebsite(false);
    }
  };

  const handleContinueToIntake = () => {
    window.location.href = '/WebsiteIntakeForm';
  };

  if (showAnalysis && analysis) {
    return (
      <div className="min-h-screen bg-transparent py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <Card className="border-2 border-blue-500/50 bg-slate-800/50 backdrop-blur-sm mb-6">
            <CardHeader>
              <CardTitle className="text-3xl">🔍 SEO Report — {formData.business_name}</CardTitle>
              <CardDescription>Complete analysis of your current website and SEO opportunities</CardDescription>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Site Overview */}
              {analysis.site_overview && (
                <div>
                  <h3 className="text-2xl font-bold text-white mb-3">🔍 1. Site Overview</h3>
                  <p className="text-lg font-semibold text-blue-400">{analysis.site_overview.site_title}</p>
                  <p className="text-slate-300 mt-2">{analysis.site_overview.summary}</p>
                </div>
              )}

              {/* SEO Scores */}
              {analysis.seo_scores && (
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="bg-slate-700/30 rounded-lg p-4 text-center">
                    <p className="text-3xl font-bold text-white">{analysis.seo_scores.overall_score}/100</p>
                    <p className="text-sm text-slate-400 mt-1">Overall SEO</p>
                  </div>
                  <div className="bg-slate-700/30 rounded-lg p-4 text-center">
                    <p className="text-3xl font-bold text-white">{analysis.seo_scores.technical_score}/100</p>
                    <p className="text-sm text-slate-400 mt-1">Technical</p>
                  </div>
                  <div className="bg-slate-700/30 rounded-lg p-4 text-center">
                    <p className="text-3xl font-bold text-white">{analysis.seo_scores.content_score}/100</p>
                    <p className="text-sm text-slate-400 mt-1">Content</p>
                  </div>
                  <div className="bg-slate-700/30 rounded-lg p-4 text-center">
                    <p className="text-3xl font-bold text-white">{analysis.seo_scores.authority_score}/100</p>
                    <p className="text-sm text-slate-400 mt-1">Authority</p>
                  </div>
                </div>
              )}

              {/* Technical SEO */}
              {analysis.technical_seo && (
                <div>
                  <h3 className="text-2xl font-bold text-white mb-3">🛠️ 2. Technical SEO</h3>
                  <div className="space-y-3 bg-slate-700/20 rounded-lg p-4">
                    <div><span className="font-semibold text-blue-400">Crawling & Indexing:</span> <span className="text-slate-300">{analysis.technical_seo.crawling_indexing}</span></div>
                    <div><span className="font-semibold text-blue-400">Mobile-Friendly:</span> <span className="text-slate-300">{analysis.technical_seo.mobile_friendly}</span></div>
                    <div><span className="font-semibold text-blue-400">Security (HTTPS):</span> <span className="text-slate-300">{analysis.technical_seo.security}</span></div>
                    <div><span className="font-semibold text-blue-400">Page Speed:</span> <span className="text-slate-300">{analysis.technical_seo.page_speed}</span></div>
                    <div><span className="font-semibold text-blue-400">Sitemap:</span> <span className="text-slate-300">{analysis.technical_seo.sitemap_status}</span></div>
                    <div><span className="font-semibold text-blue-400">Robots.txt:</span> <span className="text-slate-300">{analysis.technical_seo.robots_txt_status}</span></div>
                  </div>
                </div>
              )}

              {/* On-Page SEO */}
              {analysis.on_page_seo && (
                <div>
                  <h3 className="text-2xl font-bold text-white mb-3">🧠 3. On-Page SEO</h3>
                  <div className="space-y-3 bg-slate-700/20 rounded-lg p-4">
                    <div><span className="font-semibold text-blue-400">Title Tags:</span> <span className="text-slate-300">{analysis.on_page_seo.title_tags}</span></div>
                    <div><span className="font-semibold text-blue-400">Meta Descriptions:</span> <span className="text-slate-300">{analysis.on_page_seo.meta_descriptions}</span></div>
                    <div><span className="font-semibold text-blue-400">Headings:</span> <span className="text-slate-300">{analysis.on_page_seo.headings}</span></div>
                    <div><span className="font-semibold text-blue-400">Content Quality:</span> <span className="text-slate-300">{analysis.on_page_seo.content_quality}</span></div>
                  </div>
                </div>
              )}

              {/* Keyword Strategy */}
              {analysis.keyword_strategy && (
                <div>
                  <h3 className="text-2xl font-bold text-white mb-3">📌 4. Keyword Strategy</h3>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <p className="font-semibold text-blue-400 mb-2">Primary Keywords:</p>
                      <div className="flex flex-wrap gap-2">
                        {analysis.keyword_strategy.primary_keywords?.map((kw, i) => (
                          <Badge key={i} className="bg-blue-600">{kw}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold text-blue-400 mb-2">Long-Tail Keywords:</p>
                      <div className="flex flex-wrap gap-2">
                        {analysis.keyword_strategy.long_tail_keywords?.map((kw, i) => (
                          <Badge key={i} className="bg-purple-600">{kw}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold text-blue-400 mb-2">Keyword Gaps:</p>
                      <div className="flex flex-wrap gap-2">
                        {analysis.keyword_strategy.keyword_gaps?.map((kw, i) => (
                          <Badge key={i} className="bg-orange-600">{kw}</Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="font-semibold text-blue-400 mb-2">Competitor Keywords:</p>
                      <div className="flex flex-wrap gap-2">
                        {analysis.keyword_strategy.competitor_keywords?.map((kw, i) => (
                          <Badge key={i} className="bg-red-600">{kw}</Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Quick Wins */}
              {analysis.quick_wins && (
                <div>
                  <h3 className="text-2xl font-bold text-white mb-3">⚡ Quick Wins</h3>
                  <div className="space-y-2">
                    {analysis.quick_wins.map((win, i) => (
                      <div key={i} className="flex items-start gap-2 bg-green-600/10 border border-green-500/30 rounded-lg p-3">
                        <CheckCircle className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
                        <p className="text-slate-300">{win}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Priority Fixes */}
              {analysis.priority_fixes && (
                <div>
                  <h3 className="text-2xl font-bold text-white mb-3">🔧 Priority Fixes</h3>
                  <div className="space-y-2">
                    {analysis.priority_fixes.map((fix, i) => (
                      <div key={i} className="bg-slate-700/20 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={
                            fix.priority === 'High' ? 'bg-red-600' :
                            fix.priority === 'Medium' ? 'bg-orange-600' : 'bg-yellow-600'
                          }>{fix.priority}</Badge>
                          <p className="font-semibold text-white">{fix.issue}</p>
                        </div>
                        <p className="text-slate-300 text-sm">{fix.fix}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 90-Day Roadmap */}
              {analysis.roadmap_90_days && (
                <div>
                  <h3 className="text-2xl font-bold text-white mb-3">📅 90-Day SEO Roadmap</h3>
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="bg-blue-600/10 border border-blue-500/30 rounded-lg p-4">
                      <p className="font-bold text-white mb-2">Month 1</p>
                      <ul className="space-y-1 text-sm text-slate-300">
                        {analysis.roadmap_90_days.month_1?.map((item, i) => (
                          <li key={i}>• {item}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-blue-600/10 border border-blue-500/30 rounded-lg p-4">
                      <p className="font-bold text-white mb-2">Month 2</p>
                      <ul className="space-y-1 text-sm text-slate-300">
                        {analysis.roadmap_90_days.month_2?.map((item, i) => (
                          <li key={i}>• {item}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="bg-blue-600/10 border border-blue-500/30 rounded-lg p-4">
                      <p className="font-bold text-white mb-2">Month 3</p>
                      <ul className="space-y-1 text-sm text-slate-300">
                        {analysis.roadmap_90_days.month_3?.map((item, i) => (
                          <li key={i}>• {item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              {/* Why New Website */}
              <div className="bg-gradient-to-r from-purple-600/20 to-pink-600/20 border-2 border-purple-500/50 rounded-lg p-8">
                <h3 className="text-2xl font-bold text-white mb-4">💡 Why We Recommend a New Website</h3>
                <div className="space-y-4 text-slate-300">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-400 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-white">Built-in SEO from Day 1</p>
                      <p className="text-sm">Your new website will have proper title tags, meta descriptions, structured data, and optimized code—all the technical fixes already implemented.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-400 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-white">Mobile-First & Lightning Fast</p>
                      <p className="text-sm">Modern architecture means your site loads in under 2 seconds on mobile, dramatically improving your Google rankings and conversions.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-400 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-white">Keyword-Optimized Content</p>
                      <p className="text-sm">Every page is written with your target keywords in mind, helping you rank for the searches that matter most to your business.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-400 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-white">Professional Design = Trust</p>
                      <p className="text-sm">A modern, professional website builds instant credibility with visitors, leading to more conversions and better business results.</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="w-6 h-6 text-green-400 mt-1 flex-shrink-0" />
                    <div>
                      <p className="font-semibold text-white">All Quick Wins Implemented</p>
                      <p className="text-sm">The quick wins identified in your SEO report will be built into your new site from the start—no waiting for fixes.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* CTA */}
              {!generatedWebsite ? (
                <div className="bg-gradient-to-r from-green-600/20 to-blue-600/20 border-2 border-green-500/50 rounded-lg p-8 text-center">
                  <p className="text-3xl font-bold text-white mb-3">🚀 Ready to Get Results?</p>
                  <p className="text-slate-300 mb-6 text-lg">We'll build your SEO-optimized website with all fixes included—completely FREE to start</p>
                  <Button
                    onClick={handleBuildWebsite}
                    disabled={buildingWebsite}
                    className="bg-green-600 hover:bg-green-700 text-white text-xl py-6 px-10"
                  >
                    {buildingWebsite ? (
                      <>
                        <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                        Building Your Website...
                      </>
                    ) : (
                      <>
                        Build My Site For Me For FREE
                        <ArrowRight className="ml-2 w-6 h-6" />
                      </>
                    )}
                  </Button>
                  <p className="text-sm text-slate-400 mt-4">No payment required • See your website before paying anything</p>
                </div>
              ) : (
                <>
                  {/* Generated Website Preview */}
                  <div className="border-2 border-green-500/50 rounded-lg overflow-hidden">
                    <div className="bg-green-600/20 border-b border-green-500/30 p-4">
                      <h3 className="text-2xl font-bold text-white flex items-center gap-2">
                        <CheckCircle className="w-6 h-6 text-green-400" />
                        Your FREE Website is Ready!
                      </h3>
                      <p className="text-slate-300 mt-1">{generatedWebsite.pages?.length || 5} professional pages • SEO-optimized • Ready to launch</p>
                    </div>

                    <div className="bg-white p-8 space-y-8">
                      <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-4 mb-6">
                        <p className="text-sm font-medium text-blue-800">
                          ✅ Website generated • {generatedWebsite?.pages?.length || 0} pages • Primary color: {generatedWebsite?.primary_color || 'Not set'}
                        </p>
                      </div>

                      {Array.isArray(generatedWebsite?.pages) && generatedWebsite.pages.length > 0 ? (
                        generatedWebsite.pages.map((page, pidx) => (
                          <div key={pidx} className="border-b-4 border-slate-200 pb-8 last:border-0">
                            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg mb-6">
                              <h2 className="text-4xl font-bold text-slate-900 mb-2" style={{color: generatedWebsite.primary_color || '#0066FF'}}>
                                {page.name || 'Untitled Page'}
                              </h2>
                              <p className="text-sm text-slate-500">Page {pidx + 1} of {generatedWebsite.pages.length}</p>
                            </div>

                            {Array.isArray(page.sections) && page.sections.length > 0 ? (
                              <div className="space-y-6">
                                {page.sections.map((section, sidx) => (
                                  <div key={sidx} className="bg-white border-2 border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-start gap-3 mb-4">
                                      <div className="bg-blue-100 rounded-full p-2 mt-1">
                                        <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                                      </div>
                                      <h3 className="text-2xl font-bold text-slate-900 flex-1">{section.title || 'Section'}</h3>
                                    </div>
                                    <div className="ml-7">
                                      <p className="text-slate-700 text-lg leading-relaxed whitespace-pre-wrap">{section.content || 'No content'}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <div className="bg-yellow-50 p-6 rounded-lg border-2 border-yellow-200">
                                <p className="text-yellow-800 font-medium mb-3">⚠️ Page structure unexpected</p>
                                <pre className="text-xs text-slate-700 whitespace-pre-wrap overflow-auto bg-white p-3 rounded">{JSON.stringify(page, null, 2)}</pre>
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-8">
                          <p className="text-red-800 font-bold text-lg mb-4">❌ Website generation failed or returned unexpected format</p>
                          <p className="text-red-700 mb-4">Expected structure: pages array with sections, but got:</p>
                          <pre className="text-xs text-slate-700 bg-white p-4 rounded border overflow-auto max-h-96 whitespace-pre-wrap">{JSON.stringify(generatedWebsite, null, 2)}</pre>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Final CTA */}
                  <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-2 border-blue-500/50 rounded-lg p-8 text-center">
                    <p className="text-3xl font-bold text-white mb-3">💙 Love Your New Website?</p>
                    <p className="text-slate-300 mb-6 text-lg">Continue to customize and launch it—still 100% FREE to start</p>
                    <Button
                      onClick={handleContinueToIntake}
                      className="bg-blue-600 hover:bg-blue-700 text-white text-xl py-6 px-10"
                    >
                      Continue to Launch
                      <ArrowRight className="ml-2 w-6 h-6" />
                    </Button>
                    <p className="text-sm text-slate-400 mt-4">Customize • Add features • Go live</p>
                  </div>
                </>
              )}
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