// Ziyaretçi sayfaları: ana sayfa, hizmetler, iki kapı (ev / proje), talep formları, takip ve galeri.
const Hizmet = require('../models/Hizmet');
const Is = require('../models/Is');
const Talep = require('../models/Talep');
const { yeniTakipKodu } = require('../models/Sayac');
const dosyaDeposu = require('../services/dosyaDeposu');
const { yeniTalepBildir } = require('../services/eposta');
const { hatalariTopla, temizVeri } = require('../middleware/dogrulama');
const { IS_KATEGORILERI, HIZMET_GRUPLARI, values } = require('../utils/constants');

const TAKIP_KODU = /^KE-\d{4}-\d{4,}$/;
const SIRA = { sira: 1, ad: 1 };

const projeHizmetleri = () => Hizmet.find({ aktif: true, kapi: 'proje' }).sort(SIRA).lean();
const evHizmetleri = () => Hizmet.find({ aktif: true, kapi: 'ev' }).sort(SIRA).lean();

exports.anasayfa = async (req, res) => {
  const [oneCikanlar, hizmetSayisi, sonIsler] = await Promise.all([
    Hizmet.find({ aktif: true, kapi: 'proje', oneCikan: true }).sort(SIRA).limit(8).lean(),
    Hizmet.countDocuments({ aktif: true, kapi: 'proje' }),
    Is.find().sort({ oneCikan: -1, tarih: -1 }).limit(4).lean(),
  ]);
  res.render('public/anasayfa', { baslik: null, oneCikanlar, hizmetSayisi, sonIsler });
};

// ---------- Hizmetler ----------

exports.hizmetler = async (req, res) => {
  const grup = values(HIZMET_GRUPLARI).includes(req.query.grup) ? req.query.grup : '';
  const hizmetler = await Hizmet.find({ aktif: true, kapi: 'proje', ...(grup ? { grup } : {}) }).sort(SIRA).lean();
  res.render('public/hizmetler', {
    baslik: 'Hizmetlerimiz',
    aciklama: 'Kılıç Elektrik: fabrika, depo, mağaza ve şantiyeler için aydınlatma, kablo tava, enerji kablolaması, topraklama ve tesisat kontrol hizmetleri.',
    hizmetler,
    grup,
  });
};

exports.hizmetDetay = async (req, res, next) => {
  const hizmet = await Hizmet.findOne({ slug: req.params.slug, aktif: true }).lean();
  if (!hizmet) return next();
  // Ev hizmetlerinin ayrı sayfası yok; doğrudan talep formuna git
  if (hizmet.kapi === 'ev') return res.redirect(301, `/evim/talep?hizmet=${encodeURIComponent(hizmet.slug)}`);

  const digerleri = await Hizmet.find({
    aktif: true,
    kapi: 'proje',
    _id: { $ne: hizmet._id },
    ...(hizmet.grup ? { grup: hizmet.grup } : {}),
  })
    .sort(SIRA)
    .limit(4)
    .lean();

  res.render('public/hizmet-detay', {
    baslik: hizmet.ad,
    aciklama: hizmet.kisaAciklama,
    ogGorsel: hizmet.gorsel && hizmet.gorsel.url,
    hizmet,
    digerleri,
  });
};

// ---------- Ev / iş yeri ----------

exports.evim = async (req, res) => {
  res.render('public/evim', {
    baslik: 'Evim için',
    aciklama: 'Ev ve iş yeriniz için arıza onarımı, priz, aydınlatma ve tesisat yenileme. Fotoğraf gönderin, ustamız sizi arasın.',
    hizmetler: await evHizmetleri(),
  });
};

async function evFormunuGoster(res, { degerler = {}, hatalar = {}, durum = 200 } = {}) {
  res.status(durum).render('public/ev-talep', { baslik: 'Ev talebi oluştur', hizmetler: await evHizmetleri(), degerler, hatalar });
}

exports.evTalepFormu = async (req, res) => {
  const secili = req.query.hizmet ? await Hizmet.findOne({ slug: req.query.hizmet, aktif: true, kapi: 'ev' }).lean() : null;
  await evFormunuGoster(res, { degerler: { hizmet: secili ? String(secili._id) : '' } });
};

exports.evTalepGonder = async (req, res) => {
  const hatalar = hatalariTopla(req, 'fotograflar');
  const veri = temizVeri(req);

  // Seçilen hizmet gerçekten var mı ve ev hizmeti mi?
  const hizmet = !hatalar.hizmet ? await Hizmet.findOne({ _id: veri.hizmet, aktif: true, kapi: 'ev' }).lean() : null;
  if (!hatalar.hizmet && !hizmet) hatalar.hizmet = 'Seçtiğiniz hizmet artık sunulmuyor, başka bir hizmet seçin.';

  let fotograflar = [];
  if (!Object.keys(hatalar).length) {
    try {
      // Müşteri fotoğrafları gizlidir: sadece giriş yapmış usta görebilir
      fotograflar = await dosyaDeposu.hepsiniKaydet(req.files, { herkeseAcik: false });
    } catch (err) {
      if (!(err instanceof dosyaDeposu.DosyaHatasi)) throw err;
      hatalar.fotograflar = err.message;
    }
  }

  if (Object.keys(hatalar).length) {
    return evFormunuGoster(res, { degerler: { ...req.body, ...veri }, hatalar, durum: 422 });
  }

  const talep = await Talep.create({
    ...veri,
    tur: 'ev',
    hizmet: hizmet._id,
    hizmetAdi: hizmet.ad,
    kvkkOnay: true,
    fotograflar,
    takipKodu: await yeniTakipKodu(),
    durumGecmisi: [{ durum: 'yeni' }],
  });

  yeniTalepBildir(talep); // beklemeden gönder; e-posta yavaşsa müşteri beklemesin
  res.redirect(303, `/talep/${talep.takipKodu}/alindi`);
};

