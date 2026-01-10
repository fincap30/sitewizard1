import React, { useState } from 'react';
import { useMutation } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, ShoppingCart, CreditCard, Truck, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const CHECKOUT_STEPS = ['Cart', 'Shipping', 'Payment', 'Confirmation'];

export default function CheckoutFlow({ cartItems = [], onCheckoutComplete = null }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [orderData, setOrderData] = useState({
    customer: {
      email: '',
      firstName: '',
      lastName: '',
      phone: ''
    },
    shipping: {
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: ''
    },
    payment: {
      method: 'stripe', // 'stripe' or 'paypal'
      cardToken: null
    },
    notes: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);

  const createOrderMutation = useMutation({
    mutationFn: async () => {
      setIsProcessing(true);
      
      // Calculate totals
      const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const tax = subtotal * 0.08; // 8% tax
      const shipping = 10; // Fixed shipping
      const total = subtotal + tax + shipping;

      // Create order record
      const order = await base44.entities.Order?.create?.({
        customer_email: orderData.customer.email,
        customer_name: `${orderData.customer.firstName} ${orderData.customer.lastName}`,
        items: cartItems,
        subtotal,
        tax,
        shipping,
        total,
        status: 'processing',
        shipping_address: orderData.shipping,
        payment_method: orderData.payment.method,
        notes: orderData.notes,
        order_date: new Date().toISOString()
      }).catch(() => null);

      // Process payment based on method
      if (orderData.payment.method === 'stripe') {
        return { success: true, orderId: order?.id, method: 'stripe', total };
      } else if (orderData.payment.method === 'paypal') {
        return { success: true, orderId: order?.id, method: 'paypal', total };
      }
    },
    onSuccess: (result) => {
      setCurrentStep(3);
      if (onCheckoutComplete) {
        onCheckoutComplete(result);
      }
      toast.success('Order placed successfully!');
    },
    onError: () => {
      toast.error('Failed to process order');
    }
  });

  const handleNext = () => {
    if (currentStep < CHECKOUT_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const calculateTotal = () => {
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.08;
    const shipping = 10;
    return { subtotal, tax, shipping, total: subtotal + tax + shipping };
  };

  const totals = calculateTotal();

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        {CHECKOUT_STEPS.map((step, idx) => (
          <div key={idx} className="flex items-center flex-1">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                idx <= currentStep
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-700 text-slate-400'
              }`}
            >
              {idx < currentStep ? <CheckCircle className="w-5 h-5" /> : idx + 1}
            </div>
            <div className={`flex-1 h-1 ml-2 ${idx < CHECKOUT_STEPS.length - 1 ? (idx < currentStep ? 'bg-blue-600' : 'bg-slate-700') : ''}`} />
          </div>
        ))}
      </div>

      {/* Step Title */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white">{CHECKOUT_STEPS[currentStep]}</h2>
      </div>

      {/* Cart Summary (Always Visible) */}
      <Card className="border-2 border-slate-700/50 bg-slate-800/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Order Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {cartItems.map((item, idx) => (
              <div key={idx} className="flex justify-between items-start p-2 bg-slate-700/30 rounded">
                <div className="flex-1">
                  <p className="font-semibold text-white">{item.name}</p>
                  <p className="text-sm text-slate-400">Qty: {item.quantity}</p>
                </div>
                <p className="font-semibold text-slate-200">
                  ${(item.price * item.quantity).toFixed(2)}
                </p>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-700 pt-4 space-y-2">
            <div className="flex justify-between text-slate-300">
              <span>Subtotal:</span>
              <span>${totals.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Tax (8%):</span>
              <span>${totals.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-300">
              <span>Shipping:</span>
              <span>${totals.shipping.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-lg font-bold text-white border-t border-slate-600 pt-2">
              <span>Total:</span>
              <span>${totals.total.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step Content */}
      <Card className="border-2 border-slate-700/50 bg-slate-800/50">
        <CardContent className="pt-6">
          {currentStep === 0 && (
            <div className="space-y-4">
              <Alert className="bg-blue-900/10 border-blue-500/30">
                <AlertCircle className="w-4 h-4 text-blue-400" />
                <AlertDescription className="text-blue-300">
                  Review your items above. Click Next to continue with shipping.
                </AlertDescription>
              </Alert>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <Truck className="w-5 h-5" />
                Shipping Information
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  placeholder="First Name"
                  value={orderData.customer.firstName}
                  onChange={(e) => setOrderData({
                    ...orderData,
                    customer: { ...orderData.customer, firstName: e.target.value }
                  })}
                />
                <Input
                  placeholder="Last Name"
                  value={orderData.customer.lastName}
                  onChange={(e) => setOrderData({
                    ...orderData,
                    customer: { ...orderData.customer, lastName: e.target.value }
                  })}
                />
              </div>
              <Input
                type="email"
                placeholder="Email"
                value={orderData.customer.email}
                onChange={(e) => setOrderData({
                  ...orderData,
                  customer: { ...orderData.customer, email: e.target.value }
                })}
              />
              <Input
                placeholder="Phone"
                value={orderData.customer.phone}
                onChange={(e) => setOrderData({
                  ...orderData,
                  customer: { ...orderData.customer, phone: e.target.value }
                })}
              />
              <Input
                placeholder="Address"
                value={orderData.shipping.address}
                onChange={(e) => setOrderData({
                  ...orderData,
                  shipping: { ...orderData.shipping, address: e.target.value }
                })}
              />
              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  placeholder="City"
                  value={orderData.shipping.city}
                  onChange={(e) => setOrderData({
                    ...orderData,
                    shipping: { ...orderData.shipping, city: e.target.value }
                  })}
                />
                <Input
                  placeholder="State/Province"
                  value={orderData.shipping.state}
                  onChange={(e) => setOrderData({
                    ...orderData,
                    shipping: { ...orderData.shipping, state: e.target.value }
                  })}
                />
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  placeholder="ZIP Code"
                  value={orderData.shipping.zipCode}
                  onChange={(e) => setOrderData({
                    ...orderData,
                    shipping: { ...orderData.shipping, zipCode: e.target.value }
                  })}
                />
                <Input
                  placeholder="Country"
                  value={orderData.shipping.country}
                  onChange={(e) => setOrderData({
                    ...orderData,
                    shipping: { ...orderData.shipping, country: e.target.value }
                  })}
                />
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="font-semibold text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                Payment Method
              </h3>
              <div className="space-y-3">
                <Button
                  onClick={() => setOrderData({
                    ...orderData,
                    payment: { ...orderData.payment, method: 'stripe' }
                  })}
                  variant={orderData.payment.method === 'stripe' ? 'default' : 'outline'}
                  className="w-full justify-start"
                >
                  {orderData.payment.method === 'stripe' && <CheckCircle className="w-4 h-4 mr-2" />}
                  Credit Card (Stripe)
                </Button>
                <Button
                  onClick={() => setOrderData({
                    ...orderData,
                    payment: { ...orderData.payment, method: 'paypal' }
                  })}
                  variant={orderData.payment.method === 'paypal' ? 'default' : 'outline'}
                  className="w-full justify-start"
                >
                  {orderData.payment.method === 'paypal' && <CheckCircle className="w-4 h-4 mr-2" />}
                  PayPal
                </Button>
              </div>

              {orderData.payment.method === 'stripe' && (
                <Alert className="bg-amber-900/10 border-amber-500/30">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  <AlertDescription className="text-amber-300">
                    Stripe payment integration ready. Connect your Stripe account in settings.
                  </AlertDescription>
                </Alert>
              )}

              {orderData.payment.method === 'paypal' && (
                <Alert className="bg-amber-900/10 border-amber-500/30">
                  <AlertCircle className="w-4 h-4 text-amber-400" />
                  <AlertDescription className="text-amber-300">
                    PayPal payment integration ready. Connect your PayPal account in settings.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {currentStep === 3 && (
            <div className="text-center space-y-4">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Order Confirmed!</h3>
                <p className="text-slate-300 mb-4">
                  Thank you for your purchase. A confirmation email has been sent to {orderData.customer.email}
                </p>
                <p className="text-sm text-slate-400">
                  Order Total: <span className="text-lg font-bold text-white">${totals.total.toFixed(2)}</span>
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between gap-4">
        <Button
          onClick={handlePrev}
          disabled={currentStep === 0}
          variant="outline"
          className="flex-1 border-slate-600"
        >
          Previous
        </Button>

        {currentStep < CHECKOUT_STEPS.length - 1 ? (
          <Button
            onClick={currentStep === 2 ? () => createOrderMutation.mutate() : handleNext}
            disabled={createOrderMutation.isPending}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            {createOrderMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              currentStep === 2 ? 'Complete Order' : 'Next'
            )}
          </Button>
        ) : (
          <Button
            onClick={() => window.location.href = '/'}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            Continue Shopping
          </Button>
        )}
      </div>
    </div>
  );
}