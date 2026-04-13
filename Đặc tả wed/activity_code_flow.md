# MÔ TẢ LUỒNG CHẠY CODE - ACTIVITY 05 ĐẾN 10

---

## Activity 05: User đăng ký tài khoản

### Code location

| Lớp | File |
|---|---|
| **Frontend - Page** | `frontend/src/pages/RegisterPage.jsx` |
| **Frontend - Service** | `frontend/src/services/authService.js` → `register(data)` |
| **Backend - Controller** | `backend/DiDuDuaDi.API/Controllers/AuthController.cs` → `POST /api/auth/register` |
| **Backend - Repository** | `backend/DiDuDuaDi.API/Repositories/MySqlAuthRepository.cs` → `Register(RegisterRequest)` |
| **Model** | `backend/DiDuDuaDi.API/Models/RegisterRequest.cs` |

### Luồng chạy

1. **User** mở trang `/register` → React Router render `RegisterPage.jsx`
2. **User** nhập username, password (xác nhận), display_name, email → nhấn Submit
3. **Frontend** validate: password ≥ 6 ký tự, 2 password khớp nhau
4. **Frontend** gọi `authService.register({ username, password, displayName, email })`
5. **authService** gửi `POST /api/auth/register` với body JSON
6. **AuthController.Register()** nhận request → gọi `_authRepository.Register(request)`
7. **MySqlAuthRepository.Register()**:
   - Kiểm tra username đã tồn tại (`SELECT COUNT(*) FROM accounts WHERE username = ?`)
   - Nếu tồn tại → throw exception
   - Nếu không → `INSERT INTO accounts (id, username, password_hash, display_name, email, role_id=3) VALUES (...)`
8. **Kết quả** trả về → Frontend chuyển hướng sang `/login` với thông báo thành công

---

## Activity 06: User đăng nhập

### Code location

| Lớp | File |
|---|---|
| **Frontend - Page** | `frontend/src/pages/LoginPage.jsx` |
| **Frontend - Service** | `frontend/src/services/authService.js` → `login(username, password)` |
| **Frontend - Store** | `frontend/src/store/slices/appSlice.js` → `loginSuccess(session)` |
| **Backend - Controller** | `backend/DiDuDuaDi.API/Controllers/AuthController.cs` → `POST /api/auth/login` |
| **Backend - Repository** | `backend/DiDuDuaDi.API/Repositories/MySqlAuthRepository.cs` → `ValidateCredentials(username, password)` |
| **Backend - Service** | `backend/DiDuDuaDi.API/Services/JwtTokenService.cs` → `GenerateToken(user)` |
| **Model** | `backend/DiDuDuaDi.API/Models/LoginRequest.cs`, `AuthSession.cs`, `AuthUser.cs` |

### Luồng chạy

1. **User** mở trang `/login` → `LoginPage.jsx` render
2. **User** nhập username, password → nhấn Login (hoặc nhấn nút demo account)
3. **Frontend** gọi `authService.login(username, password)`
4. **authService** gửi `POST /api/auth/login` với body `{ username, password }`
5. **AuthController.Login()** nhận request → gọi `_authRepository.ValidateCredentials(username, password)`
6. **MySqlAuthRepository.ValidateCredentials()**:
   - `SELECT * FROM accounts WHERE username = ?`
   - So sánh password (hiện tại plaintext)
   - Nếu đúng → `UPDATE accounts SET last_login_at = NOW() WHERE id = ?`
   - Trả về `AuthUser(username, role, displayName)`
7. **AuthController** gọi `_tokenService.GenerateToken(user)`:
   - Tạo JWT với claims: `sub`, `unique_name`, `name`, `role`, `display_name`
   - Ký bằng HMAC-SHA256 với SecretKey từ appsettings
   - Trả về JWT string
8. **AuthController** trả về `200 OK` với `AuthSession { username, role, displayName, accessToken, expiresAt }`
9. **Frontend** nhận response → dispatch `loginSuccess(session)` → lưu vào localStorage `didududadi.session`
10. **Frontend** redirect theo role: user → `/map`, owner → `/owner`, admin → `/admin`

---

## Activity 07: User khám phá POI trên bản đồ

### Code location

| Lớp | File |
|---|---|
| **Frontend - Page** | `frontend/src/pages/MapPage.jsx` |
| **Frontend - Component** | `frontend/src/components/map/MapView.jsx` |
| **Frontend - Hook** | `frontend/src/hooks/useGeolocation.js` |
| **Frontend - Service** | `frontend/src/services/poiService.js` → `getAll()`, `getNearby(lat, lng, radius)` |
| **Backend - Controller** | `backend/DiDuDuaDi.API/Controllers/POIsController.cs` → `GET /api/pois`, `GET /api/pois/nearby` |
| **Backend - Repository** | `backend/DiDuDuaDi.API/Repositories/MySqlPoiRepository.cs` → `GetAll()`, `GetNearby(lat, lng, radius)` |
| **Model** | `backend/DiDuDuaDi.API/Models/POI.cs`, `GeoPoint.cs` |

