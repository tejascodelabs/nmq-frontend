import api from "./axios";

export const loginApi = async (data) => {
  const response = await api.post("/auth/login", data);

  return response.data;
};

export const refreshTokenApi = async (refreshToken) => {
  const response = await api.post("/auth/refresh", {
    refreshToken,
  });

  return response.data;
};

export const logoutApi = async (refreshToken) => {
  const response = await api.post("/auth/logout", {
    refreshToken,
  });

  return response.data;
};