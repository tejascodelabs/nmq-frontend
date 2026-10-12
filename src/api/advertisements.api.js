import api from './axios';

const getPayload = (response) => response.data?.data ?? response.data;

const toAdvertisement = (advertisement = {}) => ({
  ...advertisement,
  event_title: advertisement.event_title ?? advertisement.eventTitle ?? '',
  image_url: advertisement.image_url ?? advertisement.imageUrl ?? '',
  redirect_url: advertisement.redirect_url ?? advertisement.redirectUrl ?? '',
  cta_text: advertisement.cta_text ?? advertisement.ctaText ?? '',
  shop_id: advertisement.shop_id ?? advertisement.shopId ?? null,
  display_order: advertisement.display_order ?? advertisement.displayOrder ?? 1,
  start_date: advertisement.start_date ?? advertisement.startDate ?? '',
  end_date: advertisement.end_date ?? advertisement.endDate ?? '',
  is_active: advertisement.is_active ?? advertisement.isActive ?? true
});

const toApiPayload = (advertisement) => {
  const payload = new FormData();
  payload.append('eventTitle', advertisement.event_title.trim());
  payload.append('redirectUrl', advertisement.redirect_url || '');
  payload.append('ctaText', advertisement.cta_text || '');
  payload.append('shopId', advertisement.shop_id || '');
  payload.append('placement', advertisement.placement);
  payload.append('displayOrder', String(Number(advertisement.display_order) || 1));
  payload.append('startDate', advertisement.start_date || '');
  payload.append('endDate', advertisement.end_date || '');
  payload.append('isActive', String(Boolean(advertisement.is_active)));

  if (advertisement.image_file) {
    payload.append('image', advertisement.image_file);
  } else if (advertisement.image_url) {
    payload.append('imageUrl', advertisement.image_url);
  }

  return payload;
};

export const getAdvertisementsApi = async (params) => {
  const response = await api.get('/advertisements', { params });
  const payload = getPayload(response);
  const advertisements = Array.isArray(payload) ? payload : payload?.advertisements ?? [];

  return {
    advertisements: advertisements.map(toAdvertisement),
    pagination: response.data?.pagination ?? payload?.pagination ?? null
  };
};

export const getAdvertisementStatisticsApi = async () => {
  const response = await api.get('/advertisements/statistics');
  const payload = getPayload(response);

  return {
    total: Number(payload?.total ?? 0),
    live: Number(payload?.live ?? 0),
    impressions: Number(payload?.impressions ?? 0),
    clicks: Number(payload?.clicks ?? 0),
    ctr: Number(payload?.ctr ?? 0)
  };
};

export const createAdvertisementApi = async (advertisement) => {
  const response = await api.post('/advertisements', toApiPayload(advertisement), {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return toAdvertisement(getPayload(response));
};

export const updateAdvertisementApi = async (id, advertisement) => {
  const response = await api.put(`/advertisements/${id}`, toApiPayload(advertisement), {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return toAdvertisement(getPayload(response));
};

export const updateAdvertisementStatusApi = async (id, isActive) => {
  const response = await api.patch(`/advertisements/${id}/status`, { isActive });
  return toAdvertisement(getPayload(response));
};

export const deleteAdvertisementApi = async (id) => {
  await api.delete(`/advertisements/${id}`);
};


export const recordAdvertisementImpressionApi = async (adId) => {
  const response = await api.post(`/advertisements/${adId}/impression`);
  return response.data;
};

export const recordAdvertisementClickApi = async (adId) => {
  const response = await api.post(`/advertisements/${adId}/click`);
  return response.data;
};