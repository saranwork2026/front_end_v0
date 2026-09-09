import type { AxiosInstance } from 'axios';
import type { DocumentType, IdVerification } from '../types/admin.types';

/** Member-facing ID verification endpoints. */
export function createVerificationApi(client: AxiosInstance) {
  return {
    /** Submit an ID document for verification. */
    submit(documentType: DocumentType, document: File) {
      const formData = new FormData();
      formData.append('documentType', documentType);
      formData.append('document', document);
      return client.post<IdVerification>('/user/verification', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },

    /** My latest verification request/status (null if never submitted). */
    getMyLatest() {
      return client.get<IdVerification | null>('/user/verification');
    },
  };
}
