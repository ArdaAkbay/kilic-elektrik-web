// Usta paneli: giriş, talepler, galeri ve hizmet yönetimi.
const Kullanici = require('../models/Kullanici');
const Talep = require('../models/Talep');
const Hizmet = require('../models/Hizmet');
const Is = require('../models/Is');
const dosyaDeposu = require('../services/dosyaDeposu');
const { hatalariTopla, temizVeri } = require('../middleware/dogrulama');
const { DURUMLAR, values } = require('../utils/constants');

const regexKacis = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ================= Giriş / çıkış =================

exports.girisFormu = (req, res) => {
  if (req.session.kullaniciId) return res.redirect('/admin');
  res.render('admin/giris', { baslik: 'Usta girişi', hata: null, kullaniciAdi: '' });
};

exports.girisYap = async (req, res, next) => {
  const hatalar = hatalariTopla(req);
  const kullaniciAdi = String(req.body.kullaniciAdi || '').trim().toLowerCase();
  const gecersiz = () =>
    res.status(401).render('admin/giris', { baslik: 'Usta girişi', hata: 'Kullanıcı adı veya şifre hatalı.', kullaniciAdi });

  if (Object.keys(hatalar).length) return gecersiz();
  const kullanici = await Kullanici.findOne({ kullaniciAdi });
  if (!kullanici || !(await kullanici.sifreDogruMu(req.body.sifre))) return gecersiz();

  // Oturum sabitleme saldırısına karşı girişte yeni oturum kimliği oluştur
  const hedef = req.session.girisSonrasi || '/admin';
  req.session.regenerate((err) => {
    if (err) return next(err);
    req.session.kullaniciId = String(kullanici._id);
    req.session.kullaniciAdi = kullanici.kullaniciAdi;
    req.session.save(() => res.redirect(hedef.startsWith('/admin') ? hedef : '/admin'));
  });
};

exports.cikis = (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('ke.sid');
    res.redirect('/admin/giris');
  });
};

// ================= Talepler =================

exports.talepler = async (req, res) => {
  const tur = ['ev', 'proje'].includes(req.query.tur) ? req.query.tur : '';
  const q = String(req.query.q || '').trim().slice(0, 60);

  const filtre = {};
  if (tur) filtre.tur = tur;
  if (q) {
    const r = new RegExp(regexKacis(q), 'i');
    const rakamlar = q.replace(/\D/g, '');
    filtre.$or = [{ takipKodu: r }, { adSoyad: r }, { firma: r }, { hizmetAdi: r }];
    // Telefon "0534 873..." biçiminde saklı; aramada boşluksuz yazılsa da bulsun
    if (rakamlar.length >= 4) filtre.$or.push({ telefon: new RegExp(rakamlar.split('').join('\\s?')) });
  }

  const talepler = await Talep.find(filtre).sort({ createdAt: -1 }).lean();
  const sutunlar = DURUMLAR.map((d) => ({ ...d, talepler: talepler.filter((t) => t.durum === d.value) }));

  const birHaftaOnce = new Date(Date.now() - 7 * 86400000);
  const ozet = {
    yeni: talepler.filter((t) => t.durum === 'yeni').length,
    buHafta: talepler.filter((t) => new Date(t.createdAt) >= birHaftaOnce).length,
    acik: talepler.filter((t) => ['yeni', 'kesif', 'teklif'].includes(t.durum)).length,
    toplam: talepler.length,
  };

  res.render('admin/talepler', { baslik: 'Talepler', sutunlar, ozet, tur, q });
};

exports.talepDetay = async (req, res, next) => {
  const talep = await Talep.findById(req.params.id).lean();
  if (!talep) return next();
  res.render('admin/talep-detay', { baslik: talep.takipKodu, talep });
};

