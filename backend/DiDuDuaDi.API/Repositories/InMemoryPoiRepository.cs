using DiDuDuaDi.API.Models;

namespace DiDuDuaDi.API.Repositories;

public class InMemoryPoiRepository : IPoiRepository
{
    private readonly List<POI> _pois =

    [
        new()
        {
            Id = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            Name = Translate(
                "Bun Bo Di Sau",
                "Di Sau Beef Noodle",
                "Di Sau 牛肉粉",
                "ディーサウ牛肉麺",
                "디사우 소고기 국수",
                "Nouilles au boeuf Di Sau",
                "ก๋วยเตี๋ยวเนื้อดี่เซา"),
            Category = "food",
            Description = Translate(
                "Quan bun bo co nuoc dung dam da, thit mem va khong gian binh dan rat dong vao buoi toi o pho am thuc Vinh Khanh.",
                "A lively beef noodle spot on Vinh Khanh food street, known for rich broth, tender meat, and a busy local evening atmosphere.",
                "这家位于永庆美食街的牛肉粉店以浓郁汤头、软嫩牛肉和热闹的夜间气氛而受欢迎。",
                "ヴィンカイン食通りにある活気ある牛肉麺の店で、濃厚なスープと柔らかい牛肉、夜のにぎやかな雰囲気で人気です。",
                "빈카인 음식 거리에 있는 활기찬 소고기 국수집으로, 진한 국물과 부드러운 고기, 저녁의 북적이는 분위기로 유명합니다.",
                "Ce restaurant animé de nouilles au boeuf, situé dans la rue gourmande de Vinh Khanh, est apprécié pour son bouillon riche, sa viande tendre et son ambiance du soir.",
                "ร้านก๋วยเตี๋ยวเนื้อคึกคักบนถนนอาหารวิงห์คั้ญ มีน้ำซุปเข้มข้น เนื้อนุ่ม และบรรยากาศยามค่ำคืนที่มีชีวิตชีวา"),
            Location = new GeoPoint(10.7620, 106.7030)
        },
        new()
        {
            Id = Guid.Parse("22222222-2222-2222-2222-222222222222"),
            Name = Translate(
                "Banh Mi Vinh Khanh",
                "Vinh Khanh Banh Mi",
                "永庆法棍三明治",
                "ヴィンカインのバインミー",
                "빈카인 반미",
                "Banh mi de Vinh Khanh",
                "บั๋นหมี่วิงห์คั้ญ"),
            Category = "food",
            Description = Translate(
                "Xe banh mi phuc vu buoi toi voi vo banh gion, nhan day dan va vi nuoc sot de an nhanh khi di dao pho am thuc.",
                "An evening banh mi cart serving crispy bread, generous fillings, and a quick flavorful stop while walking through the food street.",
                "这辆夜间营业的法棍车有酥脆面包、丰富内馅和浓郁酱汁，适合边逛美食街边快速享用。",
                "夜に営業するバインミー屋台で、サクサクのパン、たっぷりの具材、風味豊かなソースが魅力です。",
                "밤에 운영하는 반미 노점으로, 바삭한 빵과 넉넉한 속재료, 풍부한 소스로 가볍게 즐기기 좋습니다.",
                "Ce stand de banh mi du soir propose un pain croustillant, une garniture généreuse et une sauce savoureuse, parfait pour une pause rapide.",
                "รถเข็นบั๋นหมี่ยามเย็นนี้มีขนมปังกรอบ ไส้แน่น และซอสเข้มข้น เหมาะกับการแวะกินเร็ว ๆ ระหว่างเดินเที่ยว"),
            Location = new GeoPoint(10.7625, 106.7035)
        },
        new()
        {
            Id = Guid.Parse("33333333-3333-3333-3333-333333333333"),
            Name = Translate(
                "Che 3 Mien",
                "Three Regions Sweet Soup",
                "三味甜品",
                "三地域のチェー",
                "삼색 베트남 디저트",
                "Dessert sucre des trois regions",
                "ของหวานสามภาค"),
            Category = "dessert",
            Description = Translate(
                "Quan che co nhieu topping, hop cho du khach muon thu mon trang mieng mat lanh sau khi an cac mon man.",
                "A dessert stop with many sweet soup toppings, perfect for visitors looking for a cool finish after savory street food.",
                "这家甜品店有丰富配料，适合在吃完咸食后来一份清凉甜点收尾。",
                "トッピングが豊富なチェーの店で、しょっぱい料理のあとにさっぱりしたデザートを楽しみたい人にぴったりです。",
                "토핑이 다양한 베트남식 디저트 가게로, 짭짤한 길거리 음식을 먹은 뒤 시원하게 마무리하기 좋습니다.",
                "Une adresse dessert avec de nombreuses garnitures, idéale pour finir en douceur et en fraîcheur après les plats salés.",
                "ร้านของหวานที่มีท็อปปิ้งหลากหลาย เหมาะสำหรับปิดท้ายมื้ออาหารคาวด้วยของหวานเย็น ๆ"),
            Location = new GeoPoint(10.7615, 106.7025)
        },
        new()
        {
            Id = Guid.Parse("44444444-4444-4444-4444-444444444444"),
            Name = Translate(
                "Oc Dem Vinh Khanh",
                "Vinh Khanh Night Snails",
                "永庆夜螺",
                "ヴィンカイン夜の巻き貝料理",
                "빈카인 야간 달팽이 요리",
                "Escargots de nuit Vinh Khanh",
                "หอยยามค่ำคืนวิงห์คั้ญ"),
            Category = "seafood",
            Description = Translate(
                "Quan oc dem mang khong khi nhon nhip dac trung cua Vinh Khanh, noi bat voi cac mon oc xao bo toi va nuoc cham dam vi.",
                "A late-night seafood stop that captures the lively Vinh Khanh vibe, especially popular for buttery garlic snails and bold dipping sauce.",
                "这家夜间海鲜店充满永庆的热闹气氛，蒜香黄油炒螺和味道浓郁的蘸酱尤其受欢迎。",
                "ヴィンカインらしいにぎやかな雰囲気を味わえる深夜の海鮮店で、ガーリックバター炒めの巻き貝が人気です。",
                "빈카인의 활기찬 분위기를 느낄 수 있는 심야 해산물 식당으로, 버터 마늘 달팽이 요리와 진한 소스가 특히 유명합니다.",
                "Une adresse de fruits de mer de nuit qui reflète l'ambiance animée de Vinh Khanh, surtout connue pour ses escargots au beurre et à l'ail.",
                "ร้านซีฟู้ดยามดึกที่สะท้อนบรรยากาศคึกคักของวิงห์คั้ญ โดดเด่นด้วยหอยผัดเนยกระเทียมและน้ำจิ้มรสจัด"),
            Location = new GeoPoint(10.7618, 106.7038)
        }
    ];

