# Meri Design House Desktop Uygulaması

Modern, entegre stok ve sipariş yönetim sistemi.

## 🚀 Özellikler

### 📊 Dashboard
- Gerçek zamanlı istatistikler
- Toplam müşteri, ürün ve sipariş sayıları
- Düşük stok uyarıları
- Son siparişler ve en çok satan ürünler

### 📦 Stok Yönetimi
- Ürün arama ve filtreleme
- Stok seviyesi takibi
- Stok giriş/çıkış işlemleri
- Düşük stok uyarıları
- Kategori bazlı filtreleme

### 📋 Sipariş Yönetimi
- Sipariş arama ve filtreleme
- Durum takibi (Bekliyor → Onaylandı → Hazırlanıyor → Kargoda → Teslim Edildi)
- Müşteri bilgileri ve sipariş detayları
- Sipariş durumu güncelleme

### 📈 Raporlar
- Özet rapor (satış, sipariş, müşteri analizi)
- Aylık satış raporları
- Stok durumu raporları
- Müşteri analizi raporları
- Rapor export özelliği

## 🛠️ Kurulum

### Gereksinimler
- Node.js 16+
- npm veya yarn
- Supabase hesabı

### Adımlar
1. Depoyu klonlayın:
```bash
git clone <repository-url>
cd meridesignhousedesktop/desktop-app
```

2. Bağımlılıkları yükleyin:
```bash
npm install
```

3. Environment variables'ları ayarlayın:
```bash
cp .env.example .env
```

`.env` dosyasında şu değerleri ayarlayın:
```
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

4. Uygulamayı çalıştırın:
```bash
npm run dev
```

## 🔄 Veri Entegrasyonu

### Supabase Bağlantısı
- Web sitesi ile aynı Supabase veritabanını kullanır
- Gerçek zamanlı veri senkronizasyonu
- Otomatik veri güncellemeleri

### Veri Migrasyonu
Excel verileriniz SQLite formatına çevrilip Supabase'e aktarılmıştır:
- ✅ Müşteriler (616 kayıt)
- ✅ Ürünler (138 kayıt)
- ✅ Siparişler (801 kayıt)

## 📱 Kullanım

### Dashboard
Ana sayfa, genel durumu gösterir. İstatistikleri yenilemek için "Yenile" butonunu kullanın.

### Stok Yönetimi
- Arama kutusu ile ürün arayın
- Kategori ve durum filtreleri uygulayın
- Stok ekleme/çıkarma işlemleri yapın
- Dialog penceresi ile detaylı stok düzenleme

### Sipariş Yönetimi
- Sipariş numarası veya müşteri bilgileri ile arama yapın
- Durum filtreleri uygulayın
- "Detay" butonu ile sipariş detaylarını görün
- Durum geçiş butonları ile sipariş durumunu güncelleyin

### Raporlar
- Rapor türünü seçin (Özet, Satış, Stok, Müşteri)
- Tarih aralığı seçin
- "Export" butonu ile raporu JSON formatında indirin

## ⚙️ Ayarlar

### Tema
- Açık/koyu tema seçimi
- Sistem teması otomatik algılama

### Bildirimler
- Düşük stok uyarıları
- Yeni sipariş bildirimleri

## 🔒 Güvenlik

- Supabase Row Level Security (RLS) aktif
- Veri validasyonu
- Business rules kontrolü
- Hata yönetimi ve logging

## 🐛 Sorun Giderme

### Yaygın Sorunlar
1. **Bağlantı hatası**: İnternet bağlantınızı kontrol edin
2. **Veri görünmüyor**: Uygulamayı yeniden başlatın
3. **Stok güncellenmiyor**: Yetkinizi kontrol edin

### Destek
Sorunlarınız için log dosyalarını kontrol edin:
```
logs/error.log
logs/performance.log
```

## 📊 Performans

- Real-time veri güncellemeleri
- Query caching
- Lazy loading
- Background sync

## 🔄 Güncellemeler

### Otomatik Güncelleme
- Yeni versiyonlar otomatik olarak algılanır
- Güvenli güncelleme sistemi

### Backup
- Otomatik yedekleme
- Manuel yedekleme seçeneği

## 📝 Değişiklik Geçmişi

### v1.0.0
- ✅ Database entegrasyonu tamamlandı
- ✅ Excel verileri migrate edildi
- ✅ Dashboard, Stok, Sipariş, Rapor modülleri eklendi
- ✅ Gelişmiş validasyon ve business rules
- ✅ Modern UI/UX tasarımı

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun
3. Değişikliklerinizi commit edin
4. Push yapın
5. Pull Request oluşturun

## 📄 Lisans

Bu proje Meri Design House tarafından geliştirilmiştir.

---

**Destek**: Sorunlarınız için teknik destek ekibi ile iletişime geçin.
