
interface PayHereParams {
  merchant_id: string;
  return_url: string;
  cancel_url: string;
  notify_url: string;
  order_id: string;
  items: string;
  currency: string;
  amount: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  hash?: string;
  [key: string]: any;
}

export const payhereService = {
  async generateHash(orderId: string, amount: number, currency: string): Promise<string> {
    const response = await fetch('/api/payhere/hash', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ order_id: orderId, amount, currency }),
    });

    if (!response.ok) {
      throw new Error('Failed to generate payment hash');
    }

    const data = await response.json();
    return data.hash;
  },

  getCheckoutParams(
    orderId: string,
    items: string,
    amount: number,
    currency: string,
    userData: any,
    baseUrl: string
  ): PayHereParams {
    return {
      merchant_id: process.env.NEXT_PUBLIC_PAYHERE_MERCHANT_ID || '',
      return_url: `${baseUrl}/payment/success?order_id=${orderId}`,
      cancel_url: `${baseUrl}/payment/cancel`,
      notify_url: `${baseUrl}/api/payhere/notify`,
      order_id: orderId,
      items: items,
      currency: currency,
      amount: amount.toFixed(2),
      first_name: userData.name?.split(' ')[0] || 'User',
      last_name: userData.name?.split(' ').slice(1).join(' ') || '',
      email: userData.email || '',
      phone: userData.contact || '0770000000',
      address: userData.address || 'Colombo',
      city: userData.city || 'Colombo',
      country: userData.country || 'Sri Lanka',
    };
  }
};
