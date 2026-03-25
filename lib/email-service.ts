import { Resend } from "resend";
import nodemailer from "nodemailer";
import { getSettings } from "@/lib/settings";

interface OrderStatusEmailProps {
  orderNumber: string;
  customerName: string;
  status: string;
  total: string;
  items: any[];
}

export const EmailService = {
  async getTransporter() {
    const settings = await getSettings();
    const config = settings.email;

    if (config.provider === "smtp") {
      return nodemailer.createTransport({
        host: config.smtpHost,
        port: config.smtpPort,
        secure: config.smtpSecure,
        auth: {
          user: config.smtpUser,
          pass: config.smtpPass,
        },
      });
    }
    
    if (config.provider === "resend") {
      return new Resend(config.resendApiKey || process.env.RESEND_API_KEY);
    }

    return null;
  },

  async sendEmail(to: string, subject: string, html: string) {
    const settings = await getSettings();
    const config = settings.email;
    
    if (config.provider === "none") {
      console.log("Email provider is disabled. Skipping email to:", to);
      return;
    }

    const transporter = await this.getTransporter();
    if (!transporter) {
      console.warn("No email transporter configured. Email skipped.");
      return;
    }

    try {
      if (config.provider === "smtp" && transporter && "sendMail" in transporter) {
        await transporter.sendMail({
          from: config.from,
          to,
          subject,
          html,
        });
      } else if (config.provider === "resend" && transporter && "emails" in transporter) {
        await transporter.emails.send({
          from: config.from,
          to,
          subject,
          html,
        });
      }
    } catch (error) {
      console.error(`Failed to send email via ${config.provider}:`, error);
    }
  },

  async sendOrderUpdateEmail(email: string, props: OrderStatusEmailProps) {
    const { orderNumber, customerName, status, total } = props;
    
    const statusMap: Record<string, string> = {
      "DESIGN_RECEIVED": "Order Confirmed",
      "IN_PRODUCTION": "In Production",
      "QUALITY_CHECK": "Quality Check",
      "READY_TO_SHIP": "Ready to Ship",
      "SHIPPED": "Shipped",
      "DELIVERED": "Delivered",
      "CANCELLED": "Cancelled"
    };

    const friendlyStatus = statusMap[status.toUpperCase()] || status;
    const subject = `Order #${orderNumber}: Your status is now ${friendlyStatus}`;
    
    const html = `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border: 1px solid #f0f0f0; border-radius: 20px;">
        <h1 style="font-size: 24px; font-weight: 800; tracking-tight; color: #000; margin-bottom: 8px;">Order Update</h1>
        <p style="color: #666; font-size: 16px; margin-bottom: 32px;">Hi ${customerName}, your order status has been updated.</p>
        
        <div style="background: #f9f9f9; padding: 24px; border-radius: 16px; margin-bottom: 32px;">
          <div style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #999; margin-bottom: 4px;">Status</div>
          <div style="font-size: 20px; font-weight: 700; color: #000;">${friendlyStatus}</div>
        </div>

        <div style="margin-bottom: 32px;">
          <h3 style="font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #999; margin-bottom: 16px;">Order Summary</h3>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: #666;">Order Number:</span>
            <span style="font-weight: 600;">#${orderNumber}</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #666;">Total Amount:</span>
            <span style="font-weight: 600;">${total}</span>
          </div>
        </div>

        <p style="font-size: 14px; color: #999; line-height: 1.6;">
          Thank you for choosing Italian Shoes. We are dedicated to crafting your premium footwear with the highest standards of quality.
        </p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 32px 0;" />
        <div style="text-align: center; font-size: 12px; color: #ccc;">
          &copy; ${new Date().getFullYear()} Italian Shoes. All rights reserved.
        </div>
      </div>
    `;

    await this.sendEmail(email, subject, html);
  },

  async sendConfirmationEmail(email: string, props: OrderStatusEmailProps) {
    const { orderNumber, customerName, total } = props;
    const subject = `Thank you for your order #${orderNumber}!`;

    const html = `
      <div style="font-family: 'Inter', sans-serif; max-width: 600px; margin: 0 auto; padding: 40px; border: 1px solid #f0f0f0; border-radius: 20px;">
        <h1 style="font-size: 28px; font-weight: 800; tracking-tight; color: #000; margin-bottom: 16px;">Welcome to Italian Shoes</h1>
        <p style="color: #666; font-size: 16px; margin-bottom: 32px;">Hi ${customerName}, we've received your order and our artisans are ready to begin.</p>
        
        <div style="background: #000; color: #fff; padding: 32px; border-radius: 16px; text-align: center; margin-bottom: 32px;">
          <div style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; color: #666; margin-bottom: 8px;">Order Confirmed</div>
          <div style="font-size: 32px; font-weight: 900;">#${orderNumber}</div>
        </div>

        <div style="margin-bottom: 32px;">
          <h3 style="font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; color: #999; margin-bottom: 16px;">Details</h3>
          <div style="display: flex; justify-content: space-between; margin-bottom: 8px;">
            <span style="color: #666;">Items:</span>
            <span style="font-weight: 600;">${props.items.length} Product(s)</span>
          </div>
          <div style="display: flex; justify-content: space-between;">
            <span style="color: #666;">Total:</span>
            <span style="font-weight: 600;">${total}</span>
          </div>
        </div>

        <p style="font-size: 14px; color: #999; line-height: 1.6; margin-bottom: 32px;">
          You'll receive updates from us as your shoes move through production and shipping.
        </p>

        <a href="https://italian-shoes.starklabs.in/orders" style="display: inline-block; background: #000; color: #fff; text-decoration: none; padding: 14px 28px; border-radius: 50px; font-weight: 700; font-size: 14px;">Track My Order</a>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 40px 0;" />
        <div style="text-align: center; font-size: 12px; color: #ccc;">
          &copy; ${new Date().getFullYear()} Italian Shoes. All rights reserved.
        </div>
      </div>
    `;

    await this.sendEmail(email, subject, html);
  }
};
