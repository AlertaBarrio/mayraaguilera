import { imageSrc } from "./data.js";

export const $ = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const esc = (s = "") => String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// ── Íconos (trazo fino)
const P = {
  home: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M9.5 21v-6h5v6"/>',
  article: '<path d="M4 4h16v16H4z"/><path d="M8 8h8M8 12h8M8 16h5"/>',
  wall: '<path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="m21 16-5-5-8 9"/>',
  book: '<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5z"/><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',
  bookmark: '<path d="M6 3h12v18l-6-4-6 4z"/>',
  heart: '<path d="M12 20s-7-4.4-9.2-8.7C1.3 8.2 3 4.5 6.6 4.5c2.1 0 3.5 1.2 5.4 3.2 1.9-2 3.3-3.2 5.4-3.2 3.6 0 5.3 3.7 3.8 6.8C19 15.6 12 20 12 20z"/>',
  comment: '<path d="M4 5h16v11H9l-5 4z"/>',
  share: '<circle cx="18" cy="5" r="2.5"/><circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="19" r="2.5"/><path d="m8.2 10.8 7.6-4.6M8.2 13.2l7.6 4.6"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  left: '<path d="m15 5-7 7 7 7"/>',
  right: '<path d="m9 5 7 7-7 7"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h10"/>',
  edit: '<path d="M4 20h4L19 9l-4-4L4 16z"/><path d="m13.5 6.5 4 4"/>',
  trash: '<path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  check: '<path d="m5 12 5 5 9-10"/>',
  eye: '<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
  logout: '<path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>',
  upload: '<path d="M12 16V4M7 9l5-5 5 5M4 16v4h16v-4"/>',
  zoom: '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5M11 8v6M8 11h6"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
  phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
  pin: '<path d="M12 21s-7-6.2-7-12a7 7 0 0 1 14 0c0 5.8-7 12-7 12z"/><circle cx="12" cy="9" r="2.5"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
  cart: '<circle cx="9" cy="20" r="1.5"/><circle cx="18" cy="20" r="1.5"/><path d="M2 3h3l2.6 12.4a1 1 0 0 0 1 .8h9.7a1 1 0 0 0 1-.8L21 7H6"/>',
  grid: '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
  scale: '<path d="M12 3v18M7 21h10M5 7h14M5 7l-3 7a3 3 0 0 0 6 0zM19 7l-3 7a3 3 0 0 0 6 0z"/>',
  star: '<path d="m12 3 2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
  quote: '<path d="M7 7h4v4c0 3-1.5 5-4 6M15 7h4v4c0 3-1.5 5-4 6"/>',
  whatsapp: '<path d="M20.5 11.7A8.5 8.5 0 0 1 8 19.3L3.5 20.5l1.2-4.3a8.5 8.5 0 1 1 15.8-4.5z"/><path d="M9 8.5c0 3.5 3 6.5 6.5 6.5l1-1.6-2-1-.9.8a4.5 4.5 0 0 1-2.3-2.3l.8-.9-1-2L9.5 8z"/>',
  facebook: '<path d="M14 8h3V4h-3a4 4 0 0 0-4 4v3H7v4h3v7h4v-7h3l1-4h-4V8.5c0-.3.2-.5.5-.5z"/>',
  instagram: '<rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".8"/>',
  linkedin: '<rect x="3" y="3" width="18" height="18" rx="3"/><path d="M8 10v7M8 7v.01M12 17v-4a2 2 0 0 1 4 0v4M12 10v7"/>',
  xsocial: '<path d="M4 4l16 16M20 4 4 20"/>',
  youtube: '<rect x="2" y="5" width="20" height="14" rx="4"/><path d="m10 9 5 3-5 3z"/>',
  tiktok: '<path d="M14 3v11.5a3.5 3.5 0 1 1-3.5-3.5"/><path d="M14 3c.5 2.5 2.5 4.5 5 5"/>',
  download: '<path d="M12 4v12M7 11l5 5 5-5M4 20h16"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  pinTop: '<path d="M9 4h6l-1 6 4 3H6l4-3zM12 13v8"/>'
};
export const icon = (n, cls = "") => `<svg class="ic ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${P[n] || ""}</svg>`;

