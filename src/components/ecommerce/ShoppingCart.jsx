import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart as CartIcon, Trash2, Plus, Minus, CreditCard } from "lucide-react";
import { loadStripe } from '@stripe/stripe-js';
import { toast } from "sonner";

export default function ShoppingCart({ products }) {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);

  const addToCart = (product) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) {
      setCart(cart.map(item =>
        item.id === product.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, { ...product, quantity: 1 }]);
    }
    toast.success(`${product.name} added to cart`);
  };

  const updateQuantity = (productId, change) => {
    setCart(cart.map(item =>
      item.id === productId
        ? { ...item, quantity: Math.max(1, item.quantity + change) }
        : item
    ).filter(item => item.quantity > 0));
  };

  const removeFromCart = (productId) => {
    setCart(cart.filter(item => item.id !== productId));
    toast.success('Item removed from cart');
  };

  const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleCheckout = async () => {
    setLoading(true);
    try {
      // This would call your Stripe backend function
      toast.success('Redirecting to checkout...');
      // const stripe = await loadStripe('your_publishable_key');
      // await stripe.redirectToCheckout({ sessionId: 'session_id' });
    } catch (error) {
      toast.error('Checkout failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-4">
        <Card className="border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm">
          <CardHeader>
            <CardTitle>Available Products</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {products.map((product) => (
                <Card key={product.id} className="bg-slate-700/30">
                  <CardContent className="pt-4">
                    <h4 className="font-semibold text-white mb-2">{product.name}</h4>
                    <p className="text-sm text-slate-300 mb-3">{product.short_description}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-xl font-bold text-green-400">${product.price}</p>
                      <Button
                        size="sm"
                        onClick={() => addToCart(product)}
                        disabled={product.stock_quantity === 0}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {product.stock_quantity === 0 ? 'Out of Stock' : 'Add to Cart'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <div>
        <Card className="border-2 border-slate-700/50 bg-slate-800/50 backdrop-blur-sm sticky top-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CartIcon className="w-5 h-5" />
              Shopping Cart ({cart.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {cart.length === 0 ? (
              <div className="text-center py-8">
                <CartIcon className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                <p className="text-slate-300">Your cart is empty</p>
              </div>
            ) : (
              <>
                <div className="space-y-3 mb-4">
                  {cart.map((item) => (
                    <Card key={item.id} className="bg-slate-700/30">
                      <CardContent className="pt-3">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <p className="font-medium text-white text-sm">{item.name}</p>
                            <p className="text-green-400 font-semibold">${item.price}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeFromCart(item.id)}
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.id, -1)}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <Badge>{item.quantity}</Badge>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.id, 1)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="border-t border-slate-600 pt-4 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-300">Subtotal</span>
                    <span className="text-white font-semibold">${total.toFixed(2)}</span>
                  </div>
                  <div className="flex items-center justify-between text-lg font-bold">
                    <span className="text-white">Total</span>
                    <span className="text-green-400">${total.toFixed(2)}</span>
                  </div>
                </div>

                <Button
                  onClick={handleCheckout}
                  disabled={loading}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  {loading ? 'Processing...' : 'Checkout with Stripe'}
                </Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}