# DiDuDuaDi

DiDuDuaDi là web app hỗ trợ du lịch và khám phá địa điểm. Người dùng có thể xem các POI (Point of Interest) trên bản đồ, mở trang chi tiết địa điểm, nghe audio guide, đổi ngôn ngữ và dùng AI chat. Hệ thống có phân quyền cho người dùng, chủ địa điểm và quản trị viên.

## Tính năng chính

- Bản đồ POI, xem địa điểm gần người dùng và mở trang chi tiết POI.
- Audio guide và nội dung đa ngôn ngữ cho địa điểm.
- Đăng ký, đăng nhập, phân quyền bằng JWT.
- Quy trình người dùng gửi yêu cầu hợp tác/nâng cấp thành owner.
- Owner dashboard để quản lý thông tin shop/POI, trạng thái mở cửa, menu và nội dung giới thiệu.
- Admin dashboard để quản lý POI, yêu cầu owner, đánh giá nội dung shop, thống kê và food tour.
- AI chat, dịch nội dung và text-to-speech.
- Analytics cho lượt xem, tìm kiếm, audio và visitor heartbeat.

## Vai trò người dùng

- `user`: xem bản đồ/POI, nghe audio guide, gửi yêu cầu hợp tác.
- `owner`: quản lý shop/POI, menu, trạng thái mở cửa và nội dung giới thiệu.
- `admin`: quản trị POI, owner requests, analytics, food tours và các luồng duyệt.

## Công nghệ sử dụng

Frontend:

- React 18, Vite
- React Router
- Axios
- Ant Design
- i18next/react-i18next
- React Query, Redux Toolkit
- React Leaflet, Google Maps
- Recharts

Backend:

- ASP.NET Core Web API
- .NET `net10.0`
- MySQL
- Dapper, Entity Framework Core
- JWT Bearer Authentication
- Swagger/OpenAPI

## Cấu trúc thư mục

```text
.
|-- frontend/
|   |-- src/
|   |   |-- App.jsx                  # Khai báo route frontend
|   |   |-- main.jsx                 # React bootstrap/providers
|   |   |-- components/              # Layout, auth, map, audio, UI chung
|   |   |-- hooks/                   # Geolocation, device heading
|   |   |-- i18n/                    # Cấu hình i18n và locale JSON
|   |   |-- pages/                   # Các màn hình chính
|   |   |-- services/                # Axios API service wrappers
|   |   |-- store/                   # Redux store/slices
|   |   +-- utils/                   # Helper/constants
|   |-- package.json
|   +-- vite.config.js
|-- backend/
|   +-- DiDuDuaDi.API/
|       |-- Controllers/             # REST API endpoints
|       |-- Data/                    # DB context, initializer, SQL scripts
|       |-- Models/                  # DTO/entity/request/response models
|       |-- Repositories/            # Data access MySQL/Dapper
|       |-- Services/                # JWT, AI chat, TTS, translation
|       |-- wwwroot/audios/pois/     # Audio guide static files
|       |-- Program.cs               # DI, auth, CORS, Swagger, middleware
|       +-- DiDuDuaDi.API.csproj
+-- project-summary.md              # Ghi chú handoff kỹ thuật
```

Các thư mục sinh tự động như `frontend/node_modules`, `frontend/dist`, `backend/**/bin`, `backend/**/obj` và các file log không nên commit.

## Yêu cầu môi trường

- Node.js và npm
- .NET SDK tương thích với target `net10.0`
- MySQL server hoặc MySQL database cloud
- API key Mistral nếu dùng tính năng AI chat

## Cấu hình môi trường

### Frontend

Tạo file `frontend/.env` từ `frontend/.env.example`:

```env
VITE_API_BASE_URL=http://localhost:5000
VITE_LOCAL_API_PROXY_TARGET=http://localhost:5000
VITE_FORCE_REMOTE_API=false
VITE_PUBLIC_APP_URL=https://di-du-dua-di.vercel.app
```

Trong chế độ dev, frontend dùng proxy `/api` và `/audios` sang backend. Proxy mặc định trỏ tới `http://localhost:5000`, có thể đổi bằng `VITE_LOCAL_API_PROXY_TARGET`.

### Backend

