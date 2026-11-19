// Takip kodundaki sıra numarası için sayaç.
// $inc tek bir atomik işlem olduğu için aynı anda gelen iki talep aynı numarayı alamaz.
const mongoose = require('mongoose');

const sayacSchema = new mongoose.Schema({
  _id: { type: String, required: true }, // örn. "talep-2026"
  deger: { type: Number, default: 0 },
});

const Sayac = mongoose.model('Sayac', sayacSchema, 'sayaclar');

// KE-2026-0001 biçiminde yeni takip kodu üretir
async function yeniTakipKodu(tarih = new Date()) {
  const yil = tarih.getFullYear();
  const sayac = await Sayac.findOneAndUpdate(
    { _id: `talep-${yil}` },
    { $inc: { deger: 1 } },
    { returnDocument: 'after', upsert: true }
  );
  return `KE-${yil}-${String(sayac.deger).padStart(4, '0')}`;
}

module.exports = { Sayac, yeniTakipKodu };
