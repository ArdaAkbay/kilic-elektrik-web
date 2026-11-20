// Yeni talep geldiğinde ustaya e-posta gönderir (Resend HTTP API).
// Anahtar tanımlı değilse e-postayı sadece konsola yazar; site çalışmaya devam eder.
const config = require('../config');
const { labelOf, YAPI_TIPLERI, PROJE_KAPSAMI, UYGUN_ZAMANLAR } = require('../utils/constants');

const kacis = (s) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

function talepEpostasi(talep) {
  const satirlar = [
    ['Takip kodu', talep.takipKodu],
    ['Tür', talep.tur === 'ev' ? 'Ev / iş yeri' : 'Proje'],
    ['Ad soyad', talep.adSoyad],
    ['Telefon', talep.telefon],
    ['İlçe', talep.ilce],
  ];
  if (talep.tur === 'ev') {
    satirlar.push(['Hizmet', talep.hizmetAdi], ['Uygun zaman', labelOf(UYGUN_ZAMANLAR, talep.uygunZaman)]);
    satirlar.push(['Fotoğraf', `${talep.fotograflar.length} adet`]);
  } else {
    if (talep.hizmetAdi) satirlar.push(['İlgili hizmet', talep.hizmetAdi]);
    if (talep.firma) satirlar.push(['Firma', talep.firma]);
    satirlar.push(
      ['Yapı tipi', labelOf(YAPI_TIPLERI, talep.yapiTipi)],
      ['Kat / m²', `${talep.katSayisi} kat, ${talep.metrekare} m²`],
      ['Kapsam', talep.kapsam.map((k) => labelOf(PROJE_KAPSAMI, k)).join(', ')]
    );
  }
  const panelLinki = config.siteUrl ? `${config.siteUrl}/admin/talepler/${talep._id}` : '';
  const tablo = satirlar
    .map(([k, v]) => `<tr><td style="padding:4px 12px 4px 0;color:#666">${kacis(k)}</td><td style="padding:4px 0"><b>${kacis(v)}</b></td></tr>`)
    .join('');

  return {
    subject: `Yeni ${talep.tur === 'ev' ? 'ev' : 'proje'} talebi: ${talep.takipKodu} – ${talep.adSoyad}`,
    html: `<div style="font-family:Arial,sans-serif;font-size:15px">
      <p>Siteden yeni bir talep geldi.</p>
      <table>${tablo}</table>
      <p style="margin-top:16px"><b>Açıklama:</b><br>${kacis(talep.aciklama).replace(/\n/g, '<br>')}</p>
      ${panelLinki ? `<p><a href="${panelLinki}">Talebi panelde aç</a></p>` : ''}
    </div>`,
  };
}

async function yeniTalepBildir(talep) {
  const { subject, html } = talepEpostasi(talep);

  if (!config.resendApiKey || !config.notifyEmail) {
    console.log(`[e-posta devre dışı] ${subject}`);
    return false;
  }

  try {
    const yanit = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${config.resendApiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: config.mailFrom, to: [config.notifyEmail], subject, html }),
    });
    if (!yanit.ok) throw new Error(`${yanit.status} ${await yanit.text()}`);
    return true;
  } catch (err) {
    // E-posta gitmese bile müşterinin talebi kaydedilmiş olur; sadece günlüğe yazarız
    console.error('Bildirim e-postası gönderilemedi:', err.message);
    return false;
  }
}

module.exports = { yeniTalepBildir, talepEpostasi };
