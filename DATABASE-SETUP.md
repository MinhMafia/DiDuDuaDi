# 🗄️ Hướng dẫn cấu hình Database

## ⚠️ CẢNH BÁO BẢO MẬT QUAN TRỌNG

**KHÔNG BAO GIỜ commit password database thật lên Git!**

File `appsettings.json` đã được thay thế bằng placeholder. 
Bạn cần tạo file riêng chứa connection string thật.

---

## 🔧 Cách cấu hình (3 bước đơn giản)

### **Bước 1: Tạo file appsettings.Development.json**

```bash
cd backend/DiDuDuaDi.API
```

Tạo file mới: `appsettings.Development.json`

**Nội dung:**
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=YOUR_MYSQL_HOST;Port=3306;Database=YOUR_DATABASE;User=YOUR_USERNAME;Password=YOUR_PASSWORD;SslMode=Required;"
  }
}
```

### **Bước 2: Thêm vào .gitignore**

Kiểm tra file `.gitignore` đã có dòng này chưa:
```
**/appsettings.Development.json
appsettings.Development.json
```

Nếu chưa có, thêm vào để Git bỏ qua file này.

### **Bước 3: Chạy ứng dụng**

```bash
cd backend/DiDuDuaDi.API
dotnet run
```

---

## 📋 Giải thích các phương án

### **✅ Option 1: Dùng file appsettings.Development.json (Khuyến nghị)**

**Ưu điểm:**
- ✅ Tự động load khi chạy `dotnet run`
- ✅ Không cần sửa code
- ✅ Git bỏ qua file này (an toàn)

**Cách hoạt động:**
```
appsettings.json (template - commit lên Git)
       ↓
appsettings.Development.json (thật - KHÔNG commit)
       ↓
ASP.NET Core tự động merge cấu hình
```

---

### **✅ Option 2: Dùng Environment Variables**

**Trên Windows:**
```cmd
set ConnectionStrings__DefaultConnection=Server=...;Password=...;
dotnet run
```

**Trên Linux/Mac:**
```bash
export ConnectionStrings__DefaultConnection="Server=...;Password=...;"
dotnet run
```

**Hoặc dùng file .env:**
```bash
# Tạo file .env ở thư mục backend
CONNECTION_STRINGS__DEFAULTCONNECTION=Server=...;Password=...;
```

---

### **✅ Option 3: Dùng User Secrets (Development only)**

```bash
cd backend/DiDuDuaDi.API

# Khởi tạo user secrets
dotnet user-secrets init

# Set connection string
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Server=...;Password=...;"

# Chạy app
dotnet run
```

**Kiểm tra đã set chưa:**
```bash
dotnet user-secrets list
```

**Xóa secret:**
```bash
dotnet user-secrets clear
```

---

## 🚀 Deploy lên Production

### **Khi deploy lên server thật:**

**Cách 1: Environment Variables trên server**
```bash
# Trên VPS
export ConnectionStrings__DefaultConnection="Server=...;Password=...;"
```

**Cách 2: File appsettings.Production.json**
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=production-db;Password=...;"
  }
}
```

**Cách 3: Docker environment**
```yaml
# docker-compose.yml
services:
  backend:
    environment:
      - ConnectionStrings__DefaultConnection=Server=mysql;Password=...;
```

---

## 🔍 Kiểm tra kết nối

### **Test connection có đúng không:**

```bash
cd backend/DiDuDuaDi.API
dotnet run
```

**Nếu thành công:**
```
info: DiDuDuaDi.API.Data.MySqlDatabaseInitializer[0]
      Database schema ensured successfully.
info: Microsoft.Hosting.Lifetime[0]
      Now listening on: http://localhost:5000
```

**Nếu lỗi:**
```
fatal_error.log sẽ được tạo ra với chi tiết lỗi
```

**Kiểm tra log:**
```bash
cat fatal_error.log
```

---

## 📊 Database hiện tại dùng gì?

### **Công nghệ:**
- ✅ **MySQL** (ví dụ: Aiven Cloud hoặc MySQL local)
- ✅ **ADO.NET** (MySqlConnector)
- ✅ **Dapper** (Micro-ORM)
- ❌ **KHÔNG dùng** Entity Framework Core
- ❌ **KHÔNG có** Migrations

### **Cách database được tạo:**

```
Khi app khởi động
    ↓
MySqlDatabaseInitializer.EnsureSchema()
    ↓
Kiểm tra từng bảng có tồn tại chưa
    ↓
Nếu chưa có → CREATE TABLE
    ↓
Nếu thiếu cột → ALTER TABLE ADD COLUMN
    ↓
Seed data mẫu (admin, owner, tourist)
    ↓
✅ Sẵn sàng!
```

### **Các bảng được tạo tự động:**
- `users` (người dùng)
- `pois` (địa điểm)
- `shop_profiles` (thông tin quán)
- `menu_items` (thực đơn)
- `owner_upgrade_requests` (yêu cầu nâng quyền)
- `shop_visit_events` (lượt ghé)
- `audio_play_events` (lượt nghe audio)
- `cash_claim_codes` (mã thanh toán)
- `food_tours` (tour ẩm thực)
- `tour_steps` (các điểm trong tour)

---

## 🆘 Troubleshooting

### **Lỗi: Unable to connect to database**

**Nguyên nhân:**
- ❌ Sai password
- ❌ Sai server/port
- ❌ Firewall chặn
- ❌ Dịch vụ database cloud bị dừng hoặc sai thông tin kết nối

**Cách sửa:**
1. Kiểm tra connection string
2. Thử kết nối bằng MySQL Workbench
3. Kiểm tra dashboard nhà cung cấp database xem service có đang chạy không

### **Lỗi: Table doesn't exist**

**Nguyên nhân:**
- Database chưa được khởi tạo

**Cách sửa:**
```bash
# Restart backend
dotnet run

# MySqlDatabaseInitializer sẽ tự tạo bảng
```

### **Lỗi: Column doesn't exist**

**Nguyên nhân:**
- Schema cũ, thiếu cột mới

**Cách sửa:**
```bash
# Restart backend
# MySqlDatabaseInitializer.EnsureSchema() sẽ tự động ALTER TABLE
dotnet run
```

---

## 🔐 Bảo mật tốt hơn

### **1. Không commit password:**
```bash
# Thêm vào .gitignore
**/appsettings.Development.json
appsettings.Production.json
```

### **2. Dùng Azure Key Vault (Production):**
```csharp
// Program.cs
builder.Configuration.AddAzureKeyVault(
    new Uri("https://your-vault.vault.azure.net/"),
    new DefaultAzureCredential());
```

### **3. Rotate password định kỳ:**
- Thay đổi password mỗi 3-6 tháng
- Update trên dashboard nhà cung cấp database
- Update environment variables trên server

---

## 📝 Checklist trước khi deploy

- [ ] Đã xóa password thật khỏi `appsettings.json`
- [ ] Đã tạo `appsettings.Development.json` với connection string thật
- [ ] Đã thêm file Development vào `.gitignore`
- [ ] Đã test `dotnet run` thành công
- [ ] Đã kiểm tra logs không có lỗi kết nối database
- [ ] Đã backup database (nếu là production)

---

## 📞 Hỗ trợ

Nếu gặp vấn đề:
1. Check `fatal_error.log`
2. Check dashboard nhà cung cấp database
3. Kiểm tra firewall rules
4. Thử kết nối bằng MySQL client