exports.talepDurumGuncelle = async (req, res, next) => {
  const yeniDurum = req.body.durum;
  if (!values(DURUMLAR).includes(yeniDurum)) {
    req.bilgiVer('hata', 'Geçersiz durum.');
    return res.redirect(`/admin/talepler/${req.params.id}`);
  }
  const talep = await Talep.findById(req.params.id);
  if (!talep) return next();

  if (talep.durum !== yeniDurum) {
    talep.durum = yeniDurum;
    talep.durumGecmisi.push({ durum: yeniDurum });
    await talep.save();
    req.bilgiVer('basari', 'Durum güncellendi. Müşteri takip sayfasında yeni durumu görecek.');
  }
  res.redirect(`/admin/talepler/${talep._id}`);
};

exports.notEkle = async (req, res, next) => {
  const metin = String(req.body.metin || '').trim();
  if (metin.length < 2 || metin.length > 500) {
    req.bilgiVer('hata', 'Not 2–500 karakter olmalı.');
    return res.redirect(`/admin/talepler/${req.params.id}#notlar`);
  }
  const sonuc = await Talep.updateOne({ _id: req.params.id }, { $push: { ustaNotlari: { metin } } });
  if (!sonuc.matchedCount) return next();
  req.bilgiVer('basari', 'Not eklendi.');
  res.redirect(`/admin/talepler/${req.params.id}#notlar`);
};

exports.notSil = async (req, res, next) => {
  const talep = await Talep.findById(req.params.id);
  if (!talep) return next();
  // Silinecek not dışındakileri tutup kaydediyoruz
  talep.ustaNotlari = talep.ustaNotlari.filter((n) => String(n._id) !== req.params.notId);
  await talep.save();
  req.bilgiVer('basari', 'Not silindi.');
  res.redirect(`/admin/talepler/${req.params.id}#notlar`);
};

exports.talepSil = async (req, res, next) => {
  const talep = await Talep.findByIdAndDelete(req.params.id);
  if (!talep) return next();
  // Talebe ait fotoğraf ve PDF'leri de depodan sil (KVKK: gereksiz kişisel veri saklanmaz)
  await Promise.all([
    ...talep.fotograflar.map((f) => dosyaDeposu.sil(f.publicId)),
    talep.projeDosyasi ? dosyaDeposu.sil(talep.projeDosyasi.publicId) : null,
  ]);
  req.bilgiVer('basari', `${talep.takipKodu} numaralı talep ve dosyaları silindi.`);
  res.redirect('/admin');
};

// ================= Galeri (işler) =================
// Galeri fotoğrafları herkese açıktır; yüklenirken küçültülüp veritabanına kaydedilir.

const fotoKaydi = ({ url, publicId }) => ({ url, kucukUrl: `${url}?boyut=kucuk`, publicId });

async function fotograflariKaydet(req, hatalar) {
  try {
    return (await dosyaDeposu.hepsiniKaydet(req.files, { herkeseAcik: true })).map(fotoKaydi);
  } catch (err) {
    if (!(err instanceof dosyaDeposu.DosyaHatasi)) throw err;
    hatalar.fotograflar = err.message;
    return null;
  }
}

exports.isler = async (req, res) => {
  const isler = await Is.find().sort({ tarih: -1 }).lean();
  res.render('admin/isler', { baslik: 'Yaptığımız işler', isler });
};

exports.isYeniForm = (req, res) => {
  res.render('admin/is-form', {
    baslik: 'İş fotoğrafı ekle',
    is: { fotograflar: [], tarih: new Date(), kategori: 'endustriyel' },
    hatalar: {},
  });
};

exports.isOlustur = async (req, res) => {
  const hatalar = hatalariTopla(req, 'fotograflar');
  if (!req.files.length && !hatalar.fotograflar) hatalar.fotograflar = 'En az bir fotoğraf ekleyin.';
  const veri = temizVeri(req);
  const fotograflar = Object.keys(hatalar).length ? null : await fotograflariKaydet(req, hatalar);

  if (Object.keys(hatalar).length) {
    return res.status(422).render('admin/is-form', {
      baslik: 'İş fotoğrafı ekle',
      is: { ...req.body, ...veri, fotograflar: [] },
      hatalar,
    });
  }

  delete veri.silinecekFotograflar;
  await Is.create({ ...veri, fotograflar });
  req.bilgiVer('basari', 'İş galeriye eklendi. Sitede "Yaptığımız işler" sayfasında görünüyor.');
  res.redirect(303, '/admin/isler');
};

