// Dosya yükleme (multer). Dosyalar önce belleğe alınır, doğrulama geçerse dosyaDeposu ile kaydedilir.
// Hatalı dosyada uygulama çökmez; hata mesajı req.yuklemeHatasi'na yazılır ve form tekrar gösterilir.
const path = require('path');
const multer = require('multer');

const GORSEL_UZANTILARI = ['.jpg', '.jpeg', '.png', '.webp', '.heic', '.heif'];

function gorselMi(dosya) {
  const uzanti = path.extname(dosya.originalname).toLowerCase();
  return dosya.mimetype.startsWith('image/') || GORSEL_UZANTILARI.includes(uzanti);
}

function pdfMi(dosya) {
  return dosya.mimetype === 'application/pdf' || path.extname(dosya.originalname).toLowerCase() === '.pdf';
}

/**
 * @param {object} o
 * @param {string} o.alan formdaki input adı
 * @param {number} o.maxAdet en fazla dosya sayısı
 * @param {number} o.maxMB dosya başına en fazla boyut
 * @param {'gorsel'|'pdf'} o.tur
 */
function yukle({ alan, maxAdet, maxMB, tur }) {
  const kontrol = tur === 'pdf' ? pdfMi : gorselMi;
  const yukleyici = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxMB * 1024 * 1024, files: maxAdet },
    fileFilter: (req, dosya, cb) => {
      if (kontrol(dosya)) return cb(null, true);
      req.yuklemeHatasi = tur === 'pdf' ? 'Proje dosyası PDF olmalı.' : 'Sadece fotoğraf yükleyebilirsiniz (JPG, PNG, WEBP, HEIC).';
      cb(null, false);
    },
  }).array(alan, maxAdet);

  return (req, res, next) => {
    yukleyici(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        req.yuklemeHatasi =
          err.code === 'LIMIT_FILE_SIZE'
            ? `Her dosya en fazla ${maxMB} MB olabilir.`
            : err.code === 'LIMIT_FILE_COUNT' || err.code === 'LIMIT_UNEXPECTED_FILE'
              ? `En fazla ${maxAdet} dosya yükleyebilirsiniz.`
              : 'Dosya yüklenemedi, lütfen tekrar deneyin.';
        req.files = [];
        req.body = req.body || {};
        return next();
      }
      if (err) return next(err);
      req.files = req.files || [];
      next();
    });
  };
}

module.exports = {
  evFotograflari: yukle({ alan: 'fotograflar', maxAdet: 3, maxMB: 5, tur: 'gorsel' }),
  projeDosyasi: yukle({ alan: 'projeDosyasi', maxAdet: 1, maxMB: 10, tur: 'pdf' }),
  isFotograflari: yukle({ alan: 'fotograflar', maxAdet: 6, maxMB: 8, tur: 'gorsel' }),
};
