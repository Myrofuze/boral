/* ==========================================================================
   carousel.js
   Carrousel plein écran pour la page Projets. Navigation par flèches,
   clavier (←/→), points de pagination, et swipe tactile. Boucle infinie.
   ========================================================================== */

(function () {
  'use strict';

  document.addEventListener('DOMContentLoaded', function () {
    var root = document.getElementById('carousel');
    if (!root) return;

    /* Verrouillage du scroll de page, indépendant du support CSS :has() */
    document.documentElement.style.overflow = 'hidden';
    document.body.style.overflow = 'hidden';

    var slides = Array.prototype.slice.call(root.querySelectorAll('.slide'));
    var dots = Array.prototype.slice.call(document.querySelectorAll('.carousel-dot'));
    var prevBtn = document.getElementById('carouselPrev');
    var nextBtn = document.getElementById('carouselNext');
    var count = slides.length;
    var current = 0;
    var animating = false;
    var ANIM_MS = 720;

    function goTo(index, direction) {
      if (animating || index === current) return;
      animating = true;

      var next = ((index % count) + count) % count;
      var exitClass = direction === 'next' ? 'is-exit-left' : 'is-exit-right';

      slides[current].classList.remove('is-active');
      slides[current].classList.add(exitClass);
      slides[next].classList.add('is-active');

      dots.forEach(function (d, i) {
        d.classList.toggle('is-active', i === next);
        d.setAttribute('aria-selected', i === next ? 'true' : 'false');
      });

      window.setTimeout(function () {
        slides[current].classList.remove(exitClass);
        current = next;
        root.setAttribute('data-index', String(current));
        animating = false;
      }, ANIM_MS);
    }

    function goNext() { goTo(current + 1, 'next'); }
    function goPrev() { goTo(current - 1, 'prev'); }

    if (prevBtn) prevBtn.addEventListener('click', goPrev);
    if (nextBtn) nextBtn.addEventListener('click', goNext);

    dots.forEach(function (dot, i) {
      dot.addEventListener('click', function () {
        if (i === current) return;
        goTo(i, i > current ? 'next' : 'prev');
      });
    });

    /* Clavier */
    document.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { goNext(); }
      else if (e.key === 'ArrowLeft') { goPrev(); }
    });

    /* Swipe tactile */
    var touchStartX = 0, touchStartY = 0;
    root.addEventListener('touchstart', function (e) {
      touchStartX = e.touches[0].clientX;
      touchStartY = e.touches[0].clientY;
    }, { passive: true });

    root.addEventListener('touchend', function (e) {
      var dx = e.changedTouches[0].clientX - touchStartX;
      var dy = e.changedTouches[0].clientY - touchStartY;
      if (Math.abs(dx) < 50 || Math.abs(dx) < Math.abs(dy)) return;
      if (dx < 0) goNext(); else goPrev();
    }, { passive: true });

    /* Molette — un cran = un slide, avec anti-rebond */
    var wheelLock = false;
    root.addEventListener('wheel', function (e) {
      if (wheelLock) return;
      if (Math.abs(e.deltaY) < 12 && Math.abs(e.deltaX) < 12) return;
      wheelLock = true;
      if (e.deltaY > 0 || e.deltaX > 0) goNext(); else goPrev();
      window.setTimeout(function () { wheelLock = false; }, ANIM_MS + 80);
    }, { passive: true });
  });
})();
