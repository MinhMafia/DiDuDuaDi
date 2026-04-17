# Hướng dẫn Deploy DiDuDuaDi

## 🔥 Option 1: Deploy bằng Docker (Khuyến nghị)

### Yêu cầu:
- VPS (Virtual Private Server) với IP public
- Docker và Docker Compose đã cài đặt
- Domain name (tùy chọn, nhưng khuyến nghị cho QR code)

### Bước 1: Chuẩn bị VPS

**Thuê VPS (chi phí ~50-100k/tháng):**
- [DigitalOcean](https://www.digitalocean.com/) ($4-6/tháng)
- [Vultr](https://www.vultr.com/) ($3.5/tháng)
- [Hetzner](https://www.hetzner.com/) (~€4/tháng)
- [VNPT Cloud](https://cloud.vnpt.vn/) (Việt Nam)

**OS khuyến nghị:** Ubuntu 22.04 LTS

### Bước 2: Cài đặt Docker trên VPS

```bash
# SSH vào VPS
ssh root@your-server-ip

# Cài đặt Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Cài đặt Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Kiểm tra
docker --version
docker-compose --version
```

### Bước 3: Push code lên GitHub

```bash
# Trên máy local
git add .
git commit -m "feat: add POI detail with QR code"
git push origin main
```

### Bước 4: Clone code lên VPS

```bash
# Trên VPS
git clone https://github.com/your-username/DiDuDuaDi.git
cd DiDuDuaDi
```

### Bước 5: Cấu hình environment

```bash
# Tạo file .env
cp .env.example .env
nano .env
```

**Nội dung file .env:**
```env
OPENAI_API_KEY=your_actual_openai_key
GOOGLE_MAPS_API_KEY=your_actual_google_maps_key
# Không cần PINECONE_API_KEY nếu chưa dùng
```

### Bước 6: Cấu hình domain (Khuyến nghị)

**Lý do cần domain:**
- QR code sẽ có URL đẹp: `https://diduduada.com/poi/xxx` thay vì `http://123.45.67.89:3000/poi/xxx`
- Hỗ trợ HTTPS (bảo mật)
- Dễ nhớ, chuyên nghiệp hơn

**Mua domain:**
- [Namecheap](https://www.namecheap.com/) (~$8-10/năm)
- [GoDaddy](https://www.godaddy.com/)
- [Pavietnam](https://www.pavietnam.vn/) (Việt Nam)

**Cấu hình DNS:**
```
A record: diduduada.com → your-server-ip
A record: www.diduduada.com → your-server-ip
```

### Bước 7: Deploy với Docker Compose

**Cập nhật docker-compose.yml cho production:**

```yaml
version: '3.8'

services:
  postgres:
    image: postgis/postgis:16-3.4
    environment:
      POSTGRES_DB: didududadi
      POSTGRES_USER: ${DB_USER:-postgres}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-postgres_secure_password}
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    restart: unless-stopped

  backend:
    build: ./backend/DiDuDuaDi.API
    ports:
      - "5000:8080"
    environment:
      ConnectionStrings__Default: "Host=postgres;Database=didududadi;Username=${DB_USER:-postgres};Password=${DB_PASSWORD:-postgres_secure_password}"
      OpenAI__ApiKey: "${OPENAI_API_KEY}"
      OpenAI__Model: "gpt-4o-mini"
    depends_on:
      - postgres
    restart: unless-stopped

  frontend:
    build: ./frontend
    ports:
      - "3000:80"
    environment:
      VITE_API_BASE_URL: "http://your-server-ip:5000"  # Hoặc domain của bạn
      VITE_GOOGLE_MAPS_API_KEY: "${GOOGLE_MAPS_API_KEY}"
    depends_on:
      - backend
    restart: unless-stopped

volumes:
  pgdata:
```

**Build và chạy:**
```bash
docker-compose up -d --build
```

**Kiểm tra logs:**
```bash
docker-compose logs -f
```

### Bước 8: Cấu hình Nginx + SSL (Nếu có domain)

```bash
# Cài đặt Nginx
sudo apt update
sudo apt install nginx -y

# Tạo config Nginx
sudo nano /etc/nginx/sites-available/diduduada
```

**Nội dung file config:**
```nginx
server {
    listen 80;
    server_name diduduada.com www.diduduada.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Kích hoạt config:**
```bash
sudo ln -s /etc/nginx/sites-available/diduduada /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

**Cài đặt SSL (HTTPS) với Let's Encrypt:**
```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d diduduada.com -d www.diduduada.com
```

### Bước 9: Cấu hình Firewall

```bash
# Mở ports cần thiết
sudo ufw allow 80    # HTTP
sudo ufw allow 443   # HTTPS
sudo ufw allow 22    # SSH
sudo ufw enable

# Kiểm tra
sudo ufw status
```

### Bước 10: Kiểm tra deployment

1. **Kiểm tra frontend:** `http://your-server-ip:3000` hoặc `https://diduduada.com`
2. **Kiểm tra backend:** `http://your-server-ip:5000/api/health`
3. **Kiểm tra QR code:** Đăng nhập admin → Quản lý POI → Chi tiết → Quét QR

---

## 🚀 Option 2: Deploy lên Cloud Platforms (Dễ hơn)

### 2.1. Deploy lên Render (Miễn phí)

**Ưu điểm:** Miễn phí, dễ setup, tự động HTTPS

**Hạn chế:** Free tier có thể sleep sau 15 phút không hoạt động

**Hướng dẫn:**
1. Đăng ký [Render](https://render.com/)
2. Connect GitHub repository
3. Tạo **Web Service** cho backend (.NET)
4. Tạo **Static Site** cho frontend (React)
5. Thêm **PostgreSQL** database từ Render dashboard
6. Cấu hình environment variables
7. Deploy!

**Chi phí:** Miễn phí (hoặc $7/tháng cho Pro)

### 2.2. Deploy lên Railway

**Ưu điểm:** Dễ setup, có free tier $5 credit/tháng

**Hướng dẫn:**
1. Đăng ký [Railway](https://railway.app/)
2. Connect GitHub
3. Railway tự động detect và deploy
4. Cấu hình environment variables
5. Done!

**Chi phí:** $5 credit miễn phí/tháng

### 2.3. Deploy lên Azure (Khuyến nghị cho SV)

**Ưu điểm:** Microsoft cho sinh viên free credit $100

**Hướng dẫn:**
1. Đăng ký [Azure for Students](https://azure.microsoft.com/free/students/)
2. Tạo **App Service** cho backend
3. Tạo **Static Web App** cho frontend
4. Tạo **Azure Database for PostgreSQL**
5. Deploy từ GitHub Actions

**Chi phí:** Miễn phí với tài khoản sinh viên

### 2.4. Deploy lên Vercel (Frontend) + Railway (Backend)

**Frontend trên Vercel:**
```bash
npm install -g vercel
cd frontend
vercel --prod
```

**Backend trên Railway:** Connect GitHub repository

**Chi phí:** Miễn phí

---

## 📋 Option 3: Deploy thủ công (Không khuyến nghị)

### Frontend (React/Vite):
```bash
cd frontend
npm run build
# Upload thư mục dist/ lên web server (Nginx/Apache)
```

### Backend (.NET):
```bash
cd backend/DiDuDuaDi.API
dotnet publish -c Release -o ./publish
# Chạy ứng dụng
cd publish
./DiDuDuaDi.API
```

---

## 🔧 Cấu hình cần thiết cho Production

### 1. Frontend Environment Variables

**File: `frontend/.env.production`**
```env
VITE_API_BASE_URL=https://api.diduduada.com
VITE_GOOGLE_MAPS_API_KEY=your_key
```

### 2. Backend Environment Variables

**File: `backend/appsettings.Production.json`**
```json
{
  "ConnectionStrings": {
    "Default": "Host=your-db-host;Database=didududadi;Username=xxx;Password=xxx"
  },
  "Jwt": {
    "SecretKey": "your-very-secure-secret-key-min-32-chars",
    "Issuer": "https://api.diduduada.com",
    "Audience": "https://diduduada.com"
  }
}
```

### 3. Cấu hình CORS trong Backend

**File: `Program.cs`**
```csharp
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy
            .WithOrigins("https://diduduada.com", "https://www.diduduada.com")
            .AllowAnyHeader()
            .AllowAnyMethod());
});
```

---

## 🎯 Quick Start - Deploy nhanh nhất (5 phút)

### Dùng Railway (Khuyến nghị cho demo/seminar):

1. **Tạo tài khoản Railway:** https://railway.app/

2. **Deploy Database (PostgreSQL):**
   - New Project → Database → Add PostgreSQL
   - Copy connection string

3. **Deploy Backend:**
   - New → GitHub Repo → Select repository
   - Environment Variables → Paste connection string
   - Deploy!

4. **Deploy Frontend:**
   - New → GitHub Repo → Select repository
   - Environment Variables:
     - `VITE_API_BASE_URL` = Backend URL
     - `VITE_GOOGLE_MAPS_API_KEY` = Your key
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Deploy!

5. **Test QR Code:**
   - Login admin
   - Quản lý POI → Chi tiết
   - Quét QR code bằng điện thoại

**Tổng chi phí:** ~$5/tháng (hoặc miễn phí với $5 credit)

---

## 📱 Test QR Code sau khi deploy

1. **Mở admin dashboard:** `https://your-domain.com/admin`
2. **Đăng nhập:** Demo Admin
3. **Vào:** Quản lý POI → Click "Chi tiết"
4. **Quét QR code** bằng điện thoại
5. **Kết quả:** Mở trang chi tiết POI trên mobile

---

## 🆘 Troubleshooting

### QR code không quét được:
- ✅ Kiểm tra URL trong QR code có đúng không
- ✅ Đảm bảo ứng dụng đã deploy và accessible từ internet
- ✅ Thử mở URL trực tiếp trên trình duyệt

### Build lỗi:
```bash
# Frontend
cd frontend
npm install
npm run build

# Backend
cd backend/DiDuDuaDi.API
dotnet restore
dotnet build
```

### Database không kết nối:
- ✅ Kiểm tra connection string
- ✅ Đảm bảo PostgreSQL đang chạy
- ✅ Kiểm tra firewall rules

---

## 📞 Hỗ trợ

Nếu gặp vấn đề khi deploy:
1. Check logs: `docker-compose logs -f`
2. Check backend health: `curl http://your-domain/api/health`
3. Check frontend console: F12 trên trình duyệt

---

## 💡 Tips

- **Domain name:** Nên mua domain để QR code chuyên nghiệp hơn
- **HTTPS:** Bắt buộc để QR code hoạt động tốt trên mobile
- **Backup:** Luôn backup database trước khi deploy phiên bản mới
- **Monitoring:** Dùng UptimeRobot để monitor ứng dụng 24/7 (miễn phí)
