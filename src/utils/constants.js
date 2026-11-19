// Formlarda ve panelde kullanılan sabit listeler.
// Değerler (value) veritabanına yazılır, etiketler (label) ekranda görünür.

const DURUMLAR = [
  { value: 'yeni', label: 'Yeni', aciklama: 'Talebiniz bize ulaştı, en kısa sürede sizi arayacağız.' },
  { value: 'kesif', label: 'Keşif planlandı', aciklama: 'Ustamız sizinle görüştü ve keşif için gün belirlendi.' },
  { value: 'teklif', label: 'Teklif verildi', aciklama: 'Keşif tamamlandı, fiyat teklifi size iletildi.' },
  { value: 'tamamlandi', label: 'Tamamlandı', aciklama: 'İş tamamlandı ve teslim edildi. Bizi tercih ettiğiniz için teşekkürler.' },
  { value: 'iptal', label: 'İptal edildi', aciklama: 'Bu talep kapatıldı. Yeni bir talep oluşturabilirsiniz.' },
];

const YAPI_TIPLERI = [
  { value: 'apartman', label: 'Apartman / konut' },
  { value: 'villa', label: 'Müstakil ev / villa' },
  { value: 'magaza', label: 'Mağaza / kafe / restoran' },
  { value: 'ofis', label: 'Ofis / plaza katı' },
  { value: 'fabrika', label: 'Fabrika / atölye / depo' },
  { value: 'diger', label: 'Diğer' },
];

const PROJE_KAPSAMI = [
  { value: 'tesisat', label: 'Komple elektrik tesisatı' },
  { value: 'aydinlatma', label: 'İç ve dış aydınlatma' },
  { value: 'pano', label: 'Pano ve dağıtım tesisatı' },
  { value: 'zayif-akim', label: 'Zayıf akım (data, TV, diyafon, kamera)' },
  { value: 'topraklama', label: 'Topraklama ve paratoner' },
  { value: 'endustriyel', label: 'Makine besleme ve kablo tavası' },
];

const UYGUN_ZAMANLAR = [
  { value: 'hici-sabah', label: 'Hafta içi, sabah' },
  { value: 'hici-ogle', label: 'Hafta içi, öğleden sonra' },
  { value: 'hici-aksam', label: 'Hafta içi, akşam' },
  { value: 'hsonu', label: 'Cumartesi' },
  { value: 'farketmez', label: 'Fark etmez' },
];

const IS_KATEGORILERI = [
  { value: 'ev', label: 'Ev' },
  { value: 'ticari', label: 'Ticari' },
  { value: 'endustriyel', label: 'Endüstriyel' },
];

const values = (list) => list.map((x) => x.value);
const labelOf = (list, value) => (list.find((x) => x.value === value) || {}).label || value;

module.exports = {
  DURUMLAR,
  YAPI_TIPLERI,
  PROJE_KAPSAMI,
  UYGUN_ZAMANLAR,
  IS_KATEGORILERI,
  values,
  labelOf,
};
