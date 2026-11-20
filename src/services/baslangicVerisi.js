// Uygulama ilk açıldığında veritabanı boşsa usta hesabını ve hizmetleri oluşturur.
// Böylece Render'a ilk yüklemede elle komut çalıştırmaya gerek kalmaz.
// "Yaptığımız işler" galerisi boş başlar: oraya sadece ustanın kendi çektiği gerçek iş fotoğrafları eklenir.
const config = require('../config');
const Kullanici = require('../models/Kullanici');
const Hizmet = require('../models/Hizmet');
const { PROJE, EV } = require('../data/hizmetler');

async function hazirla() {
  // 1) Usta hesabı
  if ((await Kullanici.countDocuments()) === 0) {
    if (config.adminPassword) {
      await Kullanici.create({
        kullaniciAdi: config.adminUsername,
        sifreHash: await Kullanici.sifreOzeti(config.adminPassword),
      });
      console.log(`Usta hesabı oluşturuldu: ${config.adminUsername}`);
    } else {
      console.warn('ADMIN_PASSWORD tanımlı değil, usta hesabı oluşturulmadı. Panel girişi için ekleyin.');
    }
  }

  // 2) Hizmetler
  if ((await Hizmet.countDocuments()) === 0) {
    const proje = PROJE.map((h, i) => ({
      ad: h.ad,
      slug: h.slug,
      kapi: 'proje',
      grup: h.grup,
      kisaAciklama: h.kisa,
      aciklama: h.aciklama,
      gorsel: { url: `/img/hizmetler/${h.slug}.jpg`, kucukUrl: `/img/hizmetler/${h.slug}-k.jpg` },
      oneCikan: Boolean(h.oneCikan),
      sira: i + 1,
    }));
    const ev = EV.map((h, i) => ({ ad: h.ad, slug: h.slug, kapi: 'ev', kisaAciklama: h.kisa, sira: 100 + i }));
    await Hizmet.insertMany([...proje, ...ev]);
    console.log(`${proje.length} proje ve ${ev.length} ev hizmeti eklendi.`);
  }
}

module.exports = { hazirla };