// ── Texto
export function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "hace un momento";
  const m = Math.floor(s / 60); if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60); if (h < 24) return `hace ${h} h`;
  const d = Math.floor(h / 24); if (d < 7) return `hace ${d} ${d === 1 ? "día" : "días"}`;
  return fmtDate(ts);
}
export const fmtDate = ts => new Date(ts).toLocaleDateString("es-HN", { day: "numeric", month: "long", year: "numeric" });
export const linkify = t => esc(t).replace(/(https?:\/\/[^\s<]+)/g, '<a href="$1" target="_blank" rel="noopener noreferrer">$1</a>').replace(/\n/g, "<br>");
export const initials = n => (n || "?").split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase();
export const readTime = html => Math.max(1, Math.round((html || "").replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length / 200));

// ── Sanitizador de HTML (lista blanca)
const ALLOWED = { P: [], BR: [], B: [], STRONG: [], I: [], EM: [], U: [], S: [], H2: [], H3: [], H4: [], BLOCKQUOTE: [], UL: [], OL: [], LI: [], A: ["href"], IMG: ["src", "alt"], HR: [], PRE: [], CODE: [], FIGURE: [], FIGCAPTION: [], DIV: [], SPAN: [] };
const DROP = ["SCRIPT", "STYLE", "IFRAME", "OBJECT", "EMBED", "NOSCRIPT", "TEMPLATE", "svg", "math", "LINK", "META", "FORM", "INPUT", "BUTTON", "TEXTAREA", "SELECT"];
export function sanitize(html) {
  const doc = new DOMParser().parseFromString(`<body>${html || ""}</body>`, "text/html");
  const walk = node => {
    [...node.childNodes].forEach(n => {
      if (n.nodeType === 1) {
        const t = n.tagName;
        if (DROP.includes(t) || DROP.includes(t.toUpperCase())) { n.remove(); return; }
        if (!(t in ALLOWED)) { walk(n); n.replaceWith(...n.childNodes); return; }
        [...n.attributes].forEach(a => { if (!ALLOWED[t].includes(a.name)) n.removeAttribute(a.name); });
        if (t === "A") {
          const h = n.getAttribute("href") || "";
          if (!/^(https?:|mailto:|tel:|#)/i.test(h)) n.removeAttribute("href");
          else if (!h.startsWith("#")) { n.setAttribute("target", "_blank"); n.setAttribute("rel", "noopener noreferrer"); }
        }
        if (t === "IMG") {
          const s = n.getAttribute("src") || "";
          if (!/^(https:\/\/|data:image\/(png|jpe?g|webp|gif);)/i.test(s)) { n.remove(); return; }
          n.setAttribute("loading", "lazy");
        }
        walk(n);
      } else if (n.nodeType !== 3) n.remove();
    });
  };
  walk(doc.body);
  return doc.body.innerHTML;
}

// ── Toast
export function toast(msg, type = "") {
  let box = $("#toasts");
  if (!box) { box = document.createElement("div"); box.id = "toasts"; document.body.appendChild(box); }
  const t = document.createElement("div");
  t.className = "toast " + type;
  t.innerHTML = `${icon(type === "err" ? "x" : "check")}<span>${esc(msg)}</span>`;
  box.appendChild(t);
  requestAnimationFrame(() => t.classList.add("in"));
  setTimeout(() => { t.classList.remove("in"); setTimeout(() => t.remove(), 400); }, 3200);
}

// ── Modal genérico
let lockCount = 0;
export const lockScroll = on => { lockCount += on ? 1 : -1; if (lockCount < 0) lockCount = 0; document.documentElement.classList.toggle("locked", lockCount > 0); };

export function modal({ title = "", body = "", wide = false, onClose } = {}) {
  const el = document.createElement("div");
  el.className = "modal";
  el.innerHTML = `<div class="modal-back"></div><div class="modal-card ${wide ? "wide" : ""}" role="dialog" aria-modal="true">
    <div class="modal-head"><h3>${esc(title)}</h3><button class="icon-btn" data-close aria-label="Cerrar">${icon("x")}</button></div>
    <div class="modal-body">${body}</div></div>`;
  document.body.appendChild(el);
  lockScroll(true);
  requestAnimationFrame(() => el.classList.add("in"));
  const close = () => { if (!el.isConnected) return; el.classList.remove("in"); lockScroll(false); document.removeEventListener("keydown", key); setTimeout(() => el.remove(), 300); onClose && onClose(); };
  const key = e => { if (e.key === "Escape") close(); };
  document.addEventListener("keydown", key);
  el.querySelector(".modal-back").onclick = close;
  el.querySelector("[data-close]").onclick = close;
  return { el, body: el.querySelector(".modal-body"), close };
}

export function confirmBox(msg, okText = "Eliminar") {
  return new Promise(res => {
    let done = false;
    const m = modal({ title: "Confirmar", body: `<p class="confirm-msg">${esc(msg)}</p><div class="modal-actions"><button class="btn ghost" data-no>Cancelar</button><button class="btn danger" data-yes>${esc(okText)}</button></div>`, onClose: () => { if (!done) res(false); } });
    m.el.querySelector("[data-no]").onclick = () => { done = true; m.close(); res(false); };
    m.el.querySelector("[data-yes]").onclick = () => { done = true; m.close(); res(true); };
  });
}

// ── Lightbox estilo red social
export function lightbox(items, start = 0) {
  if (!items.length) return;
  let i = start, zoom = false;
  const el = document.createElement("div");
  el.className = "lb";
  el.innerHTML = `
    <div class="lb-top">
      <span class="lb-count"></span>
      <div class="lb-tools">
        <button class="icon-btn" data-zoom aria-label="Acercar">${icon("zoom")}</button>
        <button class="icon-btn" data-dl aria-label="Abrir imagen">${icon("download")}</button>
        <button class="icon-btn" data-close aria-label="Cerrar">${icon("x")}</button>
      </div>
    </div>
    <button class="lb-nav prev" aria-label="Anterior">${icon("left")}</button>
    <div class="lb-stage"><img alt="" draggable="false"><div class="lb-spin"></div></div>
    <button class="lb-nav next" aria-label="Siguiente">${icon("right")}</button>
    <div class="lb-cap"></div>
    <div class="lb-strip"></div>`;
  document.body.appendChild(el);
  lockScroll(true);
  const img = el.querySelector(".lb-stage img"), stage = el.querySelector(".lb-stage");
  const strip = el.querySelector(".lb-strip");
  strip.innerHTML = items.length > 1 ? items.map((it, k) => `<button data-k="${k}"><img src="${esc(it.img.thumb || it.img.src || "")}" alt=""></button>`).join("") : "";
  if (items.length < 2) el.classList.add("single");
  const setZoom = (on, ev) => {
    zoom = on;
    el.classList.toggle("zoomed", on);
    if (on && ev) { const r = img.getBoundingClientRect(); img.style.transformOrigin = `${((ev.clientX - r.left) / r.width) * 100}% ${((ev.clientY - r.top) / r.height) * 100}%`; }
    img.style.transform = on ? "scale(2.2)" : "";
  };
  const show = async k => {
    i = (k + items.length) % items.length;
    setZoom(false);
    const it = items[i];
    img.classList.add("loading");
    img.src = it.img.thumb || it.img.src || "";
    el.querySelector(".lb-count").textContent = items.length > 1 ? `${i + 1} / ${items.length}` : "";
    el.querySelector(".lb-cap").innerHTML = (it.title || it.caption) ? `${it.title ? `<b>${esc(it.title)}</b>` : ""}${it.caption ? `<span>${esc(it.caption)}</span>` : ""}` : "";
    $$("button", strip).forEach(b => b.classList.toggle("on", +b.dataset.k === i));
    strip.querySelector(".on")?.scrollIntoView({ block: "nearest", inline: "center", behavior: "smooth" });
    const full = await imageSrc(it.img);
    if (items[i] === it) { img.src = full; img.onload = () => img.classList.remove("loading"); if (img.complete) img.classList.remove("loading"); }
  };
  const close = () => { el.classList.remove("in"); lockScroll(false); document.removeEventListener("keydown", key); setTimeout(() => el.remove(), 300); };
  const key = e => { if (e.key === "Escape") close(); if (e.key === "ArrowRight") show(i + 1); if (e.key === "ArrowLeft") show(i - 1); };
  document.addEventListener("keydown", key);
  el.querySelector("[data-close]").onclick = close;
  el.querySelector(".prev").onclick = () => show(i - 1);
  el.querySelector(".next").onclick = () => show(i + 1);
  el.querySelector("[data-zoom]").onclick = () => setZoom(!zoom);
  el.querySelector("[data-dl]").onclick = async () => { const w = window.open(); if (w) { w.document.write(`<title>Imagen</title><body style="margin:0;background:#000;display:grid;place-items:center;min-height:100vh"><img src="${await imageSrc(items[i].img)}" style="max-width:100%;max-height:100vh">`); } };
  strip.onclick = e => { const b = e.target.closest("button"); if (b) show(+b.dataset.k); };
  img.onclick = e => { e.stopPropagation(); setZoom(!zoom, e); };
  stage.onclick = e => { if (e.target === stage) close(); };
  // gestos táctiles
  let sx = 0, sy = 0, moving = false;
  stage.addEventListener("pointerdown", e => { if (zoom) return; sx = e.clientX; sy = e.clientY; moving = true; });
  stage.addEventListener("pointermove", e => { if (!moving || zoom) return; const dx = e.clientX - sx; img.style.transform = `translateX(${dx}px)`; img.style.opacity = 1 - Math.min(Math.abs(dx) / 600, .5); });
  const end = e => {
    if (!moving) return; moving = false;
    const dx = e.clientX - sx, dy = e.clientY - sy;
    img.style.transform = ""; img.style.opacity = "";
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy)) show(i + (dx < 0 ? 1 : -1));
    else if (dy > 120) close();
  };
  stage.addEventListener("pointerup", end);
  stage.addEventListener("pointercancel", end);
  requestAnimationFrame(() => el.classList.add("in"));
  show(i);
}

