import api from "./axios";

export const getStaffApi = async (shopId) => {
  const response = await api.get("/staff", {
    params: shopId ? { shopId } : undefined,
  });

  return response.data;
};

export const getStaffByShopIdApi = async (shopId) => {
  const response = await api.get(`/staff/shop/${shopId}`);

  return response.data;
};


export const createStaffApi = async (data) => {
  const response = await api.post("/staff", data);
  return response.data;
};

export const updateStaffApi = async (staffId, data) => {
  const response = await api.put(`/staff/${staffId}`, data);
  return response.data;
};

export const updateStaffStatusApi = async (staffId, data) => {
  const response = await api.patch(`/staff/${staffId}/status`, data);
  return response.data;
};