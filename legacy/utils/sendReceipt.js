// const nodemailer = require('nodemailer')
// const dotenv=require('dotenv')


// module.exports = async (from, email, subject, text, customerName, orderId, totalItems, totalAmount, purchaseItems, address) => {
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
//     <title>Order Confirmation - SolarPaddy</title>
//     <meta charset="utf-8">
//     <meta name="viewport" content="width=device-width, initial-scale=1.0">
// </head>
// <body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5; color: #333333;">
//     <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px;">
//         <!-- Header -->
//         <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #023020;">
//             <h1 style="color: #023020; margin: 0; font-size: 28px;">SolarPaddy</h1>
//             <p style="color: #666666; margin: 5px 0 0;">Your Trusted Solar Solutions Provider</p>

//         </div>

//         <!-- Order Confirmation Message -->
//         <div style="padding: 30px 0; text-align: center;">
//             <!-- <img src="https://via.placeholder.com/80" alt="Check Mark" style="width: 80px; height: 80px; margin-bottom: 20px;"> -->
//             <h2 style="color: #023020; margin: 0 0 15px;">Thank You for Your Order!</h2>
//             <p style="color: #666666; font-size: 16px; line-height: 1.5;">
//                 We're excited to help you start your solar journey. Your order has been received and is being processed.
//             </p>
//         </div>

//         <!-- Order Details -->
//         <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
//             <h3 style="color: #023020; margin: 0 0 15px;">Order Details</h3>
//             <p style="margin: 5px 0;"><strong>Order Number:</strong> #${orderId}</p>
//                         <p style="margin: 5px 0;"><strong>Customer Name:</strong>${customerName}</p>
//             <p style="margin: 5px 0;"><strong>Order Date:</strong>${new Date().toLocaleDateString()}</p>
//         </div>

//         <!-- Products -->
//         <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
//             <tr style="background-color: #023020; color: white;">
//                 <th style="padding: 10px; text-align: left;">Product</th>
//                 <th style="padding: 10px; text-align: right;">Quantity</th>
//                 <th style="padding: 10px; text-align: right;">Price</th>
//             </tr>

//             ${purchaseItems.map(item => `
//             <tr style="border-bottom: 1px solid #eeeeee;">
//                 <td style="padding: 15px 10px;">${item.title}</td>
//                 <td style="padding: 15px 10px; text-align: right;">${item.quantity}</td>
//                 <td style="padding: 15px 10px; text-align: right;">₦${item.totalPrice.toFixed(2)}</td>
//             </tr>
//              `).join('')}

//             <!-- Summary -->
//             <tr style="background-color: #f9f9f9;">
//                 <td colspan="2" style="padding: 15px 10px; text-align: right;"><strong>Subtotal:</strong></td>
//                 <td style="padding: 15px 10px; text-align: right;">₦${totalAmount.toFixed(2)}</td>
//             </tr>
//             <tr style="background-color: #f9f9f9;">
//                 <td colspan="2" style="padding: 15px 10px; text-align: right;"><strong>VAT (15%):</strong></td>
//                 <td style="padding: 15px 10px; text-align: right;">₦${(totalAmount * 0.15).toFixed(2)}</td>
//             </tr>
//             <tr style="background-color: #f9f9f9;">
//                 <td colspan="2" style="padding: 15px 10px; text-align: right;"><strong>Total:</strong></td>
//                 <td style="padding: 15px 10px; text-align: right; font-weight: bold; color: #023020;">₦${(totalAmount * 1.15).toFixed(2)}</td>
//             </tr>
//         </table>

//         <!-- Delivery Information -->
//         <div style="background-color: #f0f7f4; padding: 20px; border-radius: 8px; margin: 20px 0;">
//             <h3 style="color: #023020; margin: 0 0 15px;">Delivery Information</h3>
//             <p style="margin: 5px 0; line-height: 1.5;">
//                 <strong>Delivery Address:</strong><br>
//             ${customerName}<br>
//             ${address}<br>
//             Lagos, Nigeria.
//             </p>
//             <p style="margin: 15px 0 5px; color: #666666;">
//                 Expected delivery within <strong>3 business days</strong>.<br>
//                 Our installation team will contact you to schedule the installation.
//             </p>
//         </div>

