// Uygulama ilk açıldığında veritabanı boşsa usta hesabını, örnek hizmetleri ve işleri oluşturur.
// Böylece Render'a ilk yüklemede elle komut çalıştırmaya gerek kalmaz.
const config = require('../config');
const Kullanici = require('../models/Kullanici');
const Hizmet = require('../models/Hizmet');
const Is = require('../models/Is');

// Usta bu listeyi panelden düzenleyebilir.
const ORNEK_HIZMETLER = [
  { ad: 'Arıza tespiti ve onarım', slug: 'ariza', aciklama: 'Sigorta atması, elektrik kesilmesi, kısa devre, yanık koku. Önce arızayı bulur, sonra onarırız.' },
  { ad: 'Priz ve anahtar ekleme', slug: 'priz-anahtar', aciklama: 'Yeni priz, anahtar ya da var olanın yerini değiştirme. Sıva altı veya sıva üstü.' },
  { ad: 'Avize ve aplik montajı', slug: 'avize', aciklama: 'Avize, sarkıt, aplik ve tavan lambası montajı, gerekirse tavan kancası.' },
  { ad: 'Spot ve LED panel', slug: 'spot-led', aciklama: 'Asma tavana sıva altı spot, LED panel ve ray spot montajı.' },
  { ad: 'LED şerit ve gizli ışık', slug: 'led-serit', aciklama: 'Tavan kenarı, mutfak dolabı ve duvar panelleri için gizli ışık uygulaması.' },
  { ad: 'Kaçak akım rölesi', slug: 'kacak-akim', aciklama: 'Can güvenliği için kaçak akım rölesi takılması ve test edilmesi.' },
  { ad: 'Sigorta kutusu yenileme', slug: 'sigorta-kutusu', aciklama: 'Eski tip sigorta kutusunun otomatik sigortalı yeni panoyla değiştirilmesi.' },
  { ad: 'Daire tesisatı yenileme', slug: 'daire-tesisat', aciklama: 'Eskiyen kabloların ve hatların komple yenilenmesi. Önce yerinde keşif yapılır.' },
];

const ORNEK_ISLER = [
  { baslik: 'Panel arası LED aydınlatma', kategori: 'ticari', aciklama: 'Ofis duvarında siyah paneller arasına gizli şerit LED.', foto: 'panel-led.jpg', oneCikan: true },
  { baslik: 'Örgü atölyesi tesisatı', kategori: 'endustriyel', aciklama: 'Kablo tavası, boru tesisatı ve etanj armatür montajı.', foto: 'fabrika.jpg', oneCikan: true },
  { baslik: 'Mutfak aydınlatması', kategori: 'ev', aciklama: 'Ray spot, sarkıt avize ve dolap içi aydınlatma.', foto: 'mutfak.jpg', oneCikan: true },
  { baslik: 'Ofis tavanı LED spot', kategori: 'ticari', aciklama: 'Sıva altı LED spotlarla eşit dağılımlı aydınlatma.', foto: 'spot.jpg' },
  { baslik: 'Kafe lineer armatür hattı', kategori: 'ticari', aciklama: 'Yüksek tavanlı kafede askılı lineer armatürler.', foto: 'kafe1.jpg' },
  { baslik: 'Restoran salonu aydınlatması', kategori: 'ticari', aciklama: 'Masa üstü askılı lineer aydınlatma.', foto: 'kafe2.jpg' },
  { baslik: 'Renkli gizli tavan ışığı', kategori: 'ev', aciklama: 'Asma tavan çerçevesinde renkli LED ve ray spot.', foto: 'tavan.jpg' },
];

async function hazirla() {
  // 1) Usta hesabı
  if ((await Kullanici.countDocuments()) === 0) {
    if (config.adminPassword) {
      await Kullanici.create({
        kullaniciAdi: config.adminUsername,
        sifreHash: await Kullanici.sifreOzeti(config.adminPassword),
      });
      console.log(`Usta hesabı oluşturuldu: ${config.adminUsername}`);
    } else {
      console.warn('ADMIN_PASSWORD tanımlı değil, usta hesabı oluşturulmadı. Panel girişi için .env dosyasına ekleyin.');
    }
  }

  // 2) Hizmetler
  if ((await Hizmet.countDocuments()) === 0) {
    await Hizmet.insertMany(ORNEK_HIZMETLER.map((h, i) => ({ ...h, sira: i + 1 })));
    console.log(`${ORNEK_HIZMETLER.length} örnek hizmet eklendi.`);
  }

  // 3) Galeri
  if ((await Is.countDocuments()) === 0) {
    await Is.insertMany(
      ORNEK_ISLER.map(({ foto, ...is }, i) => ({
        ...is,
        fotograflar: [{ url: `/img/isler/${foto}` }],
        tarih: new Date(Date.now() - i * 86400000 * 9),
      }))
    );
    console.log(`${ORNEK_ISLER.length} örnek iş eklendi.`);
  }
}

module.exports = { hazirla };
