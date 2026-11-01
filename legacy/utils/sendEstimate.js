// const nodemailer = require('nodemailer')
// const dotenv=require('dotenv')


// module.exports = async (from, email, subject, text) => {
// 	try {
// 		const transporter = nodemailer.createTransport({
// 			host: process.env.EMAIL_HOST,
// 			service: process.env.SERVICE,
// 			port: Number(process.env.EMAIL_PORT),
// 			secure: false,
// 			auth: {
// 				user: process.env.USER,
// 				pass: process.env.PASS,
// 			},
// 		});

// 		await transporter.sendMail({
// 			from: from,
// 			to: email,
// 			subject: subject,
// 			text: text,
//             html: `<!DOCTYPE html>
// <html>
// <head>
//     <title>Solar Equipment Estimation Receipt</title>
// </head>
// <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;">
//     <div style="max-width: 800px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
//         <!-- Header -->
//         <div style="text-align: center; border-bottom: 2px solid #eee; padding-bottom: 20px; margin-bottom: 20px;">
//             <h1 style="color: #2c3e50; margin: 0; font-size: 24px;">Solar Equipment Estimation</h1>
//             <p style="color: #7f8c8d; margin: 10px 0;">Reference: SOL-2024-001</p>
//             <p style="color: #7f8c8d; margin: 5px 0;">Date: January 4, 2024</p>
//         </div>

//         <!-- Customer Information -->
//         <div style="margin-bottom: 30px;">
//             <h2 style="color: #2c3e50; font-size: 18px;">Customer Details</h2>
//             <table style="width: 100%; border-collapse: collapse;">
//                 <tr>
//                     <td style="padding: 8px 0; color: #7f8c8d;">Name:</td>
//                     <td style="padding: 8px 0;">John Doe</td>
//                 </tr>
//                 <tr>
//                     <td style="padding: 8px 0; color: #7f8c8d;">Email:</td>
//                     <td style="padding: 8px 0;">john.doe@email.com</td>
//                 </tr>
//                 <tr>
//                     <td style="padding: 8px 0; color: #7f8c8d;">Phone:</td>
//                     <td style="padding: 8px 0;">+1 234 567 8900</td>
//                 </tr>
//             </table>
//         </div>

//         <!-- Device List -->
//         <div style="margin-bottom: 30px;">
//             <h2 style="color: #2c3e50; font-size: 18px;">Selected Devices</h2>
//             <table style="width: 100%; border-collapse: collapse;">
//                 <thead>
//                     <tr style="background-color: #f8f9fa;">
//                         <th style="padding: 12px; text-align: left; border-bottom: 2px solid #eee;">Device</th>
//                         <th style="padding: 12px; text-align: center; border-bottom: 2px solid #eee;">Quantity</th>
//                         <th style="padding: 12px; text-align: right; border-bottom: 2px solid #eee;">Wattage</th>
//                         <th style="padding: 12px; text-align: right; border-bottom: 2px solid #eee;">Total Wattage</th>
//                     </tr>
//                 </thead>
//                 <tbody>
//                     <tr>
//                         <td style="padding: 12px; border-bottom: 1px solid #eee;">Refrigerator</td>
//                         <td style="padding: 12px; text-align: center; border-bottom: 1px solid #eee;">1</td>
//                         <td style="padding: 12px; text-align: right; border-bottom: 1px solid #eee;">150W</td>
//                         <td style="padding: 12px; text-align: right; border-bottom: 1px solid #eee;">150W</td>
//                     </tr>
//                     <tr>
//                         <td style="padding: 12px; border-bottom: 1px solid #eee;">Air Conditioner</td>
//                         <td style="padding: 12px; text-align: center; border-bottom: 1px solid #eee;">2</td>
//                         <td style="padding: 12px; text-align: right; border-bottom: 1px solid #eee;">1500W</td>
//                         <td style="padding: 12px; text-align: right; border-bottom: 1px solid #eee;">3000W</td>
//                     </tr>
//                     <tr>
//                         <td style="padding: 12px; border-bottom: 1px solid #eee;">Television</td>
//                         <td style="padding: 12px; text-align: center; border-bottom: 1px solid #eee;">3</td>
//                         <td style="padding: 12px; text-align: right; border-bottom: 1px solid #eee;">100W</td>
//                         <td style="padding: 12px; text-align: right; border-bottom: 1px solid #eee;">300W</td>
//                     </tr>
//                 </tbody>
//                 <tfoot>
//                     <tr style="background-color: #f8f9fa;">
//                         <td colspan="3" style="padding: 12px; text-align: right; font-weight: bold;">Total Power Requirement:</td>
//                         <td style="padding: 12px; text-align: right; font-weight: bold;">3450W</td>
//                     </tr>
//                 </tfoot>
//             </table>
//         </div>

