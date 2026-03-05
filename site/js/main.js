// TheLifeCo — Shared JavaScript (Figma Redesign)
document.addEventListener('DOMContentLoaded', () => {

  // ── Mobile nav toggle ──
  // Works with both dark overlay nav (.nav-figma) and white nav (.t-nav)
  document.querySelectorAll('.nav-toggle, .t-nav-toggle').forEach(toggle => {
    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const nav = toggle.closest('nav') || toggle.closest('.nav-figma');
      if (nav) nav.classList.toggle('open');
    });
  });
  document.addEventListener('click', (e) => {
    document.querySelectorAll('nav.open, .nav-figma.open').forEach(nav => {
      if (!nav.contains(e.target)) nav.classList.remove('open');
    });
  });

  // ── Tab / pill switching ──
  document.querySelectorAll('.tabs, .filter-pills, .resort-filter-pills').forEach(container => {
    container.querySelectorAll('.tab, .pill, .resort-pill').forEach(tab => {
      tab.addEventListener('click', () => {
        container.querySelectorAll('.tab, .pill, .resort-pill').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const target = tab.dataset.target;
        if (target) {
          const parent = tab.closest('section') || document;
          parent.querySelectorAll('.tab-content').forEach(c => c.style.display = 'none');
          const el = parent.querySelector(target);
          if (el) el.style.display = '';
        }
      });
    });
  });

  // ── FAQ accordion (multiple patterns) ──
  // Pattern 1: .faq-question / .faq-item (old)
  // Pattern 2: .t-faq-q / .t-faq-item (treatments page)
  document.querySelectorAll('.faq-question, .t-faq-q').forEach(q => {
    q.addEventListener('click', () => {
      const item = q.closest('.faq-item, .t-faq-item');
      if (!item) return;
      const wasOpen = item.classList.contains('active') || item.classList.contains('open');
      const container = item.parentElement;
      container.querySelectorAll('.faq-item, .t-faq-item').forEach(i => {
        i.classList.remove('active', 'open');
        const btn = i.querySelector('.faq-question, .t-faq-q');
        if (btn) btn.setAttribute('aria-expanded', 'false');
      });
      if (!wasOpen) {
        item.classList.add('active', 'open');
        q.setAttribute('aria-expanded', 'true');
      }
    });
  });

  // ── Sidebar accordion (treatments page) ──
  document.querySelectorAll('.t-sidebar-accordion-head, .t-sidebar-sort, .t-sidebar-conditions').forEach(head => {
    head.addEventListener('click', () => {
      const body = head.nextElementSibling;
      if (body && body.classList.contains('t-sidebar-accordion-body')) {
        body.classList.toggle('open');
        const icon = head.querySelector('i');
        if (icon) {
          icon.classList.toggle('fa-angle-up');
          icon.classList.toggle('fa-angle-down');
        }
      }
    });
  });

  // ── Sidebar program filter (treatments page) ──
  document.querySelectorAll('.t-sidebar-prog-item').forEach(item => {
    item.addEventListener('click', () => {
      document.querySelectorAll('.t-sidebar-prog-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
    });
  });

  // ── Resort slider (resort page) ──
  const sliderCards = document.querySelectorAll('[data-slide]');
  const sliderDots = document.querySelectorAll('.resort-slider-dot');
  if (sliderCards.length) {
    let currentSlide = 0;
    function showSlide(idx) {
      sliderCards.forEach((card, i) => {
        card.style.display = i === idx ? '' : 'none';
      });
      sliderDots.forEach((dot, i) => {
        dot.classList.toggle('active', i === idx);
      });
      currentSlide = idx;
    }
    document.querySelectorAll('.resort-slider-arrow--next').forEach(btn => {
      btn.addEventListener('click', () => showSlide((currentSlide + 1) % sliderCards.length));
    });
    document.querySelectorAll('.resort-slider-arrow--prev').forEach(btn => {
      btn.addEventListener('click', () => showSlide((currentSlide - 1 + sliderCards.length) % sliderCards.length));
    });
    sliderDots.forEach((dot, i) => {
      dot.addEventListener('click', () => showSlide(i));
    });
  }

  // ── Smooth scroll for anchor links ──
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const target = document.querySelector(a.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ── Scroll-based nav background (white nav pages) ──
  const navEl = document.querySelector('.t-nav');
  if (navEl) {
    window.addEventListener('scroll', () => {
      navEl.classList.toggle('scrolled', window.scrollY > 80);
    });
  }

  // ── View toggle (resort page grid/list) ──
  document.querySelectorAll('.resort-view-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.resort-view-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // ── Booking form date picker enhancement ──
  document.querySelectorAll('input[type="date"]').forEach(input => {
    input.addEventListener('focus', () => input.showPicker && input.showPicker());
  });

});
