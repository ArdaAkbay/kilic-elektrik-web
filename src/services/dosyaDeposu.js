// Yüklenen fotoğraf ve PDF'leri veritabanına kaydeder, siler.
// Fotoğraflar sharp ile küçültülür ve JPEG'e çevrilir; böylece telefondan gelen 5 MB'lık bir fotoğraf
// yaklaşık 200–300 KB yer kaplar ve site hızlı açılır.
const sharp = require('sharp');
const Dosya = require('../models/Dosya');

const BUYUK_PX = 1600;
const KUCUK_PX = 640;

class DosyaHatasi extends Error {}

async function gorselHazirla(buffer) {
  // rotate(): telefonun "dik çektim" bilgisini (EXIF) uygular; sonra EXIF verisi atılır (konum bilgisi dahil)
  const temel = sharp(buffer, { failOn: 'error' }).rotate();
  const meta = await temel.metadata().catch(() => null);
  if (!meta || !meta.width) {
    throw new DosyaHatasi('Fotoğraf okunamadı. JPG, PNG veya WEBP biçiminde bir fotoğraf seçin.');
  }
  const buyuk = await temel
    .clone()
    .resize({ width: BUYUK_PX, height: BUYUK_PX, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 80, mozjpeg: true })
    .toBuffer({ resolveWithObject: true });
  const kucuk = await temel
    .clone()
    .resize({ width: KUCUK_PX, height: KUCUK_PX, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 76, mozjpeg: true })
    .toBuffer();
  return { buyuk, kucuk };
}

/**
 * @param {Express.Multer.File} dosya multer'ın bellekte tuttuğu dosya
 * @param {{ herkeseAcik?: boolean }} secenekler
 * @returns {Promise<{ url: string, publicId: string, ad: string }>}
 */
async function kaydet(dosya, { herkeseAcik = false } = {}) {
  const pdfMi = dosya.mimetype === 'application/pdf' || /\.pdf$/i.test(dosya.originalname);
  let kayit;

  if (pdfMi) {
    if (dosya.buffer.subarray(0, 4).toString() !== '%PDF') {
      throw new DosyaHatasi('Proje dosyası geçerli bir PDF değil.');
    }
    kayit = await Dosya.create({
      tur: 'pdf',
      mime: 'application/pdf',
      ad: dosya.originalname,
      veri: dosya.buffer,
      boyut: dosya.size,
      herkeseAcik,
    });
  } else {
    const { buyuk, kucuk } = await gorselHazirla(dosya.buffer);
    kayit = await Dosya.create({
      tur: 'gorsel',
      mime: 'image/jpeg',
      ad: dosya.originalname,
      veri: buyuk.data,
      kucuk,
      genislik: buyuk.info.width,
      yukseklik: buyuk.info.height,
      boyut: buyuk.data.length,
      herkeseAcik,
    });
  }

  return { url: `/dosya/${kayit._id}`, publicId: `db:${kayit._id}`, ad: dosya.originalname };
}

/** Birden fazla dosyayı kaydeder. Biri hatalıysa o ana kadar kaydedilenleri geri siler. */
async function hepsiniKaydet(dosyalar, secenekler) {
  const kaydedilenler = [];
  try {
    for (const d of dosyalar) kaydedilenler.push(await kaydet(d, secenekler));
    return kaydedilenler;
  } catch (err) {
    await Promise.all(kaydedilenler.map((k) => sil(k.publicId)));
    throw err;
  }
}

async function sil(publicId) {
  if (!publicId || !publicId.startsWith('db:')) return; // örnek veri gibi statik dosyalar silinmez
  try {
    await Dosya.deleteOne({ _id: publicId.slice(3) });
  } catch (err) {
    console.warn('Dosya silinemedi:', publicId, err.message);
  }
}

module.exports = { kaydet, hepsiniKaydet, sil, gorselHazirla, DosyaHatasi };
