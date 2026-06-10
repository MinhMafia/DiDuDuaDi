# Project Summary - DiDuDuaDi

File này là ghi chú handoff cho agent/developer mới đọc nhanh dự án trước khi sửa code.

## 1. Dự án là gì?

DiDuDuaDi là web app hỗ trợ du lịch/khám phá địa điểm. Người dùng xem POI (Point of Interest) trên bản đồ, mở chi tiết địa điểm, nghe audio guide, đổi ngôn ngữ và dùng AI chat. Hệ thống có phân quyền:

- `user`: xem bản đồ/POI, gửi yêu cầu hợp tác/nâng cấp thành owner.
- `owner`: quản lý thông tin shop/POI, trạng thái mở cửa, menu, nội dung giới thiệu.
- `admin`: quản trị POI, owner requests, shop intro reviews, analytics, food tours.

Stack chính:

- Frontend: React 18, Vite, React Router, Axios, Ant Design, i18next, React Leaflet/Google Maps, Redux Toolkit, React Query, Recharts.
- Backend: ASP.NET Core Web API, .NET `net10.0`, MySQL, Dapper, JWT Bearer Auth, Swagger.
- Database: MySQL, schema/seed ở `backend/DiDuDuaDi.API/Data/db.sql` và `db_aiven.sql`.
- Static files: audio guide ở `backend/DiDuDuaDi.API/wwwroot/audios/pois`.

## 2. Cấu trúc thư mục quan trọng

```text
.
|-- frontend/
|   |-- src/
|   |   |-- App.jsx                  # Frontend routes
|   |   |-- main.jsx                 # React bootstrap, providers
|   |   |-- components/              # Layout, auth, map, audio, common UI
|   |   |-- hooks/                   # useGeolocation, useDeviceHeading
|   |   |-- i18n/                    # i18next config + locale JSON
|   |   |-- pages/                   # Main pages
|   |   |-- services/                # Axios API service wrappers
|   |   |-- store/                   # Redux store/slices
|   |   +-- utils/                   # Helpers/constants
|   |-- package.json
|   +-- vite.config.js
|-- backend/
|   +-- DiDuDuaDi.API/
|       |-- Controllers/             # REST API endpoints
|       |-- Data/                    # DB connection/init + SQL scripts
|       |-- Models/                  # DTOs/entities/request/response
|       |-- Repositories/            # Dapper/MySQL data access
|       |-- Services/                # JWT, AI chat, TTS, translation
|       |-- wwwroot/audios/pois/     # Served audio files
|       |-- Program.cs               # DI, auth, CORS, Swagger, middleware
|       +-- DiDuDuaDi.API.csproj
+-- Đặc tả wed/
    +-- PV.md                        # Interview/project explanation notes
```

Generated/dependency folders such as `frontend/node_modules`, `frontend/dist`, backend `bin`, `obj`, logs/cache files should usually be ignored when reasoning about source changes.

## 3. Cách chạy/build

Frontend:

```powershell
cd frontend
npm install
npm run dev
npm run build
```

Frontend dev server chạy port `3000`. Trong dev, `apiClient.js` dùng base URL `/api`; `vite.config.js` proxy `/api` và `/audios` tới backend, mặc định `http://localhost:5000`. Có thể đổi bằng `VITE_LOCAL_API_PROXY_TARGET`.

Backend:

```powershell
dotnet build .\backend\DiDuDuaDi.API\DiDuDuaDi.API.csproj
dotnet run --project .\backend\DiDuDuaDi.API\DiDuDuaDi.API.csproj
```

Swagger được bật ở root backend (`/`) vì `Program.cs` đặt `RoutePrefix = string.Empty`. Có health-ish endpoint `/hello`.

## 4. Frontend routes

Định nghĩa ở `frontend/src/App.jsx`:

- `/` redirect sang `/map`.
- `/map`: trang bản đồ chính.
- `/poi/:id`: trang chi tiết POI public, không cần đăng nhập.
- `/login`, `/register`: auth.
- `/cooperate`: route bảo vệ cho role `user`.
- `/owner`: route bảo vệ cho role `owner`.
- `/admin`: route bảo vệ cho role `admin`.
- `/test`: `SystemBenchmark`.
- `*`: redirect về `/map`.

