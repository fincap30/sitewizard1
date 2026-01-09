import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    const { intake_id, live_url } = await req.json();

    if (!intake_id || !live_url) {
      return Response.json({ error: 'intake_id and live_url are required' }, { status: 400 });
    }

    // Get intake details
    const intakes = await base44.asServiceRole.entities.WebsiteIntake.filter({ id: intake_id });
    const intake = intakes[0];

    if (!intake) {
      return Response.json({ error: 'Intake not found' }, { status: 404 });
    }

    // Update status to live
    await base44.asServiceRole.entities.WebsiteIntake.update(intake_id, {
      website_status: 'live',
      live_url: live_url
    });

    // Send notification to client
    await base44.asServiceRole.integrations.Core.SendEmail({
      from_name: 'SiteWizard.pro',
      to: intake.client_email,
      subject: `🎉 Your Website is Live! - ${intake.company_name}`,
      body: `
Hello ${intake.contact_person || 'there'},

Exciting news! Your website is now LIVE and ready to show the world! 🚀

Your Website: ${live_url}

What you can do now:
✅ Visit your live website
✅ Share it with your customers
✅ Request revisions if needed (from your dashboard)
✅ Monitor your website performance

View Your Dashboard:
${Deno.env.get('BASE44_APP_URL') || 'https://your-app.base44.com'}/ClientDashboard

Need changes? You can submit revision requests directly from your dashboard. We're here to help!

Congratulations on your new website!

Best regards,
SiteWizard.pro Team

P.S. Don't forget to share your new website on social media!
      `
    });

    return Response.json({
      success: true,
      message: 'Website marked as live and client notified',
      live_url: live_url
    });

  } catch (error) {
    console.error('Mark website live error:', error);
    return Response.json({ 
      error: 'Failed to mark website as live',
      details: error.message 
    }, { status: 500 });
  }
});