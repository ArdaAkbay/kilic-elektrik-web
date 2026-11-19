// Giriş noktası: veritabanına bağlan, ilk verileri hazırla, sunucuyu başlat.
const mongoose = require('mongoose');
const config = require('./config');
const { hazirla } = require('./services/baslangicVerisi');
const { uygulamaOlustur } = require('./app');
const dosyaDeposu = require('./services/dosyaDeposu');

async function basla() {
  await mongoose.connect(config.mongoUri, { serverSelectionTimeoutMS: 10000 });
  console.log('Veritabanına bağlanıldı.');

  await hazirla();

  const app = uygulamaOlustur();
  const sunucu = app.listen(config.port, () => {
    console.log(`Kılıç Elektrik ${config.port} portunda çalışıyor.`);
    console.log(`Dosya deposu: ${dosyaDeposu.kullaniliyorMu() ? 'Cloudinary' : 'yerel klasör (public/uploads)'}`);
    if (config.isProd && !dosyaDeposu.kullaniliyorMu()) {
      console.warn('UYARI: CLOUDINARY_URL tanımlı değil. Yüklenen fotoğraflar sunucu yeniden başlayınca kaybolur.');
    }
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
