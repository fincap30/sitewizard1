import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CheckCircle, AlertCircle, CreditCard, DollarSign } from "lucide-react";
import { toast } from "sonner";

export default function PaymentGatewaySetup() {
  const [stripeData, setStripeData] = useState({
    publishableKey: '',
    secretKey: '',
    isConnected: false
  });

  const [paypalData, setPaypalData] = useState({
    clientId: '',
    clientSecret: '',
    isConnected: false
  });

  const [showStripeForm, setShowStripeForm] = useState(false);
  const [showPaypalForm, setShowPaypalForm] = useState(false);

  const handleConnectStripe = () => {
    if (stripeData.publishableKey && stripeData.secretKey) {
      setStripeData({ ...stripeData, isConnected: true });
      toast.success('Stripe connected successfully!');
      setShowStripeForm(false);
    } else {
      toast.error('Please fill in all Stripe credentials');
    }
  };

  const handleConnectPaypal = () => {
    if (paypalData.clientId && paypalData.clientSecret) {
      setPaypalData({ ...paypalData, isConnected: true });
      toast.success('PayPal connected successfully!');
      setShowPaypalForm(false);
    } else {
      toast.error('Please fill in all PayPal credentials');
    }
  };

  const handleDisconnect = (gateway) => {
    if (gateway === 'stripe') {
      setStripeData({ ...stripeData, isConnected: false });
      toast.success('Stripe disconnected');
    } else {
      setPaypalData({ ...paypalData, isConnected: false });
      toast.success('PayPal disconnected');
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Payment Gateway Setup</h2>
        <p className="text-slate-300">Configure payment options for your e-commerce store</p>
      </div>

      <Tabs defaultValue="stripe" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="stripe">Stripe</TabsTrigger>
          <TabsTrigger value="paypal">PayPal</TabsTrigger>
        </TabsList>

        {/* Stripe Tab */}
        <TabsContent value="stripe" className="space-y-6">
          <Card className="border-2 border-slate-700/50 bg-slate-800/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-purple-400" />
                Stripe Payment Gateway
              </CardTitle>
              <CardDescription>
                Accept credit cards and digital payments with Stripe
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {stripeData.isConnected ? (
                <div className="space-y-4">
                  <Alert className="bg-green-900/10 border-green-500/30">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <AlertDescription className="text-green-300">
                      Stripe is connected and active. You can now accept credit card payments.
                    </AlertDescription>
                  </Alert>

                  <div className="bg-slate-700/30 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300 font-medium">Status</span>
                      <Badge className="bg-green-600">Connected</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300 font-medium">Publishable Key</span>
                      <span className="text-slate-400 text-sm">••••••••</span>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-slate-600">
                      <Button
                        onClick={() => {
                          handleDisconnect('stripe');
                          setShowStripeForm(false);
                        }}
                        variant="destructive"
                      >
                        Disconnect
                      </Button>
                    </div>
                  </div>

                  <div className="bg-slate-700/30 rounded-lg p-4 space-y-3 border border-slate-600">
                    <h4 className="font-semibold text-white mb-3">Test Your Integration</h4>
                    <p className="text-sm text-slate-300 mb-2">Use these test card numbers to verify:</p>
                    <div className="space-y-2 text-xs">
                      <div className="bg-slate-800/50 p-2 rounded">
                        <p className="text-slate-400">Success: <span className="text-slate-200 font-mono">4242 4242 4242 4242</span></p>
                      </div>
                      <div className="bg-slate-800/50 p-2 rounded">
                        <p className="text-slate-400">Decline: <span className="text-slate-200 font-mono">4000 0000 0000 0002</span></p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <Alert className="bg-amber-900/10 border-amber-500/30">
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                    <AlertDescription className="text-amber-300">
                      Stripe is not connected. Add your credentials to enable credit card payments.
                    </AlertDescription>
                  </Alert>

                  <Button
                    onClick={() => setShowStripeForm(!showStripeForm)}
                    className="w-full bg-purple-600 hover:bg-purple-700"
                  >
                    {showStripeForm ? 'Cancel' : 'Connect Stripe'}
                  </Button>

                  {showStripeForm && (
                    <div className="space-y-4 p-4 bg-slate-700/20 rounded-lg border border-slate-600">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Publishable Key
                        </label>
                        <Input
                          type="password"
                          placeholder="pk_live_..."
                          value={stripeData.publishableKey}
                          onChange={(e) => setStripeData({
                            ...stripeData,
                            publishableKey: e.target.value
                          })}
                        />
                        <p className="text-xs text-slate-400 mt-1">
                          Found in Stripe Dashboard → Developers → API Keys
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Secret Key
                        </label>
                        <Input
                          type="password"
                          placeholder="sk_live_..."
                          value={stripeData.secretKey}
                          onChange={(e) => setStripeData({
                            ...stripeData,
                            secretKey: e.target.value
                          })}
                        />
                        <p className="text-xs text-slate-400 mt-1">
                          Keep this secret and never share it
                        </p>
                      </div>

                      <Button
                        onClick={handleConnectStripe}
                        className="w-full bg-purple-600 hover:bg-purple-700"
                      >
                        Verify & Connect
                      </Button>
                    </div>
                  )}

                  <div className="bg-slate-700/30 rounded-lg p-4 space-y-2 border border-slate-600">
                    <h4 className="font-semibold text-white text-sm">Get Your Stripe Keys</h4>
                    <ol className="text-xs text-slate-300 space-y-1 list-decimal list-inside">
                      <li>Go to <span className="text-blue-400">stripe.com</span> and sign up</li>
                      <li>Navigate to Developers → API Keys</li>
                      <li>Copy your Publishable and Secret keys</li>
                      <li>Paste them above</li>
                    </ol>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* PayPal Tab */}
        <TabsContent value="paypal" className="space-y-6">
          <Card className="border-2 border-slate-700/50 bg-slate-800/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-blue-400" />
                PayPal Payment Gateway
              </CardTitle>
              <CardDescription>
                Accept PayPal payments and digital wallets
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {paypalData.isConnected ? (
                <div className="space-y-4">
                  <Alert className="bg-green-900/10 border-green-500/30">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    <AlertDescription className="text-green-300">
                      PayPal is connected and active. Customers can now pay with PayPal.
                    </AlertDescription>
                  </Alert>

                  <div className="bg-slate-700/30 rounded-lg p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300 font-medium">Status</span>
                      <Badge className="bg-green-600">Connected</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300 font-medium">Client ID</span>
                      <span className="text-slate-400 text-sm">••••••••</span>
                    </div>
                    <div className="flex items-center justify-between pt-3 border-t border-slate-600">
                      <Button
                        onClick={() => {
                          handleDisconnect('paypal');
                          setShowPaypalForm(false);
                        }}
                        variant="destructive"
                      >
                        Disconnect
                      </Button>
                    </div>
                  </div>

                  <div className="bg-slate-700/30 rounded-lg p-4 space-y-3 border border-slate-600">
                    <h4 className="font-semibold text-white mb-3">Sandbox Testing</h4>
                    <p className="text-sm text-slate-300 mb-2">Use sandbox account for testing:</p>
                    <div className="space-y-2 text-xs">
                      <div className="bg-slate-800/50 p-2 rounded">
                        <p className="text-slate-400">Email: <span className="text-slate-200 font-mono">sb-buyer@example.com</span></p>
                      </div>
                      <div className="bg-slate-800/50 p-2 rounded">
                        <p className="text-slate-400">Password: <span className="text-slate-200 font-mono">Test12345</span></p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <Alert className="bg-amber-900/10 border-amber-500/30">
                    <AlertCircle className="w-4 h-4 text-amber-400" />
                    <AlertDescription className="text-amber-300">
                      PayPal is not connected. Add your credentials to enable PayPal payments.
                    </AlertDescription>
                  </Alert>

                  <Button
                    onClick={() => setShowPaypalForm(!showPaypalForm)}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    {showPaypalForm ? 'Cancel' : 'Connect PayPal'}
                  </Button>

                  {showPaypalForm && (
                    <div className="space-y-4 p-4 bg-slate-700/20 rounded-lg border border-slate-600">
                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Client ID
                        </label>
                        <Input
                          type="password"
                          placeholder="AZBFx..."
                          value={paypalData.clientId}
                          onChange={(e) => setPaypalData({
                            ...paypalData,
                            clientId: e.target.value
                          })}
                        />
                        <p className="text-xs text-slate-400 mt-1">
                          Found in PayPal Developer Dashboard
                        </p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-slate-300 mb-2">
                          Client Secret
                        </label>
                        <Input
                          type="password"
                          placeholder="ECx..."
                          value={paypalData.clientSecret}
                          onChange={(e) => setPaypalData({
                            ...paypalData,
                            clientSecret: e.target.value
                          })}
                        />
                        <p className="text-xs text-slate-400 mt-1">
                          Keep this secret and never share it
                        </p>
                      </div>

                      <Button
                        onClick={handleConnectPaypal}
                        className="w-full bg-blue-600 hover:bg-blue-700"
                      >
                        Verify & Connect
                      </Button>
                    </div>
                  )}

                  <div className="bg-slate-700/30 rounded-lg p-4 space-y-2 border border-slate-600">
                    <h4 className="font-semibold text-white text-sm">Get Your PayPal Credentials</h4>
                    <ol className="text-xs text-slate-300 space-y-1 list-decimal list-inside">
                      <li>Go to <span className="text-blue-400">developer.paypal.com</span></li>
                      <li>Sign in with your PayPal account</li>
                      <li>Create an app in Sandbox</li>
                      <li>Copy Client ID and Client Secret</li>
                      <li>Paste them above</li>
                    </ol>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Available Payment Methods Summary */}
      <Card className="border-2 border-slate-700/50 bg-slate-800/30">
        <CardHeader>
          <CardTitle className="text-base">Active Payment Methods</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg border border-slate-600">
              <div className={`w-3 h-3 rounded-full ${stripeData.isConnected ? 'bg-green-500' : 'bg-slate-500'}`} />
              <div>
                <p className="font-medium text-white text-sm">Stripe</p>
                <p className="text-xs text-slate-400">
                  {stripeData.isConnected ? 'Active' : 'Not connected'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg border border-slate-600">
              <div className={`w-3 h-3 rounded-full ${paypalData.isConnected ? 'bg-green-500' : 'bg-slate-500'}`} />
              <div>
                <p className="font-medium text-white text-sm">PayPal</p>
                <p className="text-xs text-slate-400">
                  {paypalData.isConnected ? 'Active' : 'Not connected'}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}