### Luồng chạy

1. **User** mở trang `/map` → `MapPage.jsx` render
2. **useGeolocation hook** gọi `navigator.geolocation.watchPosition()` → lấy vị trí GPS
3. **Frontend** gọi `poiService.getNearby(lat, lng, radius=500)`
4. **POIsController.GetNearby()** nhận query params `lat`, `lng`, `radius`
5. **MySqlPoiRepository.GetNearby()**:
   - Hiện tại: `GetAll()` lấy hết POI → lọc bằng Haversine trong C#
   - TODO: Tối ưu bằng SQL bounding box
   - Trả về `List<POI>` với thông tin shop, menu items, translations
6. **Frontend** nhận danh sách POI → `MapView.jsx` vẽ markers lên Leaflet
7. **User** kéo thanh trượt radius → `MapPage.jsx` gọi lại `getNearby()` với radius mới → cập nhật markers
8. **User** click vào marker → `MapPage.jsx` gọi `poiService.getById(id)` → hiển thị `PoiDetailSheet`

---

## Activity 08: User xem chi tiết POI

### Code location

| Lớp | File |
|---|---|
| **Frontend - Page** | `frontend/src/pages/MapPage.jsx` |
| **Frontend - Component** | `frontend/src/components/map/PoiDetailSheet.jsx` |
| **Frontend - Component** | `frontend/src/components/audio/SpeechGuidePlayer.jsx` |
| **Frontend - Service** | `frontend/src/services/poiService.js` → `getById(id)` |
| **Frontend - Utils** | `frontend/src/utils/helpers.js` → `getLocalizedValue()` |
| **Backend - Controller** | `backend/DiDuDuaDi.API/Controllers/POIsController.cs` → `GET /api/pois/{id}` |
| **Backend - Repository** | `backend/DiDuDuaDi.API/Repositories/MySqlPoiRepository.cs` → `GetById(id)` |
| **Backend - Controller** | `backend/DiDuDuaDi.API/Controllers/AnalyticsController.cs` → `POST /api/analytics/poi-view` |

### Luồng chạy

1. **User** click POI marker trên bản đồ → `MapPage.jsx` gọi `poiService.getById(id)`
2. **POIsController.GetById()** → `MySqlPoiRepository.GetById(id)`:
   - `SELECT * FROM pois JOIN poi_translations ON pois.id = poi_translations.poi_id WHERE pois.id = ?`
   - Trả về POI với đầy đủ translations (vi, en, zh, ja, ko, fr, th), shop info, menu items
3. **Frontend** nhận POI → render `PoiDetailSheet`:
   - Hình ảnh hero, tên shop, địa chỉ, giờ mở cửa, số điện thoại
   - Phần giới thiệu đã duyệt (approved_intro)
   - Danh sách menu items với giá
4. **User** chọn ngôn ngữ thuyết minh (VI/EN/ZH/JA/KO/FR/TH) → `getLocalizedValue(poi.name, language)` lấy tên theo ngôn ngữ
5. **User** nhấn nút phát audio → `SpeechGuidePlayer.jsx`:
   - Thử Web Speech API (`speechSynthesis.speak()`)
   - Nếu không có voice phù hợp → gọi `translateService.cloudTTS(text, lang)` → `GET /api/tts/google?text=...&lang=...`
   - Phát audio qua Howler.js
6. **Frontend** đồng thời gọi `analyticsService.trackPoiView(poiId, languageCode, source)` → `POST /api/analytics/poi-view`
7. **AnalyticsController** → `MySqlAnalyticsRepository.TrackPoiView()` → `INSERT INTO shop_visit_events`

---

## Activity 09: User tìm đường đến POI

### Code location

| Lớp | File |
|---|---|
| **Frontend - Page** | `frontend/src/pages/MapPage.jsx` |
| **Frontend - Service** | `frontend/src/services/routeService.js` → `getRoute(startLng, startLat, endLng, endLat)` |
| **Frontend - Hook** | `frontend/src/hooks/useGeolocation.js` |
| **External API** | OSRM Routing API: `https://router.project-osrm.org/route/v1/driving/` |

### Luồng chạy

1. **User** nhấn nút "Tìm đường" trong `PoiDetailSheet`
2. **MapPage.jsx** gọi `useGeolocation` lấy vị trí hiện tại `{ lat, lng }`
3. **Frontend** gọi `routeService.getRoute(userLng, userLat, poiLng, poiLat)`
4. **routeService** gửi GET request đến OSRM API:
   ```
   GET https://router.project-osrm.org/route/v1/driving/{userLng},{userLat};{poiLng},{poiLat}?overview=full&geometries=geojson
   ```
