// Küçük ama her istekte kullanılan ara katmanlar.
const rateLimit = require('express-rate-limit');
const config = require('../config');
const sabitler = require('../utils/constants');

// Tek seferlik bilgi mesajı ("Hizmet kaydedildi" gibi). Yönlendirmeden sonraki sayfada bir kez görünür.
function bilgiMesaji(req, res, next) {
  res.locals.bilgi = req.session.bilgi || null;
  delete req.session.bilgi;
  req.bilgiVer = (tur, metin) => {
    req.session.bilgi = { tur, metin };
  };
  next();
}

// Tüm şablonlarda kullanılan değişkenler ve yardımcılar
function sablonDegiskenleri(req, res, next) {
  res.locals.isletme = config.business;
  res.locals.yol = req.path;
  res.locals.girisYapan = req.session.kullaniciAdi || null;
  res.locals.sabitler = sabitler;
  res.locals.labelOf = sabitler.labelOf;
  res.locals.tl = (n) => `${Number(n || 0).toLocaleString('tr-TR')} TL`;
  res.locals.tarih = (d, saatli) =>
    d
      ? new Date(d).toLocaleString('tr-TR', {
          timeZone: 'Europe/Istanbul',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          ...(saatli ? { hour: '2-digit', minute: '2-digit' } : {}),
        })
      : '';
  res.locals.waLink = (metin) => `https://wa.me/${config.business.phoneIntl}?text=${encodeURIComponent(metin)}`;
  next();
}

// Usta paneli korumalı sayfaları
function girisGerekli(req, res, next) {
  if (req.session.kullaniciId) return next();
  req.session.girisSonrasi = req.originalUrl;
  res.redirect('/admin/giris');
}

// Spam ve kaba kuvvet denemelerine karşı istek sınırları
function sinir({ dakika, adet, mesaj }) {
  return rateLimit({
    windowMs: dakika * 60 * 1000,
    limit: adet,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    handler: (req, res) =>
      res.status(429).render('public/hata', {
        baslik: 'Çok fazla deneme',
        kod: 429,
        mesaj,
      }),
  });
}

const talepSiniri = sinir({
  dakika: 10,
  adet: Number(process.env.TALEP_SINIRI) || 5,
  mesaj: 'Kısa sürede çok fazla talep gönderildi. Birkaç dakika sonra tekrar deneyin ya da bizi telefonla arayın.',
});
const girisSiniri = sinir({ dakika: 15, adet: 10, mesaj: 'Çok fazla hatalı giriş denemesi. 15 dakika sonra tekrar deneyin.' });
const takipSiniri = sinir({ dakika: 1, adet: 20, mesaj: 'Çok fazla sorgu yapıldı. Bir dakika sonra tekrar deneyin.' });

module.exports = { bilgiMesaji, sablonDegiskenleri, girisGerekli, talepSiniri, girisSiniri, takipSiniri };
