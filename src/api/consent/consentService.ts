import AsyncStorage from '@react-native-async-storage/async-storage';
import apiClient, {isAxiosErr} from '../axios/axios';
import {ConsentPolicyPurpose, ConsentPurpose} from '../../types/enums';

export const giveConsent = async (dto: UpsertConsentDTO) => {
  try {
    const response = await apiClient.post(`/consents`, dto);
    console.log('Give consent', response);

    if (response.status >= 200 && response.status < 300) {
      return response.data;
    } else {
      console.error('Unexpected status code:', response.status);
      return [];
    }
  } catch (error) {
    console.error('Error fetching consent:', error);
    return [];
  }
};

export const approveConsent = async (consentId: number) => {
  try {
    const response = await apiClient.put(`/consents/${consentId}/approve`);
    console.log('Approve consent', response);

    if (response.status >= 200 && response.status < 300) {
      return response.data as ConsentDTO;
    } else {
      console.error('Unexpected status code:', response.status);
      return null;
    }
  } catch (error) {
    console.error('Error fetching consent:', error);
    return null;
  }
};

export const withdrawConsent = async (consentId: number) => {
  try {
    const response = await apiClient.patch(`/consents/${consentId}/withdraw`);
    console.log('Withdrawn consent', response);

    if (response.status >= 200 && response.status < 300) {
      return response.data as ConsentDTO;
    } else {
      console.error('Unexpected status code:', response.status);
      return null;
    }
  } catch (error) {
    console.error('Error fetching consent:', error);
    return null;
  }
};

export const getLatestConsent = async (purpose: ConsentPurpose) => {
  try {
    const response = await apiClient.get(`/consents/mine/latest`, {
      params: {purpose: ConsentPurpose[purpose]},
    });
    console.log('Get latest consent', response);

    if (response.status >= 200 && response.status < 300) {
      return response.data;
    } else {
      console.error('Unexpected status code:', response.status);
      return [];
    }
  } catch (error) {
    console.error('Error fetching consent:', error);
    return [];
  }
};

export const getLatestPolicy = async (
  purpose: ConsentPolicyPurpose,
  locale = 'tr-TR',
  includeContent = true,
) => {
  console.log('burada');
  try {
    console.log('yok');
    const response = await apiClient.get(`/consent-policies/latest`, {
      params: {purpose: ConsentPolicyPurpose[purpose], locale, includeContent},
    });
    console.log('Get latest policy res', response);

    if (response.status >= 200 && response.status < 300) {
      return response.data;
    } else {
      console.error('Unexpected status code:', response.status);
      return [];
    }
  } catch (error) {
    console.error('Error fetching consent:', error);
    return [];
  }
};

export async function getPolicyByVersion(
  version: string,
  purpose: ConsentPolicyPurpose,
  locale = 'tr-TR',
  includeContent = true,
): Promise<ConsentPolicyDTO> {
  const res = await apiClient.get<ConsentPolicyDTO>(
    `/consent-policies/${encodeURIComponent(version)}`,
    {
      params: {purpose, locale, includeContent},
    },
  );
  return res.data;
}
