# Đặc Tả Yêu Cầu - Web App Thuyết Minh Phố Ẩm Thực Vĩnh Khánh

## 1. Tổng Quan Dự Án

### 1.1. Tên Dự Án

**DiDuDuaDi** - Web App Thuyết Minh Tự Động cho Phố Ẩm Thực Vĩnh Khánh

### 1.2. Mục Tiêu

Cung cấp trải nghiệm tham quan thông minh cho du khách tại Phố Ẩm Thực Vĩnh Khánh thông qua:

- Thuyết minh tự động đa ngôn ngữ
- Định vị thời gian thực
- Hỗ trợ tương tác qua chatbot AI
- Gợi ý lộ trình tối ưu

### 1.3. Đối Tượng Sử Dụng

- Du khách quốc tế và trong nước
- Người địa phương muốn khám phá khu vực
- Hướng dẫn viên du lịch
- Quản lý điểm tham quan

---

## 2. Tính Năng Chính

### 2.1. Định Vị GPS và Bản Đồ Tương Tác

#### Yêu cầu chức năng:

- **GPS Real-time**: Hiển thị vị trí thực tế của người dùng trên bản đồ
- **POI Lân Cận**: Tự động phát hiện và hiển thị các điểm tham quan trong bán kính 50-500m
- **Bản Đồ Tương Tác**:
  - Zoom in/out
  - Pan/drag bản đồ
  - Markers cho các điểm quan trọng
  - Cluster markers khi zoom out
- **Thông Báo Proximity**: Gửi thông báo khi người dùng đến gần điểm tham quan (radius 20-30m)
- **Chế Độ Offline**: Cache bản đồ cho khu vực để sử dụng khi không có internet

#### Công nghệ đề xuất:

- Google Maps API / Mapbox GL JS
- HTML5 Geolocation API
- Service Worker cho offline mode

---

### 2.2. Thuyết Minh Đa Ngôn Ngữ

#### Yêu cầu chức năng:

- **Hỗ trợ ngôn ngữ**: Tối thiểu 15 ngôn ngữ
  - Việt Nam, English, 中文, 日本語, 한국어, Español, Français, Deutsch, Italiano, Português, Русский, العربية, ไทย, Bahasa Indonesia, Bahasa Melayu
- **Định dạng nội dung**:
  - Text: Mô tả chi tiết về lịch sử, văn hóa, ẩm thực
  - Audio Guide: File âm thanh chất lượng cao (MP3/AAC), thời lượng 1-3 phút/điểm
  - Hình ảnh: Gallery ảnh HD cho mỗi điểm tham quan
- **Tự động phát**: Phát audio khi người dùng đến gần điểm tham quan (tùy chọn)
- **Điều khiển phát**: Play, pause, skip, speed control (0.75x - 1.5x)
- **Phụ đề**: Hiển thị transcript đồng bộ với audio

#### Nội dung cho mỗi POI:

- Tên điểm tham quan
- Lịch sử và nguồn gốc
- Đặc trưng văn hóa
- Món ăn đặc sản (nếu là quán ăn)
- Giờ mở cửa, giá cả
- Đánh giá và tips từ du khách

---

### 2.3. Chatbot AI với RAG (Retrieval-Augmented Generation)

#### Yêu cầu chức năng:

- **Giao diện chat**: Floating chat button, full-screen chat mode
- **Đa ngôn ngữ**: Tự động nhận diện và trả lời bằng ngôn ngữ người dùng đang sử dụng
- **Khả năng trả lời**:
  - Thông tin về các điểm tham quan
  - Lịch sử, văn hóa địa phương
  - Gợi ý món ăn, quán ăn
  - Chỉ đường và khoảng cách
  - Giá cả và giờ mở cửa
  - So sánh các lựa chọn
- **Context Awareness**: Biết vị trí hiện tại của người dùng để đưa ra câu trả lời phù hợp
- **Rich Responses**: Không chỉ text mà còn có thể gửi:
  - Hình ảnh
  - Link bản đồ
  - Audio clips
  - Quick action buttons

#### Công nghệ đề xuất:

- LLM: OpenAI GPT-4 / Anthropic Claude / Google Gemini
- Vector Database: Pinecone / Weaviate / Chroma
- Embeddings: OpenAI text-embedding-3 / Cohere
- Framework: LangChain / LlamaIndex

#### Knowledge Base:

- Tất cả nội dung thuyết minh
- Đánh giá và review từ du khách
- FAQ thường gặp
- Thông tin thực tế (giá, giờ mở cửa, liên hệ)

---

### 2.4. Gợi Ý Lộ Trình Thông Minh

#### Yêu cầu chức năng:

- **Lộ trình có sẵn**: 3-5 lộ trình mẫu được thiết kế sẵn
  - Lộ trình ẩm thực (2-3 giờ)
  - Lộ trình văn hóa lịch sử (1-2 giờ)
  - Lộ trình cho gia đình có trẻ em
  - Lộ trình buổi tối
  - Lộ trình express (30 phút - 1 giờ)
