/* =========================================================================
   Julia Hantla — Portfolio interactions
   Vanilla JS. No dependencies. Respects prefers-reduced-motion + touch.
   ========================================================================= */
(() => {
  "use strict";
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const lerp = (a, b, n) => (1 - n) * a + n * b;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  /* ------------------------------------------------------------------ NAV */
  const nav = document.querySelector(".nav");
  if (nav) {
    let last = 0;
    const onScroll = () => {
      const y = window.scrollY;
      nav.classList.toggle("is-scrolled", y > 24);
      if (y > 240 && y > last && !document.body.classList.contains("menu-open")) nav.classList.add("is-hidden");
      else nav.classList.remove("is-hidden");
      last = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  // mobile menu
  const burger = document.querySelector(".nav__burger");
  if (burger) {
    burger.addEventListener("click", () => document.body.classList.toggle("menu-open"));
    document.querySelectorAll(".menu__link").forEach(l =>
      l.addEventListener("click", () => document.body.classList.remove("menu-open")));
  }

  /* ------------------------------------------------------ CUSTOM CURSOR */
  if (fine && !reduced) {
    const dot = document.createElement("div");
    const ring = document.createElement("div");
    dot.className = "cursor-dot"; ring.className = "cursor-ring";
    document.body.append(dot, ring);
    document.body.classList.add("has-cursor");

    let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;
    window.addEventListener("mousemove", e => {
      mx = e.clientX; my = e.clientY;
      dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%,-50%)`;
    });
    const raf = () => {
      rx = lerp(rx, mx, 0.18); ry = lerp(ry, my, 0.18);
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%,-50%)`;
      requestAnimationFrame(raf);
    };
    raf();
    const hot = "a, button, .tile, .into-list li, .client, [data-cursor]";
    document.addEventListener("mouseover", e => { if (e.target.closest(hot)) ring.classList.add("is-active"); });
    document.addEventListener("mouseout",  e => { if (e.target.closest(hot)) ring.classList.remove("is-active"); });
    document.addEventListener("mouseleave", () => ring.classList.add("is-hidden"));
    document.addEventListener("mouseenter", () => ring.classList.remove("is-hidden"));
  }

  /* ----------------------------------------------------------- MAGNETIC */
  if (fine && !reduced) {
    document.querySelectorAll("[data-magnetic]").forEach(el => {
      const strength = parseFloat(el.dataset.magnetic) || 0.35;
      el.addEventListener("mousemove", e => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - (r.left + r.width / 2)) * strength;
        const y = (e.clientY - (r.top + r.height / 2)) * strength;
        el.style.transform = `translate(${x}px, ${y}px)`;
      });
      el.addEventListener("mouseleave", () => { el.style.transform = ""; });
    });
  }

  /* ------------------------------------------------------------ REVEALS */
  const revealEls = document.querySelectorAll("[data-reveal], .line-mask");
  if ("IntersectionObserver" in window && !reduced) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add("is-in"));
  }

  /* ----------------------------------------------------------- PARALLAX */
  const pEls = [...document.querySelectorAll("[data-parallax]")];
  if (pEls.length && !reduced) {
    let ticking = false;
    const update = () => {
      const vh = innerHeight;
      pEls.forEach(el => {
        const speed = parseFloat(el.dataset.parallax) || 0.12;
        const r = el.getBoundingClientRect();
        const center = r.top + r.height / 2;
        const offset = (center - vh / 2) / vh; // -1..1
        el.style.transform = `translate3d(0, ${(-offset * speed * 100).toFixed(2)}px, 0)`;
      });
      ticking = false;
    };
    window.addEventListener("scroll", () => { if (!ticking) { requestAnimationFrame(update); ticking = true; } }, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  /* --------------------------------------------------- PAGE TRANSITIONS */
  // veil in on load
  const veil = document.createElement("div");
  veil.className = "page-veil";
  document.body.appendChild(veil);
  if (!reduced) {
    veil.style.transform = "translateY(0)";
    requestAnimationFrame(() => requestAnimationFrame(() => veil.classList.add("is-out")));
    veil.addEventListener("animationend", () => { veil.style.transform = ""; veil.classList.remove("is-out"); }, { once: true });
  }
  // veil out on internal navigation
  const isInternal = (a) => {
    if (!a || a.target === "_blank" || a.hasAttribute("download")) return false;
    const href = a.getAttribute("href") || "";
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:") || href.startsWith("http")) return false;
    return true;
  };
  if (!reduced) {
    document.addEventListener("click", (e) => {
      const a = e.target.closest("a");
      if (!isInternal(a)) return;
      e.preventDefault();
      const href = a.getAttribute("href");
      veil.style.transform = "";
      veil.classList.remove("is-out");
      veil.classList.add("is-in");
      setTimeout(() => { window.location.href = href; }, 520);
    });
  }

  /* --------------------------------------------- DRAGGABLE / REARRANGE */
  // FLIP-based reorder for the home tile grid.
  const grid = document.querySelector("[data-draggable-grid]");
  if (grid && window.PointerEvent) {
    let dragEl = null, startX = 0, startY = 0, moved = false, pointerId = null;

    const recordRects = () => {
      const map = new Map();
      grid.querySelectorAll(".tile").forEach(t => map.set(t, t.getBoundingClientRect()));
      return map;
    };
    const flip = (prev) => {
      if (reduced) return;
      grid.querySelectorAll(".tile").forEach(t => {
        if (t === dragEl) return;
        const before = prev.get(t); if (!before) return;
        const after = t.getBoundingClientRect();
        const dx = before.left - after.left, dy = before.top - after.top;
        if (!dx && !dy) return;
        t.style.transition = "none";
        t.style.transform = `translate(${dx}px, ${dy}px)`;
        requestAnimationFrame(() => {
          t.style.transition = "transform 0.5s cubic-bezier(0.22,1,0.36,1)";
          t.style.transform = "";
        });
      });
    };

    const onMove = (e) => {
      if (!dragEl) return;
      const dx = e.clientX - startX, dy = e.clientY - startY;
      if (!moved && Math.hypot(dx, dy) < 6) return;
      if (!moved) { moved = true; dragEl.classList.add("is-dragging"); }
      dragEl.style.transform = `translate(${dx}px, ${dy}px) scale(1.03)`;

      // find tile under pointer
      dragEl.style.pointerEvents = "none";
      const under = document.elementFromPoint(e.clientX, e.clientY);
      dragEl.style.pointerEvents = "";
      const target = under && under.closest(".tile");
      if (target && target !== dragEl && target.parentElement === grid) {
        const prev = recordRects();
        const items = [...grid.children];
        const di = items.indexOf(dragEl), ti = items.indexOf(target);
        if (di < ti) grid.insertBefore(target, dragEl);
        else grid.insertBefore(dragEl, target);
        // keep drag transform consistent after DOM move
        startX = e.clientX; startY = e.clientY;
        dragEl.style.transform = `translate(0px,0px) scale(1.03)`;
        flip(prev);
      }
    };
    const onUp = () => {
      if (!dragEl) return;
      dragEl.releasePointerCapture && pointerId != null && dragEl.releasePointerCapture(pointerId);
      dragEl.classList.remove("is-dragging");
      dragEl.style.transition = "transform 0.45s cubic-bezier(0.22,1,0.36,1)";
      dragEl.style.transform = "";
      const el = dragEl;
      setTimeout(() => { el.style.transition = ""; }, 480);
      dragEl = null; pointerId = null;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };

    grid.querySelectorAll(".tile").forEach(tile => {
      tile.addEventListener("pointerdown", (e) => {
        if (e.button !== 0) return;
        dragEl = tile; moved = false; pointerId = e.pointerId;
        startX = e.clientX; startY = e.clientY;
        tile.setPointerCapture && tile.setPointerCapture(e.pointerId);
        window.addEventListener("pointermove", onMove);
        window.addEventListener("pointerup", onUp);
      });
      // navigate on click for project tiles (suppress if we dragged)
      tile.addEventListener("click", (e) => {
        if (moved) { e.preventDefault(); e.stopImmediatePropagation(); moved = false; return; }
        const href = tile.dataset.href;
        if (href) {
          if (!reduced) {
            veil.classList.remove("is-out"); veil.style.transform = ""; veil.classList.add("is-in");
            setTimeout(() => window.location.href = href, 520);
          } else window.location.href = href;
        }
      });
    });
  }

  /* ------------------------------------------------ TILE HOVER PARALLAX */
  if (fine && !reduced) {
    document.querySelectorAll(".tile--project").forEach(tile => {
      const media = tile.querySelector(".tile__media img, .tile__media video");
      if (!media) return;
      tile.addEventListener("mousemove", e => {
        const r = tile.getBoundingClientRect();
        const x = (e.clientX - (r.left + r.width / 2)) / r.width;
        const y = (e.clientY - (r.top + r.height / 2)) / r.height;
        media.style.transform = `scale(1.07) translate(${(-x * 14).toFixed(1)}px, ${(-y * 14).toFixed(1)}px)`;
      });
      tile.addEventListener("mouseleave", () => { media.style.transform = ""; });
    });
  }

  /* ------------------------------------------------- ANIMATED COUNTERS */
  const counters = document.querySelectorAll("[data-count]");
  if (counters.length && "IntersectionObserver" in window && !reduced) {
    const co = new IntersectionObserver((entries) => {
      entries.forEach(en => {
        if (!en.isIntersecting) return;
        const el = en.target;
        const to = parseFloat(el.dataset.count);
        const suffix = el.dataset.suffix || "";
        const dur = 1400; const t0 = performance.now();
        const tick = (t) => {
          const p = clamp((t - t0) / dur, 0, 1);
          const eased = 1 - Math.pow(1 - p, 3);
          const val = to % 1 === 0 ? Math.round(to * eased) : (to * eased).toFixed(1);
          el.textContent = val + suffix;
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        co.unobserve(el);
      });
    }, { threshold: 0.5 });
    counters.forEach(c => co.observe(c));
  } else {
    counters.forEach(c => c.textContent = c.dataset.count + (c.dataset.suffix || ""));
  }

  /* --------------------------------------------------- CURRENT YEAR */
  document.querySelectorAll("[data-year]").forEach(el => el.textContent = new Date().getFullYear());
})();
