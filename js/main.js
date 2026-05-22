/* CHUM APARTMENT Menu — shared scripts.
   - Language switcher (Phase 1: alert placeholder)
   - Meal tabs (lunch / dinner) — only active when present
   - Scroll fade-in via IntersectionObserver
*/
(function () {
  'use strict';

  // ---------- Language switcher ----------
  const langSwitch = document.querySelector('.lang-switch');
  if (langSwitch) {
    const trigger = langSwitch.querySelector('button[aria-haspopup]');
    const menu    = langSwitch.querySelector('.lang-menu');

    function close() {
      langSwitch.classList.remove('is-open');
      trigger.setAttribute('aria-expanded', 'false');
    }
    function open() {
      langSwitch.classList.add('is-open');
      trigger.setAttribute('aria-expanded', 'true');
    }
    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      langSwitch.classList.contains('is-open') ? close() : open();
    });
    document.addEventListener('click', (e) => {
      if (!langSwitch.contains(e.target)) close();
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') close();
    });

    // Note: the actual language switching is wired up in i18n.js.
    // We still keep open/close logic here so the dropdown works
    // even if translations.json fails to load.
  }

  // ---------- Meal tabs (lunch / dinner) ----------
  const mealTabs = document.querySelectorAll('.meal-tabs .tab');
  if (mealTabs.length > 0) {
    mealTabs.forEach((tab) => {
      tab.addEventListener('click', () => {
        const meal = tab.dataset.meal;
        if (!meal) return;
        mealTabs.forEach((t) => {
          const isMe = t === tab;
          t.classList.toggle('is-active', isMe);
          t.setAttribute('aria-selected', isMe ? 'true' : 'false');
        });
        document.body.dataset.meal = meal;
        document.querySelectorAll('[data-lunch-price][data-dinner-price]').forEach((el) => {
          el.textContent = meal === 'lunch'
            ? el.dataset.lunchPrice
            : el.dataset.dinnerPrice;
        });
      });
    });
  }

  // ---------- Scroll fade-in ----------
  const fades = document.querySelectorAll('.fade-in');
  if (fades.length > 0 && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.12 });
    fades.forEach((el) => io.observe(el));
  } else {
    fades.forEach((el) => el.classList.add('is-visible'));
  }
})();
