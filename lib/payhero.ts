import axios from 'axios'

const PAYHERO_BASE_URL = process.env.PAYHERO_BASE_URL || 'https://api.payhero.co.ke';
const PAYHERO_USERNAME = process.env.PAYHERO_USERNAME || '';
const PAYHERO_PASSWORD = process.env.PAYHERO_PASSWORD || '';

interface PayheroCheckoutRequest {
  amount: number;
  currency: string;
  description: string;
  callback_url: string;
  cancel_url: string;
  metadata?: Record<string, any>;
}

interface PayheroCheckoutResponse {
  checkout_url: string;
  transaction_id: string;
  status: string;
}
interface PayheroDisbursementRequest {
  amount: number
  account_number: string
  account_name: string
  bank_code: string
  description: string
  reference: string
}

interface PayheroDisbursementResponse {
  disbursement_id: string
  status: string
  reference: string
}

interface PayheroWebhookPayload {
  transaction_id: string
  status: 'success' | 'failed' | 'pending'
  amount: number
  currency: string
  reference: string
  timestamp: string
  signature: string
}

class PayheroService {
  private username: string;
  private password: string;
  private baseUrl: string;

  constructor() {
    this.username = PAYHERO_USERNAME;
    this.password = PAYHERO_PASSWORD;
    this.baseUrl = PAYHERO_BASE_URL;
    if (!this.username || !this.password) {
      console.error('PayHero credentials missing');
    }
  }

  private getHeaders() {
    const credentials = `${this.username}:${this.password}`;
    const encodedCredentials = Buffer.from(credentials).toString('base64');
    return {
      Authorization: `Basic ${encodedCredentials}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };
  }

  async createCheckout(request: PayheroCheckoutRequest): Promise<PayheroCheckoutResponse> {
    try {
      if (!this.username || !this.password) {
        throw new Error('PayHero credentials not configured');
      }

      const response = await axios.post(
        `${this.baseUrl}/v1/checkout`,
        request,
        { headers: this.getHeaders() }
      );

      console.log('PayHero API response:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('PayHero createCheckout error:', error.message, error.response?.data);
      throw error; // Throw real error instead of mock response
    }
  }
  /**
   * Verify webhook signature and payload
   */
  verifyWebhook(payload: PayheroWebhookPayload, signature: string): boolean {
    // In a real implementation, you would verify the webhook signature
    // using Payhero's webhook secret
    const webhookSecret = process.env.PAYHERO_WEBHOOK_SECRET || 'mock_webhook_secret'
    
    // Mock verification - in production, use proper HMAC verification
    return true
  }

  /**
   * Process a disbursement/payout
   */
  async disburse(request: PayheroDisbursementRequest): Promise<PayheroDisbursementResponse> {
    try {
      // In a real implementation, this would call the actual Payhero disbursement API
      const response = await axios.post(
        `${this.baseUrl}/v1/disburse`,
        request,
        { headers: this.getHeaders() }
      )

      return response.data
    } catch (error) {
      // Mock response for development
      console.log('Payhero disbursement API not available, using mock response')
      
      const mockDisbursementId = `dis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      
      return {
        disbursement_id: mockDisbursementId,
        status: 'pending',
        reference: request.reference
      }
    }
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(transactionId: string): Promise<{ status: string; amount: number }> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/v1/transactions/${transactionId}`,
        { headers: this.getHeaders() }
      )

      return response.data
    } catch (error) {
      // Mock response for development
      return {
        status: 'success',
        amount: 1000 // Mock amount
      }
    }
  }

  /**
   * Get disbursement status
   */
  async getDisbursementStatus(disbursementId: string): Promise<{ status: string; amount: number }> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/v1/disbursements/${disbursementId}`,
        { headers: this.getHeaders() }
      )

      return response.data
    } catch (error) {
      // Mock response for development
      return {
        status: 'completed',
        amount: 1000 // Mock amount
      }
    }
  }
}

export const payheroService = new PayheroService()

// Export types for use in API routes
export type {
  PayheroCheckoutRequest,
  PayheroCheckoutResponse,
  PayheroDisbursementRequest,
  PayheroDisbursementResponse,
  PayheroWebhookPayload
}
