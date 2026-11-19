// "Yaptığımız işler" galerisindeki bir iş.
const mongoose = require('mongoose');
const { IS_KATEGORILERI, values } = require('../utils/constants');

const isSchema = new mongoose.Schema(
  {
    baslik: { type: String, required: true, trim: true, maxlength: 80 },
    kategori: { type: String, enum: values(IS_KATEGORILERI), required: true },
    aciklama: { type: String, trim: true, maxlength: 300 },
    fotograflar: [
      {
        url: { type: String, required: true },
        publicId: String,
        _id: false,
      },
    ],
    tarih: { type: Date, default: Date.now },
    oneCikan: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Is', isSchema, 'isler');
