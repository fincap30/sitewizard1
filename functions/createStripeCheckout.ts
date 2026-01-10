import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { cart, websiteIntakeId } = await req.json();

    // Calculate total
    const total = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

    // Create PayPal order payload
    const paypalOrder = {
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: 'USD',
          value: total.toFixed(2),
          breakdown: {
            item_total: {
              currency_code: 'USD',
              value: total.toFixed(2)
            }
          }
        },
        items: cart.map(item => ({
          name: item.name,
          description: item.short_description,
          unit_amount: {
            currency_code: 'USD',
            value: item.price.toFixed(2)
          },
          quantity: item.quantity.toString()
        }))
      }],
      application_context: {
        return_url: `${req.headers.get('origin')}/checkout/success`,
        cancel_url: `${req.headers.get('origin')}/checkout/cancel`,
        user_action: 'PAY_NOW'
      }
    };

    // Create PayPal order
    const paypalResponse = await fetch('https://api-m.paypal.com/v2/checkout/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${btoa(`${Deno.env.get('PAYPAL_CLIENT_ID')}:${Deno.env.get('PAYPAL_SECRET')}`)}`,
      },
      body: JSON.stringify(paypalOrder)
    });

    const order = await paypalResponse.json();

    if (!paypalResponse.ok) {
      throw new Error(order.message || 'PayPal order creation failed');
    }

    return Response.json({ 
      orderId: order.id, 
      approvalUrl: order.links.find(link => link.rel === 'approve')?.href 
    });
  } catch (error) {
    console.error('PayPal checkout error:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});