- **Lộ trình tùy chỉnh**:
  - Người dùng chọn POIs muốn tham quan
  - Hệ thống tự động tính toán lộ trình tối ưu (shortest path)
  - Tính toán thời gian di chuyển và thời gian tham quan
- **Thông tin lộ trình**:
  - Tổng khoảng cách
  - Tổng thời gian dự kiến
  - Số điểm tham quan
  - Độ khó (dễ, trung bình, khó)
  - Thời điểm phù hợp (buổi sáng, chiều, tối)
- **Navigation**: Chỉ đường turn-by-turn đến điểm tiếp theo
- **Progress Tracking**: Theo dõi tiến độ tham quan

#### Thuật toán đề xuất:

- Traveling Salesman Problem (TSP) optimization
- Dijkstra / A\* pathfinding
- Tính toán dựa trên: khoảng cách, thời gian mở cửa, độ ưu tiên

---

## 3. Yêu Cầu Phi Chức Năng

### 3.1. Hiệu Năng

- **Tải trang**: < 3 giây trên 4G
- **First Contentful Paint**: < 1.5 giây
- **Time to Interactive**: < 3.5 giây
- **Smooth GPS tracking**: Cập nhật vị trí mỗi 2-3 giây
- **Audio loading**: Preload audio cho điểm tiếp theo

### 3.2. Khả Năng Tương Thích

- **Responsive Design**: Hoạt động tốt trên mobile, tablet, desktop
- **Browser Support**:
  - Chrome/Edge 90+
  - Safari 14+
  - Firefox 88+
- **Device Support**: iOS 13+, Android 8+

### 3.3. Accessibility (Khả năng Tiếp Cận)

- **WCAG 2.1 Level AA** compliance
- Screen reader support
- Keyboard navigation
- High contrast mode
- Font size adjustment

### 3.4. Bảo Mật và Quyền Riêng Tư

- **HTTPS**: Tất cả traffic được mã hóa
- **Location Privacy**: Không lưu trữ lịch sử vị trí cá nhân
- **Data Minimization**: Chỉ thu thập dữ liệu cần thiết
- **GDPR Compliance**: Tuân thủ quy định bảo vệ dữ liệu

### 3.5. Offline Support

- **PWA**: Progressive Web App với offline capability
- **Cached Content**:
  - Bản đồ khu vực
  - Nội dung text cho tất cả POIs
  - Audio guides (tùy chọn download)
- **Sync**: Đồng bộ dữ liệu khi có kết nối trở lại

---

## 4. Yêu Cầu Kỹ Thuật

### 4.1. Frontend

- **Framework**: React 18+
- **Build Tool**: Vite / Create React App
- **State Management**: Redux Toolkit / Zustand
- **Routing**: React Router v6
- **UI Library**: Material-UI (MUI) / Ant Design / Tailwind CSS
- **Maps**: Google Maps API (@react-google-maps/api) / Mapbox GL JS
- **Audio Player**: Howler.js / React Audio Player
- **HTTP Client**: Axios / React Query
- **Forms**: React Hook Form + Yup/Zod validation
- **PWA**: Workbox / vite-plugin-pwa
- **i18n**: react-i18next

### 4.2. Backend

- **Framework**: ASP.NET Core 8.0 Web API
- **Architecture**: Clean Architecture / Onion Architecture
- **ORM**: Entity Framework Core 8.0
- **Database**:
  - SQL Server / PostgreSQL (với PostGIS extension cho geo data)
  - Azure SQL Database (cloud option)
- **Authentication**: JWT Bearer / Identity Server / Azure AD
- **API Documentation**: Swagger/OpenAPI (Swashbuckle)
- **Caching**: Redis (StackExchange.Redis) / In-Memory Cache
- **Vector DB**: Pinecone / Weaviate / Azure AI Search cho RAG
- **Storage**: Azure Blob Storage / AWS S3 cho media files
- **CDN**: Azure CDN / CloudFront / Cloudflare
- **Dependency Injection**: Built-in .NET DI Container
- **Logging**: Serilog / NLog

### 4.3. AI/ML

- **LLM Provider**: OpenAI / Anthropic / Google Vertex AI
- **Embedding Model**: OpenAI text-embedding-3 / Sentence Transformers
- **Vector Search**: HNSW / FAISS
- **RAG Framework**: LangChain / LlamaIndex

### 4.4. DevOps

- **Hosting**:
  - Frontend: Vercel / Netlify / Azure Static Web Apps
  - Backend: Azure App Service / AWS Elastic Beanstalk / Docker + Kubernetes
- **CI/CD**: GitHub Actions / Azure DevOps Pipelines
- **Containerization**: Docker + Docker Compose
- **Orchestration**: Kubernetes (optional for scale)
- **Monitoring**:
  - Application: Application Insights / Sentry
  - Performance: Google Analytics / Mixpanel
  - Infrastructure: Azure Monitor / Datadog / New Relic
  - APM: Application Insights / New Relic APM
- **Version Control**: Git + GitHub
- **API Gateway**: Azure API Management / Kong (optional)

---

## 5. Data Schema

### 5.1. Point of Interest (POI)

