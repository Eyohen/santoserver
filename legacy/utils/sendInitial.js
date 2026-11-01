const nodemailer = require('nodemailer');

const dotenv = require('dotenv');

// Helper function to calculate estimated cost based on total wattage
const calculateEstimatedCost = (totalWattage) => {
  // This is a simple estimation formula - adjust according to your business logic
  const costPerWatt = 200; // Example: ₦200 per watt
  return totalWattage * costPerWatt;
};

module.exports = async (from, email, subject, firstName, phone, appliances, totalWattage, totalAppliances) => {
  try {
    const currentDate = new Date().toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    const estimatedCost = calculateEstimatedCost(totalWattage);
    
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      service: process.env.SERVICE,
      port: Number(process.env.EMAIL_PORT),
      secure: false,
      auth: {
        user: process.env.USER,
        pass: process.env.PASS,
      },
    });

    // Create the equipment list HTML
    const equipmentListHTML = appliances.map(item => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #eee;">${item.name}</td>
        <td style="padding: 12px; text-align: center; border-bottom: 1px solid #eee;">${item.quantity}</td>
        <td style="padding: 12px; text-align: right; border-bottom: 1px solid #eee;">${item.watt}W</td>
        <td style="padding: 12px; text-align: right; border-bottom: 1px solid #eee;">${item.watt * item.quantity}W</td>
      </tr>
    `).join('');

    await transporter.sendMail({
      from: from,
      to: email,
      subject: subject,
      html: `<!DOCTYPE html>
<html>
<head>
  <title>Initial Estimation Receipt</title>
</head>
<body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;">
  <div style="max-width: 800px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
    <!-- Header -->
    <div style="text-align: center; border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 20px;">
      <h1 style="color: #2c3e50; margin: 0; font-size: 24px;">Solar Equipment Estimation</h1>
      <p style="color: #7f8c8d; margin: 5px 0;">Date: ${currentDate}</p>
    </div>

    <!-- Customer Information -->
    <div style="margin-bottom: 30px;">
      <h2 style="color: #2c3e50; font-size: 18px;">Customer Details</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 8px 0; color: #7f8c8d;">Name:</td>
          <td style="padding: 8px 0;">${firstName}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #7f8c8d;">Email:</td>
          <td style="padding: 8px 0;">${email}</td>
        </tr>
        <tr>
          <td style="padding: 8px 0; color: #7f8c8d;">Phone:</td>
          <td style="padding: 8px 0;">${phone}</td>
        </tr>
      </table>
    </div>

    <!-- Device List -->
    <div style="margin-bottom: 30px;">
      <h2 style="color: #2c3e50; font-size: 18px;">Selected Devices</h2>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #f8f9fa;">
            <th style="padding: 12px; text-align: left; border-bottom: 2px solid #eee;">Device</th>
            <th style="padding: 12px; text-align: center; border-bottom: 2px solid #eee;">Quantity</th>
            <th style="padding: 12px; text-align: right; border-bottom: 2px solid #eee;">Wattage</th>
            <th style="padding: 12px; text-align: right; border-bottom: 2px solid #eee;">Total Wattage</th>
          </tr>
        </thead>
        <tbody>
          ${equipmentListHTML}
        </tbody>
        <tfoot>
          <tr style="background-color: #f8f9fa;">
            <td colspan="3" style="padding: 12px; text-align: right; font-weight: bold;">Total Power Requirement:</td>
            <td style="padding: 12px; text-align: right; font-weight: bold;">${totalWattage}W</td>
          </tr>
        </tfoot>
      </table>
    </div>

    <!-- Total Cost -->
    <div style="margin-bottom: 30px;">
      <h2 style="color: #2c3e50; font-size: 18px;">Estimated Cost</h2>
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; text-align: right;">
        <span style="font-size: 18px; font-weight: bold;">Total Estimated Cost: ₦${estimatedCost.toLocaleString()}</span>
      </div>
    </div>

    <!-- Footer -->
    <div style="margin-top: 30px; text-align: center; color: #7f8c8d; font-size: 14px;">
      <p style="margin: 5px 0;">Thank you for choosing our solar solutions</p>
      <p style="margin: 5px 0;">Contact us: support@solarcompany.com | +234 000 000 0000</p>
    </div>
  </div>
</body>
</html>`
    });
    
    console.log("email sent successfully");
  } catch (error) {
    console.log("email not sent!");
    console.log(error);
    return error;
  }
};