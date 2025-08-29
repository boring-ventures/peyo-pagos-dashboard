import type {
  BridgeCustomerRequest,
  BridgeCustomerResponse,
  BridgeKycLinkRequest,
  BridgeKycLinkResponse,
  BridgeApiResponse,
  BridgeErrorResponse,
  BridgeClientConfig,
  BridgeRequestOptions,
} from '@/types/bridge';
import type { KYCStatus, CapabilityStatus } from '@prisma/client';

/**
 * Bridge.xyz API Client
 * Handles all communication with Bridge API including customer creation, KYC links, and status checks
 */
export class BridgeApiClient {
  private config: Required<BridgeClientConfig>;

  constructor(config: BridgeClientConfig) {
    this.config = {
      timeout: 30000,
      retries: 3,
      ...config,
    };
  }

  /**
   * Create a new customer in Bridge
   */
  async createCustomer(customerData: BridgeCustomerRequest): Promise<BridgeApiResponse<BridgeCustomerResponse>> {
    const idempotencyKey = this.generateUUID();
    
    console.log('🔄 Creating Bridge customer:', {
      type: customerData.type,
      email: customerData.email,
      idempotencyKey,
    });

    // Log the full Bridge request data for debugging
    console.log('📋 Bridge Request Data:', JSON.stringify(customerData, null, 2));

    return this.makeRequest({
      method: 'POST',
      endpoint: '/customers',
      data: customerData,
      idempotencyKey,
    });
  }

  /**
   * Get existing customer by ID
   */
  async getCustomer(customerId: string): Promise<BridgeApiResponse<BridgeCustomerResponse>> {
    console.log('🔍 Fetching Bridge customer:', customerId);

    return this.makeRequest({
      method: 'GET',
      endpoint: `/customers/${customerId}`,
    });
  }

  /**
   * Create KYC link for customer verification
   */
  async createKycLink(kycLinkData: BridgeKycLinkRequest): Promise<BridgeApiResponse<BridgeKycLinkResponse>> {
    const idempotencyKey = this.generateUUID();
    
    console.log('🔗 Creating Bridge KYC link:', {
      email: kycLinkData.email,
      type: kycLinkData.type,
      idempotencyKey,
    });

    return this.makeRequest({
      method: 'POST',
      endpoint: '/kyc_links',
      data: kycLinkData,
      idempotencyKey,
    });
  }

  /**
   * Get KYC link status
   */
  async getKycLinkStatus(kycLinkId: string): Promise<BridgeApiResponse<BridgeKycLinkResponse>> {
    console.log('📊 Fetching KYC link status:', kycLinkId);

    return this.makeRequest({
      method: 'GET',
      endpoint: `/kyc_links/${kycLinkId}`,
    });
  }

  /**
   * Get KYC link for existing customer
   */
  async getCustomerKycLink(customerId: string, endorsement?: string): Promise<BridgeApiResponse<{ url: string }>> {
    console.log('🔗 Getting customer KYC link:', { customerId, endorsement });

    const endpoint = endorsement 
      ? `/customers/${customerId}/kyc_link?endorsement=${endorsement}`
      : `/customers/${customerId}/kyc_link`;

    return this.makeRequest({
      method: 'GET',
      endpoint,
    });
  }

  /**
   * Get customer status (alias for getCustomer with focus on status)
   */
  async getCustomerStatus(customerId: string): Promise<BridgeApiResponse<BridgeCustomerResponse>> {
    console.log('📊 Fetching Bridge customer status:', customerId);

    return this.makeRequest({
      method: 'GET',
      endpoint: `/customers/${customerId}`,
    });
  }

  /**
   * Retry customer verification process
   */
  async retryCustomerVerification(customerId: string): Promise<BridgeApiResponse<BridgeCustomerResponse>> {
    console.log('🔄 Retrying customer verification:', customerId);

    return this.makeRequest({
      method: 'POST',
      endpoint: `/customers/${customerId}/retry_verification`,
      data: {},
    });
  }

