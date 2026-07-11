/* ============================================
   BRAND.JS — Injection dynamique du nom de marque
   Source unique de vérité : name.txt (à la racine)

   Pour changer le nom de l'entreprise partout sur
   le site : éditer name.txt, rien d'autre à toucher.
   ============================================ */

(function () {
  "use strict";

  var FALLBACK_NAME = "BORAL";

  function toTitleCase(word) {
    if (!word) return word;
    return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  }

  function applyBrand(rawName) {
    var name = (rawName || FALLBACK_NAME).trim();
    if (!name) name = FALLBACK_NAME;

    var upper = name.toUpperCase();
    var lower = name.toLowerCase();
    var title = toTitleCase(name);

    // 1) Texte simple : [data-brand] -> nom tel quel (respecte data-brand-case)
    var nodes = document.querySelectorAll("[data-brand]");
    for (var i = 0; i < nodes.length; i++) {
      var el = nodes[i];
      var mode = el.getAttribute("data-brand-case") || "upper";
      var value = upper;
      if (mode === "lower") value = lower;
      else if (mode === "title") value = title;
      else if (mode === "as-is") value = name;
      el.textContent = value;
    }

    // 2) Attributs (alt, content, title...) : [data-brand-attr="attrName"]
    var attrNodes = document.querySelectorAll("[data-brand-attr]");
    for (var j = 0; j < attrNodes.length; j++) {
      var an = attrNodes[j];
      var attrList = an.getAttribute("data-brand-attr").split(",");
      var mode2 = an.getAttribute("data-brand-case") || "upper";
      var value2 = upper;
      if (mode2 === "lower") value2 = lower;
      else if (mode2 === "title") value2 = title;
      else if (mode2 === "as-is") value2 = name;

      for (var k = 0; k < attrList.length; k++) {
        var attrName = attrList[k].trim();
        var current = an.getAttribute(attrName) || "";
        // Remplace le token __BRAND__ dans l'attribut (permet des phrases complètes)
        if (current.indexOf("__BRAND__") !== -1) {
          an.setAttribute(attrName, current.split("__BRAND__").join(value2));
        } else {
          an.setAttribute(attrName, value2);
        }
      }
    }

    // 3) Email dynamique : [data-brand-email] -> contact@{nom-lower}-rd.com
    var emailNodes = document.querySelectorAll("[data-brand-email]");
    var slug = lower.replace(/[^a-z0-9]+/g, "");
    for (var m = 0; m < emailNodes.length; m++) {
      var em = emailNodes[m];
      var address = "contact@" + slug + "-rd.com";
      em.textContent = address;
      em.setAttribute("href", "mailto:" + address);
    }

    // 4) Titre de l'onglet si présent en __BRAND__ token
    if (document.title.indexOf("__BRAND__") !== -1) {
      document.title = document.title.split("__BRAND__").join(upper);
    }

    // Révèle la page une fois le nom appliqué (évite le flash du nom par défaut)
    document.documentElement.setAttribute("data-brand-ready", "true");
  }

  function loadName() {
    fetch("name.txt", { cache: "no-store" })
      .then(function (res) {
        if (!res.ok) throw new Error("name.txt introuvable");
        return res.text();
      })
      .then(function (text) {
        applyBrand(text);
      })
      .catch(function () {
        applyBrand(FALLBACK_NAME);
      });
  }

  // Sécurité : si le fetch traîne, on révèle quand même la page après 700ms
  // avec le nom par défaut pour ne jamais bloquer l'affichage.
  var safety = setTimeout(function () {
    if (!document.documentElement.hasAttribute("data-brand-ready")) {
      applyBrand(FALLBACK_NAME);
    }
  }, 700);

  document.addEventListener("DOMContentLoaded", function () {
    loadName();
  });

  // Nettoie le timer de sécurité une fois terminé normalement
  document.addEventListener("DOMContentLoaded", function () {
    var check = setInterval(function () {
      if (document.documentElement.hasAttribute("data-brand-ready")) {
        clearTimeout(safety);
        clearInterval(check);
      }
    }, 50);
  });
})();
