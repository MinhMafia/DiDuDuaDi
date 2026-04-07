import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getPois, createPoi, updatePoi, deletePoi } from "../../services/poiService";
import MapView from "../map/MapView";
import { VINH_KHANH_CENTER } from "../../utils/constants";
import "./PoiManagement.css";

const initialForm = {
  name: "",
  description: "",
  category: "food",
  lat: "",
  lng: "",
  radius: 35,
  imageUrl: "",
};

export default function PoiManagement() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState(initialForm);
  const [editingId, setEditingId] = useState(null);
  const [mapCenter, setMapCenter] = useState(VINH_KHANH_CENTER);

  // Lấy dữ liệu
  const { data: fetchResult, isLoading } = useQuery({
    queryKey: ["pois"],
    queryFn: getPois,
  });
  const pois = fetchResult?.data || [];

  const createMutation = useMutation({
    mutationFn: createPoi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pois"] });
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }) => updatePoi(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pois"] });
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deletePoi,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pois"] });
      resetForm();
    },
  });

  const handleMapClick = (latlng) => {
    setForm((prev) => ({
      ...prev,
      lat: latlng.lat,
      lng: latlng.lng,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.lat || !form.lng) {
      alert("Vui lòng click trên bản đồ để chọn tọa độ cho POI.");
      return;
    }

    const payload = {
      name: { vi: form.name },
      description: { vi: form.description },
      category: form.category,
      location: { lat: Number(form.lat), lng: Number(form.lng) },
      radius: Number(form.radius),
      imageUrl: form.imageUrl || null,
    };

    if (editingId) {
      updateMutation.mutate({ id: editingId, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const handleEdit = (poi) => {
    setEditingId(poi.id);
    setForm({
      name: poi.name?.vi || poi.name?.en || "",
      description: poi.description?.vi || poi.description?.en || "",
      category: poi.category,
      lat: poi.location.lat,
      lng: poi.location.lng,
      radius: poi.radius || 35,
      imageUrl: poi.imageUrl || "",
    });
    setMapCenter(poi.location);
  };

  const handleDelete = (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa điểm này? Hành động này sẽ gỡ POI khỏi các Tours hiện tại.")) {
      deleteMutation.mutate(id);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setForm(initialForm);
  };

  // Convert danh sách POI sang định dạng MapView cần (nếu Poi struct khác)
  const mapPois = pois.map(p => ({
    ...p,
    displayName: p.name?.vi || p.name?.en || "Unnamed",
    displayDescription: p.description?.vi || p.description?.en || "",
  }));

  // Tạo marker giả để preview lúc đang click chọn trên bản đồ
  const previewLocation = form.lat && form.lng ? { lat: Number(form.lat), lng: Number(form.lng) } : null;

  return (
    <div className="poi-management">
      <h2>Quản lý Điểm tham quan (POI)</h2>
      <div className="poi-management-grid">
        {/* Bản đồ */}
        <div className="poi-map-container">
          <MapView
            center={mapCenter}
            pois={mapPois}
            onMapClick={handleMapClick}
            userLocation={previewLocation}
            userLocationLabel="Vị trí đang chọn"
            onSelectPoi={handleEdit}
            selectedPoiId={editingId}
          />
          <p className="poi-map-hint">💡 <i>Click chọn điểm trên bản đồ để cập nhật tọa độ nhanh. Click vào điểm đã có để sửa.</i></p>
        </div>

        {/* Form */}
        <div className="poi-form-container">
          <h3>{editingId ? "Cập nhật POI" : "Thêm mới POI"}</h3>
          <form onSubmit={handleSubmit} className="poi-form">
            <div className="form-group grid-2">
              <label>
                Lat (Read-only):
                <input type="text" value={form.lat} readOnly placeholder="0.0" />
              </label>
              <label>
                Lng (Read-only):
                <input type="text" value={form.lng} readOnly placeholder="0.0" />
              </label>
            </div>
            
            <label>Tên địa điểm:</label>
            <input 
              type="text" 
              required 
              value={form.name} 
              onChange={e => setForm({...form, name: e.target.value})} 
              placeholder="Vd: Chè bưởi Vĩnh Khánh" 
            />

            <label>Phân loại:</label>
            <select value={form.category} onChange={e => setForm({...form, category: e.target.value})}>
              <option value="food">Ẩm thực</option>
              <option value="seafood">Hải sản</option>
              <option value="dessert">Tráng miệng</option>
              <option value="street_food">Ăn vặt</option>
              <option value="toilet">Nhà vệ sinh</option>
              <option value="parking">Bãi đỗ xe</option>
            </select>

            <div className="form-group grid-2">
              <label>
                Bán kính nhận diện (m):
                <input type="number" min="5" max="5000" value={form.radius} onChange={e => setForm({...form, radius: e.target.value})} />
              </label>
            </div>

            <label>Hình ảnh (URL):</label>
            <input 
              type="text" 
              value={form.imageUrl} 
              onChange={e => setForm({...form, imageUrl: e.target.value})} 
              placeholder="https://..." 
            />

            <label>Mô tả:</label>
            <textarea 
              rows="3" 
              value={form.description} 
              onChange={e => setForm({...form, description: e.target.value})} 
              placeholder="Mô tả tóm tắt về điểm đến..."
            ></textarea>

            <div className="form-actions">
              {editingId && <button type="button" onClick={resetForm} className="btn-secondary">Hủy</button>}
              <button type="submit" className="btn-primary" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingId ? "Lưu thay đổi" : "Tạo POI"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <div className="poi-list-section">
        <h3>Danh sách POI hiện có</h3>
        {isLoading && <p>Đang tải...</p>}
        {!isLoading && pois.length === 0 && <p>Chưa có địa điểm nào.</p>}
        {!isLoading && pois.length > 0 && (
          <table className="poi-table">
            <thead>
              <tr>
                <th>Tên điểm</th>
                <th>Phân loại</th>
                <th>Tọa độ</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {pois.map(poi => (
                <tr key={poi.id}>
                  <td><strong>{poi.name?.vi || poi.name?.en}</strong></td>
                  <td>{poi.category}</td>
                  <td>{poi.location.lat.toFixed(4)}, {poi.location.lng.toFixed(4)}</td>
                  <td>
                    <button onClick={() => handleEdit(poi)} className="btn-text">Sửa</button>
                    <button onClick={() => handleDelete(poi.id)} className="btn-text text-danger">Xóa</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