exports.isDuzenleForm = async (req, res, next) => {
  const is = await Is.findById(req.params.id).lean();
  if (!is) return next();
  res.render('admin/is-form', { baslik: 'İşi düzenle', is, hatalar: {} });
};

exports.isGuncelle = async (req, res, next) => {
  const is = await Is.findById(req.params.id);
  if (!is) return next();

  const hatalar = hatalariTopla(req, 'fotograflar');
  const veri = temizVeri(req);
  const silinecek = new Set(veri.silinecekFotograflar || []);
  const kalan = is.fotograflar.filter((f) => !silinecek.has(f.url));
  if (kalan.length + req.files.length === 0) hatalar.fotograflar = 'İşte en az bir fotoğraf kalmalı.';
  if (kalan.length + req.files.length > 6) hatalar.fotograflar = 'Bir işte en fazla 6 fotoğraf olabilir.';
  const yeniler = Object.keys(hatalar).length ? null : await fotograflariKaydet(req, hatalar);

  if (Object.keys(hatalar).length) {
    return res.status(422).render('admin/is-form', {
      baslik: 'İşi düzenle',
      is: { ...is.toObject(), ...veri },
      hatalar,
    });
  }

  const silinenler = is.fotograflar.filter((f) => silinecek.has(f.url));
  is.set({
    baslik: veri.baslik,
    kategori: veri.kategori,
    aciklama: veri.aciklama,
    tarih: veri.tarih,
    oneCikan: veri.oneCikan,
    fotograflar: [...kalan, ...yeniler],
  });
  await is.save();
  await Promise.all(silinenler.map((f) => dosyaDeposu.sil(f.publicId)));

  req.bilgiVer('basari', 'İş güncellendi.');
  res.redirect(303, '/admin/isler');
};

exports.isSil = async (req, res, next) => {
  const is = await Is.findByIdAndDelete(req.params.id);
  if (!is) return next();
  await Promise.all(is.fotograflar.map((f) => dosyaDeposu.sil(f.publicId)));
  req.bilgiVer('basari', `"${is.baslik}" galeriden silindi.`);
  res.redirect('/admin/isler');
};

// ================= Hizmetler =================

// "Priz ve anahtar ekleme" → "priz-ve-anahtar-ekleme"
function slugYap(metin) {
  const harita = { ç: 'c', ğ: 'g', ı: 'i', İ: 'i', ö: 'o', ş: 's', ü: 'u' };
  return metin
    .toLocaleLowerCase('tr-TR')
    .replace(/[çğıİöşü]/g, (h) => harita[h])
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);
}

async function benzersizSlug(ad, haricId) {
  const temel = slugYap(ad) || 'hizmet';
  let slug = temel;
  for (let i = 2; await Hizmet.exists({ slug, ...(haricId ? { _id: { $ne: haricId } } : {}) }); i++) {
    slug = `${temel}-${i}`;
  }
  return slug;
}

// Formdan gelen veriyi modele uygun hâle getirir
function hizmetVerisi(veri) {
  return {
    ad: veri.ad,
    kapi: veri.kapi,
    grup: veri.kapi === 'proje' ? veri.grup : undefined,
    kisaAciklama: veri.kisaAciklama,
    aciklama: veri.aciklama,
    sira: veri.sira ?? 0,
    aktif: veri.aktif,
    oneCikan: veri.kapi === 'proje' ? veri.oneCikan : false,
  };
}

async function hizmetFotografiKaydet(req, hatalar) {
  if (!req.files.length) return null;
  try {
    const { url, publicId } = await dosyaDeposu.kaydet(req.files[0], { herkeseAcik: true });
    return { url, kucukUrl: `${url}?boyut=kucuk`, publicId };
  } catch (err) {
    if (!(err instanceof dosyaDeposu.DosyaHatasi)) throw err;
    hatalar.fotograf = err.message;
    return null;
  }
}

