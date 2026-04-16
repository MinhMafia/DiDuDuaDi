import apiClient from './apiClient';

/**
 * Lấy danh sách các POI đã được người dùng hiện tại yêu thích.
 * @returns {Promise<import('../models/poi').POI[]>}
 */
const getFavorites = async () => {
  const response = await apiClient.get('/users/me/favorites');
  return response.data.data;
};

/**
 * Thêm một POI vào danh sách yêu thích.
 * @param {string} poiId - ID của POI cần thêm.
 */
const addFavorite = (poiId) => apiClient.post(`/users/me/favorites/${poiId}`);

/**
 * Xóa một POI khỏi danh sách yêu thích.
 * @param {string} poiId - ID của POI cần xóa.
 */
const removeFavorite = (poiId) => apiClient.delete(`/users/me/favorites/${poiId}`);

const userService = { getFavorites, addFavorite, removeFavorite };

export default userService;