//         <!-- Recommended Equipment -->
//         <div style="margin-bottom: 30px;">
//             <h2 style="color: #2c3e50; font-size: 18px;">Recommended Solar Equipment</h2>
//             <table style="width: 100%; border-collapse: collapse;">
//                 <thead>
//                     <tr style="background-color: #f8f9fa;">
//                         <th style="padding: 12px; text-align: left; border-bottom: 2px solid #eee;">Item</th>
//                         <th style="padding: 12px; text-align: center; border-bottom: 2px solid #eee;">Quantity</th>
//                         <th style="padding: 12px; text-align: right; border-bottom: 2px solid #eee;">Unit Price</th>
//                         <th style="padding: 12px; text-align: right; border-bottom: 2px solid #eee;">Total</th>
//                     </tr>
//                 </thead>
//                 <tbody>
//                     <tr>
//                         <td style="padding: 12px; border-bottom: 1px solid #eee;">Solar Panels (400W)</td>
//                         <td style="padding: 12px; text-align: center; border-bottom: 1px solid #eee;">10</td>
//                         <td style="padding: 12px; text-align: right; border-bottom: 1px solid #eee;">$300</td>
//                         <td style="padding: 12px; text-align: right; border-bottom: 1px solid #eee;">$3,000</td>
//                     </tr>
//                     <tr>
//                         <td style="padding: 12px; border-bottom: 1px solid #eee;">Inverter (5kW)</td>
//                         <td style="padding: 12px; text-align: center; border-bottom: 1px solid #eee;">1</td>
//                         <td style="padding: 12px; text-align: right; border-bottom: 1px solid #eee;">$1,500</td>
//                         <td style="padding: 12px; text-align: right; border-bottom: 1px solid #eee;">$1,500</td>
//                     </tr>
//                     <tr>
//                         <td style="padding: 12px; border-bottom: 1px solid #eee;">Battery Bank (48V)</td>
//                         <td style="padding: 12px; text-align: center; border-bottom: 1px solid #eee;">2</td>
//                         <td style="padding: 12px; text-align: right; border-bottom: 1px solid #eee;">$2,000</td>
//                         <td style="padding: 12px; text-align: right; border-bottom: 1px solid #eee;">$4,000</td>
//                     </tr>
//                 </tbody>
//                 <tfoot>
//                     <tr>
//                         <td colspan="3" style="padding: 12px; text-align: right; border-top: 2px solid #eee;">Equipment Subtotal:</td>
//                         <td style="padding: 12px; text-align: right; border-top: 2px solid #eee;">$8,500</td>
//                     </tr>
//                     <tr>
//                         <td colspan="3" style="padding: 12px; text-align: right;">Installation Cost (15%):</td>
//                         <td style="padding: 12px; text-align: right;">$1,275</td>
//                     </tr>
//                     <tr style="background-color: #f8f9fa;">
//                         <td colspan="3" style="padding: 12px; text-align: right; font-weight: bold;">Estimated Total:</td>
//                         <td style="padding: 12px; text-align: right; font-weight: bold;">$9,775</td>
//                     </tr>
//                 </tfoot>
//             </table>
//         </div>

//         <!-- Notes -->
//         <div style="margin-top: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 5px;">
//             <h2 style="color: #2c3e50; font-size: 18px; margin-top: 0;">Important Notes</h2>
//             <ul style="color: #7f8c8d; margin: 10px 0; padding-left: 20px;">
//                 <li style="margin-bottom: 5px;">This is an estimated calculation based on provided information</li>
//                 <li style="margin-bottom: 5px;">Final costs may vary based on site inspection and requirements</li>
//                 <li style="margin-bottom: 5px;">Installation costs include labor and mounting equipment</li>
//                 <li style="margin-bottom: 5px;">Warranty and maintenance details will be provided separately</li>
//             </ul>
//         </div>

//         <!-- Footer -->
//         <div style="margin-top: 30px; text-align: center; color: #7f8c8d; font-size: 14px;">
//             <p style="margin: 5px 0;">Thank you for choosing our solar solutions</p>
//             <p style="margin: 5px 0;">Contact us: support@solarcompany.com | +1 234 567 8900</p>
//         </div>
//     </div>
// </body>
// </html>`
// 		});
// 		console.log("email sent successfully");
// 	} catch (error) {
// 		console.log("email not sent!");
// 		console.log(error);
// 		return error;
// 	}
// };


const nodemailer = require('nodemailer');
const dotenv = require('dotenv');

module.exports = async (from, email, subject, text, html) => {
  try {
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

    await transporter.sendMail({
      from: from,
      to: email,
      subject: subject,
      text: text,
      html: html
    });
    
    console.log("Email sent successfully");
  } catch (error) {
    console.log("Email not sent!");
    console.error(error);
    return error;
  }
};