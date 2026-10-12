import api from "./axios";

const getPayload = (response) => response.data?.data ?? response.data;

export const getMenusApi = async (shopId) => {
  const response = await api.get("/menus", {
    params: shopId ? { shopId } : undefined,
  });

  const payload = getPayload(response);
  return Array.isArray(payload) ? payload : payload?.menus ?? [];
};

export const createMenuApi = async (data) => {
  const response = await api.post("/menus", data);
  return getPayload(response);
};

export const updateMenuApi = async (id, data) => {
  const response = await api.put(`/menus/${id}`, data);
  return getPayload(response);
};

export const updateMenuStatusApi = async (id, status) => {
  const response = await api.patch(`/menus/${id}/status`, { status });
  return getPayload(response);
};

export const deleteMenuApi = async (id) => {
  await api.delete(`/menus/${id}`);
};
