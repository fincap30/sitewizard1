import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Upload, Sparkles, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import AIQuestionsFlow from "../components/intake/AIQuestionsFlow";
import WebsitePreview from "../components/intake/WebsitePreview";
import TemplateSelector from "../components/builder/TemplateSelector";
import AIWebsiteBuilder from "../components/builder/AIWebsiteBuilder";
import AdvancedWebsiteEditor from "../components/builder/AdvancedWebsiteEditor";
import ProjectRoadmap from "../components/onboarding/ProjectRoadmap";
import AutomatedSetup from "../components/onboarding/AutomatedSetup";
import ProgressTracker from "../components/onboarding/ProgressTracker";

export default function WebsiteIntakeForm() {
  const [user, setUser] = useState(null);
  const [step, setStep] = useState('form'); // form, questions, generating, preview, template, builder, edit, roadmap
  const [intakeId, setIntakeId] = useState(null);
  const [websiteIntake, setWebsiteIntake] = useState(null);
  const [customizedTemplate, setCustomizedTemplate] = useState(null);
  const [generatedWebsite, setGeneratedWebsite] = useState(null);
  const [formData, setFormData] = useState({
    company_name: '',
    contact_person: '',
    phone: '',
    country: '',
    city: '',
    current_website: '',
    facebook_page: '',
    instagram_page: '',
    other_platforms: '',
    logo_url: '',
    brand_colors: '',
    style_preference: 'modern',
    business_goals: [],
    goal_description: '',
    competitor_urls: ['', '', '']
  });
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const queryClient = useQueryClient();

  useEffect(() => {
      base44.auth.me()
        .then(async (userData) => {
          setUser(userData);

          // Check if there's a pre-created intake from Home page
          const savedIntakeId = sessionStorage.getItem('intake_id');
          if (savedIntakeId) {
            const intakes = await base44.entities.WebsiteIntake.filter({ id: savedIntakeId });
            if (intakes[0]) {
              const intake = intakes[0];
              // Pre-fill form with existing data
              setFormData({
                company_name: intake.company_name || '',
                contact_person: intake.contact_person || '',
                phone: intake.phone || '',
                country: intake.country || '',
                city: intake.city || '',
                current_website: intake.current_website || '',
                facebook_page: intake.facebook_page || '',
                instagram_page: intake.instagram_page || '',
                other_platforms: intake.other_platforms || '',
                logo_url: intake.logo_url || '',
                brand_colors: intake.brand_colors || '',
                style_preference: intake.style_preference || 'modern',
                business_goals: intake.business_goals || [],
                goal_description: intake.goal_description || '',
                competitor_urls: intake.competitor_urls || ['', '', '']
              });
              setIntakeId(savedIntakeId);
            }
            sessionStorage.removeItem('intake_id');
          }
        })
        .catch(() => base44.auth.redirectToLogin());
    }, []);

  const { data: subscription } = useQuery({
    queryKey: ['my-subscription', user?.email],
    queryFn: () => base44.entities.ClientSubscription.filter({ 
      client_email: user.email,
      status: 'trial'
    }).then(subs => subs[0]),
    enabled: !!user,
  });

  const { data: packageData } = useQuery({
    queryKey: ['package', subscription?.package_id],
    queryFn: () => base44.entities.Package.filter({ id: subscription.package_id }).then(p => p[0]),
    enabled: !!subscription?.package_id,
  });

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setFormData({ ...formData, logo_url: file_url });
      toast.success('Logo uploaded!');
    } catch (error) {
      toast.error('Failed to upload logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleGoalToggle = (goal) => {
    const goals = formData.business_goals.includes(goal)
      ? formData.business_goals.filter(g => g !== goal)
      : [...formData.business_goals, goal];
    setFormData({ ...formData, business_goals: goals });
  };

  const submitIntakeMutation = useMutation({
      mutationFn: async (data) => {
        // If we already have an intake ID, update it instead of creating new
        if (intakeId) {
          await base44.entities.WebsiteIntake.update(intakeId, {
            ...data,
            subscription_id: subscription.id,
            website_status: 'pending',
            competitor_urls: data.competitor_urls.filter(u => u.trim())
          });
          const updated = await base44.entities.WebsiteIntake.filter({ id: intakeId });
          return updated[0];
        } else {
          return await base44.entities.WebsiteIntake.create({
            ...data,
            subscription_id: subscription.id,
            client_email: user.email,
            website_status: 'pending',
            competitor_urls: data.competitor_urls.filter(u => u.trim())
          });
        }
      },
      onSuccess: (intake) => {
        setIntakeId(intake.id);
        checkIfQuestionsNeeded(intake);
      },
    });

  const checkIfQuestionsNeeded = async (intake) => {
    setStep('analyzing');
    
    try {
      const analysisPrompt = `You are analyzing a website intake form for a business website project.
      
Package: ${packageData?.name} (${packageData?.price}/month)
Company: ${intake.company_name}
Goals: ${intake.business_goals?.join(', ')}
Style: ${intake.style_preference}
Description: ${intake.goal_description || 'Not provided'}
Current Website: ${intake.current_website || 'None'}
Social Media: FB: ${intake.facebook_page || 'None'}, IG: ${intake.instagram_page || 'None'}
Competitors: ${intake.competitor_urls?.join(', ') || 'None provided'}

Analyze if you have enough information to build a great website. If you need more details, ask up to 5 clarifying questions.
Return your response as JSON with this structure:
{
  "has_enough_info": true/false,
  "questions": ["question 1", "question 2", ...] (max 5, only if has_enough_info is false)
}`;

      const response = await base44.integrations.Core.InvokeLLM({
        prompt: analysisPrompt,
        response_json_schema: {
          type: "object",
          properties: {
            has_enough_info: { type: "boolean" },
            questions: { 
              type: "array",
              items: { type: "string" }
            }
          }
        }
      });

      if (response.has_enough_info) {
        setWebsiteIntake(intake);
        setStep('template');
      } else {
        setStep('questions');
      }
    } catch (error) {
      toast.error('Analysis failed. Proceeding with generation...');
      generateWebsite(intake, []);
    }
  };

  const generateWebsite = async (intake, additionalAnswers = []) => {
    setStep('generating');

    try {
      const generationPrompt = `You are a professional website designer. Generate a complete website structure for this business.

Package: ${packageData?.name} - ${packageData?.pages_limit} pages max
Company: ${intake.company_name}
Industry: Based on the company name and description
Style: ${intake.style_preference}
Goals: ${intake.business_goals?.join(', ')}
Additional Info: ${intake.goal_description}
${additionalAnswers.length > 0 ? `\nClient Answers:\n${additionalAnswers.join('\n')}` : ''}

Create a website structure with:
1. List of pages (titles only, respect package limit)
2. For EACH page: sections with headings and content outline (2-3 sentences per section)
3. Suggested color scheme (primary, secondary, accent colors as hex codes)
4. Key features to implement

Return JSON:
{
  "pages": [
    {
      "title": "Home",
      "sections": [
        {
          "heading": "Hero Section",
          "content_outline": "Description of what goes here"
        }
      ]
    }
  ],
  "color_scheme": {
    "primary": "#hex",
    "secondary": "#hex", 
    "accent": "#hex"
  },
  "key_features": ["feature 1", "feature 2"]
}`;

      const websiteStructure = await base44.integrations.Core.InvokeLLM({
        prompt: generationPrompt,
        add_context_from_internet: true,
        response_json_schema: {
          type: "object",
          properties: {
            pages: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  title: { type: "string" },
                  sections: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        heading: { type: "string" },
                        content_outline: { type: "string" }
                      }
                    }
                  }
                }
              }
            },
            color_scheme: {
              type: "object",
              properties: {
                primary: { type: "string" },
                secondary: { type: "string" },
                accent: { type: "string" }
              }
            },
            key_features: {
              type: "array",
              items: { type: "string" }
            }
          }
        }
      });

      await base44.entities.WebsiteIntake.update(intake.id, {
        website_status: 'review',
        preview_url: JSON.stringify(websiteStructure)
      });

      queryClient.invalidateQueries({ queryKey: ['website-intake'] });
      setStep('preview');
      toast.success('Website generated! Review your new site.');
    } catch (error) {
      toast.error('Generation failed. Please try again.');
      setStep('form');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    submitIntakeMutation.mutate(formData);
  };

  if (!user || !subscription) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-blue-400" />
      </div>
    );
  }

  if (step === 'questions') {
    return (
      <AIQuestionsFlow
        intakeId={intakeId}
        onComplete={(answers) => {
          base44.entities.WebsiteIntake.filter({ id: intakeId })
            .then(intakes => {
              setWebsiteIntake(intakes[0]);
              setStep('template');
            });
        }}
      />
    );
  }

  if (step === 'template' && websiteIntake) {
    return (
      <div className="min-h-screen bg-transparent py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <TemplateSelector
            websiteIntake={websiteIntake}
            onTemplateSelected={(data) => {
              setCustomizedTemplate(data);
              setStep('builder');
            }}
          />
        </div>
      </div>
    );
  }

  if (step === 'builder' && customizedTemplate) {
    return (
      <div className="min-h-screen bg-transparent py-12 px-4">
        <div className="container mx-auto max-w-6xl space-y-6">
          <AIWebsiteBuilder
            websiteIntake={websiteIntake}
            onComplete={(website) => {
              setGeneratedWebsite(website);
              setStep('edit');
            }}
          />
        </div>
      </div>
    );
  }

  if (step === 'edit' && generatedWebsite) {
    return (
      <div className="min-h-screen bg-transparent py-12 px-4">
        <div className="container mx-auto max-w-6xl space-y-6">
          <AdvancedWebsiteEditor
            websiteIntake={websiteIntake}
            websiteData={generatedWebsite}
          />
          <Button
            onClick={() => setStep('roadmap')}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            Continue to Project Roadmap
          </Button>
        </div>
      </div>
    );
  }

  if (step === 'roadmap') {
    return (
      <div className="min-h-screen bg-transparent py-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <Tabs defaultValue="roadmap">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="roadmap">Roadmap</TabsTrigger>
              <TabsTrigger value="setup">Automated Setup</TabsTrigger>
              <TabsTrigger value="progress">Progress</TabsTrigger>
            </TabsList>

            <TabsContent value="roadmap">
              <ProjectRoadmap websiteIntake={websiteIntake} />
            </TabsContent>

            <TabsContent value="setup">
              <AutomatedSetup
                websiteIntakeId={websiteIntake.id}
                websiteIntake={websiteIntake}
              />
            </TabsContent>

            <TabsContent value="progress">
              <ProgressTracker websiteIntakeId={websiteIntake.id} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    );
  }

  if (step === 'analyzing' || step === 'generating') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-transparent">
        <Card className="max-w-md border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="flex justify-center">
              <div className="relative">
                <Sparkles className="w-16 h-16 text-blue-400 animate-pulse" />
                <div className="absolute inset-0 bg-blue-400/20 blur-xl animate-pulse" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-white">
              {step === 'analyzing' ? 'Analyzing Your Business...' : 'Generating Your Website...'}
            </h3>
            <p className="text-slate-300">
              {step === 'analyzing' 
                ? 'Our AI is reviewing your information to create the perfect website'
                : 'AI is designing your pages, choosing colors, and structuring content'}
            </p>
            <Loader2 className="w-8 h-8 animate-spin text-blue-400 mx-auto" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === 'preview') {
    return <WebsitePreview intakeId={intakeId} />;
  }

  const goalOptions = [
    { value: 'get_leads', label: 'Generate Leads' },
    { value: 'sell_products', label: 'Sell Products/Services' },
    { value: 'book_appointments', label: 'Book Appointments' },
    { value: 'build_trust', label: 'Build Trust & Credibility' },
    { value: 'automate_business', label: 'Automate Business Processes' }
  ];

  return (
    <div className="min-h-screen bg-transparent py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-8">
          <Badge className="bg-blue-600/20 text-blue-400 border-blue-500/30 mb-4">
            {packageData?.name} - ${packageData?.price}/month
          </Badge>
          <h1 className="text-4xl font-bold text-white mb-2">Website Intake Form</h1>
          <p className="text-slate-300">Tell us about your business so we can create the perfect website</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Company Info */}
          <Card className="border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-1 block">Company Name *</label>
                  <Input
                    required
                    value={formData.company_name}
                    onChange={(e) => setFormData({...formData, company_name: e.target.value})}
                    placeholder="Your Company LLC"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-1 block">Contact Person *</label>
                  <Input
                    required
                    value={formData.contact_person}
                    onChange={(e) => setFormData({...formData, contact_person: e.target.value})}
                    placeholder="John Doe"
                  />
                </div>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-1 block">Phone/WhatsApp</label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({...formData, phone: e.target.value})}
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-1 block">Country</label>
                  <Input
                    value={formData.country}
                    onChange={(e) => setFormData({...formData, country: e.target.value})}
                    placeholder="United States"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-300 mb-1 block">City</label>
                <Input
                  value={formData.city}
                  onChange={(e) => setFormData({...formData, city: e.target.value})}
                  placeholder="New York"
                />
              </div>
            </CardContent>
          </Card>

          {/* Online Presence */}
          <Card className="border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Current Online Presence</CardTitle>
              <CardDescription>Help us understand your existing digital footprint</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-300 mb-1 block">Current Website</label>
                <Input
                  value={formData.current_website}
                  onChange={(e) => setFormData({...formData, current_website: e.target.value})}
                  placeholder="https://yoursite.com"
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-1 block">Facebook Page</label>
                  <Input
                    value={formData.facebook_page}
                    onChange={(e) => setFormData({...formData, facebook_page: e.target.value})}
                    placeholder="https://facebook.com/yourpage"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-1 block">Instagram</label>
                  <Input
                    value={formData.instagram_page}
                    onChange={(e) => setFormData({...formData, instagram_page: e.target.value})}
                    placeholder="https://instagram.com/yourpage"
                  />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-300 mb-1 block">Other Platforms</label>
                <Input
                  value={formData.other_platforms}
                  onChange={(e) => setFormData({...formData, other_platforms: e.target.value})}
                  placeholder="LinkedIn, Twitter, etc."
                />
              </div>
            </CardContent>
          </Card>

          {/* Branding */}
          <Card className="border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Branding & Design</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">Upload Logo</label>
                <div className="flex items-center gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={uploadingLogo}
                    onClick={() => document.getElementById('logo-upload').click()}
                  >
                    {uploadingLogo ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                    {uploadingLogo ? 'Uploading...' : 'Choose File'}
                  </Button>
                  <input
                    id="logo-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleLogoUpload}
                  />
                  {formData.logo_url && (
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                      <span className="text-sm text-slate-300">Logo uploaded</span>
                    </div>
                  )}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-slate-300 mb-1 block">Brand Colors</label>
                <Input
                  value={formData.brand_colors}
                  onChange={(e) => setFormData({...formData, brand_colors: e.target.value})}
                  placeholder="#0066FF, #FF6B00 (comma separated)"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-300 mb-2 block">Design Style Preference</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {['modern', 'corporate', 'minimal', 'bold'].map(style => (
                    <Button
                      key={style}
                      type="button"
                      variant={formData.style_preference === style ? "default" : "outline"}
                      onClick={() => setFormData({...formData, style_preference: style})}
                      className="capitalize"
                    >
                      {style}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Business Goals */}
          <Card className="border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Business Goals</CardTitle>
              <CardDescription>What do you want your website to achieve?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid md:grid-cols-2 gap-3">
                {goalOptions.map(goal => (
                  <Button
                    key={goal.value}
                    type="button"
                    variant={formData.business_goals.includes(goal.value) ? "default" : "outline"}
                    onClick={() => handleGoalToggle(goal.value)}
                    className="justify-start"
                  >
                    {formData.business_goals.includes(goal.value) && <CheckCircle className="w-4 h-4 mr-2" />}
                    {goal.label}
                  </Button>
                ))}
              </div>
              <div>
                <label className="text-sm font-medium text-slate-300 mb-1 block">Additional Details</label>
                <Textarea
                  value={formData.goal_description}
                  onChange={(e) => setFormData({...formData, goal_description: e.target.value})}
                  placeholder="Tell us more about your specific needs and vision..."
                  rows={4}
                />
              </div>
            </CardContent>
          </Card>

          {/* Competitors */}
          <Card className="border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Competitor Websites (Optional)</CardTitle>
              <CardDescription>Share competitor sites you like for inspiration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[0, 1, 2].map(idx => (
                <Input
                  key={idx}
                  value={formData.competitor_urls[idx]}
                  onChange={(e) => {
                    const urls = [...formData.competitor_urls];
                    urls[idx] = e.target.value;
                    setFormData({...formData, competitor_urls: urls});
                  }}
                  placeholder={`Competitor ${idx + 1} URL`}
                />
              ))}
            </CardContent>
          </Card>

          <Alert className="bg-blue-600/10 border-blue-500/30">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <AlertDescription className="text-blue-300">
              After you submit, our AI will analyze your information and may ask up to 5 clarifying questions to build the perfect website for you.
            </AlertDescription>
          </Alert>

          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-lg py-6"
            disabled={submitIntakeMutation.isPending}
          >
            {submitIntakeMutation.isPending ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5 mr-2" />
                Generate My Website
              </>
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}