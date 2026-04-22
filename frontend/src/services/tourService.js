import apiClient from "./apiClient";

export async function getTours() {
  const response = await apiClient.get("/tours");
  return response.data;
}

export async function getTourById(id) {
  const response = await apiClient.get(`/tours/${id}`);
  return response.data;
}
