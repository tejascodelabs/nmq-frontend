import api from "./axios";


export const createTokenApi = async (data) => {
    const response = await api.post(`/tokens`, data);

    return response.data;
};

export const getTokenByIdApi = async (tokenId) => {
  const response = await api.get(`/tokens/${tokenId}`);
  console.log("getTokenByIdApi", response)

  return response.data;
};

// export const cancelTokenApi = async (tokenId, mobile) => {
//   const response = await api.patch(`/tokens/${tokenId}/cancel`,
//     {
//       mobile: String(mobile),
//     }
//   );

//   return response.data;
// };

export const cancelTokenApi = async (tokenId) => {
  const response = await api.patch(`/tokens/${tokenId}/cancel`, {
    id: String(tokenId),
  });

  return response.data;
};