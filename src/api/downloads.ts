import apiClient from './client'

export interface DownloadCheck {
  canDownload: boolean
  isFree: boolean
  hasLicense: boolean
  isAuthor: boolean
}

export interface PurchasedResource {
  licenseKey: string
  issuedAt: string
  resourceId: number
  resourceName: string
  resourceSlug: string
  previewUrl: string | null
  typeName: string | null
  authorName: string | null
}

export const downloadsApi = {
  checkAccess: (resourceId: number) =>
    apiClient.get<DownloadCheck>(`/downloads/${resourceId}/check`),

  download: (resourceId: number) =>
    apiClient.get(`/downloads/${resourceId}`, { responseType: 'blob' }),

  getMyPurchases: () =>
    apiClient.get<PurchasedResource[]>('/downloads/my'),
}
