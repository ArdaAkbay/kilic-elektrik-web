// İlk açılışta veritabanına yüklenen hizmetler. Sonrasında usta bunları panelden düzenler.
// Başlıkların bir kısmı müşterinin kendi yazdığı başlıklardır (musteri: true).
// Proje hizmetlerinin fotoğrafları public/img/hizmetler klasöründedir.

const PROJE = [
  // --- Aydınlatma ---
  { slug: 'fabrika-aydinlatma', ad: 'Fabrika aydınlatma', grup: 'aydinlatma', musteri: true, oneCikan: true,
    kisa: 'Üretim alanları için yeterli, eşit ve göz yormayan genel aydınlatma.',
    aciklama: 'Fabrika ve üretim alanlarında çalışma güvenliği büyük ölçüde aydınlatmaya bağlıdır. Alanın kullanımına göre armatür tipini ve yerleşimini belirliyor, montajını ve hat tesisatını yapıyoruz. Mevcut eski armatürlerin LED armatürlerle değiştirilmesi de bu kapsamdadır.' },
  { slug: 'yuksek-tavan-aydinlatma', ad: 'Yüksek tavan aydınlatma', grup: 'aydinlatma', musteri: true, oneCikan: true,
    kisa: 'Depo, hangar ve atölyeler için yüksek tavan armatürlerinin montajı.',
    aciklama: 'Yüksek tavanlı depo, hangar ve atölyelerde ışığın zemine yeterli şiddette ulaşması gerekir. Uygun yüksek tavan armatürlerini seçip yerleşimini planlıyor, yüksekte çalışma ekipmanıyla montajını ve kablolamasını yapıyoruz.' },
  { slug: 'lineer-aydinlatma-sistemleri', ad: 'Lineer aydınlatma sistemleri', grup: 'aydinlatma', musteri: true, oneCikan: true,
    kisa: 'Tavan boyunca kesintisiz çizgi hâlinde lineer armatür uygulamaları.',
    aciklama: 'Lineer armatürler üretim hatları, ofisler ve mağazalarda düzenli ve kesintisiz bir ışık çizgisi oluşturur. Askılı, sıva üstü veya ankastre lineer sistemlerin montajını, hat bağlantılarını ve devreye alınmasını yapıyoruz.' },
  { slug: 'magaza-aydinlatma', ad: 'Mağaza aydınlatma', grup: 'aydinlatma', musteri: true, oneCikan: true,
    kisa: 'Ürünü öne çıkaran ray spot ve vitrin aydınlatması.',
    aciklama: 'Mağazada doğru ışık ürünü öne çıkarır. Ray spot, vitrin ve genel aydınlatmayı mağazanın düzenine göre planlıyor, montajını ve elektrik tesisatını yapıyoruz.' },
  { slug: 'cevre-aydinlatma', ad: 'Çevre aydınlatma', grup: 'aydinlatma', musteri: true, oneCikan: true,
    kisa: 'Bina cephesi, otopark ve saha için dış aydınlatma.',
    aciklama: 'Bina çevresi, otopark ve saha aydınlatması hem güvenlik hem görünürlük sağlar. Projektör ve dış mekân armatürlerinin montajını, toprak altı ya da cephe üzeri kablolamasını ve zamanlayıcı/fotosel bağlantılarını yapıyoruz.' },
  { slug: 'acil-cikis-ve-acil-aydinlatma', ad: 'Acil çıkış ve acil aydınlatma', grup: 'aydinlatma', musteri: true, oneCikan: true,
    kisa: 'Elektrik kesildiğinde de çalışan yönlendirme ve acil aydınlatma armatürleri.',
    aciklama: 'Elektrik kesintisinde insanların binayı güvenle terk edebilmesi için acil yönlendirme levhaları ve acil aydınlatma armatürleri gerekir. Bu armatürlerin yerleşimini, montajını ve bağlantılarını yapıyoruz.' },
  { slug: 'vincli-hol-aydinlatmasi', ad: 'Vinçli hol aydınlatması', grup: 'aydinlatma',
    kisa: 'Tavan vinci bulunan üretim hollerinde vinç hattını engellemeyen aydınlatma.',
    aciklama: 'Tavan vinci bulunan hollerde armatürler vinç hareketini engellemeyecek şekilde yerleştirilmelidir. Armatürlerin konumunu buna göre planlıyor, montajını ve kablolamasını yapıyoruz.' },
  { slug: 'uretim-hatti-aydinlatma-montaji', ad: 'Üretim hattı aydınlatma montajı', grup: 'aydinlatma',
    kisa: 'Makine ve tezgâh üzerine odaklı hat aydınlatması.',
    aciklama: 'Üretim hattı boyunca makine ve tezgâhların üzerine yeterli ışık düşmesi için armatürlerin hatta göre konumlandırılması gerekir. Hat üstü armatür montajını ve bağlantılarını yapıyoruz.' },

  // --- Tesisat ve altyapı ---
  { slug: 'kablo-tava-montaj', ad: 'Kablo tava montaj', grup: 'tesisat', musteri: true, oneCikan: true,
    kisa: 'Enerji ve zayıf akım kabloları için düzenli kablo tava sistemleri.',
    aciklama: 'Kablo tavaları kabloları düzenli, erişilebilir ve korumalı şekilde taşır. Tava güzergâhını belirliyor, askı ve konsol montajını yapıyor, kabloları tavaya düzenli şekilde yerleştiriyoruz.' },
  { slug: 'kablo-borusu-montaji', ad: 'Kablo borusu montajı', grup: 'tesisat', musteri: true,
    kisa: 'Sıva üstü tesisatlarda kabloları koruyan boru sistemleri.',
    aciklama: 'Sıva üstü tesisatlarda kablolar boru içinden geçirilerek dış etkilerden korunur. Boru güzergâhını düzenli şekilde planlıyor, büküm, kelepçe ve bağlantı parçalarıyla montajını yapıyoruz.' },
  { slug: 'enerji-kablolamasi', ad: 'Enerji kablolaması', grup: 'tesisat', musteri: true, oneCikan: true,
    kisa: 'Bina ve tesislere enerji taşıyan ana kabloların çekilmesi.',
    aciklama: 'Ana dağıtım ile bina veya tesis arasındaki enerji kablolarının toprak altından ya da kanal içinden çekilmesi, bağlantılarının yapılması ve test edilmesi.' },
  { slug: 'kablo-kanali-ve-tava-sistemleri', ad: 'Kablo kanalı ve tava sistemleri', grup: 'tesisat',
    kisa: 'Tavan ve duvar boyunca kablo kanalı ve tava altyapısı.',
    aciklama: 'Yeni yapılarda ya da tadilatlarda tavan ve duvar boyunca kablo kanalı ve tava altyapısının kurulması. Sonradan eklenecek hatlar için yedek kapasite bırakacak şekilde planlıyoruz.' },
  { slug: 'yuksekte-kablo-yolu-montaji', ad: 'Yüksekte kablo yolu montajı', grup: 'tesisat',
    kisa: 'Platform ve iskele ile yüksek tavanlarda kablo yolu montajı.',
    aciklama: 'Yüksek tavanlı yapılarda kablo yollarının montajı kaldırma platformu ve iskele ile, iş güvenliği önlemleri alınarak yapılır.' },
  { slug: 'uretim-alani-elektrik-tesisati', ad: 'Üretim alanı elektrik tesisatı', grup: 'tesisat',
    kisa: 'Üretim alanlarının priz, aydınlatma ve makine hatlarıyla komple tesisatı.',
    aciklama: 'Üretim alanlarında aydınlatma, priz ve makine besleme hatlarının birlikte planlanması ve kurulması. Tesis çalışırken yapılacak işlerde üretimi en az etkileyecek şekilde çalışırız.' },
  { slug: 'makine-besleme-hatlari', ad: 'Makine besleme hatları', grup: 'tesisat',
    kisa: 'Üretim makinelerine enerji hattı çekilmesi ve bağlantısı.',
    aciklama: 'Yeni gelen ya da yeri değişen makinelerin enerji hatlarının çekilmesi, panodan makineye kadar bağlantılarının yapılması ve test edilmesi.' },
  { slug: 'pano-montaji-ve-motor-baglantisi', ad: 'Pano montajı ve motor bağlantısı', grup: 'tesisat',
    kisa: 'Dağıtım panosu montajı ve motor bağlantıları.',
    aciklama: 'Dağıtım ve kumanda panolarının yerine montajı, kablo girişlerinin yapılması ve motor bağlantılarının tamamlanması.' },
  { slug: 'santiye-elektrik-altyapisi', ad: 'Şantiye elektrik altyapısı', grup: 'tesisat',
    kisa: 'İnşaat sürecinde binanın elektrik altyapısının kurulması.',
    aciklama: 'Yapım aşamasındaki binalarda kaba tesisat, boru ve kutu yerleşimi gibi elektrik altyapısının inşaat takvimine uygun şekilde kurulması.' },

  // --- Kontrol ve güvenlik ---
  { slug: 'topraklama-tesisati', ad: 'Topraklama tesisatı', grup: 'kontrol', musteri: true,
    kisa: 'Can ve cihaz güvenliği için topraklama sistemi kurulumu.',
    aciklama: 'Topraklama, kaçak akımın insana değil toprağa gitmesini sağlar. Topraklama çubuğu veya şerit uygulamasını, bağlantılarını ve ölçümünü yapıyoruz.' },
  { slug: 'tesisat-kontrol-hizmetleri', ad: 'Tesisat kontrol hizmetleri', grup: 'kontrol', musteri: true,
    kisa: 'Mevcut elektrik tesisatının kontrolü ve eksiklerin raporlanması.',
    aciklama: 'Mevcut tesisatın panolar, hatlar ve koruma elemanları açısından gözden geçirilmesi. Tespit edilen eksikleri size açıkça bildiriyor, isterseniz giderilmesini üstleniyoruz.' },
];

