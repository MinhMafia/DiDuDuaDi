# MO TA LUONG CHAY CODE - ACTIVITY 05 DEN 18

Tai lieu nay mo ta cach code trong du an DiDuDuaDi thuc thi theo cac so do activity tu `activity_05` den `activity_18`.

---

## Activity 05: User dang ky tai khoan

### Code location

| Lop | File / ham chinh |
|---|---|
| Frontend page | `frontend/src/pages/RegisterPage.jsx` |
| Frontend service | `frontend/src/services/authService.js` -> `register(payload)` |
| Backend controller | `backend/DiDuDuaDi.API/Controllers/AuthController.cs` -> `POST /api/auth/register` |
| Backend repository | `backend/DiDuDuaDi.API/Repositories/MySqlAuthRepository.cs` -> `Register(RegisterRequest)` |
| Model | `backend/DiDuDuaDi.API/Models/RegisterRequest.cs` |
| Database | `accounts`, `roles` |

### Luong chay code

1. User mo trang `/register`, React Router render `RegisterPage.jsx`.
2. User nhap username, password, display name va email tuy chon.
3. Frontend validate cac truong bat buoc va mat khau.
4. `RegisterPage.jsx` goi `authService.register(payload)`.
5. `authService.js` gui `POST /api/auth/register`.
6. `AuthController.Register()` nhan request va goi `MySqlAuthRepository.Register()`.
7. Repository kiem tra username da ton tai trong bang `accounts`.
8. Neu hop le, backend tao account moi voi role mac dinh la `user`.
9. Backend tra ket qua thanh cong, frontend thong bao va chuyen user ve trang dang nhap.

---

## Activity 06: User dang nhap

### Code location

| Lop | File / ham chinh |
|---|---|
| Frontend page | `frontend/src/pages/LoginPage.jsx` |
| Frontend service | `frontend/src/services/authService.js` -> `login(username, password)` |
| Frontend store | `frontend/src/store/slices/appSlice.js` -> session/user state |
| Backend controller | `backend/DiDuDuaDi.API/Controllers/AuthController.cs` -> `POST /api/auth/login` |
| Backend repository | `backend/DiDuDuaDi.API/Repositories/MySqlAuthRepository.cs` -> `ValidateCredentials()` |
| Backend service | `backend/DiDuDuaDi.API/Services/JwtTokenService.cs` -> `GenerateToken()` |
| Model | `LoginRequest.cs`, `AuthSession.cs`, `AuthUser.cs` |
| Database | `accounts`, `roles` |

### Luong chay code

1. User mo `/login`, `LoginPage.jsx` hien form dang nhap va cac nut demo.
2. User nhap username/password, frontend goi `authService.login()`.
3. `authService.js` gui `POST /api/auth/login`.
4. `AuthController.Login()` goi repository de lay account theo username.
5. `MySqlAuthRepository.ValidateCredentials()` so khop password va cap nhat `last_login_at`.
6. Neu dung, controller goi `JwtTokenService.GenerateToken(user)`.
7. JWT chua cac claims nhu username, display name va role.
8. Backend tra ve `AuthSession`.
9. Frontend luu session vao Redux/localStorage.
10. App dieu huong theo role: `user` -> `/map`, `owner` -> `/owner`, `admin` -> `/admin`.

---

## Activity 07: User kham pha POI tren ban do

### Code location

| Lop | File / ham chinh |
|---|---|
| Frontend page | `frontend/src/pages/MapPage.jsx` |
| Frontend hook | `frontend/src/hooks/useGeolocation.js` |
| Frontend service | `frontend/src/services/poiService.js` -> `getPois()`, `getNearbyPois()` |
| Backend controller | `backend/DiDuDuaDi.API/Controllers/POIsController.cs` -> `GET /api/pois`, `GET /api/pois/nearby` |
| Backend repository | `backend/DiDuDuaDi.API/Repositories/MySqlPoiRepository.cs` -> `GetAll()`, `GetNearby()` |
| Model | `POI.cs`, `GeoPoint.cs`, POI translation/menu models |
| Database | `pois`, `poi_translations`, `shops`, `menu_items` |

### Luong chay code