  /**
   * Make HTTP request to Bridge API with retry logic
   */
  private async makeRequest<T = unknown>(options: BridgeRequestOptions): Promise<BridgeApiResponse<T>> {
    const { method, endpoint, data, idempotencyKey, headers = {} } = options;
    const url = `${this.config.baseUrl}${endpoint}`;

    const requestHeaders: HeadersInit = {
      'Content-Type': 'application/json',
      'Api-Key': this.config.apiKey,
      ...headers,
    };

    // Add idempotency key for POST requests
    if (method === 'POST' && idempotencyKey) {
      requestHeaders['Idempotency-Key'] = idempotencyKey;
    }

    let lastError: Error | null = null;
    
    // Retry logic
    for (let attempt = 0; attempt <= this.config.retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.config.timeout);

        console.log(`📡 Bridge API Request (attempt ${attempt + 1}):`, {
          method,
          url,
          hasData: !!data,
          headers: this.sanitizeHeadersForLogging(requestHeaders),
        });

        const response = await fetch(url, {
          method,
          headers: requestHeaders,
          body: data ? JSON.stringify(data) : undefined,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const responseHeaders = this.extractHeaders(response.headers);
        const responseText = await response.text();
        
        console.log(`📡 Bridge API Response (${response.status}):`, {
          status: response.status,
          hasData: !!responseText,
          headers: responseHeaders,
        });

        let responseData: T | BridgeErrorResponse;
        try {
          responseData = responseText ? JSON.parse(responseText) : null;
        } catch (parseError) {
          console.error('❌ Failed to parse Bridge API response:', parseError);
          throw new Error(`Invalid JSON response from Bridge API: ${responseText.substring(0, 200)}`);
        }

        if (!response.ok) {
          const errorResponse: BridgeErrorResponse = {
            error: 'Bridge API Error',
            message: (responseData as { message?: string })?.message || `HTTP ${response.status}`,
            status_code: response.status,
            details: responseData,
          };

          console.error(`❌ Bridge API Error (${response.status}):`, errorResponse);
          
          // Log detailed validation errors if available
          if (errorResponse.details) {
            console.error('🔍 Bridge API Error Details:', JSON.stringify(errorResponse.details, null, 2));
            
            // Specifically log the key object if it exists
            if (errorResponse.details && typeof errorResponse.details === 'object' && 'source' in errorResponse.details) {
              const source = (errorResponse.details as { source?: unknown }).source;
              if (source && typeof source === 'object' && 'key' in source) {
                const sourceWithKey = source as { key?: unknown };
                console.error('🔑 Bridge API Key Object:', JSON.stringify(sourceWithKey.key, null, 2));
                console.error('🔑 Bridge API Key Object Type:', typeof sourceWithKey.key);
                if (sourceWithKey.key && typeof sourceWithKey.key === 'object') {
                  console.error('🔑 Bridge API Key Object Keys:', Object.keys(sourceWithKey.key));
                }
              }
            }
          }

          // Don't retry client errors (4xx), but do retry server errors (5xx)
          if (response.status >= 400 && response.status < 500) {
            return {
              success: false,
              error: errorResponse,
              status: response.status,
              headers: responseHeaders,
            };
          }

          // For server errors, continue to retry
          throw new Error(`Bridge API server error: ${response.status}`);
        }

        console.log('✅ Bridge API request successful');
        
        return {
          success: true,
          data: responseData as T,
          status: response.status,
          headers: responseHeaders,
        };

      } catch (error) {
        lastError = error as Error;
        console.error(`❌ Bridge API request failed (attempt ${attempt + 1}):`, error);

        // Don't retry on the last attempt
        if (attempt === this.config.retries) {
          break;
        }

        // Wait before retry (exponential backoff)
        const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
        console.log(`⏳ Retrying Bridge API request in ${delay}ms...`);
        await this.sleep(delay);
      }
    }

    // All retries failed
    const errorResponse: BridgeErrorResponse = {
      error: 'Bridge API Request Failed',
      message: lastError?.message || 'Unknown error occurred',
      status_code: 0,
      details: { originalError: lastError?.stack },
    };

    console.error('❌ Bridge API request failed after all retries:', errorResponse);

    return {
      success: false,
      error: errorResponse,
      status: 0,
      headers: {},
    };
  }

  /**
   * Generate UUID v4 for idempotency keys
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Extract headers from Response object
   */
  private extractHeaders(headers: Headers): Record<string, string> {
    const result: Record<string, string> = {};
    headers.forEach((value, key) => {
      result[key] = value;
    });
    return result;
  }

