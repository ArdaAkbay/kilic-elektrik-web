// Giriş noktası: veritabanına bağlan, ilk verileri hazırla, sunucuyu başlat.
const mongoose = require('mongoose');
const config = require('./config');
const { hazirla } = require('./services/baslangicVerisi');
const { uygulamaOlustur } = require('./app');

async function basla() {
  await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 10000 });
  console.log('Veritabanına bağlanıldı.');

  await hazirla();

  const app = uygulamaOlustur();
  const sunucu = app.listen(config.port, () => {
    console.log(`Kılıç Elektrik ${config.port} portunda çalışıyor.`);
    console.log(`Google Ads: ${config.googleAds.id ? `açık (${config.googleAds.id})` : 'kapalı'}`);
  });

  const kapat = async () => {
    sunucu.close();
    await mongoose.disconnect();
    process.exit(0);
  };
  process.on('SIGTERM', kapat);
  process.on('SIGINT', kapat);
}

basla().catch((err) => {
  console.error('Uygulama başlatılamadı:', err.message);
  process.exit(1);
});
