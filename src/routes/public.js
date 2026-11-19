const express = require('express');
const c = require('../controllers/publicController');
const yukleme = require('../middleware/yukleme');
const { evTalepKurallari, projeTalepKurallari } = require('../middleware/dogrulama');
const { talepSiniri, takipSiniri } = require('../middleware/genel');
const hata = require('../utils/asyncHata');

const router = express.Router();

router.get('/', hata(c.anasayfa));

// Ev / iş yeri kapısı
router.get('/evim', hata(c.evim));
router.get('/evim/talep', hata(c.evTalepFormu));
// Sıra önemli: önce dosyalar (multipart) çözülür, sonra alanlar doğrulanır
router.post('/evim/talep', talepSiniri, yukleme.evFotograflari, evTalepKurallari, hata(c.evTalepGonder));

// Proje kapısı
router.get('/projem', c.projem);
router.post('/projem', talepSiniri, yukleme.projeDosyasi, projeTalepKurallari, hata(c.projeTalepGonder));

// Talep sonrası ve takip
router.get('/talep/:kod/alindi', hata(c.talepAlindi));
router.get('/takip', takipSiniri, hata(c.takip));

router.get('/isler', hata(c.isler));
router.get('/kvkk', c.kvkk);

module.exports = router;
