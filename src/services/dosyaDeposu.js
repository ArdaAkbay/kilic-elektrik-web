// Yüklenen fotoğraf ve PDF'leri saklar.
// CLOUDINARY_URL tanımlıysa Cloudinary'ye (kalıcı), değilse public/uploads klasörüne (yalnızca geliştirme) yazar.
// Neden? Render'ın ücretsiz sunucusunda disk geçicidir; yeniden başlatmada yerel dosyalar silinir.
const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const config = require('../config');

const UPLOAD_DIR = path.join(__dirname, '..', '..', 'public', 'uploads');
let cloudinary = null;

if (config.cloudinaryUrl) {
  // cloudinary paketi CLOUDINARY_URL ortam değişkenini kendisi okur
  cloudinary = require('cloudinary').v2;
  cloudinary.config({ secure: true });
}

const kullaniliyorMu = () => Boolean(cloudinary);

function cloudinaryyeYukle(buffer, secenekler) {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(secenekler, (err, sonuc) =>
      err ? reject(err) : resolve(sonuc)
    );
    stream.end(buffer);
  });
}

/**
 * @param {Express.Multer.File} dosya multer'ın bellekte tuttuğu dosya
 * @param {'talepler'|'isler'|'projeler'} klasor
 * @returns {Promise<{url:string, publicId:string, ad:string}>}
 */
async function kaydet(dosya, klasor) {
  const pdfMi = dosya.mimetype === 'application/pdf';

  if (cloudinary) {
    const sonuc = await cloudinaryyeYukle(dosya.buffer, {
      folder: `kilic-elektrik/${klasor}`,
      // PDF'ler "raw" olarak saklanır; görseller otomatik boyut/biçim optimizasyonu alır
      resource_type: pdfMi ? 'raw' : 'image',
    });
    const url = pdfMi
      ? sonuc.secure_url
      : // HEIC dahil her görseli tarayıcının açabileceği biçimde ve en fazla 1600px sun
        cloudinary.url(sonuc.public_id, {
          secure: true,
          fetch_format: 'auto',
          quality: 'auto',
          width: 1600,
          crop: 'limit',
        });
    return { url, publicId: `${pdfMi ? 'raw' : 'image'}:${sonuc.public_id}`, ad: dosya.originalname };
  }

  // Yerel geliştirme
  await fs.mkdir(path.join(UPLOAD_DIR, klasor), { recursive: true });
  const uzanti = path.extname(dosya.originalname).toLowerCase().replace(/[^.a-z0-9]/g, '') || '.bin';
  const ad = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}${uzanti}`;
  await fs.writeFile(path.join(UPLOAD_DIR, klasor, ad), dosya.buffer);
  return { url: `/uploads/${klasor}/${ad}`, publicId: `local:${klasor}/${ad}`, ad: dosya.originalname };
}

async function sil(publicId) {
  if (!publicId) return;
  try {
    const [tur, id] = publicId.split(/:(.+)/);
    if (tur === 'local') {
      await fs.unlink(path.join(UPLOAD_DIR, id));
    } else if (cloudinary) {
      await cloudinary.uploader.destroy(id, { resource_type: tur });
    }
  } catch (err) {
    // Dosya zaten yoksa işlemi durdurmaya gerek yok
    console.warn('Dosya silinemedi:', publicId, err.message);
  }
}

module.exports = { kaydet, sil, kullaniliyorMu };
