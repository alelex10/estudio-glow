import { MercadoPagoConfig, Preference } from 'mercadopago';
import dotenv from 'dotenv';
dotenv.config();

const client = new MercadoPagoConfig({ accessToken: process.env.MP_ACCESS_TOKEN || 'APP_USR-testing_token' });

export class MercadoPagoService {
  static async createPreference(orderId: string, title: string, price: number, quantity: number = 1) {
    const preference = new Preference(client);
    
    const notificationUrl = process.env.WEBHOOK_URL || "https://your-ngrok.url/api/webhooks/mercadopago";

    return await preference.create({
      body: {
        items: [
          {
            id: orderId,
            title,
            quantity,
            unit_price: price,
          }
        ],
        external_reference: orderId,
        notification_url: notificationUrl
      }
    });
  }
}
