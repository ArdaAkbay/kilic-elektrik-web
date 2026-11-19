// Müşteriden gelen ev veya proje talebi.
const mongoose = require('mongoose');
const { DURUMLAR, YAPI_TIPLERI, PROJE_KAPSAMI, UYGUN_ZAMANLAR, values } = require('../utils/constants');

const dosyaSchema = new mongoose.Schema(
  {
    url: { type: String, required: true },
    publicId: String, // Cloudinary'den silebilmek için
    ad: String, // orijinal dosya adı
  },
  { _id: false }
);

const talepSchema = new mongoose.Schema(
  {
    takipKodu: { type: String, required: true, unique: true, index: true },
    tur: { type: String, enum: ['ev', 'proje'], required: true },

    // Ortak alanlar
    adSoyad: { type: String, required: true, trim: true, maxlength: 60 },
    telefon: { type: String, required: true, trim: true },
    ilce: { type: String, required: true, trim: true, maxlength: 40 },
    adres: { type: String, trim: true, maxlength: 200 },
    aciklama: { type: String, required: true, trim: true, maxlength: 1000 },
    kvkkOnay: { type: Boolean, required: true },

    // Ev talebi
    hizmet: { type: mongoose.Schema.Types.ObjectId, ref: 'Hizmet' },
    hizmetAdi: String, // hizmet sonradan silinse de talepte adı kalsın
    uygunZaman: { type: String, enum: values(UYGUN_ZAMANLAR) },
    fotograflar: [dosyaSchema],

    // Proje talebi
    firma: { type: String, trim: true, maxlength: 80 },
    eposta: { type: String, trim: true, lowercase: true, maxlength: 120 },
    yapiTipi: { type: String, enum: values(YAPI_TIPLERI) },
    katSayisi: Number,
    metrekare: Number,
    daireSayisi: Number,
    kapsam: [{ type: String, enum: values(PROJE_KAPSAMI) }],
    projeDosyasi: dosyaSchema,

    // Takip
    durum: { type: String, enum: values(DURUMLAR), default: 'yeni', index: true },
    durumGecmisi: [
      {
        durum: { type: String, enum: values(DURUMLAR) },
        tarih: { type: Date, default: Date.now },
        _id: false,
      },
    ],
    ustaNotlari: [
      {
        metin: { type: String, maxlength: 500 },
        tarih: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// Müşteri takip sayfasında görebileceği, kişisel veri içermeyen özet
talepSchema.methods.toTakipOzeti = function () {
  return {
    takipKodu: this.takipKodu,
    tur: this.tur,
    baslik: this.tur === 'ev' ? this.hizmetAdi : 'Proje görüşme talebi',
    durum: this.durum,
    durumGecmisi: this.durumGecmisi,
    olusturma: this.createdAt,
  };
};

module.exports = mongoose.model('Talep', talepSchema, 'talepler');
