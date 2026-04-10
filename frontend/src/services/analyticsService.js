import apiClient from "./apiClient";

export const getTopShops = (days = 30, limit = 10, metric = 'visits') => 
  apiClient.get('/analytics/top-shops', { params: { days, limit, metric } }).then(r => r.data.data);

export const getTopPois = (days = 30, limit = 10, metric = 'visits') => 
  apiClient.get('/analytics/top-pois', { params: { days, limit, metric } }).then(r => r.data);

// POI for manage
export const getPois = (params) => apiClient.get('/pois', { params }).then(r => r.data);
export const createPoi = (data) => apiClient.post('/pois', data).then(r => r.data);
export const updatePoi = (id, data) => apiClient.put(`/pois/${id}`, data).then(r => r.data);

export const deletePoi = (id) => apiClient.delete(`/pois/${id}`).then(r => r.data);

export const trackPoiView = (poiId, languageCode = 'vi', source = 'map') => 
  apiClient.post('/analytics/poi-view', { poiId, languageCode, source }).then(r => r.data);

export const trackAudioPlay = (poiId, languageCode = 'vi', source = 'tts') => 
  apiClient.post('/analytics/audio-play', { poiId, languageCode, source }).then(r => r.data);



