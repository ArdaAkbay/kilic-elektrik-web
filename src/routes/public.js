const express = require('express');
const c = require('../controllers/publicController');
const dosya = require('../controllers/dosyaController');
const seo = require('../controllers/seoController');
const yukleme = require('../middleware/yukleme');
const { evTalepKurallari, projeTalepKurallari } = require('../middleware/dogrulama');
const { talepSiniri, takipSiniri } = require('../middleware/genel');
const hata = require('../utils/asyncHata');

const router = express.Router();

router.get('/', hata(c.anasayfa));

// Hizmetler ve her hizmetin kendi sayfası (Google aramaları ve reklamlar bu sayfalara gelir)
router.get('/hizmetler', hata(c.hizmetler));
router.get('/hizmetler/:slug', hata(c.hizmetDetay));

// Ev / iş yeri kapısı
router.get('/evim', hata(c.evim));
router.get('/evim/talep', hata(c.evTalepFormu));
// Sıra önemli: önce dosyalar (multipart) çözülür, sonra alanlar doğrulanır
router.post('/evim/talep', talepSiniri, yukleme.evFotograflari, evTalepKurallari, hata(c.evTalepGonder));

// Proje kapısı
router.get('/projem', hata(c.projem));
router.post('/projem', talepSiniri, yukleme.projeDosyasi, projeTalepKurallari, hata(c.projeTalepGonder));

// Talep sonrası ve takip
router.get('/talep/:kod/alindi', hata(c.talepAlindi));
router.get('/takip', takipSiniri, hata(c.takip));

router.get('/isler', hata(c.isler));
router.get('/kvkk', c.kvkk);

// Veritabanındaki fotoğraf ve PDF'ler
router.get('/dosya/:id', hata(dosya.goster));

// Arama motorları için
router.get('/robots.txt', seo.robots);
router.get('/sitemap.xml', hata(seo.sitemap));

module.exports = router;
