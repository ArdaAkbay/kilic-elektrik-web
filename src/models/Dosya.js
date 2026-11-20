// Yüklenen fotoğraf ve PDF'ler doğrudan veritabanında saklanır.
// Neden? Render'ın ücretsiz sunucusunda disk geçicidir; ayrı bir dosya servisine (Cloudinary vb.) de gerek kalmaz.
// Fotoğraflar yüklenirken küçültülür: büyük (en fazla 1600px) ve küçük (600px) iki sürüm tutulur.
const mongoose = require('mongoose');

const dosyaSchema = new mongoose.Schema(
  {
    tur: { type: String, enum: ['gorsel', 'pdf'], required: true },
    mime: { type: String, required: true },
    ad: { type: String, maxlength: 200 }, // yüklenen dosyanın orijinal adı
    veri: { type: Buffer, required: true }, // büyük sürüm ya da PDF'in kendisi
    kucuk: Buffer, // sadece görseller için
    genislik: Number,
    yukseklik: Number,
    boyut: Number, // bayt
    // Hizmet ve galeri fotoğrafları herkese açık; müşteri talep dosyaları sadece ustaya
    herkeseAcik: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Dosya', dosyaSchema, 'dosyalar');