//         <!-- Important Notes -->
//         <div style="padding: 20px 0; border-top: 1px solid #eeeeee;">
//             <h3 style="color: #023020; margin: 0 0 15px;">Important Notes</h3>
//             <ul style="color: #666666; margin: 0; padding-left: 20px; line-height: 1.5;">
//                 <li>Our team will inspect all equipment before delivery</li>
//                 <li>Professional installation service is included</li>
//                 <li>5-year warranty on all equipment</li>
//                 <li>24/7 customer support available</li>
//             </ul>
//         </div>

//         <!-- Contact Information -->
//         <div style="text-align: center; padding: 30px 0; border-top: 1px solid #eeeeee; margin-top: 30px;">
//             <p style="color: #666666; margin: 0 0 10px;">Need help? Contact our support team</p>
//             <p style="margin: 0;">
//                 <a href="tel:+2348033621415" style="color: #023020; text-decoration: none;">📞 +234 803 362 1415</a>
//                 <br>
//                 <a href="mailto:powerup@solarpaddy.com" style="color: #023020; text-decoration: none;">✉️ powerup@solarpaddy.com</a>
//             </p>
//         </div>

//         <!-- Footer -->
//         <div style="text-align: center; padding: 20px; background-color: #023020; color: white; border-radius: 8px;">
//             <p style="margin: 0 0 10px;">SolarPaddy Ltd.</p>
//             <p style="margin: 0; font-size: 14px;">7 Ibiyinka Olorunbe, Victoria Island, Lagos</p>
//             <div style="margin-top: 15px;">
//                 <a href="#" style="color: white; text-decoration: none; margin: 0 10px;">Facebook</a>
//                 <a href="#" style="color: white; text-decoration: none; margin: 0 10px;">Twitter</a>
//                 <a href="#" style="color: white; text-decoration: none; margin: 0 10px;">Instagram</a>
//             </div>
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




// sendReceipt.js with Papersignal
const axios = require('axios');
require('dotenv').config();  // Make sure dotenv is imported

