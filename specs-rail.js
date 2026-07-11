/* ==========================================================================
   specs-rail.js
   Met en évidence le bloc de la colonne de specs correspondant à la
   section de texte actuellement visible sur les pages projet.
   ========================================================================== */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    var rail = document.querySelector('.specs-rail');
    if (!rail || !('IntersectionObserver' in window)) return;

    var sections = document.querySelectorAll('[data-spec-section]');
    if (!sections.length) return;

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        var id = entry.target.getAttribute('data-spec-section');
        var block = rail.querySelector('[data-spec-for="' + id + '"]');
        if (!block) return;
        if (entry.isIntersecting) {
          rail.querySelectorAll('.specs-rail-block').forEach(function (b) {
            b.style.opacity = '0.4';
          });
          block.style.opacity = '1';
        }
      });
    }, { rootMargin: '-40% 0px -50% 0px', threshold: 0 });

    sections.forEach(function (s) { observer.observe(s); });
  });
})();
