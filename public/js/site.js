// Sayfadaki küçük etkileşimler. Site JavaScript kapalıyken de çalışır; bunlar sadece kolaylık sağlar.
(function () {
  'use strict';

  // Mobil menü
  var menuBtn = document.querySelector('[data-menu-btn]');
  var menu = document.getElementById('menu');
  if (menuBtn && menu) {
    menuBtn.addEventListener('click', function () {
      var acik = menu.classList.toggle('acik');
      menuBtn.setAttribute('aria-expanded', String(acik));
      menuBtn.textContent = acik ? 'Kapat' : 'Menü';
    });
  }

  // Kopyala düğmeleri: <button data-kopyala="metin">
  document.querySelectorAll('[data-kopyala]').forEach(function (btn) {
    var ilkMetin = btn.textContent;
    btn.addEventListener('click', function () {
      var metin = btn.getAttribute('data-kopyala');
      var bitti = function () {
        btn.textContent = 'Kopyalandı';
        setTimeout(function () { btn.textContent = ilkMetin; }, 1800);
      };
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(metin).then(bitti, function () { window.prompt('Kopyalayın:', metin); });
      } else {
        window.prompt('Kopyalayın:', metin);
      }
    });
  });

  // Dosya seçilince önizleme + adet kontrolü: <input type="file" data-onizleme="hedefId" data-max="3">
  document.querySelectorAll('input[type="file"][data-onizleme]').forEach(function (input) {
    var hedef = document.getElementById(input.getAttribute('data-onizleme'));
    var max = Number(input.getAttribute('data-max') || 0);
    var maxMB = Number(input.getAttribute('data-max-mb') || 0);
    input.addEventListener('change', function () {
      var dosyalar = Array.prototype.slice.call(input.files || []);
      var hata = '';
      if (max && dosyalar.length > max) hata = 'En fazla ' + max + ' dosya seçebilirsiniz.';
      else if (maxMB && dosyalar.some(function (d) { return d.size > maxMB * 1024 * 1024; })) hata = 'Her dosya en fazla ' + maxMB + ' MB olabilir.';
      input.setCustomValidity(hata);
      if (hata) input.reportValidity();
      if (!hedef) return;
      hedef.innerHTML = '';
      dosyalar.slice(0, max || dosyalar.length).forEach(function (d) {
        if (/^image\/(jpeg|png|webp|gif)$/.test(d.type)) {
          var img = document.createElement('img');
          img.alt = d.name;
          img.src = URL.createObjectURL(d);
          hedef.appendChild(img);
        } else {
          var s = document.createElement('span');
          s.className = 'dosya-ad';
          s.textContent = d.name;
          hedef.appendChild(s);
        }
      });
    });
  });

  // Gönderim sırasında butonu kilitle (çift gönderimi önler) ve onay iste
  document.querySelectorAll('form').forEach(function (form) {
    form.addEventListener('submit', function (e) {
      var soru = form.getAttribute('data-onay');
      if (soru && !window.confirm(soru)) { e.preventDefault(); return; }
      var btn = form.querySelector('[data-gonder]');
      if (btn) {
        btn.disabled = true;
        btn.textContent = btn.getAttribute('data-gonder') || 'Gönderiliyor…';
      }
    });
  });

  // Hata özeti varsa ona odaklan (ekran okuyucu ve klavye kullanıcıları için)
  var ozet = document.querySelector('[data-odaklan]');
  if (ozet) ozet.focus();

  // Takip kodu: yazarken büyük harfe çevir
  var kod = document.querySelector('input[name="kod"]');
  if (kod) kod.addEventListener('input', function () {
    var p = kod.selectionStart;
    kod.value = kod.value.toUpperCase();
    kod.setSelectionRange(p, p);
  });

  // Panel: durum seçilince formu otomatik gönder
  document.querySelectorAll('select[data-otomatik-gonder]').forEach(function (s) {
    s.addEventListener('change', function () { s.form.requestSubmit ? s.form.requestSubmit() : s.form.submit(); });
  });
})();
