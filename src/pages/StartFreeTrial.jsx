import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Check, CreditCard, Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";


export default function StartFreeTrial() {
  const [step, setStep] = useState(1);
  const [selectedPackage, setSelectedPackage] = useState(null);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    cardNumber: '',
    cardExpiry: '',
    cardCvc: '',
    cardName: ''
  });
  const [user, setUser] = useState(null);

  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
    
    const urlParams = new URLSearchParams(window.location.search);
    const packageId = urlParams.get('package');
    if (packageId) {
      setSelectedPackage(packageId);
    }
  }, []);

  const { data: packages = [] } = useQuery({
    queryKey: ['packages'],
    queryFn: () => base44.entities.Package.list('display_order'),
  });

  const createSubscriptionMutation = useMutation({
    mutationFn: async (data) => {
      const trialStart = new Date();
      const trialEnd = new Date(trialStart);
      trialEnd.setDate(trialEnd.getDate() + 14);

      return await base44.entities.ClientSubscription.create({
        client_email: data.email,
        package_id: data.package_id,
        status: 'trial',
        trial_started: trialStart.toISOString(),
        trial_ends: trialEnd.toISOString(),
        payment_method_added: true
      });
    },
    onSuccess: () => {
      toast.success('Trial started! Redirecting to intake form...');
      setTimeout(() => {
        window.location.href = '/WebsiteIntakeForm';
      }, 2000);
    },
  });

  const selectedPkg = packages.find(p => p.id === selectedPackage);

  const handlePackageSelect = (pkgId) => {
    setSelectedPackage(pkgId);
    setStep(2);
  };

  const handleSignup = async () => {
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }
    setStep(3);
  };

  const handlePaymentSubmit = async () => {
    if (!formData.cardNumber || !formData.cardExpiry || !formData.cardCvc || !formData.cardName) {
      toast.error('Please fill in all payment details');
      return;
    }

    createSubscriptionMutation.mutate({
      email: formData.email,
      package_id: selectedPackage
    });
  };

  if (user) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center px-4">
        <Card className="max-w-md w-full border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Already Logged In</CardTitle>
            <CardDescription>You're already logged in. Go to your dashboard or logout first.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              className="w-full" 
              onClick={() => window.location.href = '/ClientDashboard'}
            >
              Go to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent py-16 px-4">
      <div className="container mx-auto max-w-4xl">
        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 mb-12">
          {[1, 2, 3].map((num) => (
            <div key={num} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold ${
                step >= num ? 'bg-blue-600 text-white' : 'bg-slate-700 text-slate-400'
              }`}>
                {num}
              </div>
              {num < 3 && <div className={`w-16 h-1 ${step > num ? 'bg-blue-600' : 'bg-slate-700'}`} />}
            </div>
          ))}
        </div>

        {/* Step 1: Select Package */}
        {step === 1 && (
          <div>
            <h2 className="text-3xl font-bold text-white text-center mb-8">Choose Your Package</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {packages.filter(p => p.is_active).slice(0, 6).map((pkg) => (
                <Card 
                  key={pkg.id}
                  className={`cursor-pointer border-2 transition-all ${
                    selectedPackage === pkg.id 
                      ? 'border-blue-500 bg-blue-600/10' 
                      : 'border-slate-700/50 bg-slate-800/50 hover:border-blue-500/50'
                  }`}
                  onClick={() => handlePackageSelect(pkg.id)}
                >
                  <CardHeader>
                    <Badge className="w-fit">{pkg.tier}</Badge>
                    <CardTitle className="text-xl">{pkg.name}</CardTitle>
                    <div className="text-2xl font-bold text-white">${pkg.price}/mo</div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2">
                      {pkg.features?.slice(0, 4).map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-sm text-slate-300">
                          <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Account Details */}
        {step === 2 && selectedPkg && (
          <Card className="border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle>Create Your Account</CardTitle>
              <CardDescription>
                Selected: {selectedPkg.name} - ${selectedPkg.price}/month
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-slate-300 mb-1 block">Email</label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-300 mb-1 block">Password</label>
                <Input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  placeholder="Min 6 characters"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-300 mb-1 block">Confirm Password</label>
                <Input
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                  placeholder="Confirm password"
                />
              </div>
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700" 
                onClick={handleSignup}
                disabled={!formData.email || !formData.password}
              >
                Continue to Payment
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Step 3: Payment Method */}
        {step === 3 && selectedPkg && (
          <Card className="border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment Method
              </CardTitle>
              <CardDescription>
                Your card won't be charged for 14 days. Cancel anytime before then.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert className="bg-blue-600/10 border-blue-500/30">
                <AlertCircle className="w-4 h-4 text-blue-400" />
                <AlertDescription className="text-blue-300">
                  14-day free trial • First charge on {new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString()}
                </AlertDescription>
              </Alert>

              <div>
                <label className="text-sm font-medium text-slate-300 mb-1 block">Cardholder Name</label>
                <Input
                  value={formData.cardName}
                  onChange={(e) => setFormData({...formData, cardName: e.target.value})}
                  placeholder="John Doe"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-slate-300 mb-1 block">Card Number</label>
                <Input
                  value={formData.cardNumber}
                  onChange={(e) => setFormData({...formData, cardNumber: e.target.value})}
                  placeholder="4242 4242 4242 4242"
                  maxLength={19}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-1 block">Expiry</label>
                  <Input
                    value={formData.cardExpiry}
                    onChange={(e) => setFormData({...formData, cardExpiry: e.target.value})}
                    placeholder="MM/YY"
                    maxLength={5}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-300 mb-1 block">CVC</label>
                  <Input
                    value={formData.cardCvc}
                    onChange={(e) => setFormData({...formData, cardCvc: e.target.value})}
                    placeholder="123"
                    maxLength={4}
                  />
                </div>
              </div>

              <div className="bg-slate-700/30 p-4 rounded-lg space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400">Selected Plan:</span>
                  <span className="text-white font-semibold">{selectedPkg.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Trial Period:</span>
                  <span className="text-white">14 days free</span>
                </div>
                <div className="flex justify-between text-lg font-bold pt-2 border-t border-slate-600">
                  <span className="text-white">Due Today:</span>
                  <span className="text-green-400">$0.00</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">After trial:</span>
                  <span className="text-white">${selectedPkg.price}/month</span>
                </div>
              </div>

              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700" 
                onClick={handlePaymentSubmit}
                disabled={createSubscriptionMutation.isPending}
              >
                {createSubscriptionMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Starting Trial...
                  </>
                ) : (
                  'Start Free Trial'
                )}
              </Button>

              <p className="text-xs text-slate-400 text-center">
                By starting your trial, you agree to our Terms of Service
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}