// Tüm ortam değişkenleri tek yerden okunur.
// Gizli bilgiler (.env) GitHub'a gönderilmez; Render'da "Environment" bölümüne girilir.
require('dotenv').config({ quiet: true });

const env = process.env;

const config = {
  isProd: env.NODE_ENV === 'production',
  port: Number(env.PORT) || 3000,
  mongoUri: env.MONGODB_URI || 'mongodb://127.0.0.1:27017/kilic-elektrik',
  sessionSecret: env.SESSION_SECRET || 'gelistirme-icin-gizli-anahtar',
  // Süresi dolan oturumların silinmesi. Atlas'ta 'native' (TTL index) kullanılır.
  sessionAutoRemove: env.SESSION_AUTO_REMOVE || 'native',

  // İlk açılışta otomatik oluşturulan usta hesabı
  adminUsername: env.ADMIN_USERNAME || 'usta',
  adminPassword: env.ADMIN_PASSWORD || '',

  // Yeni talep bildirimlerinin gideceği adres ve e-posta servisi (Resend)
  notifyEmail: env.NOTIFY_EMAIL || '',
  resendApiKey: env.RESEND_API_KEY || '',
  mailFrom: env.MAIL_FROM || 'Kılıç Elektrik <onboarding@resend.dev>',

  // Cloudinary tanımlıysa dosyalar oraya, değilse public/uploads klasörüne kaydedilir
  cloudinaryUrl: env.CLOUDINARY_URL || '',

  // Sitenin herkese açık adresi (e-postadaki panel linki için)
  siteUrl: (env.SITE_URL || '').replace(/\/$/, ''),

  // İşletme bilgileri: tek yerden değişsin diye burada
  business: {
    name: 'Kılıç Elektrik',
    phoneDisplay: '0534 873 00 10',
    phoneIntl: '905348730010',
    address: 'Demirkapı Mah. Velioğlu Cd. No: 115/D, 34218 Bağcılar / İstanbul',
    hours: 'Dükkân 19:00\'a kadar açık',
    mapsUrl:
      'https://www.google.com/maps/search/?api=1&query=K%C4%B1l%C4%B1%C3%A7+Elektrik+Velio%C4%9Flu+Cd.+115%2Fd+Ba%C4%9Fc%C4%B1lar',
    googleRating: '4,8',
    googleReviews: 20,
  },
};

if (config.isProd && config.sessionSecret === 'gelistirme-icin-gizli-anahtar') {
  console.warn('UYARI: SESSION_SECRET tanımlı değil. Canlı ortamda mutlaka uzun ve rastgele bir değer girin.');
}

module.exports = config;
