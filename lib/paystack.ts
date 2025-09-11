interface PaystackResponse {
  status: boolean
  message: string
  data?: any
}

interface InitializePaymentData {
  email: string
  amount: number
  reference: string
  callback_url?: string
  metadata?: Record<string, any>
}

export class PaystackService {
  private secretKey: string
  private baseUrl = "https://api.paystack.co"

  constructor() {
    this.secretKey = process.env.PAYSTACK_SECRET_KEY!
    if (!this.secretKey) {
      throw new Error("PAYSTACK_SECRET_KEY is required")
    }
  }

  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<PaystackResponse> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.secretKey}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    })

    const data = await response.json()
    return data
  }

  async initializePayment(data: InitializePaymentData): Promise<PaystackResponse> {
    return this.makeRequest("/transaction/initialize", {
      method: "POST",
      body: JSON.stringify({
        ...data,
        amount: data.amount * 100, // Convert to kobo
      }),
    })
  }

  async verifyPayment(reference: string): Promise<PaystackResponse> {
    return this.makeRequest(`/transaction/verify/${reference}`)
  }

  async listTransactions(page = 1, perPage = 50): Promise<PaystackResponse> {
    return this.makeRequest(`/transaction?page=${page}&perPage=${perPage}`)
  }
}

export const paystack = new PaystackService()