// ── Procesar imágenes (comprimir en el navegador antes de guardar)
function loadImage(file) {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file);
    const im = new Image();
    im.onload = () => { res(im); setTimeout(() => URL.revokeObjectURL(url), 1000); };
    im.onerror = () => rej(new Error("No se pudo leer la imagen"));
    im.src = url;
  });
}
function encode(im, max, q, limit) {
  let scale = Math.min(1, max / Math.max(im.naturalWidth, im.naturalHeight));
  const c = document.createElement("canvas"), ctx = c.getContext("2d");
  let out = "";
  for (let tries = 0; tries < 12; tries++) {
    c.width = Math.max(1, Math.round(im.naturalWidth * scale));
    c.height = Math.max(1, Math.round(im.naturalHeight * scale));
    ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(im, 0, 0, c.width, c.height);
    out = c.toDataURL("image/webp", q);
    if (!out.startsWith("data:image/webp")) out = c.toDataURL("image/jpeg", q);
    if (out.length <= limit) break;
    if (q > 0.5) q -= 0.08; else scale *= 0.82;
  }
  return out;
}
export async function processImage(file, { full = 1600, thumb = 640 } = {}) {
  if (!file.type.startsWith("image/")) throw new Error("El archivo no es una imagen");
  const im = await loadImage(file);
  return {
    full: encode(im, full, 0.84, 800000),
    thumb: encode(im, thumb, 0.72, 80000),
    w: im.naturalWidth, h: im.naturalHeight
  };
}

// ── Animación al hacer scroll
let io;
export function reveal(root = document) {
  if (!io) io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px", threshold: 0.05 });
  $$(".reveal:not(.in)", root).forEach(el => io.observe(el));
}

export const avatar = (name, photo, cls = "") => photo ? `<img class="avatar ${cls}" src="${esc(photo)}" alt="" referrerpolicy="no-referrer">` : `<span class="avatar ${cls}">${esc(initials(name))}</span>`;