1. User mo `/map`, `MapPage.jsx` khoi tao ban do Leaflet va UI tim kiem.
2. `useGeolocation.js` goi `navigator.geolocation.watchPosition()` de lay vi tri hien tai. Neu user tu choi GPS, app dung vi tri mac dinh/demo.
3. Frontend goi `getPois()` hoac `getNearbyPois()` de lay POI.
4. `POIsController` chuyen request sang `MySqlPoiRepository`.
5. Repository lay POI, ban dich, shop va menu tu MySQL.
6. Frontend tinh khoang cach Haversine giua user va tung POI.
7. User chon ban kinh co dinh `50m`, `100m`, `200m`, `500m` hoac `Tat ca`.
8. `MapPage.jsx` loc va sap xep danh sach POI tren client, sau do render marker tren ban do va card ben phai.
9. User click marker/card POI, frontend chuyen sang luong xem chi tiet POI.

---

## Activity 08: User xem chi tiet POI

### Code location

| Lop | File / ham chinh |
|---|---|
| Frontend page | `frontend/src/pages/MapPage.jsx`, `frontend/src/pages/PoiDetailPage.jsx` |
| Frontend component | `frontend/src/components/map/PoiDetailSheet.jsx` |
| Frontend audio | `frontend/src/components/audio/SpeechGuidePlayer.jsx` |
| Frontend service | `frontend/src/services/poiService.js` -> `getPoiById(id)` |
| Frontend analytics | `frontend/src/services/analyticsService.js` -> `trackPoiView()` |
| Frontend util | `frontend/src/utils/publicPoiUrl.js` |
| Backend controller | `POIsController.cs` -> `GET /api/pois/{id}` |
| Backend analytics | `AnalyticsController.cs` -> `POST /api/analytics/poi-view` |
| Backend repository | `MySqlPoiRepository.cs`, `MySqlAnalyticsRepository.cs` |
| Database | `pois`, `poi_translations`, `menu_items`, `shop_visit_events` |

### Luong chay code

1. User mo chi tiet POI tu marker/card tren ban do hoac tu URL cong khai `/poi/{id}`.
2. Neu link den tu QR, URL co `?source=qr`; `PoiDetailPage.jsx` doc query nay de tracking dung nguon.
3. Frontend goi `poiService.getPoiById(id)`.
4. `POIsController.GetById()` goi `MySqlPoiRepository.GetById(id)`.
5. Repository lay POI, shop, translations va menu dang hien.
6. Frontend render `PoiDetailSheet` hoac `PoiDetailPage` voi anh, ten quan, mo ta, dia chi, menu va audio guide.
7. Frontend goi `trackPoiView({ poiId, languageCode, source })`.
8. `AnalyticsController.TrackPoiView()` ghi vao `shop_visit_events`.
9. Neu user bam nghe audio, `SpeechGuidePlayer` hoac logic audio tren `MapPage` chon audio dung ngon ngu; neu khong co file audio dung ngon ngu thi dung Web Speech API voi speechText cua ngon ngu hien tai, khong fallback sang tieng Viet.

---

## Activity 09: User tim duong den POI

### Code location

| Lop | File / ham chinh |
|---|---|
| Frontend page | `frontend/src/pages/MapPage.jsx` |
| Frontend hook | `frontend/src/hooks/useGeolocation.js` |
| Frontend service | `frontend/src/services/routeService.js` -> `getDrivingRoute(from, to)` |
| External API | OSRM Routing API |

### Luong chay code

1. User chon POI va bam nut tim duong.
2. `MapPage.jsx` lay toa do user tu `useGeolocation`.
3. App lay toa do POI tu du lieu da load.
4. Frontend goi `getDrivingRoute(from, to)`.
5. `routeService.js` gui request den OSRM theo toa do diem di va diem den.
6. OSRM tra ve geometry, distance va duration.
7. `MapPage.jsx` ve polyline len Leaflet, hien khoang cach va thoi gian du kien.
8. Neu OSRM loi, UI hien thong bao khong tim duoc lo trinh.

---

## Activity 10: Tu dong thuyet minh theo vi tri

### Code location