exports.hizmetler = async (req, res) => {
  const hizmetler = await Hizmet.find().sort({ kapi: -1, sira: 1, ad: 1 }).lean();
  res.render('admin/hizmetler', {
    baslik: 'Hizmetler',
    proje: hizmetler.filter((h) => h.kapi === 'proje'),
    ev: hizmetler.filter((h) => h.kapi === 'ev'),
  });
};

exports.hizmetYeniForm = async (req, res) => {
  const kapi = req.query.kapi === 'ev' ? 'ev' : 'proje';
  const sonSira = (await Hizmet.findOne({ kapi }).sort({ sira: -1 }).lean())?.sira || 0;
  res.render('admin/hizmet-form', {
    baslik: 'Yeni hizmet',
    hizmet: { aktif: true, kapi, grup: 'aydinlatma', sira: sonSira + 1 },
    hatalar: {},
  });
};

exports.hizmetOlustur = async (req, res) => {
  const hatalar = hatalariTopla(req, 'fotograf');
  const veri = temizVeri(req);
  const gorsel = Object.keys(hatalar).length ? null : await hizmetFotografiKaydet(req, hatalar);

  if (Object.keys(hatalar).length) {
    return res.status(422).render('admin/hizmet-form', { baslik: 'Yeni hizmet', hizmet: { ...req.body, ...veri }, hatalar });
  }
  await Hizmet.create({ ...hizmetVerisi(veri), slug: await benzersizSlug(veri.ad), ...(gorsel ? { gorsel } : {}) });
  req.bilgiVer('basari', `"${veri.ad}" eklendi.`);
  res.redirect(303, '/admin/hizmetler');
};

exports.hizmetDuzenleForm = async (req, res, next) => {
  const hizmet = await Hizmet.findById(req.params.id).lean();
  if (!hizmet) return next();
  res.render('admin/hizmet-form', { baslik: 'Hizmeti düzenle', hizmet, hatalar: {} });
};

exports.hizmetGuncelle = async (req, res, next) => {
  const hizmet = await Hizmet.findById(req.params.id);
  if (!hizmet) return next();
  const hatalar = hatalariTopla(req, 'fotograf');
  const veri = temizVeri(req);
  const yeniGorsel = Object.keys(hatalar).length ? null : await hizmetFotografiKaydet(req, hatalar);

  if (Object.keys(hatalar).length) {
    return res.status(422).render('admin/hizmet-form', {
      baslik: 'Hizmeti düzenle',
      hizmet: { ...hizmet.toObject(), ...req.body, ...veri },
      hatalar,
    });
  }

  const eskiPublicId = hizmet.gorsel && hizmet.gorsel.publicId;
  // Ad değişse bile adres (slug) sabit kalır; böylece eski linkler ve reklamlar bozulmaz
  hizmet.set(hizmetVerisi(veri));
  if (yeniGorsel) hizmet.gorsel = yeniGorsel;
  else if (veri.fotografiKaldir) hizmet.gorsel = undefined;
  await hizmet.save();
  if (eskiPublicId && (yeniGorsel || veri.fotografiKaldir)) await dosyaDeposu.sil(eskiPublicId);

  req.bilgiVer('basari', `"${hizmet.ad}" güncellendi.`);
  res.redirect(303, '/admin/hizmetler');
};

exports.hizmetSil = async (req, res, next) => {
  const hizmet = await Hizmet.findByIdAndDelete(req.params.id);
  if (!hizmet) return next();
  if (hizmet.gorsel) await dosyaDeposu.sil(hizmet.gorsel.publicId);
  // Eski talepler hizmetAdi alanını sakladığı için silinen hizmetin adı taleplerde görünmeye devam eder
  req.bilgiVer('basari', `"${hizmet.ad}" silindi.`);
  res.redirect('/admin/hizmetler');
};
