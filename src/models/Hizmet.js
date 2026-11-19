// "Evim için" sayfasında listelenen hizmetler. Fiyat gösterilmez; fiyat keşiften sonra verilir.
// Usta panelden ekler, günceller, siler.
const mongoose = require('mongoose');

const hizmetSchema = new mongoose.Schema(
  {
    ad: { type: String, required: true, trim: true, maxlength: 60 },
    slug: { type: String, required: true, unique: true, index: true },
    aciklama: { type: String, trim: true, maxlength: 240 },
    aktif: { type: Boolean, default: true },
    sira: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Hizmet', hizmetSchema, 'hizmetler');