| Lop | File / ham chinh |
|---|---|
| Frontend page | `frontend/src/pages/MapPage.jsx` |
| Frontend audio | `frontend/src/components/audio/SpeechGuidePlayer.jsx` |
| Frontend hook | `frontend/src/hooks/useGeolocation.js` |
| Frontend store | `frontend/src/store/slices/appSlice.js` -> language/auto play state |
| Frontend analytics | `frontend/src/services/analyticsService.js` -> `trackAudioPlay()` |
| Backend controller | `AnalyticsController.cs` -> `POST /api/analytics/audio-play` |
| Backend repository | `MySqlAnalyticsRepository.cs` -> audio play tracking |
| Database | `audio_play_events`, `poi_translations` |

### Luong chay code

1. User bat tuy chon tu thuyet minh khi o gan POI.
2. Moi lan GPS cap nhat, `MapPage.jsx` tinh khoang cach den cac POI dang hien.
3. Neu khong co POI trong pham vi 35m, app khong phat audio.
4. Neu co nhieu POI trong 35m, app sap xep theo khoang cach.
5. Khi hai POI co khoang cach gan bang nhau, app uu tien POI chua nghe trong phien hien tai; neu van bang nhau thi giu thu tu on dinh de tranh doi qua lai.
6. App bo qua POI vua phat gan day de tranh lap audio lien tuc.
7. App lay ngon ngu hien tai tu store.
8. Neu POI co `audioUrl` dung ngon ngu hien tai, app phat file audio.
9. Neu khong co audio dung ngon ngu, app dung `speechText` va Web Speech API theo ngon ngu dang chon.
10. Frontend goi `trackAudioPlay({ poiId, languageCode, source })`.
11. Backend ghi su kien vao `audio_play_events`.

---

## Activity 11: User dang ky quan an / nang quyen owner

### Code location

| Lop | File / ham chinh |
|---|---|
| Frontend page | `frontend/src/pages/CollaborationPage.jsx` |
| Frontend style | `frontend/src/pages/CollaborationPage.css` |
| Frontend service | `frontend/src/services/authService.js` -> `createOwnerUpgradeRequest()`, `getMyOwnerUpgradeRequests()`, `updateOwnerUpgradeRequest()`, `cancelOwnerUpgradeRequest()` |
| Backend controller | `AuthController.cs` -> owner upgrade request endpoints |
| Backend repository | `MySqlAuthRepository.cs` |
| Model | `CreateOwnerUpgradeRequest.cs` va cac owner upgrade request models |
| Database | `owner_upgrade_requests`, `accounts` |

### Luong chay code

1. User da dang nhap mo trang `/cooperate`.
2. `CollaborationPage.jsx` hien tabs `Dang ky moi` va `Lich su & Trang thai`.
3. Tab lich su goi `getMyOwnerUpgradeRequests()` de lay cac don cu.
4. Neu don bi tu choi, UI hien ly do va nut `Sua lai tu don cu`.
5. Khi bam sua lai, frontend nap thong tin don cu vao form dang ky moi.
6. User nhap ten quan, dia chi, link giay to, ghi chu va chon toa do truc tiep tren map picker.
7. Frontend validate form va goi `createOwnerUpgradeRequest(payload)`.
8. `AuthController` xac thuc token user, kiem tra user co don pending hay khong.
9. Neu co pending, backend tra loi tu choi tao moi.
10. Neu hop le, repository insert vao `owner_upgrade_requests` voi trang thai `pending`.
11. Admin se thay don nay trong dashboard duyet chu quan.

---

## Activity 12: Admin duyet yeu cau nang quyen owner

### Code location

| Lop | File / ham chinh |
|---|---|
| Frontend page | `frontend/src/pages/AdminDashboardPage.jsx` |
| Frontend service | `frontend/src/services/adminService.js` -> `getOwnerUpgradeRequests()`, `reviewOwnerUpgradeRequest()`, `approveOwnerUpgradeRequest()` |
| Backend controller | `AuthController.cs` -> admin owner upgrade endpoints |
| Backend repository | `MySqlAuthRepository.cs` |
| Database | `owner_upgrade_requests`, `accounts`, `shops`, `pois`, `poi_translations` |

### Luong chay code

