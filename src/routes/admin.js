// Usta paneli rotaları. Giriş sayfası hariç hepsi oturum ister.
const express = require('express');
const c = require('../controllers/adminController');
const yukleme = require('../middleware/yukleme');
const { girisKurallari, hizmetKurallari, isKurallari } = require('../middleware/dogrulama');
const { girisGerekli, girisSiniri } = require('../middleware/genel');
const hata = require('../utils/asyncHata');

const router = express.Router();

// Panel sayfaları arama motorlarında görünmesin ve tarayıcıda önbelleğe alınmasın
router.use((req, res, next) => {
  res.set('X-Robots-Tag', 'noindex, nofollow');
  res.set('Cache-Control', 'no-store');
  next();
});

router.get('/giris', c.girisFormu);
router.post('/giris', girisSiniri, girisKurallari, hata(c.girisYap));

router.use(girisGerekli);
router.post('/cikis', c.cikis);

// Talepler: listeleme, detay, güncelleme (durum + not), silme
router.get('/', hata(c.talepler));
router.get('/talepler/:id', hata(c.talepDetay));
router.put('/talepler/:id/durum', hata(c.talepDurumGuncelle));
router.post('/talepler/:id/notlar', hata(c.notEkle));
router.delete('/talepler/:id/notlar/:notId', hata(c.notSil));
router.delete('/talepler/:id', hata(c.talepSil));

// Galeri: tam CRUD
router.get('/isler', hata(c.isler));
router.get('/isler/yeni', c.isYeniForm);
router.post('/isler', yukleme.isFotograflari, isKurallari, hata(c.isOlustur));
router.get('/isler/:id/duzenle', hata(c.isDuzenleForm));
router.put('/isler/:id', yukleme.isFotograflari, isKurallari, hata(c.isGuncelle));
router.delete('/isler/:id', hata(c.isSil));

// Hizmetler: tam CRUD
router.get('/hizmetler', hata(c.hizmetler));
router.get('/hizmetler/yeni', hata(c.hizmetYeniForm));
router.post('/hizmetler', hizmetKurallari, hata(c.hizmetOlustur));
router.get('/hizmetler/:id/duzenle', hata(c.hizmetDuzenleForm));
router.put('/hizmetler/:id', hizmetKurallari, hata(c.hizmetGuncelle));
router.delete('/hizmetler/:id', hata(c.hizmetSil));

module.exports = router;