  /**
   * Sanitize headers for logging (remove sensitive data)
   */
  private sanitizeHeadersForLogging(headers: HeadersInit): Record<string, string> {
    const sanitized: Record<string, string> = {};
    const headerEntries = headers instanceof Headers 
      ? Array.from(headers.entries())
      : Object.entries(headers as Record<string, string>);

    for (const [key, value] of headerEntries) {
      if (key.toLowerCase() === 'api-key') {
        sanitized[key] = `${value.substring(0, 10)}...`;
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Check if Bridge API is healthy
   */
  async healthCheck(): Promise<boolean> {
    try {
      console.log('🏥 Checking Bridge API health...');
      
      // Simple GET request to a lightweight endpoint
      const response = await this.makeRequest({
        method: 'GET',
        endpoint: '/customers?limit=1',
      });

      const isHealthy = response.success || response.status === 200;
      console.log(isHealthy ? '✅ Bridge API is healthy' : '❌ Bridge API health check failed');
      return isHealthy;
    } catch (error) {
      console.error('❌ Bridge API health check failed:', error);
      return false;
    }
  }
}

/**
 * Default Bridge API client instance
 */
let bridgeApiClient: BridgeApiClient | null = null;

/**
 * Get or create Bridge API client instance
 */
export function getBridgeApiClient(): BridgeApiClient {
  if (!bridgeApiClient) {
    const apiKey = process.env.BRIDGE_API_KEY;
    const baseUrl = process.env.BRIDGE_API_URL || 'https://api.bridge.xyz/v0';

    if (!apiKey) {
      throw new Error('BRIDGE_API_KEY environment variable is required');
    }

    bridgeApiClient = new BridgeApiClient({
      apiKey,
      baseUrl,
      timeout: 30000,
      retries: 3,
    });

    console.log('🔧 Bridge API client initialized:', { baseUrl });
  }

  return bridgeApiClient;
}

/**
 * Utility functions for Bridge API operations
 */
export const bridgeUtils = {
  /**
   * Map Bridge status to internal KYC status
   */
  mapBridgeStatusToKycStatus(bridgeStatus: string): KYCStatus {
    const statusMapping: Record<string, string> = {
      'pending': 'under_review',
      'active': 'active',
      'approved': 'active', 
      'rejected': 'rejected',
      'under_review': 'under_review',
      'incomplete': 'incomplete',
      'not_started': 'not_started',
      'awaiting_questionnaire': 'awaiting_questionnaire',
      'awaiting_ubo': 'awaiting_ubo',
      'paused': 'paused',
      'offboarded': 'offboarded',
    };

    return (statusMapping[bridgeStatus] || 'not_started') as KYCStatus;
  },

  /**
   * Map Bridge capability status to Prisma enum
   */
  mapCapabilityStatus(capabilityStatus: string | null | undefined): CapabilityStatus | null {
    if (!capabilityStatus) return null;
    
    const statusMapping: Record<string, CapabilityStatus> = {
      'pending': 'pending',
      'active': 'active',
      'inactive': 'inactive',
      'rejected': 'rejected',
    };

    return statusMapping[capabilityStatus] || null;
  },

  /**
   * Map Bridge expected monthly payments to Prisma enum
   */
  mapExpectedMonthlyPaymentsToPrisma(bridgeValue: string | undefined): 'zero_4999' | 'five_thousand_9999' | 'ten_thousand_49999' | 'fifty_thousand_plus' | null {
    if (!bridgeValue) {
      console.log(`💰 No expected monthly payments value provided, using null`);
      return null;
    }

    const paymentMapping: Record<string, 'zero_4999' | 'five_thousand_9999' | 'ten_thousand_49999' | 'fifty_thousand_plus'> = {
      '0_4999': 'zero_4999',
      '5000_9999': 'five_thousand_9999', 
      '10000_49999': 'ten_thousand_49999',
      '50000_plus': 'fifty_thousand_plus',
    };

    const mappedValue = paymentMapping[bridgeValue];
    console.log(`💰 Mapping expected monthly payments: ${bridgeValue} → ${mappedValue || 'null (unknown value)'}`);
    
    return mappedValue || null;
  },

  /**
   * Map Prisma expected monthly payments to Bridge format
   */
  mapExpectedMonthlyPaymentsToBridge(prismaValue: string | undefined): string | undefined {
    if (!prismaValue) return undefined;
    
    const reverseMapping: Record<string, string> = {
      'zero_4999': '0_4999',
      'five_thousand_9999': '5000_9999',
      'ten_thousand_49999': '10000_49999',
      'fifty_thousand_plus': '50000_plus',
    };
    
    return reverseMapping[prismaValue] || prismaValue;
  },

  /**
   * Check if Bridge status indicates approval
   */
  isApprovedStatus(status: string): boolean {
    return status === 'active' || status === 'approved';
  },

  /**
   * Check if Bridge status indicates rejection
   */
  isRejectedStatus(status: string): boolean {
    return status === 'rejected';
  },

  /**
   * Check if Bridge status indicates pending review
   */
  isPendingStatus(status: string): boolean {
    return ['pending', 'under_review', 'incomplete', 'awaiting_questionnaire', 'awaiting_ubo'].includes(status);
  },

  /**
   * Format Bridge customer for database storage
   */
  formatCustomerForDatabase(bridgeResponse: BridgeCustomerResponse) {
    return {
      bridgeCustomerId: bridgeResponse.id,
      kycStatus: this.mapBridgeStatusToKycStatus(bridgeResponse.status),
      firstName: bridgeResponse.first_name || null,
      lastName: bridgeResponse.last_name || null,
      email: bridgeResponse.email,
      kycApprovedAt: this.isApprovedStatus(bridgeResponse.status) ? new Date(bridgeResponse.updated_at) : null,
      kycRejectedAt: this.isRejectedStatus(bridgeResponse.status) ? new Date(bridgeResponse.updated_at) : null,
      payinCrypto: this.mapCapabilityStatus(bridgeResponse.capabilities?.payin_crypto),
      payoutCrypto: this.mapCapabilityStatus(bridgeResponse.capabilities?.payout_crypto),
      payinFiat: this.mapCapabilityStatus(bridgeResponse.capabilities?.payin_fiat),
      payoutFiat: this.mapCapabilityStatus(bridgeResponse.capabilities?.payout_fiat),
      requirementsDue: bridgeResponse.requirements_due || [],
      futureRequirementsDue: bridgeResponse.future_requirements_due || [],
      hasAcceptedTermsOfService: bridgeResponse.has_accepted_terms_of_service || false,
      bridgeRawResponse: JSON.parse(JSON.stringify(bridgeResponse)),
    };
  }
};;;

// Export types for convenience
export type { BridgeCustomerRequest, BridgeCustomerResponse, BridgeApiResponse };