const EV = [
  { slug: 'ariza', ad: 'Arıza tespiti ve onarım', kisa: 'Sigorta atması, elektrik kesilmesi, kısa devre, yanık koku. Önce arızayı bulur, sonra onarırız.' },
  { slug: 'priz-anahtar', ad: 'Priz ve anahtar ekleme', kisa: 'Yeni priz, anahtar ya da var olanın yerini değiştirme. Sıva altı veya sıva üstü.' },
  { slug: 'avize', ad: 'Avize ve aplik montajı', kisa: 'Avize, sarkıt, aplik ve tavan lambası montajı, gerekirse tavan kancası.' },
  { slug: 'spot-led', ad: 'Spot ve LED panel', kisa: 'Asma tavana sıva altı spot, LED panel ve ray spot montajı.' },
  { slug: 'led-serit', ad: 'LED şerit ve gizli ışık', kisa: 'Tavan kenarı, mutfak dolabı ve duvar panelleri için gizli ışık uygulaması.' },
  { slug: 'kacak-akim', ad: 'Kaçak akım rölesi', kisa: 'Can güvenliği için kaçak akım rölesi takılması ve test edilmesi.' },
  { slug: 'sigorta-kutusu', ad: 'Sigorta kutusu yenileme', kisa: 'Eski tip sigorta kutusunun otomatik sigortalı yeni panoyla değiştirilmesi.' },
  { slug: 'daire-tesisat', ad: 'Daire tesisatı yenileme', kisa: 'Eskiyen kabloların ve hatların komple yenilenmesi. Önce yerinde keşif yapılır.' },
];

module.exports = { PROJE, EV };
