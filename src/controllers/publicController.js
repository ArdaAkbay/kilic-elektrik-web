// Ziyaretçi sayfaları: ana sayfa, iki kapı (ev / proje), talep formları, takip ve galeri.
const Hizmet = require('../models/Hizmet');
const Is = require('../models/Is');
const Talep = require('../models/Talep');
const { yeniTakipKodu } = require('../models/Sayac');
const dosyaDeposu = require('../services/dosyaDeposu');
const { yeniTalepBildir } = require('../services/eposta');
const { hatalariTopla, temizVeri } = require('../middleware/dogrulama');
const { IS_KATEGORILERI, values } = require('../utils/constants');

const TAKIP_KODU = /^KE-\d{4}-\d{4,}$/;

exports.anasayfa = async (req, res) => {
  const [oneCikanlar, hizmetSayisi] = await Promise.all([
    Is.find({ oneCikan: true }).sort({ tarih: -1 }).limit(3).lean(),
    Hizmet.countDocuments({ aktif: true }),
  ]);
  res.render('public/anasayfa', { baslik: null, oneCikanlar, hizmetSayisi });
};

// ---------- Ev / iş yeri ----------

exports.evim = async (req, res) => {
  const hizmetler = await Hizmet.find({ aktif: true }).sort({ sira: 1, ad: 1 }).lean();
  res.render('public/evim', { baslik: 'Evim için', hizmetler });
};

async function evFormunuGoster(res, { degerler = {}, hatalar = {}, durum = 200 } = {}) {
  const hizmetler = await Hizmet.find({ aktif: true }).sort({ sira: 1, ad: 1 }).lean();
  res.status(durum).render('public/ev-talep', { baslik: 'Ev talebi oluştur', hizmetler, degerler, hatalar });
}

exports.evTalepFormu = async (req, res) => {
  const secili = req.query.hizmet ? await Hizmet.findOne({ slug: req.query.hizmet, aktif: true }).lean() : null;
  await evFormunuGoster(res, { degerler: { hizmet: secili ? String(secili._id) : '' } });
};

exports.evTalepGonder = async (req, res) => {
  const hatalar = hatalariTopla(req, 'fotograflar');
  const veri = temizVeri(req);

  // Seçilen hizmet gerçekten var ve aktif mi?
  const hizmet = !hatalar.hizmet ? await Hizmet.findOne({ _id: veri.hizmet, aktif: true }).lean() : null;
  if (!hatalar.hizmet && !hizmet) hatalar.hizmet = 'Seçtiğiniz hizmet artık sunulmuyor, başka bir hizmet seçin.';

  if (Object.keys(hatalar).length) {
    return evFormunuGoster(res, { degerler: { ...req.body, ...veri }, hatalar, durum: 422 });
  }

  const fotograflar = await Promise.all(req.files.map((f) => dosyaDeposu.kaydet(f, 'talepler')));
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

function projeFormunuGoster(res, { degerler = {}, hatalar = {}, durum = 200 } = {}) {
  res.status(durum).render('public/projem', { baslik: 'Projem için', degerler, hatalar });
}

exports.projem = (req, res) => projeFormunuGoster(res, { degerler: { kapsam: [] } });

exports.projeTalepGonder = async (req, res) => {
  const hatalar = hatalariTopla(req, 'projeDosyasi');
  const veri = temizVeri(req);

  if (Object.keys(hatalar).length) {
    const kapsam = Array.isArray(req.body.kapsam) ? req.body.kapsam : req.body.kapsam ? [req.body.kapsam] : [];
    return projeFormunuGoster(res, { degerler: { ...req.body, ...veri, kapsam }, hatalar, durum: 422 });
  }

  const projeDosyasi = req.files[0] ? await dosyaDeposu.kaydet(req.files[0], 'projeler') : undefined;
  const talep = await Talep.create({
    ...veri,
    tur: 'proje',
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
  res.render('public/talep-alindi', { baslik: 'Talebiniz alındı', ozet: talep.toTakipOzeti() });
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
  res.render('public/isler', { baslik: 'Yaptığımız işler', isler, kategori });
};

exports.kvkk = (req, res) => res.render('public/kvkk', { baslik: 'Kişisel verilerin korunması' });