```json
{
  "id": "string",
  "name": {
    "vi": "string",
    "en": "string"
    // ... other languages
  },
  "category": "restaurant | landmark | shop | entertainment",
  "location": {
    "lat": "number",
    "lng": "number",
    "address": "string"
  },
  "description": {
    "vi": "string",
    "en": "string"
    // ... other languages
  },
  "audio_guides": {
    "vi": "url",
    "en": "url"
    // ... other languages
  },
  "images": ["url1", "url2"],
  "opening_hours": "string",
  "price_range": "$ | $$ | $$$",
  "rating": "number",
  "specialties": ["string"],
  "accessibility": {
    "wheelchair": "boolean",
    "parking": "boolean"
  }
}
```

### 5.2. Route (Lộ trình)

```json
{
  "id": "string",
  "name": {
    "vi": "string",
    "en": "string"
  },
  "description": "string",
  "duration_minutes": "number",
  "distance_meters": "number",
  "difficulty": "easy | medium | hard",
  "best_time": "morning | afternoon | evening",
  "poi_sequence": ["poi_id1", "poi_id2"],
  "tags": ["food", "culture", "family-friendly"]
}
```

---

## 6. User Stories

### US-1: Du khách quốc tế

_"Là du khách người Nhật, tôi muốn được thuyết minh bằng tiếng Nhật và nghe audio guide trong khi đi dạo"_

**Acceptance Criteria:**

- Có thể chuyển đổi ngôn ngữ sang tiếng Nhật
- Audio guide phát tự động khi đến gần POI
- Text description đồng bộ với audio

### US-2: Người dùng lần đầu

_"Tôi không biết nên đi đâu, cần gợi ý lộ trình phù hợp với 2 giờ tham quan"_

**Acceptance Criteria:**

- Hiển thị các lộ trình gợi ý
- Filter theo thời gian, sở thích
- Preview lộ trình trên bản đồ

### US-3: Người dùng tò mò

_"Tôi muốn hỏi về lịch sử của con đường này và món ăn nổi tiếng"_

**Acceptance Criteria:**

- Chatbot trả lời chính xác về lịch sử
- Gợi ý món ăn dựa trên vị trí hiện tại
- Đưa ra link hoặc chỉ đường đến quán

### US-4: Offline user

_"Tôi muốn sử dụng app khi không có kết nối internet"_

**Acceptance Criteria:**

- Download nội dung offline trước
- Bản đồ hoạt động offline
- GPS vẫn track được vị trí

---

## 7. Roadmap Phát Triển

### Phase 1: MVP (2-3 tháng)

- [ ] Bản đồ cơ bản với GPS tracking
- [ ] 5-10 POIs với nội dung tiếng Việt và English
- [ ] Audio guide cơ bản
- [ ] 2-3 lộ trình mẫu
- [ ] Responsive web app

### Phase 2: AI Integration (1-2 tháng)

- [ ] Chatbot RAG với knowledge base
- [ ] Mở rộng 15+ ngôn ngữ
- [ ] Cải thiện UX/UI
- [ ] Analytics và monitoring

### Phase 3: Advanced Features (2-3 tháng)

- [ ] PWA với offline support
- [ ] Route optimization algorithm
- [ ] User personalization
- [ ] Social features (share, review)
- [ ] Admin dashboard

### Phase 4: Scale & Optimize (ongoing)

- [ ] Performance optimization
- [ ] Mở rộng coverage area
- [ ] Gamification
- [ ] AR features (future)

---

## 8. Metrics và KPIs

### 8.1. User Engagement

- Daily Active Users (DAU)
- Average session duration
- POIs visited per session
- Audio guide completion rate
- Chat messages per user

### 8.2. Technical Performance

- Page load time
- API response time
- Error rate
- GPS accuracy
- Audio buffering time

### 8.3. Content Quality

- User satisfaction rating
- Chat resolution rate
- Language coverage
- Content completeness

---

## 9. Rủi Ro và Giải Pháp

| Rủi Ro                        | Impact | Giải Pháp                                  |
| ----------------------------- | ------ | ------------------------------------------ |
| GPS không chính xác trong nhà | High   | Sử dụng beacons/NFC tags                   |
| LLM cost quá cao              | Medium | Rate limiting, cache responses             |
| Audio file quá nặng           | Medium | Compression, adaptive streaming            |
| Thiếu nội dung chất lượng     | High   | Hợp tác với chuyên gia địa phương          |
| Privacy concerns              | Medium | Transparent data policy, minimize tracking |

---

## 10. Tài Liệu Tham Khảo

### 10.1. Công Nghệ

- [Google Maps Platform](https://developers.google.com/maps)
- [OpenAI API](https://platform.openai.com/docs)
- [LangChain Documentation](https://python.langchain.com/)
- [PWA Guides](https://web.dev/progressive-web-apps/)

### 10.2. Best Practices

- W3C Web Content Accessibility Guidelines
- Google's Mobile-First Indexing
- Audio Guide UX Patterns

---

## Phụ Lục A: Wireframes

_(Sẽ được bổ sung)_

## Phụ Lục B: API Specifications

_(Sẽ được bổ sung)_

## Phụ Lục C: Database Schema Details

_(Sẽ được bổ sung)_
