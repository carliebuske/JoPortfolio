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

  // Home project tiles are plain anchor links now (navigation handled by the
  // page-transition veil). No drag/rearrange — keeps mobile scrolling smooth.

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

  /* ----------------------------------------------------- LIGHTBOX */
  const zoomables = document.querySelectorAll(".set-grid img, .gallery .g img, .moodboard .mb img");
  if (zoomables.length) {
    const lb = document.createElement("div");
    lb.className = "lightbox";
    lb.innerHTML = '<button class="lightbox__close" aria-label="Close preview">×</button><img alt="">';
    document.body.appendChild(lb);
    const lbImg = lb.querySelector("img");
    let lastFocus = null;
    const open = (src, alt) => {
      lbImg.src = src; lbImg.alt = alt || "";
      lb.classList.add("is-open");
      document.body.style.overflow = "hidden";
    };
    const close = () => {
      lb.classList.remove("is-open");
      document.body.style.overflow = "";
      setTimeout(() => { lbImg.src = ""; }, 300);
      if (lastFocus) lastFocus.focus && lastFocus.focus();
    };
    zoomables.forEach(img => {
      img.style.cursor = "zoom-in";
      img.addEventListener("click", (e) => {
        e.stopPropagation();
        lastFocus = img;
        open(img.currentSrc || img.src, img.alt);
      });
    });
    lb.addEventListener("click", close);
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && lb.classList.contains("is-open")) close();
    });
  }

  /* ----------------------------------------------- ANCHOR SCROLL FIX */
  // Lazy-loaded images above an anchor shift the layout, so the browser's
  // initial jump lands short. Re-scroll to the target until it settles.
  if (location.hash.length > 1) {
    let target = null;
    try { target = document.querySelector(location.hash); } catch (e) { target = null; }
    if (target) {
      let stop = false, n = 0;
      const onUser = () => { stop = true; };
      const events = ["wheel", "touchmove", "keydown"];
      const cleanup = () => events.forEach(ev => window.removeEventListener(ev, onUser));
      events.forEach(ev => window.addEventListener(ev, onUser, { passive: true }));
      const settle = () => {
        if (stop) return cleanup();
        target.scrollIntoView({ block: "start" });
        if (++n < 12) setTimeout(settle, 150); else cleanup();
      };
      if (document.readyState === "complete") setTimeout(settle, 60);
      else window.addEventListener("load", () => setTimeout(settle, 60));
    }
  }

  /* --------------------------------------------------- CURRENT YEAR */
  document.querySelectorAll("[data-year]").forEach(el => el.textContent = new Date().getFullYear());
})();