1. Admin dang nhap va vao `/admin`.
2. `AdminDashboardPage.jsx` goi `adminService.getOwnerUpgradeRequests("pending")` va `getOwnerUpgradeRequests("payment_pending")`.
3. `AuthController` kiem tra JWT va role admin.
4. Repository lay danh sach don pending tu `owner_upgrade_requests`.
5. Admin xem chi tiet don: user, ten quan, dia chi, toa do, giay to va ghi chu.
6. Neu tu choi, admin nhap ly do; frontend goi `reviewOwnerUpgradeRequest(requestId, "reject", reason)`.
7. Backend cap nhat trang thai `rejected` va luu `review_note`.
8. Neu phe duyet, frontend goi `reviewOwnerUpgradeRequest(requestId, "approve")`.
9. Backend tao `payment_reference_code`, `payment_qr_content`, `payment_qr_image_url` va cap nhat request sang `payment_pending`.
10. User xem QR thanh toan trong tab lich su cua trang dang ky quan.
11. Khi Admin xac nhan da thanh toan, frontend goi `confirmOwnerUpgradePayment(requestId)`.
12. Backend nang role user thanh owner, tao/cap nhat shop va POI mac dinh, cap nhat request thanh `approved`.
13. Neu Admin huy thanh toan, frontend goi `cancelOwnerUpgradePayment(requestId)` va backend dua don ve `pending`.

---

## Activity 13: Admin duyet noi dung gioi thieu quan

### Code location

| Lop | File / ham chinh |
|---|---|
| Frontend owner | `frontend/src/pages/OwnerDashboardPage.jsx` |
| Frontend admin | `frontend/src/pages/AdminDashboardPage.jsx` |
| Frontend service | `frontend/src/services/ownerService.js`, `frontend/src/services/adminService.js` |
| Backend owner | `OwnerController.cs` -> `PUT /api/owner/shop-profile`, `PUT /api/owner/poi-content` |
| Backend admin | `AdminController.cs` -> `GET /api/admin/shop-intros`, `POST /api/admin/shop-intros/{shopId}/review` |
| Backend repository | `MySqlOwnerRepository.cs`, `MySqlAdminRepository.cs` |
| Database | `shops`, `pois`, `poi_translations` |

### Luong chay code

1. Owner cap nhat thong tin quan hoac noi dung gioi thieu trong Owner dashboard.
2. Frontend goi `ownerService.updateShopProfile()` hoac `ownerService.updatePoiContent()`.
3. Backend owner controller xac thuc role owner va cap nhat thong tin vao database.
4. Noi dung can duyet duoc dat trang thai pending/review theo thiet ke duyet intro.
5. Admin vao dashboard va mo muc duyet noi dung.
6. `adminService.getShopIntroReviews("pending")` goi `GET /api/admin/shop-intros`.
7. `AdminController` lay danh sach shop co intro pending.
8. Admin chon approve hoac reject.
9. Neu approve, backend copy pending intro sang approved intro va cap nhat status approved.
10. Neu reject, backend luu ly do vao `review_note` va status rejected.

---

## Activity 14: Owner dashboard

### Code location

| Lop | File / ham chinh |
|---|---|
| Frontend page | `frontend/src/pages/OwnerDashboardPage.jsx` |
| Frontend style | `frontend/src/pages/OwnerDashboardPage.css` |
| Frontend service | `frontend/src/services/ownerService.js` |
| Frontend QR util | `frontend/src/utils/publicPoiUrl.js` |
| Backend controller | `OwnerController.cs` |
| Backend repository | `MySqlOwnerRepository.cs` |
| Database | `shops`, `pois`, `poi_translations`, `menu_items`, `shop_visit_events`, `audio_play_events` |

### Luong chay code

1. Owner vao `/owner`.
2. `OwnerDashboardPage.jsx` goi `ownerService.getOwnerDashboard()`.
3. `OwnerController.GetDashboard()` xac thuc owner va goi `MySqlOwnerRepository.GetDashboard()`.
4. Repository lay shop, POI, translations, menu items va thong ke views/audio/QR.
5. Frontend render sidebar gom Tong quan, Quan ly thuc don, Thong tin quan, Thong tin tren ban do va QR quan.
6. Tab tong quan hien stat cards: mon dang co, luot xem, audio plays va luot quet QR.
7. Tab thuc don hien `Thuc don hien tai`; khi owner bam them/sua, UI mo dialog.
8. Dialog goi `createMenuItem()`, `updateMenuItem()` hoac `deleteMenuItem()` den `OwnerController`.
9. Tab thong tin quan/map cho phep cap nhat profile, dia chi va toa do GPS bang map picker.
10. Tab noi dung da ngon ngu goi `updatePoiContent()` voi `sourceLanguage`, `sourceName`, `sourceDescription`; backend cap nhat ngon ngu nguon, dich cac ngon ngu con lai va sinh audio neu co mo ta.
11. Tab QR tao public link `/poi/{id}?source=qr`, render QR/standee, cho phep copy link, mo trang chi tiet va in standee.
12. Sau moi thao tac thanh cong, React Query/state refresh dashboard de cap nhat so lieu.

