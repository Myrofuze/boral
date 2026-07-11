/* ==========================================================================
   three-object.js
   Petit objet 3D interactif (silhouette d'aile volante stylisée, low-poly)
   qui accompagne le texte du hero sans jamais devenir le sujet de la page.
   - Chargé en différé (dynamic import du CDN), jamais bloquant.
   - Respecte data-fx="off" et prefers-reduced-motion.
   - Interaction : drag pour orienter, légère auto-rotation au repos.
   ========================================================================== */

(function () {
  'use strict';

  var CDN = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';

  document.addEventListener('DOMContentLoaded', function () {
    var mount = document.querySelector('.three-mount');
    if (!mount) return;

    var fxOff = document.documentElement.getAttribute('data-fx') === 'off';
    var reduced = document.documentElement.getAttribute('data-motion') === 'reduced' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var coarsePointer = window.matchMedia('(pointer: coarse)').matches;
    var smallViewport = window.innerWidth < 640;

    if (fxOff || smallViewport) {
      showFallback(mount);
      return;
    }

    window.addEventListener('site:fx-changed', function (e) {
      if (!e.detail.on) location.reload();
    });

    loadThree(function (ok) {
      if (!ok) { showFallback(mount); return; }
      try {
        boot(mount, { reduced: reduced, interactive: !coarsePointer });
      } catch (err) {
        showFallback(mount);
      }
    });
  });

  function loadThree(cb) {
    if (window.THREE) { cb(true); return; }
    var s = document.createElement('script');
    s.src = CDN;
    s.async = true;
    s.onload = function () { cb(!!window.THREE); };
    s.onerror = function () { cb(false); };
    document.head.appendChild(s);
  }

  function showFallback(mount) {
    mount.innerHTML = '';
    var fallback = document.createElement('div');
    fallback.className = 'three-fallback';
    var img = document.createElement('img');
    img.src = mount.getAttribute('data-fallback') || 'logo-mark-fallback.svg';
    img.alt = '';
    img.style.width = '34%';
    img.style.opacity = '0.55';
    fallback.appendChild(img);
    mount.appendChild(fallback);
  }

  function boot(mount, opts) {
    var THREE = window.THREE;
    var width = mount.clientWidth, height = mount.clientHeight;

    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 100);
    camera.position.set(0, 0.6, 5.4);

    var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
    renderer.setSize(width, height);
    mount.appendChild(renderer.domElement);

    /* Éclairage — sobre, deux sources */
    var keyLight = new THREE.DirectionalLight(0xd9b48c, 1.05);
    keyLight.position.set(3, 4, 5);
    scene.add(keyLight);
    var fillLight = new THREE.DirectionalLight(0x2e5a8c, 0.55);
    fillLight.position.set(-4, -2, -3);
    scene.add(fillLight);
    scene.add(new THREE.AmbientLight(0x223350, 0.65));

    /* Groupe racine — silhouette d'aile volante low-poly (générique, non-photoréaliste) */
    var group = new THREE.Group();
    scene.add(group);

    var bodyMat = new THREE.MeshStandardMaterial({ color: 0x0c3159, metalness: 0.35, roughness: 0.45, flatShading: true });
    var accentMat = new THREE.MeshStandardMaterial({ color: 0xb8895a, metalness: 0.5, roughness: 0.35, flatShading: true });
    var edgeMat = new THREE.LineBasicMaterial({ color: 0xd9b48c, transparent: true, opacity: 0.35 });

    /* Fuselage central : cône aplati */
    var bodyGeo = new THREE.ConeGeometry(0.42, 1.9, 6);
    bodyGeo.rotateX(Math.PI / 2);
    bodyGeo.scale(1, 0.42, 1);
    var body = new THREE.Mesh(bodyGeo, bodyMat);
    group.add(body);
    group.add(new THREE.LineSegments(new THREE.EdgesGeometry(bodyGeo), edgeMat));

    /* Ailes delta : deux plans triangulaires low-poly */
    function makeWing(sign) {
      var shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.lineTo(sign * 2.1, -0.55);
      shape.lineTo(sign * 1.55, -0.95);
      shape.lineTo(0, -0.35);
      shape.closePath();
      var geo = new THREE.ExtrudeGeometry(shape, { depth: 0.05, bevelEnabled: false });
      geo.translate(0, 0, -0.02);
      var mesh = new THREE.Mesh(geo, bodyMat);
      mesh.position.set(0, 0.02, -0.15);
      mesh.rotation.x = -Math.PI / 2.3;
      group.add(mesh);
      group.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), edgeMat));
    }
    makeWing(1);
    makeWing(-1);

    /* Accents cuivre : deux petits capteurs / nacelles */
    var nacelleGeo = new THREE.CylinderGeometry(0.07, 0.09, 0.22, 6);
    [-0.55, 0.55].forEach(function (x) {
      var n = new THREE.Mesh(nacelleGeo, accentMat);
      n.rotation.z = Math.PI / 2;
      n.position.set(x, -0.05, 0.55);
      group.add(n);
    });

    group.scale.setScalar(1.15);
    group.rotation.set(0.18, -0.5, 0);

    /* --- Interaction : drag pour orienter --- */
    var dragging = false, lastX = 0, lastY = 0;
    var targetRotX = group.rotation.x, targetRotY = group.rotation.y;
    var velY = 0.0018;

    function pointerDown(x, y) {
      dragging = true; lastX = x; lastY = y;
      mount.style.cursor = 'grabbing';
    }
    function pointerMove(x, y) {
      if (!dragging) return;
      var dx = x - lastX, dy = y - lastY;
      targetRotY += dx * 0.006;
      targetRotX += dy * 0.004;
      targetRotX = Math.max(-0.6, Math.min(0.6, targetRotX));
      lastX = x; lastY = y;
    }
    function pointerUp() { dragging = false; mount.style.cursor = 'grab'; }

    if (opts.interactive) {
      mount.addEventListener('mousedown', function (e) { pointerDown(e.clientX, e.clientY); });
      window.addEventListener('mousemove', function (e) { pointerMove(e.clientX, e.clientY); });
      window.addEventListener('mouseup', pointerUp);
      mount.addEventListener('touchstart', function (e) {
        var t = e.touches[0]; pointerDown(t.clientX, t.clientY);
      }, { passive: true });
      mount.addEventListener('touchmove', function (e) {
        var t = e.touches[0]; pointerMove(t.clientX, t.clientY);
      }, { passive: true });
      window.addEventListener('touchend', pointerUp);
    }

    /* --- Boucle de rendu --- */
    var clock = new THREE.Clock();
    var running = true;

    var io = new IntersectionObserver(function (entries) {
      running = entries[0].isIntersecting;
    }, { threshold: 0.05 });
    io.observe(mount);

    function animate() {
      if (!document.body.contains(mount)) return;
      requestAnimationFrame(animate);
      if (!running) return;

      if (!dragging && !opts.reduced) {
        targetRotY += velY;
      }
      group.rotation.y += (targetRotY - group.rotation.y) * 0.09;
      group.rotation.x += (targetRotX - group.rotation.x) * 0.09;

      if (!opts.reduced) {
        group.position.y = Math.sin(clock.getElapsedTime() * 0.6) * 0.045;
      }

      renderer.render(scene, camera);
    }
    animate();

    /* --- Redimensionnement --- */
    var resizeObserver = new ResizeObserver(function () {
      var w = mount.clientWidth, h = mount.clientHeight;
      if (!w || !h) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    resizeObserver.observe(mount);
  }
})();
