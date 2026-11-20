# Kılıç Elektrik Web Sitesi

Bağcılar'daki Kılıç Elektrik için hizmetlerini tanıtan, müşteri talebi toplayan ve takip eden dinamik web sitesi.
BİLP2135 Web ve İnternet Programcılığı II dönem projesi.

**Teknoloji:** Node.js, Express, EJS, MongoDB Atlas (Mongoose), sharp, Resend
**Canlı adres:** _(Render'a yükledikten sonra buraya yazın)_

---

## Müşterinin sorunu ve çözüm

Kılıç Elektrik'in web sitesi yoktu. Müşteriler ustayı telefonla arıyor, arızanın fotoğrafını WhatsApp'tan dağınık şekilde gönderiyordu. Hangi talebin hangi aşamada olduğu takip edilemiyordu. İşletme ayrıca Google Ads ile reklam vermek, sitedeki fotoğrafları da kendisi eklemek istiyordu.

| Özellik | Ne işe yarar |
|---|---|
| **Hizmetlerimiz** | 19 hizmet, fotoğraflı kart ve her biri için ayrı sayfa (`/hizmetler/fabrika-aydinlatma` gibi). Google araması ve reklamlar doğrudan ilgili sayfaya gelir. |
| **İki kapılı giriş** | "Projem için" (fabrika, depo, mağaza, şantiye) ve "Evim için" (arıza, priz, avize) farklı formlara gider. Sitede fiyat gösterilmez; fiyat keşiften sonra verilir. |
| **Fotoğraflı arıza bildirimi** | Ev müşterisi en fazla 3 fotoğraf yükler. Fotoğraflar sadece ustaya görünür. |
| **Proje talebi** | Yapı tipi, kat, m², kapsam, ilgili hizmet ve isteğe bağlı PDF çizim. |
| **Takip kodu** | Her talebe `KE-2026-0001` gibi bir kod verilir. Müşteri giriş yapmadan durumunu görür. |
| **Usta paneli** | Talepler durum sütunlarında. Durum güncelleme, not, arama, filtre, silme. |
| **Fotoğrafları usta ekler** | Hizmet fotoğraflarını değiştirme ve telefondan "Yaptığımız işler" galerisine iş fotoğrafı ekleme. Fotoğraflar otomatik küçültülür. |
| **Google Ads hazırlığı** | Çerez onayı, dönüşüm takibi (talep gönderildi, arandı / WhatsApp), sitemap, sayfa açıklamaları, işletme bilgisi (schema.org). |
| **KVKK** | Formda onay zorunlu. Takip sayfası kişisel veri göstermez. Reklam çerezleri yalnızca onayla çalışır. |

## Ödev şartlarının karşılığı

| Şart | Projede nerede |
|---|---|
| Dinamik backend | Express, `src/app.js` ve `src/routes/` |
| Veritabanı | MongoDB Atlas, modeller `src/models/` |
| CRUD | **Talepler** (oluştur: müşteri formu; listele, güncelle, sil: panel), **Hizmetler** ve **Galeri** (panelde fotoğraflı tam CRUD) |
| Form ve doğrulama | `src/middleware/dogrulama.js` (sunucu), formlarda `required`/`pattern` (tarayıcı) |
| Responsive | `public/css/site.css`, 920px ve 560px kırılımları |
| Canlı yayın | Render |
| Opsiyonel | Giriş sistemi, dosya yükleme, e-posta, arama/filtre, harita linki, hız sınırı, SEO, Google Ads |

---

## Klasör yapısı

```
src/
  server.js              Giriş noktası: veritabanına bağlan, ilk verileri yükle, sunucuyu başlat
  app.js                 Express ayarları: güvenlik (CSP), oturum, şablonlar, rotalar, hata sayfaları
  config/index.js        Ortam değişkenleri ve işletme bilgileri
  data/hizmetler.js      İlk açılışta yüklenen 19 proje + 8 ev hizmeti
  models/                Veritabanı şemaları (Talep, Hizmet, Is, Dosya, Kullanici, Sayac)
  routes/                Hangi adres hangi fonksiyona gider (public.js, admin.js)
  controllers/           Sayfalar ve işlemler (public, admin, dosya, seo)
  middleware/            Doğrulama kuralları, dosya yükleme, giriş kontrolü, hız sınırı
  services/              Dosya deposu (sharp + MongoDB), e-posta, ilk açılış verisi
views/
  public/                Ziyaretçi sayfaları (EJS)
  admin/                 Usta paneli sayfaları
  partials/              Ortak parçalar: üst/alt, hizmet kartı, iletişim, hata mesajları
public/
  css/                   site.css (tasarım), admin.css (panel)
  js/site.js             Menü, kopyala, dosya önizleme, çift gönderim engeli
  js/reklam.js           Çerez onayı ve Google Ads dönüşüm takibi (sadece reklam açıksa yüklenir)
  img/hizmetler/         19 hizmet fotoğrafı (büyük ve küçük sürüm)
```

## Fotoğraflar nasıl saklanıyor?

Render'ın ücretsiz sunucusunda disk geçicidir; sunucu yeniden başlayınca oraya kaydedilen dosyalar silinir. Bu yüzden yüklenen fotoğraflar **veritabanında** saklanır (`Dosya` modeli):

1. Fotoğraf `sharp` ile döndürülür (telefonun dik/yatay bilgisi), konum bilgisi (EXIF) silinir.
2. İki sürüm üretilir: büyük (en fazla 1600 px) ve küçük (640 px), ikisi de JPEG. 5 MB'lık bir telefon fotoğrafı yaklaşık 200–300 KB'a iner.
3. `/dosya/:id` adresinden sunulur. Hizmet ve galeri fotoğrafları herkese açıktır ve tarayıcıda önbelleğe alınır. **Müşteri talep fotoğrafları ve PDF'ler sadece giriş yapmış ustaya gösterilir**, diğerlerine 404 döner.

Atlas'ın ücretsiz 512 MB alanı binlerce fotoğrafa yeter.

## Bir talebin yolculuğu (sunumda anlatmak için)

1. Müşteri bir hizmet sayfasında "Görüşme talep et"e basar → `/projem?hizmet=magaza-aydinlatma`, hizmet formda seçili gelir
2. Formu gönderir → `POST /projem`
3. `talepSiniri` aynı kişinin çok sık göndermesini engeller
4. `yukleme.projeDosyasi` (multer) dosyayı belleğe alır, tür ve boyutu kontrol eder
5. `projeTalepKurallari` (express-validator) alanları kontrol eder, telefonu `0532 111 22 33` biçimine getirir
6. Hata varsa form, hatalar ve girilen değerlerle tekrar gösterilir (422)
7. Hata yoksa PDF gerçekten PDF mi diye bakılır, veritabanına gizli dosya olarak kaydedilir, `Sayac` ile sıradaki takip kodu alınır, `Talep` kaydedilir
8. Ustaya e-posta gider, müşteri "Talebiniz alındı" sayfasına yönlendirilir (303). Reklam açıksa bu sayfa Google Ads'e "talep" dönüşümü bildirir.
9. Usta panelde durumu "Keşif planlandı" yapar → müşteri `/takip` sayfasında bunu görür

---

## Yerelde çalıştırma

Gerekenler: Node.js 20 veya üstü, bir MongoDB adresi (Atlas'taki ücretsiz küme yeterli).

```bash
npm install
cp .env.example .env      # Windows: copy .env.example .env
# .env içinde en az MONGODB_URI, SESSION_SECRET ve ADMIN_PASSWORD'ü doldurun
npm run dev
```

Tarayıcıda `http://localhost:3000` açılır. Panel: `http://localhost:3000/admin`

---

## Canlıya alma

### 1. MongoDB Atlas (tamamlandı)

Küme, veritabanı kullanıcısı ve `0.0.0.0/0` erişim izni hazır. Render'a girilecek bağlantı adresi için: **Clusters → Connect → Drivers**. Adresteki `<db_password>` yerine veritabanı şifresini yazın ve `.net/` sonrasına `kilic-elektrik` ekleyin:

`mongodb+srv://kullanici:SIFRE@cluster0.xxxxx.mongodb.net/kilic-elektrik?retryWrites=true&w=majority`

Kümeye "sample dataset" yüklendiyse alan açmak için **Data Explorer**'da `sample_` ile başlayan veritabanlarını silin.

### 2. Resend (e-posta bildirimi, isteğe bağlı)

[resend.com](https://resend.com) adresinde **bildirimlerin gideceği e-posta adresiyle** hesap açın, **API Keys** → yeni anahtar. Kendi alan adınız olmadan Resend yalnızca hesabı açtığınız adrese e-posta gönderir; bu proje için yeterli.

### 3. Render (sunucu)

1. [render.com](https://render.com) adresinde GitHub hesabınızla giriş yapın.
2. **New → Web Service** → `kilic-elektrik-web` reposunu seçin.
3. **Runtime:** Node, **Build Command:** `npm install`, **Start Command:** `npm start`, **Instance Type:** Free
4. **Environment Variables:**

| Anahtar | Değer |
|---|---|
| `NODE_ENV` | `production` |
| `MONGODB_URI` | Atlas bağlantı adresi |
| `SESSION_SECRET` | Uzun rastgele bir metin |
| `ADMIN_USERNAME` | `usta` |
| `ADMIN_PASSWORD` | Güçlü bir şifre |
| `SITE_URL` | Render'ın verdiği adres, örn. `https://kilic-elektrik.onrender.com` |
| `RESEND_API_KEY`, `NOTIFY_EMAIL` | İsteğe bağlı, e-posta için |

5. **Create Web Service**. Loglarda `Kılıç Elektrik ... portunda çalışıyor` yazmalı. İlk açılışta 27 hizmet ve usta hesabı otomatik oluşur.

Render'ın ücretsiz sunucusu bir süre ziyaret edilmezse uykuya geçer; ilk açılış yarım dakikayı bulabilir. Sunumdan önce siteyi bir kez açın.

### 4. Google Ads (reklam hesabı açılınca)

1. Google Ads'te **Hedefler → Dönüşümler → Yeni dönüşüm işlemi → Web sitesi** ile iki dönüşüm oluşturun: "Talep gönderildi" ve "Arama / WhatsApp tıklaması".
2. Etiket kurulumunda **"Google etiketini kendim yükleyeceğim"** seçin. Verilen koddaki `AW-…` kimliğini ve her dönüşümün `send_to: 'AW-…/ETIKET'` kısmındaki etiketi alın.
3. Render'da şu değişkenleri ekleyin: `GOOGLE_ADS_ID`, `GOOGLE_ADS_TALEP_ETIKETI`, `GOOGLE_ADS_ARAMA_ETIKETI`. Kodda değişiklik gerekmez.
4. Site çerez bandını göstermeye başlar. Ziyaretçi onay vermeden Google kodu yüklenmez.
5. Reklamlarda hedef sayfa olarak ilgili hizmet sayfasını kullanın (örn. "fabrika aydınlatma" reklamı → `/hizmetler/fabrika-aydinlatma`).
6. Google Search Console'a siteyi ekleyip `SITE_URL/sitemap.xml` adresini gönderin.

### Kontrol listesi

- [ ] Ana sayfa, Hizmetlerimiz, bir hizmet sayfası, Projem için, Evim için açılıyor
- [ ] Telefondan fotoğraflı bir ev talebi ve bir proje talebi gönderildi, takip kodları alındı
- [ ] Panelde talepler görünüyor, fotoğraf açılıyor, durum değiştirilebiliyor
- [ ] Panelden bir hizmetin fotoğrafı değiştirildi, sitede yenisi görünüyor
- [ ] Telefondan "İş fotoğrafı ekle" ile galeriye bir iş eklendi
- [ ] Hizmet listesi kuzeninizle birlikte kontrol edildi
- [ ] Deneme talepleri panelden silindi

---

## Güvenlik notları

- Şifreler bcrypt ile özetlenerek saklanır.
- Girişte oturum kimliği yenilenir (oturum sabitleme saldırısına karşı).
- Çerezler `httpOnly`, `sameSite=lax` ve canlıda `secure` (CSRF ve çerez çalmaya karşı).
- `helmet` ile güvenlik başlıkları ve içerik güvenlik politikası (CSP). Google adreslerine yalnızca reklam açıksa izin verilir.
- EJS `<%= %>` çıktıları otomatik kaçırır; formdan gelen HTML/script çalışmaz (XSS).
- Form gönderimi ve giriş denemeleri hız sınırlıdır (spam ve kaba kuvvet).
- Yüklenen dosyalar sunucuda gerçekten açılıp kontrol edilir (bozuk fotoğraf ve sahte PDF reddedilir); fotoğraflardaki konum bilgisi silinir.
- Müşteri dosyaları herkese açık değildir.

## Yapay zekâ kullanımı

_(Sunumun 6. bölümü için doldurun: hangi aracı, hangi kısımda, neden kullandınız ve neyi kendiniz değiştirdiniz.)_
