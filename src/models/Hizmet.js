// Kılıç Elektrik'in sunduğu hizmetler. Fiyat gösterilmez; fiyat keşiften sonra verilir.
// kapi: "proje" hizmetleri fotoğraflı kartlarla /hizmetler sayfasında, "ev" hizmetleri "Evim için" listesinde görünür.
// Usta panelden ekler, günceller, fotoğrafını değiştirir, siler.
const mongoose = require('mongoose');
const { HIZMET_GRUPLARI, values } = require('../utils/constants');

const hizmetSchema = new mongoose.Schema(
  {
    ad: { type: String, required: true, trim: true, maxlength: 60 },
    slug: { type: String, required: true, unique: true, index: true }, // adres: /hizmetler/<slug>
    kapi: { type: String, enum: ['ev', 'proje'], required: true, default: 'proje' },
    grup: { type: String, enum: values(HIZMET_GRUPLARI) },
    kisaAciklama: { type: String, trim: true, maxlength: 160 }, // kartta ve Google'da görünen özet
    aciklama: { type: String, trim: true, maxlength: 1200 }, // hizmet sayfasındaki uzun metin
    gorsel: {
      url: String,
      kucukUrl: String,
      publicId: String, // panelden yüklenen fotoğrafı silebilmek için
    },
    aktif: { type: Boolean, default: true },
    oneCikan: { type: Boolean, default: false }, // ana sayfada gösterilsin mi
    sira: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Hizmet', hizmetSchema, 'hizmetler');