`ProtectedRoute` chỉ là bảo vệ phía UI; quyền thật vẫn phải kiểm tra ở backend bằng JWT/role.

## 5. Frontend services và API client

`frontend/src/services/apiClient.js` tạo Axios instance chung:

- Tự resolve `baseURL`.
- Gắn `Authorization: Bearer <token>` từ `localStorage["didududadi.session"]`.
- Không gắn token cho `/auth/login` và `/auth/register`.
- Nếu response `401`, xóa session và chuyển về `/login`.

Các service đáng chú ý:

- `authService.js`: login, register, owner upgrade request CRUD/cancel/history.
- `poiService.js`: public POI list, nearby, detail, admin-style CRUD.
- `ownerService.js`: owner dashboard, shop profile, open status, POI content, menu items.
- `adminService.js`: owner upgrade review/payment, shop intro review, dashboard stats, POI admin, top POIs, food tours.
- `analyticsService.js`: visitor/POI/audio/search tracking.
- `mistralService.js`, `translateService.js`, `tourService.js`, `healthService.js`, `userService.js`: feature-specific calls.

## 6. Backend architecture

`Program.cs` đăng ký:

- Controllers, Swagger.
- JWT Bearer auth từ config section `Jwt`.
- CORS policy `AllowAll`.
- DI cho database/repositories/services.
- `IDatabaseInitializer.EnsureSchema()` khi startup.
- Static files, thêm CORS header cho audio/static responses.

Repository pattern:

- Controller xử lý HTTP, validation cơ bản, role claim/current user.
- Repository xử lý SQL/Dapper/MySQL.
- Service xử lý logic cross-cutting: JWT token, Mistral chat, Google-free translation, Google-free TTS.

## 7. Backend controllers/API surface

Base route hầu hết là `api/[controller]`.

Core controllers:

- `AuthController`: `/api/auth`
  - `POST /login`, `POST /register`
  - Owner upgrade request flow: create, update own pending request, cancel, history, admin review/approve/confirm payment/cancel payment.
- `POIsController`: `/api/pois`
  - Public: `GET /`, `GET /nearby`, `GET /{id}`
  - Admin-only: `POST /`, `PUT /{id}`, `DELETE /{id}`
- `OwnerController`: `/api/owner`, role `owner`
  - `GET /dashboard`
  - `PUT /shop-profile`
  - `PATCH /shop-open-status`
  - `PUT /poi-content`
  - `POST/PUT/DELETE /menu-items`
- `AdminController`: admin dashboard/statistics/shop intro/POI management.
- `AdminToursController`: food tour admin endpoints.
- `AnalyticsController`: tracking and analytics endpoints.
- `AIController`: AI chat endpoint backed by `MistralChatService`.
- `TtsController`: text-to-speech/audio generation endpoints.
- `ToursController`: public tour endpoints.
- `UsersController`: user endpoints.
- `HealthController`: health/startup status.

When changing frontend service URLs, check the matching controller route and method name first.

## 8. Database/data notes

Database scripts:

- `backend/DiDuDuaDi.API/Data/db.sql`
- `backend/DiDuDuaDi.API/Data/db_aiven.sql`
- Runtime initializer: `MySqlDatabaseInitializer.cs`

Connection path:

- `IDbConnectionFactory` -> `MySqlConnectionFactory`
- Repositories use Dapper with parameterized queries.

Important warning: `backend/DiDuDuaDi.API/Data/note.txt` contains deployment notes and appears to include a real MySQL connection string/secret. Do not copy secrets into docs, commits, logs, or generated summaries. Prefer `appsettings.Development.json`, env vars, or deployment secret storage.

## 9. i18n/audio/POI content flow

Supported frontend locales include:

- `vi`, `en`, `fr`, `ja`, `ko`, `th`, `zh`

Locale files live in `frontend/src/i18n/locales/*.json`.

Owner POI content update flow:

