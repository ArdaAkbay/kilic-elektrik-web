// Express uygulamasının kurulumu: güvenlik başlıkları, oturum, şablonlar, rotalar, hata sayfaları.
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const session = require('express-session');
const { MongoStore } = require('connect-mongo');
const methodOverride = require('method-override');
const mongoose = require('mongoose');

const config = require('./config');
const { bilgiMesaji, sablonDegiskenleri } = require('./middleware/genel');
const publicRoutes = require('./routes/public');
const adminRoutes = require('./routes/admin');

function uygulamaOlustur() {
  const app = express();

  app.set('view engine', 'ejs');
  app.set('views', path.join(__dirname, '..', 'views'));
  // Render gibi servisler isteği bir proxy üzerinden iletir; gerçek IP ve https bilgisini doğru okumak için
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(
    helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'"],
          styleSrc: ["'self'", 'https://fonts.googleapis.com', "'unsafe-inline'"],
          fontSrc: ["'self'", 'https://fonts.gstatic.com'],
          imgSrc: ["'self'", 'data:', 'blob:', 'https://res.cloudinary.com'],
          formAction: ["'self'"],
          frameAncestors: ["'none'"],
          upgradeInsecureRequests: config.isProd ? [] : null,
        },
      },
    })
  );
  app.use(compression());
  app.use(express.static(path.join(__dirname, '..', 'public'), { maxAge: config.isProd ? '7d' : 0 }));
  app.use(express.urlencoded({ extended: true, limit: '100kb' }));
  // HTML formları sadece GET/POST gönderebilir; "?_method=PUT" ile PUT/DELETE'e çeviriyoruz
  app.use(methodOverride('_method'));

  app.use(
    session({
      name: 'ke.sid',
      secret: config.sessionSecret,
      resave: false,
      saveUninitialized: false,
      store: MongoStore.create({
        client: mongoose.connection.getClient(),
        collectionName: 'oturumlar',
        ttl: 60 * 60 * 24 * 7,
        autoRemove: config.sessionAutoRemove,
      }),
      cookie: {
        httpOnly: true,
        sameSite: 'lax', // başka sitelerden gönderilen formlarda çerez gitmez (CSRF koruması)
        secure: config.isProd,
        maxAge: 1000 * 60 * 60 * 24 * 7,
      },
    })
  );

  app.use(bilgiMesaji);
  app.use(sablonDegiskenleri);

  app.use('/', publicRoutes);
  app.use('/admin', adminRoutes);

  // 404
  app.use((req, res) => {
    res.status(404).render('public/hata', {
      baslik: 'Sayfa bulunamadı',
      kod: 404,
      mesaj: 'Aradığınız sayfa taşınmış ya da hiç var olmamış olabilir.',
    });
  });

  // Beklenmeyen hatalar
  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    if (err.name === 'CastError') {
      return res.status(404).render('public/hata', { baslik: 'Kayıt bulunamadı', kod: 404, mesaj: 'Bu kayıt bulunamadı.' });
    }
    console.error(err);
    res.status(500).render('public/hata', {
      baslik: 'Bir şeyler ters gitti',
      kod: 500,
      mesaj: 'Beklenmeyen bir hata oluştu. Lütfen biraz sonra tekrar deneyin ya da bizi arayın.',
    });
  });

  return app;
}

module.exports = { uygulamaOlustur };