    public IReadOnlyList<POI> GetAll(Guid? userId = null) => _pois;

    public POI? GetById(Guid id, Guid? userId = null) => _pois.FirstOrDefault(p => p.Id == id);

    public POI Add(POI poi)
    {
        poi.Id = Guid.NewGuid();
        _pois.Add(poi);
        return poi;
    }

    public POI Update(POI poi)
    {
        var existing = _pois.FirstOrDefault(p => p.Id == poi.Id);
        if (existing != null)
        {
            existing.Name = poi.Name;
            existing.Category = poi.Category;
            existing.Description = poi.Description;
            existing.Location = poi.Location;
            existing.Radius = poi.Radius;
            existing.ImageUrl = poi.ImageUrl;
        }
        return existing ?? poi; // Should throw NotFoundException ideally, but MVP
    }

    public bool Delete(Guid id)
    {
        var poi = _pois.FirstOrDefault(p => p.Id == id);
        if (poi != null)
        {
            return _pois.Remove(poi);
        }
        return false;
    }

    public IReadOnlyList<POI> GetNearby(double lat, double lng, double radiusMeters, Guid? userId = null)
    {
        return _pois
            .Select(p => new { Poi = p, Distance = HaversineMeters(lat, lng, p.Location.Lat, p.Location.Lng) })
            .Where(x => x.Distance <= radiusMeters)
            .OrderBy(x => x.Distance)
            .Select(x => x.Poi)
            .ToList();
    }

    private static double HaversineMeters(double lat1, double lon1, double lat2, double lon2)
    {
        const double R = 6371000;
        var dLat = DegreesToRadians(lat2 - lat1);
        var dLon = DegreesToRadians(lon2 - lon1);

        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(DegreesToRadians(lat1)) * Math.Cos(DegreesToRadians(lat2)) *
                Math.Sin(dLon / 2) * Math.Sin(dLon / 2);

        var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
        return R * c;
    }

    private static double DegreesToRadians(double degrees) => degrees * (Math.PI / 180);

    private static Dictionary<string, string> Translate(
        string vi,
        string en,
        string zh,
        string ja,
        string ko,
        string fr,
        string th)
    {
        return new Dictionary<string, string>
        {
            ["vi"] = vi,
            ["en"] = en,
            ["zh"] = zh,
            ["ja"] = ja,
            ["ko"] = ko,
            ["fr"] = fr,
            ["th"] = th
        };
    }
}
