import * as nodemailer from 'nodemailer';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MailService {
  private transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.MAIL_USER, // medicarexadmin@gmail.com
        pass: process.env.MAIL_PASS, 
      },
    });
  }

  async sendInvoiceRole(customerEmail: string, orderDetails: any) {
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; border: 1px solid #ddd; padding: 20px;">
        <h2 style="color: #1a365d;">MediCareX - Official Invoice</h2>
        <p>Dear ${orderDetails.firstName},</p>
        <p>Thank you for your order! Your payment was successful.</p>
        <hr>
        <p><strong>Order ID:</strong> ${orderDetails.orderId}</p>
        <p><strong>Amount Paid:</strong> Rs. ${orderDetails.totalAmount}.00</p>
        <p><strong>Delivery to:</strong> ${orderDetails.houseNumber}, ${orderDetails.laneStreet}, ${orderDetails.city}</p>
        <hr>
        <p>We will deliver your medicine shortly. Stay safe!</p>
      </div>
    `;

    await this.transporter.sendMail({
      from: `"MediCareX" <${process.env.MAIL_USER}>`,
      to: customerEmail,
      subject: 'Your Order Confirmation - MediCareX',
      html: htmlContent,
    });
  }
}