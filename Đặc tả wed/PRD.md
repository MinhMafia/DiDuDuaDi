# Product Requirements Document (PRD) v1.0

## Dự án: GPS Admin Dashboard - POI & Tour Management System

## 1. Thông tin tài liệu

| Trường        | Giá trị                    |
| ------------- | -------------------------- |
| Tên sản phẩm  | GPS Admin Dashboard        |
| Phiên bản     | v1.0 (MVP)                 |
| Ngày cập nhật | 21/03/2026                 |
| Trạng thái    | Draft cho phát triển đồ án |
| Chủ sở hữu    | Product Owner / BA         |
| Đối tượng đọc | Dev, QA, Stakeholders      |

---

## 2. Tổng quan sản phẩm

### 2.1 Bài toán

Hệ thống cần một trang quản trị web để quản lý điểm tham quan (POI) và tuyến tham quan (Tour) phục vụ ứng dụng GPS phía người dùng cuối.

### 2.2 Mục tiêu

- Quản trị POI/Tour nhanh qua giao diện trực quan có bản đồ.
- Đảm bảo dữ liệu tọa độ hợp lệ trước khi lưu.
- Quản lý thứ tự POI trong tour theo trình tự hành trình.
- Đảm bảo toàn vẹn dữ liệu khi xóa POI (xóa dây chuyền khỏi tour).

### 2.3 Giá trị mang lại

- Rút ngắn thời gian nhập liệu và chỉnh sửa nội dung điểm đến.
- Giảm lỗi tọa độ gây sai trải nghiệm GPS.
- Dễ mở rộng sang tích hợp mobile app và bản đồ thật ở giai đoạn sau.

---

## 3. Phạm vi MVP

### 3.1 Trong phạm vi (In-Scope)

#### Module A - Đăng nhập Admin

- Đăng nhập username/password.
- Duy trì phiên đăng nhập đến khi logout.
- Đăng xuất khỏi hệ thống.

#### Module B - Quản lý POI

- Tạo POI bằng click bản đồ hoặc nhập tay lat/lng.
- Sửa POI: tên, mô tả, tọa độ, radius, loại điểm, ảnh (URL).
- Xóa POI và tự động gỡ POI khỏi tất cả tour liên quan.
- Phân loại POI:
  - Điểm chính (MAIN)
  - Điểm phụ: WC, Bán vé, Gửi xe, Bến thuyền
- Hiển thị POI ở map và list/gallery.

#### Module C - Quản lý Tour

- Tạo, sửa, xóa Tour.
- Thêm/bớt POI vào Tour.
- Sắp xếp lại thứ tự POI trong Tour (drag-and-drop UI).
- Xem danh sách Tour dạng card grid.
- Hiển thị số POI và thời lượng của Tour.

### 3.2 Ngoài phạm vi (Out-of-Scope)

- Đa ngôn ngữ nội dung.
- Audio guide.
- Quản lý nhiều vai trò người dùng.
- Vẽ lộ trình nâng cao (routing, distance calculation).
- Upload ảnh thật (MVP dùng URL).
- Analytics/report, import/export, audit log.
- Mobile app admin.

---

## 4. Người dùng mục tiêu

### 4.1 Persona chính - Content Administrator

- Vai trò: Quản lý nội dung điểm đến.
- Trình độ kỹ thuật: Trung bình (quen dashboard, map).
- Mục tiêu:
  - Thêm POI mới nhanh.
  - Cập nhật thông tin khi thay đổi.
  - Tạo tour theo chủ đề.
- Pain points:
  - Nhập liệu thủ công tốn thời gian.
  - Khó hình dung tuyến tour.
  - Sai tọa độ gây lỗi trải nghiệm.

---

## 5. User Stories ưu tiên

### 5.1 P0 (Must)

- US001: Admin đăng nhập hệ thống.
- US002: Admin đăng xuất hệ thống.
- US003: Tạo POI bằng click map.
- US005: Sửa thông tin POI.
- US006: Chọn loại POI.
- US007: Xóa POI (cascade khỏi Tour).
- US008: Xem toàn bộ POI trên map.
- US010: Tạo Tour.
- US011: Thêm POI vào Tour.
- US012: Đổi thứ tự POI trong Tour.
- US013: Xóa POI khỏi Tour.
- US014: Sửa metadata Tour.
- US016: Xem danh sách Tour dạng grid.