1. Owner calls `PUT /api/owner/poi-content`.
2. Backend normalizes source language.
3. Backend updates owner/POI content through repository.
4. For target languages `vi/en/zh/ja/ko/fr/th`, backend translates name/description if needed.
5. Backend generates/saves TTS audio for descriptions.
6. Backend upserts POI translations/audio URLs.

Audio files are served from backend `wwwroot`, with frontend proxying `/audios` in dev.

## 10. Auth/session conventions

Frontend session key:

```text
didududadi.session
```

JWT comes from backend `JwtTokenService`. Backend role names used in code are lowercase strings:

```text
user, owner, admin
```

Frontend route guards use these exact role strings. Backend controllers should still use `[Authorize(Roles = "...")]` for protected endpoints.

## 11. Files to check for common tasks

Add/change frontend route:

- `frontend/src/App.jsx`
- relevant page in `frontend/src/pages`
- layout/nav in `frontend/src/components/layout`

Add/change API call:

- frontend service in `frontend/src/services`
- matching backend controller in `backend/DiDuDuaDi.API/Controllers`
- model DTO in `backend/DiDuDuaDi.API/Models`
- repository interface + MySQL implementation in `Repositories`

Change POI display/map:

- `frontend/src/pages/MapPage.jsx`
- `frontend/src/components/map/MapView.jsx`
- `frontend/src/components/map/PoiDetailSheet.jsx`
- `frontend/src/pages/PoiDetailPage.jsx`
- `frontend/src/services/poiService.js`
- `backend/DiDuDuaDi.API/Controllers/POIsController.cs`
- `backend/DiDuDuaDi.API/Repositories/MySqlPoiRepository.cs`
- `backend/DiDuDuaDi.API/Models/POI.cs`

Change owner dashboard:

- `frontend/src/pages/OwnerDashboardPage.jsx`
- `frontend/src/services/ownerService.js`
- `backend/DiDuDuaDi.API/Controllers/OwnerController.cs`
- `backend/DiDuDuaDi.API/Repositories/MySqlOwnerRepository.cs`
- owner-related models in `Models`

Change admin dashboard:

- `frontend/src/pages/AdminDashboardPage.jsx`
- `frontend/src/services/adminService.js`
- `backend/DiDuDuaDi.API/Controllers/AdminController.cs`
- `backend/DiDuDuaDi.API/Controllers/AdminToursController.cs`
- `backend/DiDuDuaDi.API/Repositories/MySqlAdminRepository.cs`

Change translations:

- `frontend/src/i18n/index.js`
- `frontend/src/i18n/locales/*.json`
- `backend/DiDuDuaDi.API/Services/TranslationService.cs`
- `backend/DiDuDuaDi.API/Services/TextToSpeechService.cs`

## 12. Current codebase risks/notes for future agents

- Some large pages are very big (`AdminDashboardPage.jsx`, `OwnerDashboardPage.jsx`, `MapPage.jsx`). Be careful with scoped edits; avoid broad refactors unless requested.
- There are duplicate/old-looking files such as `AdminDashboardPage_rebuild.jsx`; verify whether a file is actually imported before editing.
- Backend targets `.NET 10` preview-era packages. Build environment must have compatible SDK.
- CORS is currently `AllowAll`; production should use stricter allowed origins.
- Swagger is enabled always; production exposure should be reviewed.
- `Program.cs` currently runs database schema initialization on startup; schema changes can affect startup behavior.
- Frontend dev proxy defaults backend to `http://localhost:5000`; if backend uses another port, set `VITE_LOCAL_API_PROXY_TARGET`.
- Keep generated folders (`dist`, `node_modules`, `bin`, `obj`) out of hand edits unless the task explicitly concerns build artifacts.

## 13. Suggested verification after changes

Frontend:

```powershell
cd frontend
npm run build
```

Backend:

```powershell
dotnet build .\backend\DiDuDuaDi.API\DiDuDuaDi.API.csproj
```

Manual smoke checks:

- Open `/map`, select a POI, open `/poi/:id`.
- Login as each relevant role if touching protected routes.
- Check browser Network tab for API path/base URL mistakes.
- For owner content/audio changes, verify generated audio URL and locale content.
- For DB/repository changes, verify Swagger endpoint and relevant UI flow.
