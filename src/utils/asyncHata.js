// Express 4, async fonksiyonlarda oluşan hataları kendiliğinden yakalamaz.
// Bu sarmalayıcı hatayı next()'e iletir; böylece hata sayfası gösterilir, sunucu çökmez.
module.exports = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
