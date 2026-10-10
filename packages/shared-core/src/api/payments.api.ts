import type { AxiosInstance } from 'axios';
import type {
  Payment,
  PaymentInitRequest,
  PaymentInitResponse,
  PaymentSuccessRequest,
  PaymentFailedRequest,
  ManualPaymentResponse,
  ManualPaymentInitiateRequest,
  ManualPaymentInitiateResponse,
  PaymentMethod,
} from '../types/payments.types';

export interface ManualPaymentFormData {
  planId: number;
  /**
   * When present, finalises the already-initiated INITIATED payment row
   * (whose paymentId is in the UPI reference) instead of creating a new one.
   */
  paymentId?: number;
  paymentMethod: PaymentMethod;
  referenceNote: string;
  screenshot?: File;
}

export interface ContactUnlockManualPaymentFormData {
  paymentId: number;
  paymentMethod: PaymentMethod;
  referenceNote: string;
  screenshot?: File;
}

export function createPaymentsApi(client: AxiosInstance) {
  return {
    initSubscription(data: PaymentInitRequest) {
      return client.post<PaymentInitResponse>('/payments/subscription/init', data);
    },

    /**
     * Initiate a manual (cash/UPI) subscription payment. Creates the PENDING
     * payment row up front and returns {paymentId, amount, reference} so the
     * UPI QR can be built from a real, persisted payment reference BEFORE the
     * user pays.
     */
    initiateManualSubscription(data: ManualPaymentInitiateRequest) {
      return client.post<ManualPaymentInitiateResponse>('/payments/subscription/manual/initiate', data);
    },

    /**
     * Submit a manual (Cash/UPI) payment claim for a subscription.
     * Sends multipart/form-data so the UPI screenshot can be attached.
     */
    submitManualPayment(data: ManualPaymentFormData) {
      const formData = new FormData();
      formData.append('planId', String(data.planId));
      if (data.paymentId != null) {
        formData.append('paymentId', String(data.paymentId));
      }
      formData.append('paymentMethod', data.paymentMethod);
      formData.append('referenceNote', data.referenceNote || '');
      if (data.screenshot) {
        formData.append('screenshot', data.screenshot);
      }
      return client.post<ManualPaymentResponse>('/payments/subscription/manual', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },

    /**
     * Submit a manual (Cash/UPI) payment claim for a contact unlock.
     * Sends multipart/form-data so the UPI screenshot can be attached.
     */
    submitContactUnlockManualPayment(data: ContactUnlockManualPaymentFormData) {
      const formData = new FormData();
      formData.append('paymentId', String(data.paymentId));
      formData.append('paymentMethod', data.paymentMethod);
      formData.append('referenceNote', data.referenceNote || '');
      if (data.screenshot) {
        formData.append('screenshot', data.screenshot);
      }
      return client.post<ManualPaymentResponse>('/payments/contact-unlock/manual', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },

    paymentSuccess(data: PaymentSuccessRequest) {
      return client.post<{ status: number; description: string }>(
        '/payments/success',
        data
      );
    },

    paymentFailed(data: PaymentFailedRequest) {
      return client.post<{ status: number; description: string }>(
        '/payments/failed',
        data
      );
    },

    getPaymentHistory() {
      return client.get<Payment[]>('/payments/history');
    },
  };
}