---

## Activity 15: Analytics tracking

### Code location

| Lop | File / ham chinh |
|---|---|
| Frontend service | `frontend/src/services/analyticsService.js` |
| Frontend pages | `MapPage.jsx`, `PoiDetailPage.jsx`, `OwnerDashboardPage.jsx`, `AdminDashboardPage.jsx` |
| Backend controller | `backend/DiDuDuaDi.API/Controllers/AnalyticsController.cs` |
| Backend repository | `backend/DiDuDuaDi.API/Repositories/MySqlAnalyticsRepository.cs`, `MySqlOwnerRepository.cs`, `MySqlAdminRepository.cs` |
| Database | `visitor_activity_events`, `shop_visit_events`, `audio_play_events` |

### Luong chay code

1. Khi user mo app hoac vao trang ban do, frontend tao/lai su dung visitor session key trong localStorage.
2. `analyticsService.trackVisitorHeartbeat()` gui `POST /api/analytics/visitor-heartbeat` voi sessionId, path, role va thoi diem.
3. Backend ghi vao `visitor_activity_events`.
4. Admin dashboard goi `GET /api/analytics/active-visitors?minutes=5` de tinh nguoi dang truy cap trong 5 phut.
5. Admin dashboard goi `GET /api/analytics/total-visitors` de tinh tong nguoi tung truy cap.
6. Khi user xem POI, frontend goi `trackPoiView()` voi source `map`, `public-detail`, `demo-map` hoac `qr`.
7. Backend ghi vao `shop_visit_events`; Owner dashboard dung bang nay de tinh luot xem va luot quet QR.
8. Khi user nghe audio, frontend goi `trackAudioPlay()` voi poiId, languageCode va source.
9. Backend ghi vao `audio_play_events`; Owner dashboard dung bang nay de tinh luot phat audio.
10. Admin/Owner dashboard doc du lieu tong hop va render bieu do/stat cards.

---

## Activity 16: User luu POI yeu thich

### Code location

| Lop | File / ham chinh |
|---|---|
| Frontend page | `frontend/src/pages/MapPage.jsx` |
| Frontend service | `frontend/src/services/userService.js` |
| Backend controller | `backend/DiDuDuaDi.API/Controllers/UsersController.cs` |
| Backend repository | `backend/DiDuDuaDi.API/Repositories/MySqlUserRepository.cs` |
| Database | `user_favorites`, `pois` |

### Luong chay code

1. User dang nhap va mo `/map`.
2. `MapPage.jsx` render nut yeu thich tren POI card/marker detail.
3. Khi user them yeu thich, frontend goi `POST /api/users/me/favorites/{poiId}`.
4. `UsersController` lay account hien tai tu JWT va goi `MySqlUserRepository.AddFavorite()`.
5. Repository ghi `INSERT IGNORE` vao `user_favorites`.
6. Khi user bo yeu thich, frontend goi `DELETE /api/users/me/favorites/{poiId}` va repository xoa ban ghi tuong ung.
7. Khi user xem danh sach yeu thich, frontend goi `GET /api/users/me/favorites` va backend tra ve danh sach POI da luu.

---

## Activity 17: Food Tour

### Code location

| Lop | File / ham chinh |
|---|---|
| Frontend admin | `frontend/src/pages/AdminDashboardPage.jsx` |
| Frontend user | `frontend/src/pages/MapPage.jsx` |
| Frontend service | `frontend/src/services/adminService.js`, `frontend/src/services/tourService.js` |
| Backend controller | `AdminToursController.cs`, `ToursController.cs` |
| Backend repository | `MySqlAdminRepository.cs` |
| Database | `tours`, `tour_steps`, `pois` |

