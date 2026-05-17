import { MercadoPagoConfig, Preference, Payment } from 'mercadopago';
import { env } from '../config/env';

const client = new MercadoPagoConfig({ accessToken: env.MP_ACCESS_TOKEN });

export class MercadoPagoService {
  static async createPreference(orderId: string, title: string, price: number, quantity: number = 1) {
    const preference = new Preference(client);

    const notificationUrl = env.WEBHOOK_URL ?? "https://your-ngrok.url/api/webhooks/mercadopago";

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
        notification_url: notificationUrl,
        back_urls: {
          success: `${env.FRONTEND_URL}/checkout/result?orderId=${orderId}`,
          failure: `${env.FRONTEND_URL}/checkout/result?orderId=${orderId}`,
          pending: `${env.FRONTEND_URL}/checkout/result?orderId=${orderId}`,
        },
        auto_return: "approved",
      }
    });
  }

  /**
   * Search for a MercadoPago payment by the external_reference (our orderId).
   * Returns the first matching payment result, or undefined if none found.
   * Used by the reconciliation cron to detect approved payments whose webhook was missed.
   */
  static async findByExternalReference(orderId: string) {
    const payment = new Payment(client);
    const result = await payment.search({ options: { external_reference: orderId } });
    return result?.results?.[0];
  }
}