5. **OSRM API** trả về GeoJSON với:
   - `routes[0].geometry` → polyline tọa độ lộ trình
   - `routes[0].distance` → khoảng cách (mét)
   - `routes[0].duration` → thời gian dự kiến (giây)
6. **Frontend** decode polyline → vẽ `Polyline` lên Leaflet
7. **Frontend** hiển thị khoảng cách và thời gian dự kiến
8. **User** xem lộ trình trên bản đồ và di chuyển

---

## Activity 10: Auto-play thuyết minh theo vị trí

### Code location

| Lớp | File |
|---|---|
| **Frontend - Page** | `frontend/src/pages/MapPage.jsx` |
| **Frontend - Component** | `frontend/src/components/audio/SpeechGuidePlayer.jsx` |
| **Frontend - Hook** | `frontend/src/hooks/useGeolocation.js` |
| **Frontend - Service** | `frontend/src/services/translateService.js` → `cloudTTS(text, lang)` |
| **Frontend - Store** | `frontend/src/store/slices/appSlice.js` → `autoPlayAudio` state |
| **Backend - Controller** | `backend/DiDuDuaDi.API/Controllers/TtsController.cs` → `GET /api/tts/google` |
| **Backend - Controller** | `backend/DiDuDuaDi.API/Controllers/AnalyticsController.cs` → `POST /api/analytics/audio-play` |
| **Backend - Repository** | `backend/DiDuDuaDi.API/Repositories/MySqlAnalyticsRepository.cs` → `TrackAudioPlay()` |

### Luồng chạy

1. **User** mở Settings → bật toggle "Auto-play audio" → `appSlice.setAutoPlayAudio(true)` → lưu localStorage
2. **MapPage.jsx** có `useEffect` theo dõi vị trí User qua `useGeolocation`
3. **Mỗi lần vị trí cập nhật** → tính khoảng cách đến từng POI bằng công thức Haversine:
   ```javascript
   a = sin²(Δφ/2) + cos(φ1) * cos(φ2) * sin²(Δλ/2)
   c = 2 * atan2(√a, √(1−a))
   distance = R * c  // R = 6371km
   ```
4. **Nếu khoảng cách < 35m** và `autoPlayAudio === true`:
   - Xác định POI gần nhất (tránh phát nhiều POI cùng lúc)
   - Lấy ngôn ngữ hiện tại từ Redux store (`app.language`)
   - Lấy nội dung thuyết minh từ POI data đã load: `getLocalizedValue(poi.description, language)`
5. **SpeechGuidePlayer** phát audio:
   - Ưu tiên Web Speech API (`speechSynthesis`)
   - Nếu không có voice phù hợp → gọi `translateService.cloudTTS()` → `GET /api/tts/google?text=...&lang=vi-VN`
   - **TtsController** proxy request đến Google Translate TTS → trả về `audio/mpeg`
   - Phát qua Howler.js
6. **Frontend** đồng thời gọi `analyticsService.trackAudioPlay(poiId, languageCode, source)` → `POST /api/analytics/audio-play`
7. **AnalyticsController** → `MySqlAnalyticsRepository.TrackAudioPlay()` → `INSERT INTO audio_play_events`
8. **Loop tiếp tục** mỗi giây theo dõi vị trí

---

## Tóm tắt file liên quan

| Activity | Frontend Page | Frontend Service | Backend Controller | Backend Repository |
|---|---|---|---|---|
| 05 Register | `RegisterPage.jsx` | `authService.js` | `AuthController.cs` | `MySqlAuthRepository.cs` |
| 06 Login | `LoginPage.jsx` | `authService.js` | `AuthController.cs` | `MySqlAuthRepository.cs`, `JwtTokenService.cs` |
| 07 Discover POI | `MapPage.jsx`, `MapView.jsx` | `poiService.js` | `POIsController.cs` | `MySqlPoiRepository.cs` |
| 08 View POI Detail | `MapPage.jsx`, `PoiDetailSheet.jsx` | `poiService.js`, `translateService.js` | `POIsController.cs`, `AnalyticsController.cs`, `TtsController.cs` | `MySqlPoiRepository.cs`, `MySqlAnalyticsRepository.cs` |
| 09 Find Route | `MapPage.jsx` | `routeService.js` | (External OSRM) | - |
| 10 Auto-play TTS | `MapPage.jsx`, `SpeechGuidePlayer.jsx` | `translateService.js`, `analyticsService.js` | `TtsController.cs`, `AnalyticsController.cs` | `MySqlAnalyticsRepository.cs` |
