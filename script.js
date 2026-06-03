(function () {
  const header = document.querySelector(".meta");
  let lastY = window.scrollY;

  function updateHeader() {
    const y = window.scrollY;
    header.classList.toggle("is-bordered", y > 24);
    header.classList.toggle("is-hidden", y > lastY && y > 120);
    lastY = y;
  }

  updateHeader();
  window.addEventListener("scroll", updateHeader, { passive: true });

  const menuButton = document.querySelector(".meta__menu");
  const nav = document.querySelector(".meta__nav");
  if (menuButton && nav) {
    function closeMenu() {
      nav.classList.remove("is-open");
      menuButton.setAttribute("aria-expanded", "false");
    }

    menuButton.addEventListener("click", () => {
      const open = menuButton.getAttribute("aria-expanded") === "true";
      nav.classList.toggle("is-open", !open);
      menuButton.setAttribute("aria-expanded", String(!open));
    });

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", closeMenu);
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 900) closeMenu();
    });
  }

  const revealTargets = document.querySelectorAll(".section, .hero__statement");
  revealTargets.forEach((target) => target.classList.add("appear"));

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("in-view");
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.08 }
  );

  revealTargets.forEach((target) => observer.observe(target));

  const time = document.getElementById("local-time");
  function tick() {
    if (!time) return;
    time.textContent = new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false
    }).format(new Date());
  }

  tick();
  setInterval(tick, 1000);

  function decodeContact(token) {
    const shifted = window.atob(token);
    return Array.from(shifted)
      .map((char) => String.fromCharCode(char.charCodeAt(0) - 2))
      .reverse()
      .join("");
  }

  document.querySelectorAll("[data-contact-token]").forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      const token = button.getAttribute("data-contact-token");
      if (!token) return;

      try {
        const value = decodeContact(token);
        const type = button.getAttribute("data-contact-type") || "email";
        const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
        const isPhone = /^[+()0-9\s-]+$/.test(value) && /\d/.test(value);
        if ((type === "email" && !isEmail) || (type === "phone" && !isPhone)) return;

        const link = document.createElement("a");
        link.href = type === "phone" ? `tel:${value.replace(/[^\d+]/g, "")}` : `mailto:${value}`;
        link.setAttribute("aria-label", `${type === "phone" ? "Call" : "Email"} ${value}`);

        const label = document.createElement("span");
        label.textContent = value;

        const arrow = document.createElement("span");
        arrow.setAttribute("aria-hidden", "true");
        arrow.textContent = "↗";

        link.append(label, arrow);
        button.replaceWith(link);
        link.focus({ preventScroll: true });
      } catch {
        button.textContent = "Contact unavailable";
      }
    });
  });

  document.querySelectorAll("[data-updates-toggle]").forEach((button) => {
    const panelId = button.getAttribute("aria-controls");
    const panel = panelId ? document.getElementById(panelId) : null;
    if (!panel) return;

    function setOpen(open) {
      button.setAttribute("aria-expanded", String(open));
      button.textContent = open ? "Collapse updates" : "List all updates";

      if (open) {
        panel.hidden = false;
        window.requestAnimationFrame(() => panel.classList.add("is-open"));
      } else {
        panel.classList.remove("is-open");
        window.setTimeout(() => {
          if (!panel.classList.contains("is-open")) panel.hidden = true;
        }, 280);
      }
    }

    button.addEventListener("click", () => {
      setOpen(button.getAttribute("aria-expanded") !== "true");
    });
  });

  const blogFilters = document.querySelectorAll("[data-blog-filter]");
  const blogItems = document.querySelectorAll("[data-blog-tags]");
  blogFilters.forEach((button) => {
    button.addEventListener("click", () => {
      const filter = button.dataset.blogFilter || "all";

      blogFilters.forEach((item) => {
        item.classList.toggle("is-active", item === button);
        item.setAttribute("aria-pressed", String(item === button));
      });

      blogItems.forEach((item) => {
        const tags = (item.getAttribute("data-blog-tags") || "").split(" ");
        item.hidden = filter !== "all" && !tags.includes(filter);
      });
    });
  });

  const canvas = document.getElementById("distillation-hero");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const terms = [
    "From low-level noise to high-fidelity synthetic identities",
    "From low-dimensional latents to high-quality generated faces",
    "From high-dimensional face inputs to compact identity embeddings",
    "From high-variation face images to compact biometric representations",
    "From low-quality face captures to high-confidence recognition decisions",
    "From low-resolution uncertainty to high-reliability assessment",
    "From dense model parameters to compact face-recognition systems",
    "From high-compute inference to low-latency identity matching",
    "From full-precision models to efficient inference"
  ];
  const liveTerm = document.getElementById("hero-live-term");
  let liveTermIndex = -1;
  let liveTermTimer = 0;

  function parseOBJ(text) {
    const vertices = [];
    const faces = [];

    text.split(/\r?\n/).forEach((line) => {
      if (line.startsWith("v ")) {
        const [, x, y, z] = line.trim().split(/\s+/);
        vertices.push({ x: Number(x), y: Number(y), z: Number(z) });
      } else if (line.startsWith("f ")) {
        const ids = line
          .trim()
          .slice(2)
          .split(/\s+/)
          .map((part) => Number(part.split("/")[0]) - 1)
          .filter((id) => Number.isFinite(id));
        for (let i = 1; i < ids.length - 1; i += 1) {
          faces.push([ids[0], ids[i], ids[i + 1]]);
        }
      }
    });

    return { vertices, faces };
  }

  function normalizeMesh(mesh) {
    const box = mesh.vertices.reduce(
      (acc, point) => ({
        minX: Math.min(acc.minX, point.x),
        maxX: Math.max(acc.maxX, point.x),
        minY: Math.min(acc.minY, point.y),
        maxY: Math.max(acc.maxY, point.y),
        minZ: Math.min(acc.minZ, point.z),
        maxZ: Math.max(acc.maxZ, point.z)
      }),
      { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity, minZ: Infinity, maxZ: -Infinity }
    );
    const cx = (box.minX + box.maxX) / 2;
    const cy = (box.minY + box.maxY) / 2;
    const cz = (box.minZ + box.maxZ) / 2;
    const scale = Math.max(box.maxX - box.minX, box.maxY - box.minY, box.maxZ - box.minZ) || 1;

    return {
      vertices: mesh.vertices.map((point) => ({
        x: (point.x - cx) / scale,
        y: (point.y - cy) / scale,
        z: (point.z - cz) / scale
      })),
      faces: mesh.faces
    };
  }

  function buildEdges(faces) {
    const seen = new Set();
    const edges = [];
    faces.forEach((face) => {
      [
        [face[0], face[1]],
        [face[1], face[2]],
        [face[2], face[0]]
      ].forEach(([a, b]) => {
        const key = a < b ? `${a}:${b}` : `${b}:${a}`;
        if (!seen.has(key)) {
          seen.add(key);
          edges.push([a, b]);
        }
      });
    });
    return edges;
  }

  function nearestSources(targets, sources) {
    return targets.map((target) => {
      let best = sources[0];
      let bestDistance = Infinity;
      sources.forEach((source) => {
        const distance =
          (target.x - source.x) ** 2 +
          (target.y - source.y) ** 2 +
          (target.z - source.z) ** 2;
        if (distance < bestDistance) {
          bestDistance = distance;
          best = source;
        }
      });
      return best;
    });
  }

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.floor(rect.width * dpr));
    canvas.height = Math.max(1, Math.floor(rect.height * dpr));
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function easeInOut(value) {
    return value < 0.5 ? 4 * value * value * value : 1 - (-2 * value + 2) ** 3 / 2;
  }

  function project(point, rect, angle, scaleMultiplier) {
    const sin = Math.sin(angle);
    const cos = Math.cos(angle);
    const x = point.x * cos - point.z * sin;
    const z = point.x * sin + point.z * cos;
    const y = point.y;
    const perspective = 2.6 / (2.6 - z);
    const scale = Math.min(rect.width, rect.height) * scaleMultiplier;
    return {
      x: rect.width * 0.5 + x * scale * perspective,
      y: rect.height * 0.49 - y * scale * perspective,
      z,
      p: perspective
    };
  }

  function drawFaces(points, faces, color, alphaBase, cullBackfaces = false) {
    const ordered = faces
      .map((face) => {
        const a = points[face[0]];
        const b = points[face[1]];
        const c = points[face[2]];
        const area = (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
        return {
          area,
          face,
          z: (a.z + b.z + c.z) / 3
        };
      })
      .filter(({ area }) => !cullBackfaces || area > 0)
      .sort((a, b) => a.z - b.z);

    ordered.forEach(({ face, z }) => {
      const a = points[face[0]];
      const b = points[face[1]];
      const c = points[face[2]];
      const shade = Math.max(0.72, Math.min(1.08, 0.92 + z * 0.18));
      ctx.fillStyle = `rgba(${color.r},${color.g},${color.b},${alphaBase * shade})`;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.lineTo(c.x, c.y);
      ctx.closePath();
      ctx.fill();
    });
  }

  function drawEdges(points, edges, alpha, width, color = "14,14,14", frontOnly = false) {
    ctx.lineWidth = width;
    ctx.strokeStyle = `rgba(${color},${alpha})`;
    edges.forEach(([a, b]) => {
      const pa = points[a];
      const pb = points[b];
      if (!pa || !pb) return;
      if (frontOnly && (pa.z + pb.z) / 2 < -0.08) return;
      ctx.beginPath();
      ctx.moveTo(pa.x, pa.y);
      ctx.lineTo(pb.x, pb.y);
      ctx.stroke();
    });
  }

  function drawVertices(points, alpha, every, color = "14,14,14", frontOnly = false) {
    ctx.fillStyle = `rgba(${color},${alpha})`;
    for (let i = 0; i < points.length; i += every) {
      const p = points[i];
      if (frontOnly && p.z < -0.08) continue;
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(0.75, 1.2 * p.p), 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawTransferLines(lowPoints, highPoints, phase) {
    ctx.lineWidth = 0.9;
    ctx.strokeStyle = "rgba(226,104,39,0.42)";
    ctx.fillStyle = "rgba(226,104,39,0.95)";
    for (let i = 0; i < highPoints.length; i += 163) {
      const low = lowPoints[i % lowPoints.length];
      const high = highPoints[i];
      const local = Math.max(0, Math.min(1, phase * 1.45 - (i % 489) / 489));
      if (local <= 0 || local >= 1) continue;
      const x = low.x + (high.x - low.x) * local;
      const y = low.y + (high.y - low.y) * local;
      ctx.beginPath();
      ctx.moveTo(low.x, low.y);
      ctx.lineTo(x, y);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x, y, 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function randomTermIndex() {
    if (terms.length < 2) return 0;
    let index = Math.floor(Math.random() * terms.length);
    while (index === liveTermIndex) {
      index = Math.floor(Math.random() * terms.length);
    }
    return index;
  }

  function updateLiveTerm(index) {
    if (!liveTerm) return;
    if (liveTerm.dataset.index === String(index)) return;
    liveTerm.dataset.index = String(index);
    liveTermIndex = index;

    if (document.hidden) {
      setLiveTerm(index);
      return;
    }

    liveTerm
      .querySelectorAll(".hero-term__item:not(.is-active)")
      .forEach((item) => item.remove());

    const previous = liveTerm.querySelector(".hero-term__item.is-active");
    const next = document.createElement("span");
    next.className = "hero-term__item";
    next.textContent = terms[index];
    liveTerm.append(next);

    if (previous) {
      previous.classList.remove("is-active");
      previous.classList.add("is-exiting");
      previous.addEventListener("transitionend", () => previous.remove(), { once: true });
      window.setTimeout(() => previous.remove(), 950);
    }

    window.requestAnimationFrame(() => {
      next.classList.add("is-active");
    });
  }

  function setLiveTerm(index) {
    if (!liveTerm) return;
    liveTerm.dataset.index = String(index);
    liveTermIndex = index;
    liveTerm.replaceChildren();

    const current = document.createElement("span");
    current.className = "hero-term__item is-active";
    current.textContent = terms[index];
    liveTerm.append(current);
  }

  function scheduleLiveTerm() {
    if (!liveTerm || reduceMotion) return;
    if (liveTermTimer) return;
    const delay = 4200 + Math.random() * 1600;
    liveTermTimer = window.setTimeout(() => {
      liveTermTimer = 0;
      if (document.hidden) return;
      updateLiveTerm(randomTermIndex());
      scheduleLiveTerm();
    }, delay);
  }

  document.addEventListener("visibilitychange", () => {
    if (!liveTerm || reduceMotion) return;

    if (document.hidden) {
      if (liveTermTimer) {
        window.clearTimeout(liveTermTimer);
        liveTermTimer = 0;
      }
      return;
    }

    const currentIndex = Number(liveTerm.dataset.index);
    setLiveTerm(Number.isFinite(currentIndex) ? currentIndex : randomTermIndex());
    scheduleLiveTerm();
  });

  updateLiveTerm(randomTermIndex());
  scheduleLiveTerm();

  async function initMeshHero() {
    const [highText, lowText] = await Promise.all([
      fetch("david_decimated_lowpoly.obj").then((response) => response.text()),
      fetch("david_decimated_lowpoly_2.obj").then((response) => response.text())
    ]);
    const high = normalizeMesh(parseOBJ(highText));
    const low = normalizeMesh(parseOBJ(lowText));
    const highEdges = buildEdges(high.faces);
    const lowEdges = buildEdges(low.faces);
    const highSources = nearestSources(high.vertices, low.vertices);

    function draw(time) {
      const rect = canvas.getBoundingClientRect();
      const seconds = reduceMotion ? 1.8 : time / 1000;
      const cycle = (seconds % 8.4) / 8.4;
      const morph = easeInOut((Math.sin(cycle * Math.PI * 2 - Math.PI / 2) + 1) / 2);
      const angle = seconds * 0.34;
      ctx.clearRect(0, 0, rect.width, rect.height);

      const highInterpolated = high.vertices.map((target, index) => {
        const source = highSources[index];
        return {
          x: source.x + (target.x - source.x) * morph,
          y: source.y + (target.y - source.y) * morph,
          z: source.z + (target.z - source.z) * morph
        };
      });
      const scaleMultiplier = rect.width < 520 ? 0.72 : 0.82;
      const highProjected = highInterpolated.map((point) => project(point, rect, angle, scaleMultiplier));
      const lowProjected = low.vertices.map((point) => project(point, rect, angle, scaleMultiplier));

      drawFaces(lowProjected, low.faces, { r: 226, g: 104, b: 39 }, 0.34 * (1 - morph), true);
      drawFaces(highProjected, high.faces, { r: 14, g: 14, b: 14 }, 0.18 + morph * 0.26, true);
      drawEdges(lowProjected, lowEdges, 0.4 * (1 - morph), 1.05, "226,104,39", true);
      drawVertices(lowProjected, 0.6 * (1 - morph), 4, "226,104,39", true);
      drawTransferLines(lowProjected, highProjected, cycle);
      drawEdges(highProjected, highEdges, 0.16 + morph * 0.26, 0.62, "14,14,14", true);
      drawVertices(highProjected, 0.24 + morph * 0.28, morph > 0.62 ? 4 : 8, "14,14,14", true);

      if (!reduceMotion) requestAnimationFrame(draw);
    }

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    requestAnimationFrame(draw);
  }

  initMeshHero().catch((error) => {
    console.error("Mesh hero failed", error);
  });
})();