### Luong chay code

1. Admin mo muc Food Tours trong `/admin`.
2. Admin tao/sua tour voi ten, mo ta, danh muc va danh sach POI theo thu tu.
3. Frontend goi `POST/PUT /api/admin/food-tours`.
4. `AdminToursController` validate tieu de, danh sach POI, thu tu va POI trung.
5. Repository luu tour vao `tours` va cac diem vao `tour_steps`.
6. User mo `/map`, frontend goi `GET /api/tours`.
7. User chon tour, `MapPage.jsx` loc POI theo `steps` va hien marker/card theo thu tu tour.

---

## Activity 18: Chat tro ly AI

### Code location

| Lop | File / ham chinh |
|---|---|
| Frontend component | `frontend/src/components/chat/ChatButton.jsx` |
| Frontend service | `frontend/src/services/poiService.js` |
| Backend controller | `backend/DiDuDuaDi.API/Controllers/AIController.cs` |
| External service | Mistral chat completion API |

### Luong chay code

1. User mo nut chat trong layout.
2. `ChatButton.jsx` nap danh sach POI de lam ngu canh goi y.
3. User nhap cau hoi ve mon an, dia diem hoac lich trinh.
4. Frontend goi `POST /api/ai/chat`.
5. `AIController` tao prompt tu cau hoi va du lieu POI lien quan, sau do goi Mistral API.
6. Neu thanh cong, backend tra cau tra loi ve frontend; neu loi, frontend hien thong bao tro ly tam thoi khong kha dung.

---

## Tom tat file lien quan

| Activity | Frontend chinh | Service chinh | Backend controller | Backend repository |
|---|---|---|---|---|
| 05 Register | `RegisterPage.jsx` | `authService.register()` | `AuthController.cs` | `MySqlAuthRepository.cs` |
| 06 Login | `LoginPage.jsx` | `authService.login()` | `AuthController.cs` | `MySqlAuthRepository.cs`, `JwtTokenService.cs` |
| 07 Discover POI | `MapPage.jsx` | `poiService.js` | `POIsController.cs` | `MySqlPoiRepository.cs` |
| 08 View POI Detail | `MapPage.jsx`, `PoiDetailPage.jsx`, `PoiDetailSheet.jsx` | `poiService.js`, `analyticsService.js` | `POIsController.cs`, `AnalyticsController.cs` | `MySqlPoiRepository.cs`, `MySqlAnalyticsRepository.cs` |
| 09 Find Route | `MapPage.jsx` | `routeService.js` | OSRM external API | - |
| 10 Auto narration | `MapPage.jsx`, `SpeechGuidePlayer.jsx` | `analyticsService.js` | `AnalyticsController.cs` | `MySqlAnalyticsRepository.cs` |
| 11 Owner request | `CollaborationPage.jsx` | `authService.js` | `AuthController.cs` | `MySqlAuthRepository.cs` |
| 12 Admin review owner | `AdminDashboardPage.jsx` | `adminService.js` | `AuthController.cs` | `MySqlAuthRepository.cs` |
| 13 Admin review intro | `AdminDashboardPage.jsx`, `OwnerDashboardPage.jsx` | `adminService.js`, `ownerService.js` | `AdminController.cs`, `OwnerController.cs` | `MySqlAdminRepository.cs`, `MySqlOwnerRepository.cs` |
| 14 Owner dashboard | `OwnerDashboardPage.jsx` | `ownerService.js` | `OwnerController.cs` | `MySqlOwnerRepository.cs` |
| 15 Analytics | `MapPage.jsx`, `PoiDetailPage.jsx`, dashboards | `analyticsService.js` | `AnalyticsController.cs` | `MySqlAnalyticsRepository.cs` |
| 16 Favorites | `MapPage.jsx` | `userService.js` | `UsersController.cs` | `MySqlUserRepository.cs` |
| 17 Food Tour | `AdminDashboardPage.jsx`, `MapPage.jsx` | `adminService.js`, `tourService.js` | `AdminToursController.cs`, `ToursController.cs` | `MySqlAdminRepository.cs` |
| 18 AI chat | `ChatButton.jsx` | `poiService.js` | `AIController.cs` | - |