Cấu hình trong `backend/DiDuDuaDi.API/appsettings.Development.json`, user secrets, biến môi trường hoặc secret storage khi deploy:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=YOUR_MYSQL_HOST;Port=3306;Database=YOUR_DATABASE;User=YOUR_USERNAME;Password=YOUR_PASSWORD;SslMode=Required;"
  },
  "Jwt": {
    "Issuer": "DiDuDuaDi.API",
    "Audience": "DiDuDuaDi.Frontend",
    "SecretKey": "CHANGE_ME_TO_A_LONG_RANDOM_SECRET_AT_LEAST_32_CHARS",
    "ExpiresInHours": 12
  },
  "Mistral": {
    "ApiKey": "YOUR_MISTRAL_API_KEY",
    "Endpoint": "https://api.mistral.ai/v1/chat/completions",
    "Model": "mistral-small-latest"
  }
}
```

Không commit secret thật, connection string thật hoặc API key thật vào repository.

## Chạy dự án local

### 1. Chạy backend

```powershell
dotnet restore .\backend\DiDuDuaDi.API\DiDuDuaDi.API.csproj
dotnet run --project .\backend\DiDuDuaDi.API\DiDuDuaDi.API.csproj
```

Backend mặc định chạy tại:

```text
http://localhost:5000
```

Swagger UI được cấu hình ở root backend:

```text
http://localhost:5000/
```

Health check:

```text
http://localhost:5000/api/health
```

### 2. Chạy frontend

```powershell
cd frontend
npm install
npm run dev
```

Frontend mặc định chạy tại:

```text
http://localhost:3000
```

## Build

Frontend:

```powershell
cd frontend
npm run build
```

Backend:

```powershell
dotnet build .\backend\DiDuDuaDi.API\DiDuDuaDi.API.csproj
```

## Frontend routes

- `/`: redirect sang `/map`.
- `/map`: trang bản đồ chính.
- `/poi/:id`: trang chi tiết POI public.
- `/login`: đăng nhập.
- `/register`: đăng ký.
- `/cooperate`: gửi/tra cứu yêu cầu hợp tác, dành cho role `user`.
- `/owner`: owner dashboard, dành cho role `owner`.
- `/admin`: admin dashboard, dành cho role `admin`.
- `/test`: màn hình benchmark/test hệ thống.

Frontend route guard chỉ bảo vệ trải nghiệm UI. Backend vẫn phải kiểm tra quyền bằng JWT và role.

## API chính

Base API URL:

```text
/api
```

Một số controller quan trọng:

- `AuthController` - `/api/auth`: login, register, owner upgrade request flow.
- `POIsController` - `/api/pois`: danh sách POI, nearby, chi tiết POI, CRUD POI cho admin.
- `OwnerController` - `/api/owner`: dashboard owner, shop profile, trạng thái mở cửa, POI content, menu.
- `AdminController` - `/api/admin`: dashboard admin, thống kê, duyệt nội dung, quản lý POI.
- `AdminToursController`: quản lý food tour cho admin.
- `AnalyticsController` - tracking visitor, audio, search, POI events.
- `AIController`: AI chat.
- `TtsController`: text-to-speech/audio.
- `ToursController`: public tour endpoints.
- `UsersController`: user endpoints.
- `HealthController` - `/api/health`: trạng thái backend/database.

Frontend gọi API thông qua các file trong `frontend/src/services`. Axios client chung nằm ở `frontend/src/services/apiClient.js`, tự gắn `Authorization: Bearer <token>` từ localStorage key:

```text
didududadi.session
```

## Database

Các file liên quan:

- `backend/DiDuDuaDi.API/Data/db.sql`
- `backend/DiDuDuaDi.API/Data/db_aiven.sql`
- `backend/DiDuDuaDi.API/Data/DiDuDuaDiDbContext.cs`
- `backend/DiDuDuaDi.API/Data/MySqlDatabaseInitializer.cs`
- `backend/DiDuDuaDi.API/Data/Migrations/`

Backend hiện gọi `IDatabaseInitializer.EnsureSchema()` khi startup để đảm bảo schema cần thiết. Khi thay đổi database, kiểm tra đồng thời SQL scripts, EF migration, models và repository tương ứng.

## Đa ngôn ngữ và audio guide

Locale frontend nằm tại:

```text
frontend/src/i18n/locales
```

Các ngôn ngữ hiện có:

```text
vi, en, fr, ja, ko, th, zh
```

Audio guide static files được phục vụ từ:

```text
backend/DiDuDuaDi.API/wwwroot/audios/pois
```

Trong dev, Vite proxy đường dẫn `/audios` sang backend để frontend có thể phát audio.

## Checklist kiểm thử nhanh

Sau khi thay đổi code, nên kiểm tra:

- `npm run build` trong thư mục `frontend`.
- `dotnet build .\backend\DiDuDuaDi.API\DiDuDuaDi.API.csproj`.
- Mở `/map`, chọn một POI và mở trang `/poi/:id`.
- Đăng nhập bằng từng role liên quan nếu thay đổi route bảo vệ.
- Kiểm tra Network tab để xác nhận API base URL đúng.
- Nếu sửa owner content/audio, kiểm tra nội dung dịch và audio URL.
- Nếu sửa database/repository, kiểm tra endpoint liên quan bằng Swagger.

## Lưu ý bảo mật và triển khai

- Không commit `.env`, `appsettings.Development.json`, secret, API key hoặc connection string thật.
- CORS trong production nên giới hạn đúng domain frontend.
- Swagger trên production nên được tắt hoặc bảo vệ nếu không cần public.
- JWT secret phải đủ dài, ngẫu nhiên và lấy từ secret storage.
- Không commit thư mục build/dependency như `node_modules`, `dist`, `bin`, `obj`.

## Tài liệu nội bộ

Xem thêm `project-summary.md` để có ghi chú handoff chi tiết cho developer/agent mới.