// ---------- Proje ----------

async function projeFormunuGoster(res, { degerler = {}, hatalar = {}, durum = 200 } = {}) {
  res.status(durum).render('public/projem', {
    baslik: 'Projem için',
    aciklama: 'Bina, fabrika, mağaza ve ofis projeleriniz için elektrik tesisatı ve aydınlatma. Proje bilgilerinizi bırakın, sizi arayıp görüşme ayarlayalım.',
    hizmetler: await projeHizmetleri(),
    degerler,
    hatalar,
  });
}

exports.projem = async (req, res) => {
  const secili = req.query.hizmet ? await Hizmet.findOne({ slug: req.query.hizmet, aktif: true, kapi: 'proje' }).lean() : null;
  await projeFormunuGoster(res, { degerler: { kapsam: [], hizmet: secili ? String(secili._id) : '' } });
};

exports.projeTalepGonder = async (req, res) => {
  const hatalar = hatalariTopla(req, 'projeDosyasi');
  const veri = temizVeri(req);

  const hizmet = veri.hizmet && !hatalar.hizmet ? await Hizmet.findOne({ _id: veri.hizmet, aktif: true }).lean() : null;
  if (veri.hizmet && !hatalar.hizmet && !hizmet) hatalar.hizmet = 'Seçtiğiniz hizmet artık sunulmuyor.';

  let projeDosyasi;
  if (!Object.keys(hatalar).length && req.files[0]) {
    try {
      projeDosyasi = await dosyaDeposu.kaydet(req.files[0], { herkeseAcik: false });
    } catch (err) {
      if (!(err instanceof dosyaDeposu.DosyaHatasi)) throw err;
      hatalar.projeDosyasi = err.message;
    }
  }

  if (Object.keys(hatalar).length) {
    const kapsam = Array.isArray(req.body.kapsam) ? req.body.kapsam : req.body.kapsam ? [req.body.kapsam] : [];
    return projeFormunuGoster(res, { degerler: { ...req.body, ...veri, kapsam }, hatalar, durum: 422 });
  }

  const talep = await Talep.create({
    ...veri,
    tur: 'proje',
    hizmet: hizmet ? hizmet._id : undefined,
    hizmetAdi: hizmet ? hizmet.ad : undefined,
    kvkkOnay: true,
    projeDosyasi,
    takipKodu: await yeniTakipKodu(),
    durumGecmisi: [{ durum: 'yeni' }],
  });

  yeniTalepBildir(talep);
  res.redirect(303, `/talep/${talep.takipKodu}/alindi`);
};

// ---------- Talep alındı ve takip ----------

exports.talepAlindi = async (req, res, next) => {
  const kod = String(req.params.kod).toUpperCase();
  const talep = TAKIP_KODU.test(kod) ? await Talep.findOne({ takipKodu: kod }) : null;
  if (!talep) return next(); // 404
  res.render('public/talep-alindi', { baslik: 'Talebiniz alındı', ozet: talep.toTakipOzeti(), donusumSayfasi: true });
};

exports.takip = async (req, res) => {
  const kod = String(req.query.kod || '').trim().toUpperCase();
  let ozet = null;
  let hata = null;

  if (kod) {
    if (!TAKIP_KODU.test(kod)) {
      hata = 'Takip kodu KE-2026-0001 biçiminde olmalı.';
    } else {
      const talep = await Talep.findOne({ takipKodu: kod });
      if (talep) ozet = talep.toTakipOzeti();
      else hata = 'Bu koda ait bir talep bulunamadı. Kodu kontrol edip tekrar deneyin.';
    }
  }
  res.status(hata ? 404 : 200).render('public/takip', { baslik: 'Talep takibi', kod, ozet, hata });
};

// ---------- Galeri ----------

exports.isler = async (req, res) => {
  const kategori = values(IS_KATEGORILERI).includes(req.query.kategori) ? req.query.kategori : '';
  const isler = await Is.find(kategori ? { kategori } : {}).sort({ tarih: -1 }).lean();
  res.render('public/isler', {
    baslik: 'Yaptığımız işler',
    aciklama: 'Kılıç Elektrik ekibinin tamamladığı işlerden fotoğraflar.',
    isler,
    kategori,
  });
};

exports.kvkk = (req, res) => res.render('public/kvkk', { baslik: 'KVKK ve çerez politikası' });