### 5.2 P1 (Should)

- US004: Nhập thủ công lat/lng.
- US009: Xem POI dạng gallery.
- US015: Xóa Tour.
- US017: Lọc POI khi build Tour.
- US018: Tìm kiếm POI theo tên khi build Tour.

---

## 6. Yêu cầu chức năng chi tiết

### 6.1 Authentication

#### FR-AUTH-001: Màn hình đăng nhập

- Input username/password.
- Nút Sign In.
- Hiển thị lỗi khi sai thông tin.

#### FR-AUTH-002: Session

- Giữ trạng thái đăng nhập đến khi logout.
- MVP chưa cần timeout phức tạp.

#### FR-AUTH-003: Logout

- Nút logout luôn nhìn thấy ở sidebar.
- Logout xong quay về màn hình login.

### 6.2 POI Management

#### FR-POI-001: Bản đồ POI

- Hiển thị marker theo loại:
  - Xanh lá: POI đang chọn
  - Xanh dương: MAIN
  - Cam: loại phụ
- Cho phép click map để set tọa độ tạo mới.

#### FR-POI-002: Form POI

- Trường dữ liệu:
  - Latitude, Longitude, Radius
  - Tên điểm, Mô tả
  - Loại điểm
  - Ảnh (URL)
- Nút Đặt lại, Tạo điểm/Cập nhật điểm.

#### FR-POI-003: Danh sách/Gallery POI

- Hiển thị thumbnail, tên, tọa độ, loại, radius.
- Chọn card để vào edit mode.
- Xóa card có confirm.

#### FR-POI-004: Edit mode

- Chọn marker/card sẽ nạp dữ liệu vào form.
- Nút hành động chuyển sang Cập nhật điểm.

#### FR-POI-005: Xóa POI có cascade

- Xóa POI khỏi kho POI.
- Đồng thời gỡ POI khỏi mọi tour.

### 6.3 Tour Management

#### FR-TOUR-001: Danh sách Tour

- Hiển thị card grid responsive.
- Card có tên, mô tả ngắn, duration, số POI.

#### FR-TOUR-002: Màn hình chỉnh sửa Tour

- Panel trái: chọn POI, filter, search.
- Panel phải: thông tin Tour + route sequence.

#### FR-TOUR-003: Metadata Tour

- Tên tour (required), mô tả, duration, ảnh URL.

#### FR-TOUR-004: Thêm/bớt POI trong Tour

- Toggle POI từ danh sách trái.
- Hiển thị trạng thái selected rõ ràng.

#### FR-TOUR-005: Sắp xếp route

- Reorder POI theo thứ tự hành trình.
- Cập nhật số thứ tự sau khi kéo thả.

#### FR-TOUR-006: Lưu Tour

- Validate bắt buộc trước khi lưu.
- Tạo mới hoặc cập nhật tùy trạng thái edit.

#### FR-TOUR-007: Xóa Tour

- Xóa tour độc lập, không xóa POI gốc.

---

## 7. Luật nghiệp vụ (Business Rules)

- BR-001: POI phải có lat/lng hợp lệ trước khi lưu.
- BR-002: Tour phải có ít nhất 1 POI (khuyến nghị >= 2).
- BR-003: Xóa POI phải cascade remove khỏi `poiIds` của mọi Tour.
- BR-004: MVP chỉ có 1 vai trò Admin (full quyền CRUD).
- BR-005: Giai đoạn MVP có thể dùng dữ liệu mock/in-memory cho phát triển nhanh.

---

## 8. Mô hình dữ liệu

### 8.1 POI

```ts
interface POI {
  id: string;
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  radius: number;
  type: "MAIN" | "WC" | "TICKET" | "PARKING" | "BOAT";
  image: string;
  distance?: string;
}
```

### 8.2 Tour

```ts
interface Tour {
  id: string;
  name: string;
  description?: string;
  duration: number;
  poiIds: string[];
  image?: string;
  createdAt: string;
}
```

