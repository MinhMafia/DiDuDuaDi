# SƠ ĐỒ USECASE – HỆ THỐNG DiDuDuaDi

## Hướng dẫn render ảnh

Mỗi sơ đồ có file `.puml` riêng trong cùng thư mục. Cách render:

1. Copy nội dung file `.puml`
2. Dán vào [PlantUML Online Server](https://www.plantuml.com/plantuml/uml/)
3. Nhấn **Submit**
4. Nhấn chuột phải vào ảnh → **Save image as** → lưu PNG về chèn vào Word

---

## Hình 1: Sơ đồ Usecase tổng quát

**Mô tả:** Thể hiện mối quan hệ giữa ba tác nhân (User, Owner, Admin) với các chức năng chính của hệ thống DiDuDuaDi.

**File nguồn:** `usecase_01_tong_quat.puml`

---

## Hình 2: Sơ đồ Usecase chi tiết Admin

**Mô tả:** Sơ đồ usecase chi tiết của Admin, bao gồm 4 usecase chính và các usecase con mở rộng cho từng chức năng quản trị.

**File nguồn:** `usecase_02_admin.puml`

---

## Hình 3: Sơ đồ Usecase chi tiết Owner

**Mô tả:** Sơ đồ usecase chi tiết của Owner, bao gồm 5 usecase chính, các usecase con và hệ thống tự động (dịch nội dung, thông báo).

**File nguồn:** `usecase_03_owner.puml`

---

## Hình 4: Sơ đồ Usecase chi tiết User

**Mô tả:** Sơ đồ usecase chi tiết của User, bao gồm 11 usecase chính, các usecase con và dịch vụ bên ngoài (GPS, OSRM, TTS).

**File nguồn:** `usecase_04_user.puml`

---

## Bảng mô tả các usecase

|  Mã  | Tên usecase                         | Tác nhân           | Mô tả ngắn                                             |
| :--: | :---------------------------------- | :----------------- | :----------------------------------------------------- |
| UC01 | Đăng ký tài khoản                   | User               | Tạo tài khoản mới với username, password, display name |
| UC02 | Đăng nhập                           | User, Owner, Admin | Xác thực bằng username/password, nhận JWT token        |
| UC03 | Xem danh sách POI                   | User               | Hiển thị tất cả POI đang hoạt động                     |
| UC04 | Xem chi tiết POI                    | User               | Xem thông tin đầy đủ: shop, địa chỉ, menu, thuyết minh |
| UC05 | Tìm kiếm POI                        | User               | Tìm theo tên và lọc theo category                      |
| UC06 | Hiển thị POI trên bản đồ            | User               | Hiển thị vị trí POI trên OpenStreetMap + Leaflet       |
| UC07 | Tìm đường đến POI                   | User               | Tính toán lộ trình lái đường qua OSRM                  |
| UC08 | Nghe thuyết minh đa ngôn ngữ        | User               | Chọn ngôn ngữ và nghe thuyết minh (7 ngôn ngữ)         |
| UC09 | Auto-play thuyết minh theo vị trí   | User               | Tự động phát audio khi đến gần POI (~35m)              |
| UC10 | Gửi yêu cầu nâng cấp Owner          | User               | Gửi đơn xin trở thành Owner kèm giấy tờ                |
| UC11 | Chat trợ lý AI                      | User               | Hỏi đáp về POI, gợi ý địa điểm ăn uống                 |
| UC12 | Quản lý hồ sơ cửa hàng              | Owner              | Cập nhật tên shop, địa chỉ, giờ mở, intro, hình ảnh    |
| UC13 | Quản lý nội dung POI                | Owner              | Chỉnh sửa tên/mô tả POI (VI/EN), hệ thống tự dịch      |
| UC14 | Quản lý thực đơn (Menu Items)       | Owner              | Thêm/sửa/xóa món ăn, giá cả, hình ảnh                  |
| UC15 | Tạo mã claim code                   | Owner              | Sinh mã giảm giá định dạng VK + 6 chữ số               |
| UC16 | Xem thống kê dashboard              | Owner              | Xem lượt truy cập, audio plays, mã đã tạo              |
| UC17 | Duyệt yêu cầu nâng cấp Owner        | Admin              | Phê duyệt/từ chối yêu cầu User → Owner                 |
| UC18 | Kiểm duyệt nội dung giới thiệu shop | Admin              | Phê duyệt/từ chối pending introduction                 |
| UC19 | Quản lý POI (CRUD)                  | Admin              | Tạo, cập nhật, xóa POI trên toàn hệ thống              |
| UC20 | Xem analytics hệ thống              | Admin              | Xem thống kê tổng quan lượt truy cập, audio            |

---

## Quan hệ giữa các usecase

### Quan hệ <<include>>

| Usecase cha                    | Usecase con                   | Mô tả                                              |
| :----------------------------- | :---------------------------- | :------------------------------------------------- |
| UC04: Xem chi tiết POI         | UC08: Nghe thuyết minh        | Khi xem chi tiết POI, user có thể nghe thuyết minh |
| UC06: Hiển thị POI trên bản đồ | UC07: Tìm đường               | Từ bản đồ, user có thể chọn tìm đường              |
| UC06: Hiển thị POI trên bản đồ | GPS / Geolocation             | Cần vị trí GPS để hiển thị POI gần user            |
| UC07: Tìm đường đến POI        | OSRM Routing API              | Cần API ngoài để tính lộ trình lái đường           |
| UC08: Nghe thuyết minh         | Web Speech API / Google TTS   | Sử dụng TTS để phát audio thuyết minh              |
| UC09: Auto-play thuyết minh    | GPS / Geolocation             | Cần theo dõi vị trí để kích hoạt auto-play         |
| UC09: Auto-play thuyết minh    | Web Speech API / Google TTS   | Tự động phát audio khi đến gần POI                 |
| UC13a: Chỉnh sửa POI (VI/EN)   | AutoTrans – Dịch tự động      | Hệ thống tự động dịch sang 5 ngôn ngữ còn lại      |
| UC12b: Gửi intro chờ duyệt     | Notify – Gửi thông báo        | Thông báo cho Admin có nội dung cần duyệt          |
| UC01: Đăng ký tài khoản        | UC01a: Nhập thông tin đăng ký | User phải điền đầy đủ thông tin                    |
| UC02: Đăng nhập                | UC02a: Nhập username/password | User phải nhập thông tin xác thực                  |
| UC10: Gửi yêu cầu nâng cấp     | UC10a: Điền form nâng cấp     | User phải điền form thông tin shop                 |
| UC11: Chat trợ lý AI           | UC11a: Nhắn tin với chatbot   | User nhập tin nhắn để tương tác                    |

### Quan hệ <<extend>>

| Usecase cơ sở                  | Usecase mở rộng                | Điều kiện / Mô tả                           |
| :----------------------------- | :----------------------------- | :------------------------------------------ |
| UC05: Tìm kiếm POI             | UC05a: Lọc theo category       | Khi user chọn bộ lọc danh mục               |
| UC05: Tìm kiếm POI             | UC05b: Tìm theo tên            | Khi user nhập từ khóa tìm kiếm              |
| UC06: Hiển thị POI trên bản đồ | UC06a: Điều chỉnh bán kính     | Khi user kéo thanh trượt radius             |
| UC07: Tìm đường đến POI        | UC07a: Xem lộ trình            | Kết quả hiển thị polyline trên bản đồ       |
| UC08: Nghe thuyết minh         | UC08a: Chọn ngôn ngữ           | Khi user muốn đổi ngôn ngữ thuyết minh      |
| UC08: Nghe thuyết minh         | UC08b: Phát/dừng audio         | Khi user điều khiển player                  |
| UC09: Auto-play thuyết minh    | UC09a: Bật/tắt auto-play       | Khi user thay đổi cài đặt trong Settings    |
| UC12: Quản lý hồ sơ cửa hàng   | UC12a: Cập nhật thông tin shop | Owner tự chọn thao tác                      |
| UC12: Quản lý hồ sơ cửa hàng   | UC12b: Gửi intro chờ duyệt     | Khi Owner muốn gửi intro để Admin duyệt     |
| UC13: Quản lý nội dung POI     | UC13a: Chỉnh sửa tên/mô tả     | Owner tự chọn thao tác                      |
| UC14: Quản lý thực đơn         | UC14a: Thêm món ăn mới         | Owner thêm món mới vào menu                 |
| UC14: Quản lý thực đơn         | UC14b: Sửa thông tin món       | Owner cập nhật món đã có                    |
| UC14: Quản lý thực đơn         | UC14c: Xóa món ăn              | Owner xóa món khỏi menu                     |
| UC15: Tạo mã claim code        | UC15a: Sinh mã                 | Owner tạo mã mới                            |
| UC15: Tạo mã claim code        | UC15b: Xem lịch sử mã          | Owner xem các mã đã tạo trước đó            |
| UC16: Xem thống kê dashboard   | UC16a: Xem dashboard tổng quan | Owner xem tổng hợp số liệu                  |
| UC17: Duyệt yêu cầu nâng cấp   | UC17b: Phê duyệt               | Khi yêu cầu hợp lệ, Admin nhấn Approve      |
| UC17: Duyệt yêu cầu nâng cấp   | UC17c: Từ chối                 | Khi yêu cầu không hợp lệ, Admin nhấn Reject |
| UC18: Kiểm duyệt intro         | UC18b: Phê duyệt               | Khi nội dung phù hợp, Admin nhấn Approve    |
| UC18: Kiểm duyệt intro         | UC18c: Từ chối                 | Khi nội dung không đạt, Admin nhấn Reject   |
| UC19: Quản lý POI (CRUD)       | UC19a: Tạo POI mới             | Admin tạo POI mới                           |
| UC19: Quản lý POI (CRUD)       | UC19b: Cập nhật POI            | Admin chỉnh sửa thông tin POI               |
| UC19: Quản lý POI (CRUD)       | UC19c: Xóa POI                 | Admin xóa POI khỏi hệ thống                 |
| UC20: Xem analytics hệ thống   | UC20a: Xem thống kê truy cập   | Admin xem số lượt visit                     |
| UC20: Xem analytics hệ thống   | UC20b: Xem thống kê audio      | Admin xem số lượt audio play                |
