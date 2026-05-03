/**
 * Navegación lateral: estado activo al hacer clic y al desplazar (scroll spy).
 */
(function () {
  "use strict";

  var nav = document.querySelector(".sidebar__nav");
  if (!nav) return;

  var links = Array.prototype.slice.call(nav.querySelectorAll('a[href^="#"]'));
  var sectionIds = links
    .map(function (a) {
      return a.getAttribute("href").slice(1);
    })
    .filter(Boolean);

  var sections = sectionIds
    .map(function (id) {
      return document.getElementById(id);
    })
    .filter(Boolean);

  function setActive(id) {
    links.forEach(function (link) {
      var href = link.getAttribute("href");
      var isActive = href === "#" + id;
      link.classList.toggle("is-active", isActive);
      if (isActive) link.setAttribute("aria-current", "true");
      else link.removeAttribute("aria-current");
    });
  }

  function getCurrentSectionId() {
    var scrollY = window.scrollY;
    var doc = document.documentElement;
    var nearBottom = scrollY + window.innerHeight >= doc.scrollHeight - 48;
    if (nearBottom && sectionIds.length) {
      return sectionIds[sectionIds.length - 1];
    }
    var offset = 120;
    var current = sectionIds[0];

    for (var i = 0; i < sections.length; i++) {
      var el = sections[i];
      if (!el) continue;
      var top = el.getBoundingClientRect().top + scrollY;
      if (scrollY + offset >= top) {
        current = el.id;
      }
    }
    return current;
  }

  var ticking = false;
  function onScroll() {
    if (!ticking) {
      window.requestAnimationFrame(function () {
        setActive(getCurrentSectionId());
        ticking = false;
      });
      ticking = true;
    }
  }

  links.forEach(function (link) {
    link.addEventListener("click", function () {
      var id = link.getAttribute("href").slice(1);
      window.setTimeout(function () {
        setActive(id);
      }, 100);
    });
  });

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  setActive(getCurrentSectionId());
})();