### 8.3 Auth State

```ts
interface AuthState {
  isAuthenticated: boolean;
  username: string | null;
}
```

---

## 9. API Contract (MVP-Ready)

### 9.1 Đã có trong backend hiện tại

- `GET /api/health`: kiểm tra backend sống.
- `GET /api/pois`: lấy danh sách POI.
- `GET /api/pois/nearby?lat=&lng=&radius=`: lấy POI gần vị trí.

### 9.2 API cần hoàn thiện thêm theo PRD

#### Auth

- `POST /api/auth/login`
- `POST /api/auth/logout`

#### POI CRUD đầy đủ

- `GET /api/pois/:id`
- `POST /api/pois`
- `PUT /api/pois/:id`
- `DELETE /api/pois/:id`

#### Tour CRUD

- `GET /api/tours`
- `GET /api/tours/:id`
- `POST /api/tours`
- `PUT /api/tours/:id`
- `DELETE /api/tours/:id`

---

## 10. Yêu cầu phi chức năng (NFR)

### 10.1 Performance

- CRUD thao tác chính <= 2 giây.
- Render map với 100 POI <= 1 giây.
- Trang danh sách 50 Tour <= 2 giây.

### 10.2 Usability

- Thông báo lỗi rõ ràng tiếng Việt.
- Hành động xóa phải có confirm.
- Hỗ trợ thao tác bàn phím ở form.

### 10.3 Reliability

- Luôn đảm bảo cascade khi xóa POI.
- Không cho lưu tour rỗng (0 POI).

### 10.4 Accessibility

- Element tương tác truy cập bằng bàn phím.
- Marker màu phải có legend văn bản.

### 10.5 Browser support

- Chrome, Edge, Firefox, Safari bản mới.
- Màn hình mục tiêu: >= 1280x720.

---

## 11. UI/UX định hướng cho đồ án

- Bố cục desktop 2 cột: Sidebar + Main content.
- Design system gợi ý:
  - Primary: Emerald
  - Secondary: Blue
  - Error: Red
  - Neutral: Slate
- Thành phần chính:
  - Sidebar navigation
  - Tour cards
  - POI form nhiều section collapse
  - Route list có drag handle
  - Dialog xác nhận xóa

---

## 12. Rủi ro & hướng xử lý

- R-01: Xóa nhầm POI đang dùng nhiều tour.
  - Mitigation: cảnh báo số tour bị ảnh hưởng trước khi confirm.
- R-02: Tọa độ nhập sai.
  - Mitigation: validate bounds + thông báo lỗi cụ thể.
- R-03: Mất dữ liệu khi refresh (nếu dùng in-memory/mock).
  - Mitigation: thông báo rõ giới hạn MVP; ưu tiên tích hợp persistence sớm.

---

## 13. Kế hoạch triển khai gợi ý

### Sprint 1 (Auth + POI nền tảng)

- Login/logout.
- POI create/edit/delete + map/list.
- Validate lat/lng, radius, type.

### Sprint 2 (Tour builder)

- Tour CRUD.
- Add/remove POI.
- Reorder sequence.
- Filter/search POI.

### Sprint 3 (Hardening)

- Nâng UX, empty/error/loading states.
- Kiểm thử AC quan trọng (P0).
- Chốt demo flow end-to-end.

---

## 14. Tiêu chí nghiệm thu MVP

MVP được xem là đạt khi:

- Hoàn thành toàn bộ nhóm user story P0.
- API và UI CRUD POI/Tour hoạt động ổn định.
- BR-001, BR-002, BR-003 được đảm bảo.
- Demo được 1 kịch bản đầy đủ: đăng nhập -> tạo POI -> tạo Tour -> reorder -> xóa POI và cascade.

---

## 15. Ghi chú đồng bộ với code hiện tại

- Frontend: React + Vite (JavaScript), có dashboard test kết nối backend.
- Backend: .NET 10, đang có `health` và `POI read APIs` để kiểm thử tích hợp.
- Bước tiếp theo để khớp đầy đủ PRD: bổ sung Auth API + Tour API + POI write APIs.