module.exports = async (from, email, subject, text, customerName, orderId, totalItems, totalAmount, purchaseItems, address) => {
	try {
		// Create the HTML template (your original template)
		const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <title>Order Confirmation - SolarPaddy</title>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f5f5f5; color: #333333;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 20px;">
        <!-- Header -->
        <div style="text-align: center; padding: 20px 0; border-bottom: 2px solid #023020;">
            <h1 style="color: #023020; margin: 0; font-size: 28px;">SolarPaddy</h1>
            <p style="color: #666666; margin: 5px 0 0;">Your Trusted Solar Solutions Provider</p>
        </div>

        <!-- Order Confirmation Message -->
        <div style="padding: 30px 0; text-align: center;">
            <h2 style="color: #023020; margin: 0 0 15px;">Thank You for Your Order!</h2>
            <p style="color: #666666; font-size: 16px; line-height: 1.5;">
                We're excited to help you start your solar journey. Your order has been received and is being processed.
            </p>
        </div>

        <!-- Order Details -->
        <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #023020; margin: 0 0 15px;">Order Details</h3>
            <p style="margin: 5px 0;"><strong>Order Number:</strong> #${orderId}</p>
            <p style="margin: 5px 0;"><strong>Customer Name:</strong>${customerName}</p>
            <p style="margin: 5px 0;"><strong>Order Date:</strong>${new Date().toLocaleDateString()}</p>
        </div>

        <!-- Products -->
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <tr style="background-color: #023020; color: white;">
                <th style="padding: 10px; text-align: left;">Product</th>
                <th style="padding: 10px; text-align: right;">Quantity</th>
                <th style="padding: 10px; text-align: right;">Price</th>
            </tr>

            ${purchaseItems.map(item => `
            <tr style="border-bottom: 1px solid #eeeeee;">
                <td style="padding: 15px 10px;">${item.title}</td>
                <td style="padding: 15px 10px; text-align: right;">${item.quantity}</td>
                <td style="padding: 15px 10px; text-align: right;">₦${item.totalPrice.toFixed(2)}</td>
            </tr>
             `).join('')}

            <!-- Summary -->
            <tr style="background-color: #f9f9f9;">
                <td colspan="2" style="padding: 15px 10px; text-align: right;"><strong>Subtotal:</strong></td>
                <td style="padding: 15px 10px; text-align: right;">₦${totalAmount.toFixed(2)}</td>
            </tr>
            <tr style="background-color: #f9f9f9;">
                <td colspan="2" style="padding: 15px 10px; text-align: right;"><strong>VAT (15%):</strong></td>
                <td style="padding: 15px 10px; text-align: right;">₦${(totalAmount * 0.15).toFixed(2)}</td>
            </tr>
            <tr style="background-color: #f9f9f9;">
                <td colspan="2" style="padding: 15px 10px; text-align: right;"><strong>Total:</strong></td>
                <td style="padding: 15px 10px; text-align: right; font-weight: bold; color: #023020;">₦${(totalAmount * 1.15).toFixed(2)}</td>
            </tr>
        </table>

        <!-- Delivery Information -->
        <div style="background-color: #f0f7f4; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #023020; margin: 0 0 15px;">Delivery Information</h3>
            <p style="margin: 5px 0; line-height: 1.5;">
                <strong>Delivery Address:</strong><br>
            ${customerName}<br>
            ${address}<br>
            Lagos, Nigeria.
            </p>
            <p style="margin: 15px 0 5px; color: #666666;">
                Expected delivery within <strong>3 business days</strong>.<br>
                Our installation team will contact you to schedule the installation.
            </p>
        </div>

        <!-- Important Notes -->
        <div style="padding: 20px 0; border-top: 1px solid #eeeeee;">
            <h3 style="color: #023020; margin: 0 0 15px;">Important Notes</h3>
            <ul style="color: #666666; margin: 0; padding-left: 20px; line-height: 1.5;">
                <li>Our team will inspect all equipment before delivery</li>
                <li>Professional installation service is included</li>
                <li>5-year warranty on all equipment</li>
                <li>24/7 customer support available</li>
            </ul>
        </div>

        <!-- Contact Information -->
        <div style="text-align: center; padding: 30px 0; border-top: 1px solid #eeeeee; margin-top: 30px;">
            <p style="color: #666666; margin: 0 0 10px;">Need help? Contact our support team</p>
            <p style="margin: 0;">
                <a href="tel:+2348033621415" style="color: #023020; text-decoration: none;">📞 +234 803 362 1415</a>
                <br>
                <a href="mailto:powerup@solarpaddy.com" style="color: #023020; text-decoration: none;">✉️ powerup@solarpaddy.com</a>
            </p>
        </div>

        <!-- Footer -->
        <div style="text-align: center; padding: 20px; background-color: #023020; color: white; border-radius: 8px;">
            <p style="margin: 0 0 10px;">SolarPaddy Ltd.</p>
            <p style="margin: 0; font-size: 14px;">7 Ibiyinka Olorunbe, Victoria Island, Lagos</p>
            <div style="margin-top: 15px;">
                <a href="#" style="color: white; text-decoration: none; margin: 0 10px;">Facebook</a>
                <a href="#" style="color: white; text-decoration: none; margin: 0 10px;">Twitter</a>
                <a href="#" style="color: white; text-decoration: none; margin: 0 10px;">Instagram</a>
            </div>
        </div>
    </div>
</body>
</html>`;

        // Create Axios instance with specific configuration
        const instance = axios.create({
            // Do not use https agent for http connection
            httpAgent: require('http').Agent(),
            maxRedirects: 0,        // Don't follow redirects
            timeout: 15000,         // 15 second timeout
            decompress: true        // Allow response compression
        });

        // Make request with the properly configured instance
        const response = await instance({
            method: 'post',
            //url: process.env.EMAIL_API_URL || 'https://mailserver-production-e4d4.up.railway.app/api/send-email', // Keep your port 3001
            url: process.env.EMAIL_API_URL || ' http://localhost:3001/api/send-email',
           
            headers: {
                'Content-Type': 'application/json',
                'x-api-key': process.env.API_KEY || 'simisolababy' // Fallback to hardcoded value if env not set
            },
            data: {
                from: "solarpaddy24@gmail.com <henryeyo@zohomail.com>",
                to: email,
                subject: subject,
                text: text,
                html: htmlContent
            }
        });
        
        console.log("Email sent successfully");
        return response.data;
    } catch (error) {
        console.log("Email not sent!");
        
        // Better error info to help debug
        if (error.response) {
            // Server responded with error
            console.log(`Server Error Code: ${error.response.status}`);
            console.log('Server Error Response:', error.response.data);
            
            if (error.response.data && error.response.data.error) {
                console.log('Specific error:', error.response.data.error);
            }
        } else if (error.request) {
            // No response received
            console.log("Server did not respond. Check if the email server is running on port 3001.");
        } else {
            // Request setup error
            console.log(`Error setting up request: ${error.message}`);
        }
        
        return error;
    }
};