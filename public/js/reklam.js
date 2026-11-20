// Google Ads: çerez onayı ve dönüşüm takibi.
// Bu dosya sadece GOOGLE_ADS_ID tanımlıysa sayfaya eklenir.
// KVKK gereği Google kodu, ziyaretçi "Kabul et" demeden HİÇ yüklenmez.
// Dönüşümler: (1) talep gönderildi (talep alındı sayfası), (2) arama veya WhatsApp düğmesine basıldı.
(function () {
  'use strict';

  var betik = document.currentScript;
  var ADS_ID = betik.getAttribute('data-ads-id');
  var TALEP_ETIKETI = betik.getAttribute('data-talep-etiketi');
  var ARAMA_ETIKETI = betik.getAttribute('data-arama-etiketi');
  var CEREZ = 'ke_cerez_tercihi';

  function tercihOku() {
    var m = document.cookie.match(new RegExp('(?:^|; )' + CEREZ + '=([^;]*)'));
    return m ? m[1] : null;
  }
  function tercihYaz(deger) {
    // Tercih 1 yıl hatırlanır. Bu çerez zorunlu çerezdir (tercihi saklamak için).
    document.cookie = CEREZ + '=' + deger + '; Max-Age=31536000; Path=/; SameSite=Lax' + (location.protocol === 'https:' ? '; Secure' : '');
  }

  // --- Google etiketi ---
  var yuklendi = false;
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }

  function googleYukle() {
    if (yuklendi) return;
    yuklendi = true;
    gtag('consent', 'default', { ad_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'denied', analytics_storage: 'denied' });
    gtag('js', new Date());
    gtag('config', ADS_ID);
    var s = document.createElement('script');
    s.async = true;
    s.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(ADS_ID);
    document.head.appendChild(s);
    donusumleriKur();
  }

  function donusum(etiket, ekstra) {
    if (!yuklendi || !etiket) return;
    var veri = { send_to: ADS_ID + '/' + etiket };
    for (var k in ekstra) veri[k] = ekstra[k];
    gtag('event', 'conversion', veri);
  }

  function donusumleriKur() {
    // 1) Talep alındı sayfası: aynı talep için yalnızca bir kez say
    var govde = document.body;
    if (govde.getAttribute('data-donusum') === 'talep') {
      var kod = govde.getAttribute('data-takip-kodu');
      var anahtar = 'ke_donusum_' + kod;
      var sayildi = false;
      try { sayildi = sessionStorage.getItem(anahtar) === '1'; } catch (e) {}
      if (!sayildi) {
        donusum(TALEP_ETIKETI, { transaction_id: kod });
        try { sessionStorage.setItem(anahtar, '1'); } catch (e) {}
      }
    }
    // 2) Telefon ve WhatsApp tıklamaları
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href^="tel:"], a[href*="wa.me/"]');
      if (a) donusum(ARAMA_ETIKETI, {});
    });
  }

  // --- Çerez bandı ---
  var bant = document.getElementById('cerez-bandi');
  function bandiGoster() { if (bant) bant.hidden = false; }
  function bandiGizle() { if (bant) bant.hidden = true; }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest && e.target.closest('[data-cerez], [data-cerez-ayar]');
    if (!btn) return;
    if (btn.hasAttribute('data-cerez-ayar')) { bandiGoster(); return; }
    var karar = btn.getAttribute('data-cerez');
    tercihYaz(karar);
    bandiGizle();
    if (karar === 'kabul') googleYukle();
    // Daha önce kabul edip şimdi reddettiyse, yüklenmiş Google kodunu durdurmanın en temiz yolu sayfayı yenilemek
    else if (yuklendi) location.reload();
  });

  var tercih = tercihOku();
  if (tercih === 'kabul') googleYukle();
  else if (!tercih) bandiGoster();
})();
