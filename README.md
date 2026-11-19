# Kılıç Elektrik Web Sitesi

Bağcılar'daki Kılıç Elektrik için talep toplayan ve takip eden dinamik web sitesi.
BİLP2135 Web ve İnternet Programcılığı II dönem projesi.

**Teknoloji:** Node.js, Express, EJS, MongoDB (Mongoose), Cloudinary, Resend
**Canlı adres:** _(Render'a yükledikten sonra buraya yazın)_

---

## Müşterinin sorunu ve çözüm

Kılıç Elektrik'in web sitesi yoktu. Müşteriler ustayı telefonla arıyor, arızanın fotoğrafını WhatsApp'tan dağınık şekilde gönderiyordu. Hangi talebin hangi aşamada olduğu takip edilemiyordu.

Site bu süreci düzene sokar:

| Özellik | Ne işe yarar |
|---|---|
| **İki kapılı giriş** | "Evim için" ve "Projem için" farklı akışlara gider. Ev sahibine hizmet listesi ve fotoğraflı form, inşaat firmasına proje formu gösterilir. Sitede fiyat gösterilmez; fiyat keşiften sonra verilir. |
| **Hizmet listesi** | "Evim için" sayfasındaki işler. Usta panelden ekler, düzenler, gizler. |
| **Fotoğraflı arıza bildirimi** | Müşteri en fazla 3 fotoğraf yükler. Usta gitmeden önce durumu görür. |
| **Proje talebi** | Yapı tipi, kat, m², kapsam ve isteğe bağlı PDF çizim. |
| **Takip kodu** | Her talebe `KE-2026-0001` gibi bir kod verilir. Müşteri giriş yapmadan durumunu görür. |
| **Usta paneli** | Talepler durum sütunlarında listelenir. Durum güncelleme, not, arama, filtre, silme. |
| **E-posta bildirimi** | Yeni talep gelince ustaya e-posta gider. |
| **KVKK** | Formda onay zorunlu. Takip sayfası kişisel veri göstermez. Silinen talebin dosyaları da silinir. |

## Ödev şartlarının karşılığı

| Şart | Projede nerede |
|---|---|
| Dinamik backend | Express, `src/app.js` ve `src/routes/` |
| Veritabanı | MongoDB Atlas, modeller `src/models/` |
| CRUD | **Talepler** (oluştur: müşteri formu; listele, güncelle, sil: panel), **Hizmetler** ve **Galeri** (panelde tam CRUD) |
| Form ve doğrulama | `src/middleware/dogrulama.js` (sunucu tarafı), formlarda `required`/`pattern` (tarayıcı tarafı) |
| Responsive | `public/css/site.css` ve `admin.css`, 900px ve 560px kırılımları |
| Canlı yayın | Render |
| Opsiyonel | Giriş sistemi, dosya yükleme, e-posta, arama/filtre, harita linki, hız sınırı |

---

## Klasör yapısı

```
src/
  server.js              Giriş noktası: veritabanına bağlan, ilk verileri yükle, sunucuyu başlat
  app.js                 Express ayarları: güvenlik, oturum, şablonlar, rotalar, hata sayfaları
  config/index.js        Ortam değişkenleri ve işletme bilgileri
  models/                Veritabanı şemaları (Talep, Hizmet, Is, Kullanici, Sayac)
  routes/                Hangi adres hangi fonksiyona gider (public.js, admin.js)
  controllers/           Sayfaların ve işlemlerin kendisi
  middleware/            Doğrulama kuralları, dosya yükleme, giriş kontrolü, hız sınırı
  services/              Dosya deposu, e-posta, ilk açılış verisi
  utils/                 Sabit listeler (durumlar, yapı tipleri…)
views/
  public/                Ziyaretçi sayfaları (EJS)
  admin/                 Usta paneli sayfaları
  partials/              Ortak üst/alt bölümler, hata mesajları
public/                  CSS, JavaScript, görseller
```

## Bir talebin yolculuğu (sunumda anlatmak için)

1. Müşteri `/evim/talep` formunu doldurur → `POST /evim/talep`
2. `talepSiniri` aynı kişinin çok sık göndermesini engeller
3. `yukleme.evFotograflari` (multer) fotoğrafları belleğe alır, tür ve boyutu kontrol eder
4. `evTalepKurallari` (express-validator) alanları kontrol eder, telefonu `0532 111 22 33` biçimine getirir
5. `publicController.evTalepGonder`: hata varsa formu hatalarla ve girilen değerlerle tekrar gösterir (422)
6. Hata yoksa fotoğraflar Cloudinary'ye yüklenir, `Sayac` ile sıradaki takip kodu alınır, `Talep` kaydedilir
7. Ustaya e-posta gider, müşteri "Talebiniz alındı" sayfasına yönlendirilir (303)
8. Usta panelde durumu "Keşif planlandı" yapar → müşteri `/takip` sayfasında bunu görür

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

Cloudinary tanımlı değilse fotoğraflar `public/uploads` klasörüne kaydedilir. Bu sadece yerel geliştirme içindir.

---

## Canlıya alma (adım adım)

Hepsi ücretsiz. Toplam 30–45 dakika sürer. Sırayla yapın.

### 1. MongoDB Atlas (veritabanı)

1. [mongodb.com/atlas](https://www.mongodb.com/atlas) adresinde hesap açın.
2. **Create** ile ücretsiz (Free / M0) bir küme oluşturun. Bölge olarak Frankfurt seçilebilir.
3. **Database Access** → yeni bir veritabanı kullanıcısı ve şifresi oluşturun. Şifrede `@ : / ?` gibi karakterler kullanmayın.
4. **Network Access** → **Add IP Address** → `0.0.0.0/0` (her yerden erişim). Render'ın ücretsiz sunucusunun sabit IP'si olmadığı için gerekli.
5. **Connect → Drivers** → bağlantı adresini kopyalayın. `<password>` yerine şifrenizi yazın ve `.net/` sonrasına veritabanı adını ekleyin:
   `mongodb+srv://kullanici:sifre@cluster0.xxxxx.mongodb.net/kilic-elektrik?retryWrites=true&w=majority`

### 2. Cloudinary (fotoğraf deposu)

1. [cloudinary.com](https://cloudinary.com) adresinde ücretsiz hesap açın.
2. Dashboard'da **API Environment variable** satırındaki `cloudinary://...` değerini kopyalayın.

Neden gerekli: Render'ın ücretsiz sunucusunda disk geçicidir. Sunucu yeniden başlayınca yerel klasöre kaydedilen fotoğraflar silinir.

### 3. Resend (e-posta bildirimi, isteğe bağlı)

1. [resend.com](https://resend.com) adresinde **bildirimlerin gideceği e-posta adresiyle** hesap açın.
2. **API Keys** → yeni anahtar oluşturup kopyalayın.

Kendi alan adınız olmadan Resend yalnızca hesabı açtığınız adrese e-posta gönderir. Bu proje için yeterli: bildirimler size gelir.

### 4. GitHub

GitHub'da `kilic-elektrik-web` adında **boş** bir repo açın (README eklemeyin). Proje klasöründe:

```bash
git init
git add .
git commit -m "Kılıç Elektrik web sitesi ilk sürüm"
git branch -M main
git remote add origin https://github.com/KULLANICI_ADINIZ/kilic-elektrik-web.git
git push -u origin main
```

`.env` dosyası `.gitignore` içinde olduğu için şifreleriniz GitHub'a gitmez. Göndermeden önce `git status` ile kontrol edin: listede `.env` görünmemeli.

### 5. Render (sunucu)

1. [render.com](https://render.com) adresinde GitHub hesabınızla giriş yapın.
2. **New → Web Service** → GitHub reponuzu seçin.
3. Ayarlar:
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free
4. **Environment Variables** bölümüne şunları ekleyin:

| Anahtar | Değer |
|---|---|
| `NODE_ENV` | `production` |
| `MONGODB_URI` | Atlas'tan aldığınız adres |
| `SESSION_SECRET` | Uzun rastgele bir metin |
| `ADMIN_USERNAME` | `usta` |
| `ADMIN_PASSWORD` | Güçlü bir şifre |
| `CLOUDINARY_URL` | Cloudinary'den aldığınız adres |
| `RESEND_API_KEY` | Resend anahtarı |
| `NOTIFY_EMAIL` | Bildirimlerin gideceği adres |
| `SITE_URL` | Render'ın verdiği adres, örn. `https://kilic-elektrik.onrender.com` |

5. **Create Web Service**. Birkaç dakika sonra loglarda `Kılıç Elektrik ... portunda çalışıyor` ve `Dosya deposu: Cloudinary` yazmalı.
6. Siteyi açın, `/admin` adresinden giriş yapın.

**Önemli:** Render'ın ücretsiz sunucusu bir süre ziyaret edilmezse uykuya geçer; ilk açılış yarım dakikayı bulabilir. Sunumdan birkaç dakika önce siteyi bir kez açın.

### Canlıya aldıktan sonra kontrol listesi

- [ ] Ana sayfa, Evim için, Projem için, Yaptığımız işler açılıyor
- [ ] Telefondan fotoğraflı bir ev talebi gönderildi, takip kodu alındı
- [ ] Bildirim e-postası geldi
- [ ] Panelde talep görünüyor, fotoğraf açılıyor, durum değiştirilebiliyor
- [ ] Takip sayfasında yeni durum görünüyor
- [ ] Hizmet listesi kuzeninizle birlikte kontrol edildi
- [ ] Deneme talepleri panelden silindi

---

## Güvenlik notları

- Şifreler bcrypt ile özetlenerek saklanır, açık metin tutulmaz.
- Girişte oturum kimliği yenilenir (oturum sabitleme saldırısına karşı).
- Çerezler `httpOnly`, `sameSite=lax` ve canlıda `secure` (CSRF ve çerez çalmaya karşı).
- `helmet` ile güvenlik başlıkları ve içerik güvenlik politikası (CSP).
- EJS `<%= %>` çıktıları otomatik kaçırır; formdan gelen HTML/script çalışmaz (XSS).
- Form gönderimi ve giriş denemeleri hız sınırlıdır (spam ve kaba kuvvet).
- Dosya türü ve boyutu sunucuda kontrol edilir.
- Gizli bilgiler yalnızca ortam değişkenlerinde; repoda `.env.example` dışında yok.

## Yapay zekâ kullanımı

_(Sunumun 6. bölümü için doldurun: hangi aracı, hangi kısımda, neden kullandınız ve neyi kendiniz değiştirdiniz.)_
