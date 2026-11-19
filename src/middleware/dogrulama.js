// Sunucu tarafı form doğrulama kuralları (express-validator).
// Tarayıcıdaki kontroller (required, pattern) kullanıcıya kolaylık içindir; asıl güvenlik buradadır.
const { body, validationResult, matchedData } = require('express-validator');
const { YAPI_TIPLERI, PROJE_KAPSAMI, UYGUN_ZAMANLAR, IS_KATEGORILERI, values } = require('../utils/constants');

// "0534 873 00 10", "+90 534...", "5348730010" → "0534 873 00 10"
function telefonDuzenle(deger) {
  let rakam = String(deger || '').replace(/\D/g, '');
  if (rakam.startsWith('90') && rakam.length === 12) rakam = rakam.slice(2);
  if (rakam.length === 10) rakam = `0${rakam}`;
  if (!/^05\d{9}$/.test(rakam)) return String(deger || '').trim();
  return `${rakam.slice(0, 4)} ${rakam.slice(4, 7)} ${rakam.slice(7, 9)} ${rakam.slice(9)}`;
}

const diziyeCevir = (v) => (Array.isArray(v) ? v : v ? [v] : []);

const ortakKurallar = [
  body('adSoyad').trim().isLength({ min: 2, max: 60 }).withMessage('Adınızı ve soyadınızı yazın (2–60 karakter).'),
  body('telefon')
    .customSanitizer(telefonDuzenle)
    .matches(/^05\d{2} \d{3} \d{2} \d{2}$/)
    .withMessage('Cep telefonunuzu 05XX XXX XX XX biçiminde yazın.'),
  body('ilce').trim().isLength({ min: 2, max: 40 }).withMessage('İlçenizi yazın.'),
  body('adres').optional({ values: 'falsy' }).trim().isLength({ max: 200 }).withMessage('Adres en fazla 200 karakter olabilir.'),
  body('aciklama').trim().isLength({ min: 10, max: 1000 }).withMessage('İşi birkaç cümleyle anlatın (10–1000 karakter).'),
  body('kvkkOnay').equals('evet').withMessage('Devam etmek için aydınlatma metnini onaylayın.'),
];

const evTalepKurallari = [
  body('hizmet').isMongoId().withMessage('Bir hizmet seçin.'),
  body('uygunZaman').isIn(values(UYGUN_ZAMANLAR)).withMessage('Size uygun zamanı seçin.'),
  ...ortakKurallar,
];

const projeTalepKurallari = [
  body('firma').optional({ values: 'falsy' }).trim().isLength({ max: 80 }).withMessage('Firma adı en fazla 80 karakter olabilir.'),
  body('eposta').optional({ values: 'falsy' }).trim().isEmail().withMessage('Geçerli bir e-posta adresi yazın.').normalizeEmail({ gmail_remove_dots: false }),
  body('yapiTipi').isIn(values(YAPI_TIPLERI)).withMessage('Yapı tipini seçin.'),
  body('katSayisi').isInt({ min: 1, max: 60 }).withMessage('Kat sayısı 1 ile 60 arasında olmalı.').toInt(),
  body('metrekare').isInt({ min: 10, max: 100000 }).withMessage('Yaklaşık alanı m² olarak yazın (en az 10).').toInt(),
  body('daireSayisi').optional({ values: 'falsy' }).isInt({ min: 1, max: 500 }).withMessage('Daire / birim sayısı 1 ile 500 arasında olmalı.').toInt(),
  body('kapsam')
    .customSanitizer(diziyeCevir)
    .custom((dizi) => dizi.length > 0 && dizi.every((k) => values(PROJE_KAPSAMI).includes(k)))
    .withMessage('İşin kapsamından en az birini seçin.'),
  ...ortakKurallar,
];

const hizmetKurallari = [
  body('ad').trim().isLength({ min: 2, max: 60 }).withMessage('Hizmet adı 2–60 karakter olmalı.'),
  body('aciklama').optional({ values: 'falsy' }).trim().isLength({ max: 240 }).withMessage('Açıklama en fazla 240 karakter.'),
  body('sira').optional({ values: 'falsy' }).isInt({ min: 0, max: 999 }).withMessage('Sıra 0–999 arası bir sayı olmalı.').toInt(),
  body('aktif').customSanitizer((v) => v === 'on' || v === 'true' || v === true),
];

const isKurallari = [
  body('baslik').trim().isLength({ min: 3, max: 80 }).withMessage('Başlık 3–80 karakter olmalı.'),
  body('kategori').isIn(values(IS_KATEGORILERI)).withMessage('Kategori seçin.'),
  body('aciklama').optional({ values: 'falsy' }).trim().isLength({ max: 300 }).withMessage('Açıklama en fazla 300 karakter.'),
  body('tarih').isISO8601().withMessage('Geçerli bir tarih seçin.').toDate(),
  body('oneCikan').customSanitizer((v) => v === 'on' || v === 'true' || v === true),
  body('silinecekFotograflar').customSanitizer(diziyeCevir),
];

const girisKurallari = [
  body('kullaniciAdi').trim().notEmpty().withMessage('Kullanıcı adını yazın.'),
  body('sifre').notEmpty().withMessage('Şifreyi yazın.'),
];

// Hataları { alanAdi: 'mesaj' } biçimine çevirir; yükleme hatasını da ekler
function hatalariTopla(req, dosyaAlani) {
  const hatalar = {};
  for (const h of validationResult(req).array()) {
    if (!hatalar[h.path]) hatalar[h.path] = h.msg;
  }
  if (req.yuklemeHatasi && dosyaAlani) hatalar[dosyaAlani] = req.yuklemeHatasi;
  return hatalar;
}

const temizVeri = (req) => matchedData(req, { locations: ['body'], includeOptionals: true });

module.exports = {
  evTalepKurallari,
  projeTalepKurallari,
  hizmetKurallari,
  isKurallari,
  girisKurallari,
  hatalariTopla,
  temizVeri,
  telefonDuzenle,
};
