/* ==========================================================================
   main.js
   Loader, thème clair/sombre, navigation mobile, panneau de réglages,
   halo thermique, état du header au scroll. Aucune dépendance externe.
   ========================================================================== */

(function () {
  'use strict';

  var STORAGE = {
    theme: 'site-theme',
    motion: 'site-motion',
    fx: 'site-fx'
  };

  var root = document.documentElement;

  /* ---------------- Préférences persistées ---------------- */
  function applyStoredPreferences() {
    var theme = localStorage.getItem(STORAGE.theme);
    if (theme) root.setAttribute('data-theme', theme);

    var motion = localStorage.getItem(STORAGE.motion);
    if (motion === 'reduced') root.setAttribute('data-motion', 'reduced');

    var fx = localStorage.getItem(STORAGE.fx);
    if (fx === 'off') root.setAttribute('data-fx', 'off');
  }
  applyStoredPreferences();

  document.addEventListener('DOMContentLoaded', function () {
    initLoader();
    initHeaderScroll();
    initMobileNav();
    initSettingsPanel();
    initThermalHalo();
    initCurrentYear();
  });

  /* ---------------- Écran de chargement ---------------- */
  function initLoader() {
    var loader = document.querySelector('.loader');
    if (!loader) return;
    var reduced = root.getAttribute('data-motion') === 'reduced' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var delay = reduced ? 150 : 1550;
    window.setTimeout(function () {
      loader.classList.add('is-hidden');
      window.setTimeout(function () { loader.remove(); }, reduced ? 150 : 600);
    }, delay);
  }

  /* ---------------- Header : état au scroll ---------------- */
  function initHeaderScroll() {
    var header = document.querySelector('.site-header');
    if (!header) return;
    function update() {
      if (window.scrollY > 24) header.classList.add('is-scrolled');
      else header.classList.remove('is-scrolled');
    }
    update();
    window.addEventListener('scroll', update, { passive: true });
  }

  /* ---------------- Navigation mobile ---------------- */
  function initMobileNav() {
    var toggle = document.querySelector('.nav-toggle');
    var nav = document.querySelector('.mobile-nav');
    if (!toggle || !nav) return;

    toggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.style.overflow = open ? 'hidden' : '';
    });

    nav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        nav.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      });
    });
  }

  /* ---------------- Panneau de réglages ---------------- */
  function initSettingsPanel() {
    var trigger = document.querySelector('.settings-trigger');
    var panel = document.querySelector('.settings-panel');
    if (!trigger || !panel) return;

    trigger.addEventListener('click', function (e) {
      e.stopPropagation();
      var open = panel.classList.toggle('is-open');
      trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
    });
    document.addEventListener('click', function (e) {
      if (!panel.contains(e.target) && e.target !== trigger) {
        panel.classList.remove('is-open');
        trigger.setAttribute('aria-expanded', 'false');
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        panel.classList.remove('is-open');
        trigger.setAttribute('aria-expanded', 'false');
      }
    });

    /* Thème clair / sombre */
    var themeSwitch = panel.querySelector('[data-switch="theme"]');
    if (themeSwitch) {
      syncSwitch(themeSwitch, root.getAttribute('data-theme') === 'light');
      themeSwitch.addEventListener('click', function () {
        var toLight = root.getAttribute('data-theme') !== 'light';
        root.setAttribute('data-theme', toLight ? 'light' : 'dark');
        localStorage.setItem(STORAGE.theme, toLight ? 'light' : 'dark');
        syncSwitch(themeSwitch, toLight);
      });
    }

    /* Réduction des animations */
    var motionSwitch = panel.querySelector('[data-switch="motion"]');
    if (motionSwitch) {
      syncSwitch(motionSwitch, root.getAttribute('data-motion') === 'reduced');
      motionSwitch.addEventListener('click', function () {
        var toReduced = root.getAttribute('data-motion') !== 'reduced';
        root.setAttribute('data-motion', toReduced ? 'reduced' : 'normal');
        localStorage.setItem(STORAGE.motion, toReduced ? 'reduced' : 'normal');
        syncSwitch(motionSwitch, toReduced);
      });
    }

    /* Effets lourds (3D, halo thermique) */
    var fxSwitch = panel.querySelector('[data-switch="fx"]');
    if (fxSwitch) {
      syncSwitch(fxSwitch, root.getAttribute('data-fx') !== 'off');
      fxSwitch.addEventListener('click', function () {
        var toOn = root.getAttribute('data-fx') === 'off';
        root.setAttribute('data-fx', toOn ? 'on' : 'off');
        localStorage.setItem(STORAGE.fx, toOn ? 'on' : 'off');
        syncSwitch(fxSwitch, toOn);
        window.dispatchEvent(new CustomEvent('site:fx-changed', { detail: { on: toOn } }));
      });
    }
  }

  function syncSwitch(el, checked) {
    el.setAttribute('aria-checked', checked ? 'true' : 'false');
  }

  /* ---------------- Halo thermique (curseur) ---------------- */
  function initThermalHalo() {
    if (window.matchMedia('(pointer: coarse)').matches) return;
    var halo = document.querySelector('.thermal-halo');
    if (!halo) return;

    var targets = document.querySelectorAll('a, button, .project-card');
    var raf = null;
    var mx = 0, my = 0;

    function move(e) {
      mx = e.clientX; my = e.clientY;
      if (raf) return;
      raf = requestAnimationFrame(function () {
        halo.style.transform = 'translate(' + mx + 'px,' + my + 'px) translate(-50%,-50%)';
        raf = null;
      });
    }
    window.addEventListener('mousemove', move, { passive: true });

    targets.forEach(function (t) {
      t.addEventListener('mouseenter', function () { halo.classList.add('is-active'); });
      t.addEventListener('mouseleave', function () { halo.classList.remove('is-active'); });
    });
  }

  /* ---------------- Année courante (footer) ---------------- */
  function initCurrentYear() {
    var els = document.querySelectorAll('[data-year]');
    var y = new Date().getFullYear();
    els.forEach(function (el) { el.textContent = y; });
  }
})();
