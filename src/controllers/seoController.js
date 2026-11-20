// Google'ın siteyi ve hizmet sayfalarını bulabilmesi için robots.txt ve sitemap.xml.
const Hizmet = require('../models/Hizmet');
const config = require('../config');

function siteAdresi(req) {
  return config.siteUrl || `${req.protocol}://${req.get('host')}`;
}

exports.robots = (req, res) => {
  res.type('text/plain').send(
    ['User-agent: *', 'Disallow: /admin', 'Disallow: /dosya/', 'Disallow: /talep/', `Sitemap: ${siteAdresi(req)}/sitemap.xml`, ''].join('\n')
  );
};

exports.sitemap = async (req, res) => {
  const adres = siteAdresi(req);
  const hizmetler = await Hizmet.find({ aktif: true, kapi: 'proje' }).select('slug updatedAt').lean();
  const sayfalar = [
    { yol: '/', oncelik: '1.0' },
    { yol: '/hizmetler', oncelik: '0.9' },
    { yol: '/projem', oncelik: '0.8' },
    { yol: '/evim', oncelik: '0.8' },
    { yol: '/isler', oncelik: '0.6' },
    ...hizmetler.map((h) => ({ yol: `/hizmetler/${h.slug}`, oncelik: '0.7', tarih: h.updatedAt })),
  ];
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...sayfalar.map(
      (s) =>
        `  <url><loc>${adres}${s.yol}</loc>${s.tarih ? `<lastmod>${new Date(s.tarih).toISOString().slice(0, 10)}</lastmod>` : ''}<priority>${s.oncelik}</priority></url>`
    ),
    '</urlset>',
  ].join('\n');
  res.type('application/xml').send(xml);
};
