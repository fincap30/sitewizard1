import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { intake_id } = await req.json();

    if (!intake_id) {
      return Response.json({ error: 'intake_id is required' }, { status: 400 });
    }

    // Get intake details
    const intakes = await base44.entities.WebsiteIntake.filter({ id: intake_id });
    const intake = intakes[0];

    if (!intake) {
      return Response.json({ error: 'Intake not found' }, { status: 404 });
    }

    // Verify ownership
    if (intake.client_email !== user.email) {
      return Response.json({ error: 'Not authorized to approve this website' }, { status: 403 });
    }

    // Update intake status to approved
    await base44.entities.WebsiteIntake.update(intake_id, {
      website_status: 'approved',
      confirmed: true
    });

    // Get admin users
    const adminUsers = await base44.asServiceRole.entities.User.filter({ role: 'admin' });

    // Send notification email to admins
    const emailPromises = adminUsers.map(admin =>
      base44.asServiceRole.integrations.Core.SendEmail({
        from_name: 'SiteWizard.pro',
        to: admin.email,
        subject: `🚀 New Website Approved - ${intake.company_name}`,
        body: `
Hello Admin,

A client has approved their AI-generated website and it's ready for build!

Client Details:
- Company: ${intake.company_name}
- Contact: ${intake.contact_person}
- Email: ${intake.client_email}
- Phone: ${intake.phone || 'Not provided'}

Website Details:
- Style: ${intake.style_preference}
- Goals: ${intake.business_goals?.join(', ') || 'Not specified'}

Please start the build process. Target completion: 30 days.

View in Admin Dashboard:
${Deno.env.get('BASE44_APP_URL') || 'https://your-app.base44.com'}/AdminDashboard

Best regards,
SiteWizard.pro System
        `
      })
    );

    await Promise.all(emailPromises);

    // Send confirmation to client
    await base44.asServiceRole.integrations.Core.SendEmail({
      from_name: 'SiteWizard.pro',
      to: intake.client_email,
      subject: `✅ Website Approved - ${intake.company_name}`,
      body: `
Hello ${intake.contact_person || 'there'},

Great news! Your website has been approved and our team is starting the build process.

What happens next:
1. Our developers will build your website based on the approved structure
2. You'll receive progress updates via email
3. Estimated completion: 30 days
4. You can track progress in your dashboard

Website Details:
- Company: ${intake.company_name}
- Style: ${intake.style_preference}

You can view your dashboard here:
${Deno.env.get('BASE44_APP_URL') || 'https://your-app.base44.com'}/ClientDashboard

If you have any questions, feel free to reach out!

Best regards,
SiteWizard.pro Team
      `
    });

    return Response.json({
      success: true,
      message: 'Website approved and notifications sent'
    });

  } catch (error) {
    console.error('Website approval error:', error);
    return Response.json({ 
      error: 'Failed to process approval',
      details: error.message 
    }, { status: 500 });
  }
});