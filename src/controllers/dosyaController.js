// Veritabanındaki fotoğraf ve PDF'leri tarayıcıya gönderir.
// Hizmet ve galeri fotoğrafları herkese açık; müşteri talep dosyaları sadece giriş yapmış ustaya gösterilir.
const mongoose = require('mongoose');
const Dosya = require('../models/Dosya');

exports.goster = async (req, res, next) => {
  if (!mongoose.isValidObjectId(req.params.id)) return next();
  const kucukMu = req.query.boyut === 'kucuk';

  // Sadece gereken sürümü veritabanından çek
  const alan = kucukMu ? 'kucuk' : 'veri';
  const dosya = await Dosya.findById(req.params.id).select(`${alan} tur mime ad herkeseAcik updatedAt`).lean();
  if (!dosya) return next();

  // Gizli dosyayı giriş yapmamış birine "yok" gibi göster (varlığını bile belli etme)
  if (!dosya.herkeseAcik && !req.session.kullaniciId) return next();

  const icerik = (kucukMu && dosya.kucuk) || dosya.veri || dosya.kucuk;
  const buffer = Buffer.isBuffer(icerik) ? icerik : Buffer.from(icerik.buffer || icerik);

  res.set({
    'Content-Type': dosya.mime,
    'Content-Length': buffer.length,
    'X-Content-Type-Options': 'nosniff',
    // Dosya içeriği hiç değişmez (yeni yükleme = yeni kimlik); herkese açıksa uzun süre önbellekte tutulabilir
    'Cache-Control': dosya.herkeseAcik ? 'public, max-age=31536000, immutable' : 'private, no-store',
  });
  if (dosya.tur === 'pdf') {
    res.set('Content-Disposition', `inline; filename="${encodeURIComponent(dosya.ad || 'proje.pdf')}"`);
  }
  res.send(buffer);
};
