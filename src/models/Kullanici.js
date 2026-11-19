// Usta paneline giriş yapan kullanıcı. Şifre açık değil, bcrypt özeti olarak saklanır.
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const kullaniciSchema = new mongoose.Schema(
  {
    kullaniciAdi: { type: String, required: true, unique: true, trim: true, lowercase: true },
    sifreHash: { type: String, required: true },
    rol: { type: String, enum: ['admin'], default: 'admin' },
  },
  { timestamps: true }
);

kullaniciSchema.methods.sifreDogruMu = function (sifre) {
  return bcrypt.compare(sifre, this.sifreHash);
};

kullaniciSchema.statics.sifreOzeti = function (sifre) {
  return bcrypt.hash(sifre, 12);
};

module.exports = mongoose.model('Kullanici', kullaniciSchema, 'kullanicilar');
