import * as D from "./data.js";
import { $, $$, esc, icon, timeAgo, fmtDate, linkify, sanitize, toast, modal, confirmBox, lightbox, reveal, avatar, readTime } from "./ui.js";

let S = null;                       // ajustes del sitio
const cache = {};                   // caché de colecciones por sesión
const refreshers = new Set();       // bloques que se actualizan al iniciar sesión
const view = $("#view");

// ───────────── utilidades ─────────────
async function getAll(col, filters) {
  const key = col + JSON.stringify(filters || []);
  if (!cache[key]) cache[key] = D.list(col, filters).catch(e => { console.error(e); delete cache[key]; return []; });
  return cache[key];
}
const byDate = (a, b) => (b.createdAt || 0) - (a.createdAt || 0);
const articles = async () => (await getAll("posts", [["published", "==", true]])).filter(p => p.type === "article").sort(byDate);
const wallPosts = async () => (await getAll("posts", [["published", "==", true]])).filter(p => p.type === "wall").sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0) || byDate(a, b));
const galleryItems = async () => (await getAll("gallery")).sort(byDate);
const bookItems = async () => (await getAll("books")).sort((a, b) => (+a.order || 99) - (+b.order || 99) || byDate(a, b));

const savedIds = () => { try { return JSON.parse(localStorage.getItem("ma-saved") || "[]"); } catch { return []; } };
const isSaved = id => savedIds().includes(id);
function toggleSaved(id) {
  const s = savedIds(); const i = s.indexOf(id);
  if (i >= 0) s.splice(i, 1); else s.unshift(id);
  try { localStorage.setItem("ma-saved", JSON.stringify(s)); } catch { }
  updateSavedBadge();
  return i < 0;
}
function updateSavedBadge() {
  const n = savedIds().length, b = $("#btnSaved");
  b.innerHTML = icon("bookmark") + (n ? `<span class="badge-dot">${n}</span>` : "");
}
const firstName = () => (S.name || "").split(" ")[0];
const nameParts = () => { const p = (S.name || "").trim().split(/\s+/); return [p[0] || "", p.slice(1).join(" ")]; };
const waDigits = () => (S.whatsapp || "").replace(/\D/g, "");
const waLink = text => `https://wa.me/${waDigits()}?text=${encodeURIComponent(text)}`;
const shareUrl = path => location.origin + location.pathname + "#/" + path;
const imgThumb = img => esc(img?.thumb || img?.src || "");
const loader = () => `<div class="loader"><span></span></div>`;
const bgDeco = (orbs = true) => `<div class="hero-grid"></div>${orbs ? '<div class="orb o1"></div>' : ""}`;
const SOCIAL_ICONS = { facebook: "facebook", instagram: "instagram", x: "xsocial", linkedin: "linkedin", youtube: "youtube", tiktok: "tiktok" };
const socialsHtml = () => Object.entries(S.socials || {}).filter(([, u]) => u).map(([k, u]) => `<a href="${esc(u)}" target="_blank" rel="noopener" aria-label="${k}">${icon(SOCIAL_ICONS[k] || "link")}</a>`).join("");
const avatarMe = (cls = "") => avatar(S.name, S.photo?.avatar || S.photo?.thumb || S.photo?.src, cls);
const STATUS = { disponible: "Disponible", preventa: "Preventa", proximamente: "Próximamente", agotado: "Agotado" };

async function requireVisitor() {
  if (D.user()) return true;
  try { await D.loginVisitor(); return !!D.user(); }
  catch (e) { if (e?.code !== "auth/popup-closed-by-user") toast("No se pudo iniciar sesión", "err"); return false; }
}

// ───────────── componentes ─────────────
function articleCard(p, feature = false, cls = "") {
  return `<article class="card ${feature ? "feature" : ""} reveal ${cls}">
    <button class="save-btn ${isSaved(p.id) ? "on" : ""}" data-save="${p.id}" aria-label="Guardar">${icon("bookmark")}</button>
    <div class="card-media">${p.cover ? `<img src="${imgThumb(p.cover)}" alt="" loading="lazy">` : ""}</div>
    <div class="card-body">
      <span class="tag">${esc(p.category || "Artículo")}</span>
      <h3><a href="#/articulos/${p.id}" class="stretched">${esc(p.title)}</a></h3>
      <p>${esc(p.excerpt || "")}</p>
      <div class="card-meta"><span>${fmtDate(p.createdAt)}</span><span>${p.readMin || 3} min de lectura</span></div>
    </div></article>`;
}

function bindSaveButtons(root) {
  $$("[data-save]", root).forEach(b => b.onclick = e => {
    e.preventDefault(); e.stopPropagation();
    const on = toggleSaved(b.dataset.save);
    b.classList.toggle("on", on); b.classList.toggle("saved", on);
    toast(on ? "Guardado en tus temas" : "Quitado de guardados");
    if (location.hash.startsWith("#/guardados")) route();
  });
}

function bookCard(b) {
  return `<div class="book-card reveal">
    <a href="#/libros/${b.id}" class="book3d-wrap">
      ${b.status ? `<span class="book-status ${esc(b.status)}">${STATUS[b.status] || esc(b.status)}</span>` : ""}
      <div class="book3d">${b.cover ? `<img src="${imgThumb(b.cover)}" alt="Portada de ${esc(b.title)}" loading="lazy">` : ""}</div>
    </a>
    <div class="book-info">
      <h3><a href="#/libros/${b.id}">${esc(b.title)}</a></h3>
      ${b.subtitle ? `<p class="sub">${esc(b.subtitle)}</p>` : ""}
      <div class="book-foot">
        ${b.price ? `<span class="price"><small>${esc(b.currency || "L")}</small>${esc(b.price)}</span>` : "<span></span>"}
        <a href="#/libros/${b.id}" class="link-arrow">Ver libro ${icon("arrow")}</a>
      </div>
    </div></div>`;
}

function galleryTile(g, i) {
  const im = g.image || {};
  return `<button class="m-item reveal" data-i="${i}">
    <img src="${imgThumb(im)}" ${im.w ? `width="${im.w}" height="${im.h}"` : ""} alt="${esc(g.caption || "")}" loading="lazy">
    <span class="m-zoom">${icon("zoom")}</span>
    <span class="m-cap">${g.album ? `<small>${esc(g.album)}</small>` : ""}<span>${esc(g.caption || "")}</span></span>
  </button>`;
}
const galleryLb = list => list.map(g => ({ img: g.image, title: g.album, caption: g.caption }));

function mediaGrid(images) {
  if (!images?.length) return "";
  const n = Math.min(images.length, 4), extra = images.length - 4;
  return `<div class="mgrid n${n}">${images.slice(0, 4).map((im, k) => `<button data-img="${k}"><img src="${imgThumb(im)}" alt="" loading="lazy">${k === 3 && extra > 0 ? `<span class="more-ov">+${extra}</span>` : ""}</button>`).join("")}</div>`;
}

// Bloque de comentarios reutilizable
async function commentsBlock(box, postId, postTitle, onCount) {
  const draw = async () => {
    const u = D.user();
    const filters = u?.isAdmin ? [["postId", "==", postId]] : [["postId", "==", postId], ["approved", "==", true]];
    let list = [];
    try { list = await D.list("comments", filters); } catch (e) { console.error(e); }
    if (u && !u.isAdmin) {
      try { const mine = await D.list("comments", [["postId", "==", postId], ["uid", "==", u.uid]]); mine.forEach(m => { if (!list.find(x => x.id === m.id)) list.push(m); }); } catch { }
    }
    list.sort((a, b) => a.createdAt - b.createdAt);
    onCount && onCount(list.filter(c => c.approved).length);
    box.innerHTML = `<div class="comments">
      <h3>Comentarios <small>${list.length}</small></h3>
      ${u ? `<form class="c-form">${avatar(u.isAdmin ? S.name : u.name, u.isAdmin ? (S.photo?.avatar || S.photo?.thumb || S.photo?.src) : u.photo)}
          <div class="field"><textarea name="t" rows="1" maxlength="2000" placeholder="${u.isAdmin ? "Responder como " + esc(S.name) : "Escribí tu comentario…"}" required></textarea>
          <div class="row"><span>${u.isAdmin ? "Publicás como administradora" : "Comentando como " + esc(u.name)} · <button type="button" class="link-out" style="font-size:.8rem;text-decoration:underline">salir</button></span><button class="btn dark sm">Publicar</button></div></div></form>`
        : `<div class="login-cta"><p>Iniciá sesión para comentar y reaccionar a las publicaciones.</p><button class="btn dark sm" data-login>${icon("user")} Iniciar sesión</button></div>`}
      <div class="c-list">${list.length ? list.map(c => `
        <div class="c-item ${c.isAdmin ? "admin" : ""}">${avatar(c.name, c.isAdmin ? (S.photo?.avatar || S.photo?.thumb || S.photo?.src) : c.photo)}
          <div class="c-bubble"><div class="c-in"><div class="c-head"><b>${esc(c.name)}</b>${c.isAdmin ? '<span class="c-badge">Autora</span>' : ""}${!c.approved ? '<span class="c-pending">· Pendiente de aprobación</span>' : ""}</div><p class="c-text">${linkify(c.text)}</p></div>
          <div class="c-actions"><span>${timeAgo(c.createdAt)}</span>${u && (u.isAdmin || u.uid === c.uid) ? `<button data-del="${c.id}">Eliminar</button>` : ""}</div></div></div>`).join("") : `<p class="muted" style="margin:0">Sé la primera persona en comentar.</p>`}
      </div></div>`;
    const ta = $("textarea", box);
    if (ta) ta.oninput = () => { ta.style.height = "auto"; ta.style.height = ta.scrollHeight + "px"; };
    $("[data-login]", box) && ($("[data-login]", box).onclick = async () => { if (await requireVisitor()) draw(); });
    $(".link-out", box) && ($(".link-out", box).onclick = () => D.logout());
    const form = $(".c-form", box);
    if (form) form.onsubmit = async e => {
      e.preventDefault();
      const text = form.t.value.trim(); if (!text) return;
      const btn = $("button.btn", form); btn.disabled = true;
      try {
        const approved = u.isAdmin || !S.moderateComments;
        await D.add("comments", { postId, postTitle: postTitle || "", uid: u.uid, name: u.isAdmin ? S.name : u.name, photo: u.isAdmin ? null : (u.photo || null), text, approved, isAdmin: !!u.isAdmin, createdAt: Date.now() });
        toast(approved ? "Comentario publicado" : "Comentario enviado. Se mostrará cuando sea aprobado.");
        draw();
      } catch (err) { console.error(err); toast("No se pudo publicar el comentario", "err"); btn.disabled = false; }
    };
    $$("[data-del]", box).forEach(b => b.onclick = async () => {
      if (!(await confirmBox("¿Eliminar este comentario?"))) return;
      try { await D.remove("comments", b.dataset.del); toast("Comentario eliminado"); draw(); } catch { toast("No se pudo eliminar", "err"); }
    });
  };
  refreshers.add(draw);
  await draw();
}

async function likeButton(btn, postId, onChange) {
  const paint = (info) => { btn.classList.toggle("liked", info.liked); const c = btn.querySelector("[data-n]"); if (c) c.textContent = info.count || ""; onChange && onChange(info); };
  let info = await D.likeInfo(postId).catch(() => ({ count: 0, liked: false }));
  paint(info);
  btn.onclick = async () => {
    if (!(await requireVisitor())) return;
    const was = info.liked;
    info = { liked: !was, count: info.count + (was ? -1 : 1) }; paint(info);
    try { await D.toggleLike(postId); } catch (e) { console.error(e); info = { liked: was, count: info.count + (was ? 1 : -1) }; paint(info); toast("No se pudo registrar", "err"); }
  };
  refreshers.add(async () => { info = await D.likeInfo(postId).catch(() => info); paint(info); });
}

function shareRow(path, title) {
  const url = encodeURIComponent(shareUrl(path)), t = encodeURIComponent(title);
  return `<div class="share-row"><small>Compartir</small>
    <a class="icon-btn" target="_blank" rel="noopener" href="https://wa.me/?text=${t}%20${url}" aria-label="WhatsApp">${icon("whatsapp")}</a>
    <a class="icon-btn" target="_blank" rel="noopener" href="https://www.facebook.com/sharer/sharer.php?u=${url}" aria-label="Facebook">${icon("facebook")}</a>
    <a class="icon-btn" target="_blank" rel="noopener" href="https://twitter.com/intent/tweet?url=${url}&text=${t}" aria-label="X">${icon("xsocial")}</a>
    <a class="icon-btn" target="_blank" rel="noopener" href="https://www.linkedin.com/sharing/share-offsite/?url=${url}" aria-label="LinkedIn">${icon("linkedin")}</a>
    <button class="icon-btn" data-copy="${esc(shareUrl(path))}" aria-label="Copiar enlace">${icon("link")}</button></div>`;
}
function bindCopy(root) {
  $$("[data-copy]", root).forEach(b => b.onclick = async () => {
    const u = b.dataset.copy;
    if (navigator.share && matchMedia("(pointer:coarse)").matches) { try { await navigator.share({ url: u }); return; } catch { } }
    try { await navigator.clipboard.writeText(u); toast("Enlace copiado"); } catch { prompt("Copiá el enlace:", u); }
  });
}

// ───────────── VISTAS ─────────────
async function vHome() {
  const [first, rest] = nameParts();
  const creds = S.credentials || [];
  view.innerHTML = `
  <section class="hero">
    <div class="hero-bg">${bgDeco(false)}<div class="orb o1"></div><div class="orb o2"></div><div class="hero-noise"></div></div>
    <div class="hero-inner">
      <div class="hero-copy">
        <span class="kicker fade-up"><i class="dot"></i>${esc(S.heroKicker)}</span>
        <h1 class="display"><span><i>${esc(first)}</i></span><span><i><em>${esc(rest)}</em></i></span></h1>
        <p class="hero-role fade-up" style="animation-delay:.35s">${esc(S.role)}</p>
        <p class="lead fade-up" style="animation-delay:.45s">${esc(S.heroText)}</p>
        <div class="cta-row fade-up" style="animation-delay:.55s">
          <a href="#/libros" class="btn gold">${icon("book")} Ver sus libros</a>
          <a href="#/trayectoria" class="btn ghost-light">Conocer trayectoria ${icon("arrow")}</a>
        </div>
      </div>
      <div class="hero-portrait fade-up" style="animation-delay:.3s">
        <div class="arch">${S.photo ? `<img src="${imgThumb(S.photo)}" alt="${esc(S.name)}" id="heroPhoto">` : `<div class="arch-mono"><b>${esc((first[0] || "") + (rest[0] || ""))}</b></div>`}</div>
        <div class="glass float-card"><small>Cargo actual</small><b>${esc(S.currentPosition)}</b><span>${esc(S.currentRank)}</span></div>
        ${S.stats?.[0] ? `<div class="glass float-chip"><b>${esc(S.stats[0].value)}</b><span>${esc(S.stats[0].label)}</span></div>` : ""}
      </div>
    </div>
    <div class="marquee"><div class="marquee-track">${[...creds, ...creds, ...creds, ...creds].map(c => `<span>${esc(c)}</span>`).join("")}</div></div>
  </section>

  <section class="sec tight"><div class="wrap"><div class="stats">${(S.stats || []).map((s, i) => `<div class="stat reveal d${i}"><b>${esc(s.value).replace("%", "<sup>%</sup>")}</b><span>${esc(s.label)}</span></div>`).join("")}</div></div></section>

  <section class="sec" style="padding-top:clamp(2rem,5vw,4rem)"><div class="wrap about-grid">
    <div class="reveal">
      <span class="eyebrow">Perfil</span>
      <h2 class="h-sec" style="margin-top:1rem">Una vida dedicada a la <em>justicia</em></h2>
      <p class="about-quote">${esc(S.bioShort)}</p>
      <div style="margin-top:2rem"><a href="#/trayectoria" class="btn dark">Trayectoria completa ${icon("arrow")}</a></div>
    </div>
    <div>
      <div class="cred-list reveal d1">${creds.map((c, i) => `<div class="cred"><i>0${i + 1}</i><span>${esc(c)}</span></div>`).join("")}</div>
      <div class="timeline reveal d2" style="margin-top:3rem">${(S.timeline || []).slice(-3).map((t, i, a) => `<div class="tl ${i === a.length - 1 ? "now" : ""}"><small>${esc(t.year)}</small><h4>${esc(t.title)}</h4><p>${esc(t.text)}</p></div>`).join("")}</div>
    </div>
  </div></section>

  <section class="sec dark" id="homeBooks"></section>
  <section class="sec" id="homeArticles"></section>
  <section class="sec alt" id="homeGallery"></section>
  <section class="sec"><div class="wrap"><div class="cta-band reveal">${bgDeco()}
    <div><h2>¿Querés comunicarte con <em>${esc(firstName())}</em>?</h2><p>Invitaciones a conferencias, consultas académicas, prensa o información sobre sus libros.</p></div>
    <div class="cta-row" style="margin:0"><a href="#/contacto" class="btn gold">${icon("mail")} Escribir mensaje</a>${waDigits() ? `<a href="${waLink("Hola, quisiera comunicarme con la Dra. " + S.name)}" target="_blank" rel="noopener" class="btn ghost-light">${icon("whatsapp")} WhatsApp</a>` : ""}</div>
  </div></div></section>`;

  if (S.photo) D.imageSrc(S.photo).then(s => { const im = $("#heroPhoto"); if (im) im.src = s; });

  const [bks, arts, gal] = await Promise.all([bookItems(), articles(), galleryItems()]);
  const hb = $("#homeBooks"), ha = $("#homeArticles"), hg = $("#homeGallery");
  if (!hb) return;
  if (bks.length) hb.innerHTML = `<div class="wrap"><div class="sec-head"><div class="reveal"><span class="eyebrow">Publicaciones</span><h2 class="h-sec">Libros de la <em>autora</em></h2><p class="lead">Obras para estudiantes, profesionales y todas las personas interesadas en el Derecho.</p></div><a href="#/libros" class="btn ghost-light reveal">Ver todos ${icon("arrow")}</a></div><div class="books">${bks.slice(0, 3).map(bookCard).join("")}</div></div>`;
  else hb.remove();
  if (arts.length) {
    ha.innerHTML = `<div class="wrap"><div class="sec-head"><div class="reveal"><span class="eyebrow">Artículos</span><h2 class="h-sec">Análisis y <em>reflexiones</em></h2></div><a href="#/articulos" class="btn ghost reveal">Todos los artículos ${icon("arrow")}</a></div>
      <div class="cards">${arts.slice(0, 4).map((p, i) => articleCard(p, i === 0, "d" + (i % 3))).join("")}</div></div>`;
    bindSaveButtons(ha);
  } else ha.remove();
  if (gal.length) {
    const sub = gal.slice(0, 6);
    hg.innerHTML = `<div class="wrap"><div class="sec-head"><div class="reveal"><span class="eyebrow">Galería</span><h2 class="h-sec">Actividades y <em>momentos</em></h2></div><a href="#/galeria" class="btn ghost reveal">Abrir galería ${icon("arrow")}</a></div><div class="mosaic">${sub.map(galleryTile).join("")}</div></div>`;
    $$(".m-item", hg).forEach(b => b.onclick = () => lightbox(galleryLb(sub), +b.dataset.i));
  } else hg.remove();
  reveal();
}

function pageHead(eyebrow, title, lead = "") {
  return `<section class="page-head">${bgDeco()}<div class="wrap"><span class="eyebrow fade-up">${eyebrow}</span><h1 class="fade-up" style="animation-delay:.1s">${title}</h1>${lead ? `<p class="lead fade-up" style="animation-delay:.2s">${lead}</p>` : ""}</div></section>`;
}

async function vAbout() {
  view.innerHTML = pageHead("Trayectoria", `${esc(S.fullName || S.name)}`, esc(S.role)) + `
  <section class="sec"><div class="wrap about-grid">
    <div class="reveal">
      <div class="arch" style="max-width:380px;background:var(--ink)">${S.photo ? `<img src="${imgThumb(S.photo)}" alt="" id="aboutPhoto">` : `<div class="arch-mono"><b>${esc(nameParts()[0][0] || "")}${esc(nameParts()[1][0] || "")}</b></div>`}</div>
      <div class="cred-list">${(S.credentials || []).map((c, i) => `<div class="cred"><i>0${i + 1}</i><span>${esc(c)}</span></div>`).join("")}</div>
    </div>
    <div class="reveal d1">
      <span class="eyebrow">Biografía</span>
      <div class="prose" style="margin-top:1.5rem">${sanitize(S.bioHtml)}</div>
    </div>
  </div></section>
  <section class="sec dark"><div class="wrap about-grid">
    <div class="reveal"><span class="eyebrow">Recorrido</span><h2 class="h-sec" style="margin-top:1rem">Del Ministerio Público a la <em>Asesoría de Estado</em></h2><p class="lead" style="margin-top:1rem">Experiencia en la persecución penal, la judicatura, la magistratura y la academia.</p></div>
    <div class="timeline reveal d1">${(S.timeline || []).map((t, i, a) => `<div class="tl ${i === a.length - 1 ? "now" : ""}"><small>${esc(t.year)}</small><h4>${esc(t.title)}</h4><p>${esc(t.text)}</p></div>`).join("")}</div>
  </div></section>
  <section class="sec tight"><div class="wrap"><div class="stats">${(S.stats || []).map((s, i) => `<div class="stat reveal d${i}"><b>${esc(s.value).replace("%", "<sup>%</sup>")}</b><span>${esc(s.label)}</span></div>`).join("")}</div></div></section>`;
  if (S.photo) D.imageSrc(S.photo).then(s => { const im = $("#aboutPhoto"); if (im) im.src = s; });
  reveal();
}

async function vArticles(q) {
  const all = await articles();
  const cats = [...new Set([...(S.categories || []), ...all.map(a => a.category).filter(Boolean)])].filter(c => all.some(a => a.category === c));
  let cat = q.get("tema") || "", term = "";
  view.innerHTML = pageHead("Artículos", "Temas de <em>Derecho</em>", "Análisis, opiniones y guías prácticas sobre las distintas ramas del Derecho. Guardá los temas que te interesen para leerlos después.") + `
  <section class="sec" style="padding-top:3rem"><div class="wrap">
    <div class="toolbar"><div class="chips" id="cats"><button class="chip" data-c="">Todos</button>${cats.map(c => `<button class="chip" data-c="${esc(c)}">${esc(c)}</button>`).join("")}</div>
      <label class="searchbox">${icon("search")}<input type="search" id="q" placeholder="Buscar artículos…" aria-label="Buscar"></label></div>
    <div class="cards" id="list"></div></div></section>`;
  const draw = () => {
    const t = term.toLowerCase();
    const res = all.filter(a => (!cat || a.category === cat) && (!t || (a.title + " " + a.excerpt).toLowerCase().includes(t)));
    $$("#cats .chip").forEach(c => c.classList.toggle("on", c.dataset.c === cat));
    $("#list").innerHTML = res.length ? res.map((p, i) => articleCard(p, i === 0 && !cat && !t && res.length > 2, "d" + (i % 3))).join("") : `<div class="empty" style="grid-column:1/-1">${icon("article")}<h3>Sin resultados</h3><p>Probá con otro tema o palabra.</p></div>`;
    bindSaveButtons($("#list")); reveal();
  };
  $("#cats").onclick = e => { const b = e.target.closest(".chip"); if (!b) return; cat = b.dataset.c; history.replaceState(null, "", "#/articulos" + (cat ? "?tema=" + encodeURIComponent(cat) : "")); draw(); };
  $("#q").oninput = e => { term = e.target.value; draw(); };
  draw();
}

async function vArticle(id) {
  const p = await D.get("posts", id).catch(() => null);
  const u = D.user();
  if (!p || (!p.published && !u?.isAdmin) || p.type !== "article") return vNotFound();
  view.innerHTML = `
  <section class="article-hero">${bgDeco()}<div class="article-head">
    <a href="#/articulos?tema=${encodeURIComponent(p.category || "")}" class="tag fade-up">${esc(p.category || "Artículo")}</a>
    <h1 class="fade-up" style="animation-delay:.1s">${esc(p.title)}</h1>
    <div class="article-meta fade-up" style="animation-delay:.2s"><span class="who">${avatarMe()} ${esc(S.name)}</span><span>${icon("calendar")} ${fmtDate(p.createdAt)}</span><span>${icon("clock")} ${p.readMin || 3} min</span></div>
  </div>${p.cover ? `<div class="article-cover fade-up" style="animation-delay:.3s"><img src="${imgThumb(p.cover)}" alt="" id="coverImg"></div>` : `<div style="height:3.5rem"></div>`}</section>
  <div class="article-wrap">
    ${!p.published ? `<p class="c-pending" style="margin-bottom:1rem">Borrador: solo vos podés verlo.</p>` : ""}
    <div class="prose" id="body"><div class="skel" style="height:300px"></div></div>
    <div class="engage">
      <div class="engage-left"><button class="pill" id="like">${icon("heart")} Me gusta <span data-n></span></button>
      <button class="pill ${isSaved(p.id) ? "saved" : ""}" data-save="${p.id}">${icon("bookmark")} Guardar tema</button></div>
      ${shareRow("articulos/" + p.id, p.title)}
    </div>
    <div class="author-box">${avatarMe()}<div><h4>${esc(S.name)}</h4><p>${esc(S.role)}. ${esc(S.currentPosition)}.</p></div></div>
    <div id="comments"></div>
  </div>
  <section class="sec alt" id="related"></section>`;
  if (p.cover) D.imageSrc(p.cover).then(s => { const im = $("#coverImg"); if (im) { im.src = s; im.onclick = () => lightbox([{ img: p.cover, title: p.title }]); } });
  bindSaveButtons(view); bindCopy(view);
  likeButton($("#like"), p.id);
  D.get("bodies", p.id).then(b => {
    const el = $("#body"); if (!el) return;
    el.innerHTML = sanitize(b?.content || "<p>" + esc(p.excerpt || "") + "</p>");
    const imgs = $$("img", el);
    imgs.forEach((im, k) => im.onclick = () => lightbox(imgs.map(x => ({ img: { src: x.src } })), k));
  }).catch(() => { $("#body").innerHTML = "<p>No se pudo cargar el contenido.</p>"; });
  commentsBlock($("#comments"), p.id, p.title);
  const rel = (await articles()).filter(a => a.id !== p.id).sort((a, b) => (b.category === p.category) - (a.category === p.category)).slice(0, 3);
  const r = $("#related");
  if (r) { if (rel.length) { r.innerHTML = `<div class="wrap"><div class="sec-head"><div><span class="eyebrow">Seguí leyendo</span><h2 class="h-sec">Artículos <em>relacionados</em></h2></div></div><div class="cards">${rel.map(a => articleCard(a)).join("")}</div></div>`; bindSaveButtons(r); reveal(); } else r.remove(); }
}

function wallCard(p) {
  return `<article class="post reveal" data-id="${p.id}">
    <div class="post-head">${avatarMe()}<div><b>${esc(S.name)} <span class="verified">${icon("check")}</span></b><small>${timeAgo(p.createdAt)}</small></div>${p.pinned ? `<span class="pinned">${icon("pinTop")} Fijado</span>` : ""}</div>
    ${p.text ? `<div class="post-text">${linkify(p.text)}</div>` : ""}
    ${mediaGrid(p.images)}
    <div class="post-stats"><span data-likes></span><button data-tog><span data-cc></span></button></div>
    <div class="post-actions">
      <button data-like>${icon("heart")}<span>Me gusta</span></button>
      <button data-tog>${icon("comment")}<span>Comentar</span></button>
      <button data-copy="${esc(shareUrl("muro/" + p.id))}">${icon("share")}<span>Compartir</span></button>
    </div>
    <div class="post-comments" hidden></div>
  </article>`;
}
function bindWall(root, posts, openComments = false) {
  $$(".post", root).forEach(el => {
    const p = posts.find(x => x.id === el.dataset.id); if (!p) return;
    $$("[data-img]", el).forEach(b => b.onclick = () => lightbox(p.images.map(im => ({ img: im, caption: "" })), +b.dataset.img));
    const likesEl = $("[data-likes]", el), cc = $("[data-cc]", el);
    likeButton($("[data-like]", el), p.id, info => { likesEl.innerHTML = info.count ? `<span style="color:#c2413a">♥</span> ${info.count}` : ""; });
    const setCount = n => { cc.textContent = n ? `${n} comentario${n === 1 ? "" : "s"}` : ""; };
    D.count("comments", [["postId", "==", p.id], ["approved", "==", true]]).then(setCount).catch(() => { });
    const box = $(".post-comments", el); let loaded = false;
    const open = () => { box.hidden = !box.hidden; if (!box.hidden && !loaded) { loaded = true; commentsBlock(box, p.id, "Publicación del muro", setCount); } if (!box.hidden) setTimeout(() => $("textarea", box)?.focus(), 300); };
    $$("[data-tog]", el).forEach(b => b.onclick = open);
    if (openComments) open();
  });
  bindCopy(root);
}

async function vWall() {
  const [posts, arts, gal] = await Promise.all([wallPosts(), articles(), galleryItems()]);
  view.innerHTML = pageHead("Muro", "Novedades y <em>conversación</em>", "Publicaciones, anuncios y momentos compartidos. Reaccioná y comentá.") + `
  <section class="sec" style="padding-top:3rem"><div class="wrap wall-layout">
    <aside class="wall-side reveal">
      <div class="profile-card"><div class="pc-cover"></div><div class="pc-body">${avatarMe()}<h3>${esc(S.name)}</h3><p>${esc(S.currentPosition)}</p>
        <div class="pc-stats"><span><b>${posts.length}</b>Publicaciones</span><span><b>${arts.length}</b>Artículos</span><span><b>${gal.length}</b>Fotos</span></div></div></div>
      ${gal.length ? `<div class="profile-card" style="padding:1.2rem"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:.8rem"><b>Fotos</b><a href="#/galeria" class="link-arrow" style="font-size:.8rem">Ver todas</a></div><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:4px;border-radius:10px;overflow:hidden">${gal.slice(0, 6).map((g, i) => `<button data-gi="${i}" style="aspect-ratio:1"><img src="${imgThumb(g.image)}" style="width:100%;height:100%;object-fit:cover" alt="" loading="lazy"></button>`).join("")}</div></div>` : ""}
    </aside>
    <div class="feed" id="feed">${posts.length ? posts.map(wallCard).join("") : `<div class="empty">${icon("wall")}<h3>Aún no hay publicaciones</h3></div>`}</div>
  </div></section>`;
  bindWall($("#feed"), posts);
  $$("[data-gi]").forEach(b => b.onclick = () => lightbox(galleryLb(gal.slice(0, 6)), +b.dataset.gi));
  reveal();
}

async function vWallPost(id) {
  const p = await D.get("posts", id).catch(() => null);
  if (!p || p.type !== "wall" || (!p.published && !D.user()?.isAdmin)) return vNotFound();
  view.innerHTML = pageHead("Muro", "Publicación") + `<section class="sec" style="padding-top:3rem"><div class="wrap" style="max-width:680px"><a href="#/muro" class="link-arrow" style="margin-bottom:1.5rem">${icon("left")} Volver al muro</a><div class="feed" id="feed" style="margin-top:1rem">${wallCard(p)}</div></div></section>`;
  bindWall($("#feed"), [p], true);
  reveal();
}

async function vGallery(q) {
  const all = await galleryItems();
  const albums = [...new Set(all.map(g => g.album).filter(Boolean))];
  let al = q.get("album") || "";
  view.innerHTML = pageHead("Galería", "Actividades y <em>momentos</em>", "Conferencias, clases, eventos institucionales y encuentros con la comunidad jurídica.") + `
  <section class="sec" style="padding-top:3rem"><div class="wrap">
    ${albums.length > 1 ? `<div class="chips albums" id="albums"><button class="chip" data-a="">Todo · ${all.length}</button>${albums.map(a => `<button class="chip" data-a="${esc(a)}">${esc(a)} · ${all.filter(g => g.album === a).length}</button>`).join("")}</div>` : ""}
    <div class="masonry" id="grid"></div></div></section>`;
  const draw = () => {
    const list = all.filter(g => !al || g.album === al);
    $$("#albums .chip").forEach(c => c.classList.toggle("on", c.dataset.a === al));
    $("#grid").innerHTML = list.length ? list.map(galleryTile).join("") : `<div class="empty">${icon("image")}<h3>Aún no hay fotos</h3></div>`;
    $$("#grid .m-item").forEach(b => b.onclick = () => lightbox(galleryLb(list), +b.dataset.i));
    reveal();
  };
  $("#albums") && ($("#albums").onclick = e => { const b = e.target.closest(".chip"); if (!b) return; al = b.dataset.a; draw(); });
  draw();
}

async function vBooks() {
  const bks = await bookItems();
  view.innerHTML = pageHead("Libros", "Obras de la <em>autora</em>", "Adquirí sus publicaciones directamente. Cada libro incluye información de compra o pedido.") + `
  <section class="sec"><div class="wrap">${bks.length ? `<div class="books">${bks.map(bookCard).join("")}</div>` : `<div class="empty">${icon("book")}<h3>Muy pronto</h3><p>Los libros estarán disponibles en breve.</p></div>`}</div></section>`;
  reveal();
}

async function vBook(id) {
  const b = await D.get("books", id).catch(() => null);
  if (!b) return vNotFound();
  const msg = `Hola, me interesa adquirir el libro "${b.title}" de ${S.name}.`;
  const buy = b.status === "proximamente"
    ? `<a href="#/contacto?asunto=${encodeURIComponent("Aviso de lanzamiento: " + b.title)}" class="btn gold">${icon("mail")} Avisarme del lanzamiento</a>`
    : `${b.buyUrl ? `<a href="${esc(b.buyUrl)}" target="_blank" rel="noopener" class="btn gold">${icon("cart")} ${b.status === "preventa" ? "Reservar ahora" : "Comprar ahora"}</a>` : ""}
       ${waDigits() ? `<a href="${waLink(msg)}" target="_blank" rel="noopener" class="btn ${b.buyUrl ? "ghost" : "gold"}">${icon("whatsapp")} Pedir por WhatsApp</a>` : ""}
       ${!b.buyUrl && !waDigits() ? `<a href="#/contacto?asunto=${encodeURIComponent("Pedido: " + b.title)}" class="btn gold">${icon("mail")} Solicitar ejemplar</a>` : ""}`;
  view.innerHTML = `<section class="page-head" style="padding-bottom:0;min-height:0">${bgDeco()}<div class="wrap"><a href="#/libros" class="link-arrow" style="color:#fff">${icon("left")} Todos los libros</a></div><div style="height:3rem"></div></section>
  <section class="sec" style="padding-top:3rem"><div class="wrap book-detail">
    <div class="reveal"><div class="book3d-wrap">${b.status ? `<span class="book-status ${esc(b.status)}">${STATUS[b.status] || esc(b.status)}</span>` : ""}<div class="book3d" style="cursor:zoom-in" id="cover">${b.cover ? `<img src="${imgThumb(b.cover)}" alt="Portada">` : ""}</div></div></div>
    <div class="reveal d1">
      <span class="eyebrow">${esc(S.name)}</span>
      <h1>${esc(b.title)}</h1>${b.subtitle ? `<p class="sub" style="font-family:var(--serif);font-style:italic;font-size:1.4rem;color:var(--muted);margin:0">${esc(b.subtitle)}</p>` : ""}
      ${b.price ? `<p class="price" style="font-size:2.6rem;margin:1.4rem 0 0"><small>${esc(b.currency || "L")}</small>${esc(b.price)}</p>` : ""}
      <div class="specs">${b.year ? `<div><small>Año</small><b>${esc(b.year)}</b></div>` : ""}${b.pages ? `<div><small>Páginas</small><b>${esc(b.pages)}</b></div>` : ""}${b.isbn ? `<div><small>ISBN</small><b>${esc(b.isbn)}</b></div>` : ""}<div><small>Estado</small><b>${STATUS[b.status] || "—"}</b></div></div>
      <div class="prose" style="font-size:1.05rem">${linkify(b.description || "")}</div>
      <div class="buy-row">${buy}</div>
      <div style="margin-top:1.5rem">${shareRow("libros/" + b.id, b.title)}</div>
    </div></div></section>`;
  if (b.cover) { $("#cover").onclick = () => lightbox([{ img: b.cover, title: b.title }]); D.imageSrc(b.cover).then(s => { const im = $("#cover img"); if (im) im.src = s; }); }
  bindCopy(view); reveal();
}

async function vContact(q) {
  view.innerHTML = pageHead("Contacto", "Conversemos", "Invitaciones a conferencias, actividades académicas, prensa o pedidos de libros.") + `
  <section class="sec"><div class="wrap contact-grid">
    <div class="reveal">
      <div class="contact-cards">
        ${S.email ? `<a class="c-card" href="mailto:${esc(S.email)}"><span class="ci">${icon("mail")}</span><div><small>Correo</small><b>${esc(S.email)}</b></div></a>` : ""}
        ${waDigits() ? `<a class="c-card" href="${waLink("Hola, quisiera comunicarme con la Dra. " + S.name)}" target="_blank" rel="noopener"><span class="ci">${icon("whatsapp")}</span><div><small>WhatsApp</small><b>${esc(S.whatsapp)}</b></div></a>` : ""}
        ${S.phone ? `<a class="c-card" href="tel:${esc(S.phone.replace(/\s/g, ""))}"><span class="ci">${icon("phone")}</span><div><small>Teléfono</small><b>${esc(S.phone)}</b></div></a>` : ""}
        ${S.location ? `<div class="c-card"><span class="ci">${icon("pin")}</span><div><small>Ubicación</small><b>${esc(S.location)}</b></div></div>` : ""}
      </div>
      ${socialsHtml() ? `<p class="eyebrow" style="margin:2rem 0 1rem">Redes sociales</p><div class="socials">${socialsHtml()}</div>` : ""}
    </div>
    <form class="form-card reveal d1" id="cform">
      <div class="form-grid">
        <div class="f"><label for="n">Nombre completo</label><input id="n" name="name" required maxlength="100" autocomplete="name"></div>
        <div class="f"><label for="e">Correo electrónico</label><input id="e" name="email" type="email" required maxlength="120" autocomplete="email"></div>
        <div class="f"><label for="ph">Teléfono (opcional)</label><input id="ph" name="phone" maxlength="30" autocomplete="tel"></div>
        <div class="f"><label for="s">Asunto</label><input id="s" name="subject" required maxlength="150" value="${esc(q.get("asunto") || "")}"></div>
        <div class="f full"><label for="m">Mensaje</label><textarea id="m" name="message" required maxlength="4000"></textarea></div>
        <input name="website" tabindex="-1" autocomplete="off" style="position:absolute;left:-9999px" aria-hidden="true">
        <div class="full" style="display:flex;justify-content:space-between;align-items:center;gap:1rem;flex-wrap:wrap"><small class="muted">Tu mensaje llega directamente a su panel.</small><button class="btn dark">${icon("arrow")} Enviar mensaje</button></div>
      </div>
    </form>
  </div></section>`;
  $("#cform").onsubmit = async e => {
    e.preventDefault();
    const f = e.target; if (f.website.value) return;
    const btn = $("button", f); btn.disabled = true;
    try {
      await D.add("messages", { name: f.name.value.trim(), email: f.email.value.trim(), phone: f.phone.value.trim(), subject: f.subject.value.trim(), message: f.message.value.trim(), read: false, createdAt: Date.now() });
      f.reset(); toast("¡Mensaje enviado! Gracias por escribir.");
    } catch (err) { console.error(err); toast("No se pudo enviar. Intentá de nuevo.", "err"); }
    btn.disabled = false;
  };
  reveal();
}

async function vSaved() {
  const ids = savedIds();
  const all = await articles();
  const list = ids.map(id => all.find(a => a.id === id)).filter(Boolean);
  view.innerHTML = pageHead("Guardados", "Tus <em>temas</em>", "Los artículos que guardás quedan en este dispositivo para leerlos cuando quieras.") + `
  <section class="sec"><div class="wrap"><div class="cards" id="list">${list.length ? list.map(p => articleCard(p)).join("") : `<div class="empty" style="grid-column:1/-1">${icon("bookmark")}<h3>Aún no guardaste temas</h3><p>Tocá el ícono de marcador en cualquier artículo.</p><a href="#/articulos" class="btn dark" style="margin-top:1rem">Explorar artículos</a></div>`}</div></div></section>`;
  bindSaveButtons(view); reveal();
}

function vNotFound() {
  view.innerHTML = pageHead("404", "Página no <em>encontrada</em>", "El contenido que buscás no existe o fue movido.") + `<section class="sec"><div class="wrap" style="text-align:center"><a href="#/" class="btn dark">Volver al inicio</a></div></section>`;
}

// ───────────── búsqueda ─────────────
async function openSearch() {
  const m = modal({ title: "Buscar", wide: true, body: `<input class="search-in" placeholder="Escribí un tema, palabra o libro…" autofocus><div class="search-res"></div>` });
  const [arts, bks] = await Promise.all([articles(), bookItems()]);
  const inp = $(".search-in", m.el), res = $(".search-res", m.el);
  const draw = () => {
    const t = inp.value.trim().toLowerCase();
    const items = [
      ...arts.filter(a => !t || (a.title + a.excerpt + a.category).toLowerCase().includes(t)).map(a => ({ h: "#/articulos/" + a.id, img: a.cover, k: a.category || "Artículo", t: a.title })),
      ...bks.filter(b => t && (b.title + (b.subtitle || "")).toLowerCase().includes(t)).map(b => ({ h: "#/libros/" + b.id, img: b.cover, k: "Libro", t: b.title }))
    ].slice(0, 8);
    res.innerHTML = items.length ? items.map(i => `<a href="${i.h}">${i.img ? `<img src="${imgThumb(i.img)}" alt="">` : ""}<div><small>${esc(i.k)}</small><b>${esc(i.t)}</b></div></a>`).join("") : `<p class="muted">Sin resultados.</p>`;
    $$("a", res).forEach(a => a.onclick = () => m.close());
  };
  inp.oninput = draw; draw(); setTimeout(() => inp.focus(), 50);
}

// ───────────── layout ─────────────
function renderChrome() {
  $("#brandName").textContent = S.name;
  $("#btnSearch").innerHTML = icon("search");
  $("#btnMenu").innerHTML = icon("menu");
  $(".drawer-x").innerHTML = icon("x");
  updateSavedBadge();
  $("#tabbar").innerHTML = [["", "home", "Inicio"], ["articulos", "article", "Artículos"], ["muro", "wall", "Muro"], ["galeria", "image", "Galería"], ["libros", "book", "Libros"]]
    .map(([r, ic, t]) => `<a href="#/${r}" data-nav="${r}">${icon(ic)}<span>${t}</span></a>`).join("");
  $("#drawerFoot").innerHTML = `<div class="socials">${socialsHtml()}</div>`;
  const [first, rest] = nameParts();
  $("#footer").innerHTML = `<div class="wrap">
    <div class="foot-grid">
      <div><a href="#/" class="brand"><img class="logo lg" src="assets/logo-ma.webp" alt="MA"><span class="brand-text"><b>${esc(S.name)}</b><small>${esc(S.role)}</small></span></a>
        <p style="max-width:42ch;margin:1.2rem 0 1.4rem;font-size:.92rem">${esc(S.currentPosition)}. ${esc(S.currentRank)}.</p><div class="socials">${socialsHtml()}</div></div>
      <div><h5>Explorar</h5><nav><a href="#/trayectoria">Trayectoria</a><a href="#/articulos">Artículos</a><a href="#/muro">Muro</a><a href="#/galeria">Galería</a><a href="#/libros">Libros</a></nav></div>
      <div><h5>Contacto</h5><nav>${S.email ? `<a href="mailto:${esc(S.email)}">${esc(S.email)}</a>` : ""}${waDigits() ? `<a href="${waLink("Hola")}" target="_blank" rel="noopener">WhatsApp</a>` : ""}<a href="#/contacto">Enviar mensaje</a>${S.location ? `<span>${esc(S.location)}</span>` : ""}</nav></div>
    </div>
    <p class="foot-big">${esc(S.name)}</p>
    <div class="foot-bottom"><span>© ${new Date().getFullYear()} ${esc(S.name)}. Todos los derechos reservados.</span><a href="admin.html">Acceso administrativo</a></div>
  </div>`;
}

function renderUser() {
  const u = D.user(), slot = $("#userSlot");
  if (!u) { slot.innerHTML = ""; return; }
  slot.innerHTML = `<button aria-label="Mi cuenta" style="display:grid;padding:4px">${avatar(u.name, u.photo)}</button>`;
  slot.firstChild.onclick = () => {
    const m = modal({ title: "Mi cuenta", body: `<div style="display:flex;gap:1rem;align-items:center">${avatar(u.name, u.photo)}<div><b>${esc(u.name)}</b><br><small class="muted">${esc(u.email || "")}</small></div></div><div class="modal-actions">${u.isAdmin ? `<a href="admin.html" class="btn gold">${icon("settings")} Panel</a>` : ""}<button class="btn ghost" data-out>${icon("logout")} Cerrar sesión</button></div>` });
    $("[data-out]", m.el).onclick = async () => { await D.logout(); m.close(); toast("Sesión cerrada"); };
  };
}

function setNavActive(seg) {
  $$("[data-nav]").forEach(a => a.classList.toggle("on", a.dataset.nav === seg));
  $$(".drawer nav a").forEach(a => a.classList.toggle("on", a.getAttribute("href") === "#/" + seg));
}

function onScroll() {
  $("#nav").classList.toggle("solid", scrollY > 40);
  const rp = $("#readProgress");
  if (location.hash.startsWith("#/articulos/")) {
    const h = document.documentElement.scrollHeight - innerHeight;
    rp.style.width = h > 0 ? (scrollY / h) * 100 + "%" : "0";
  } else rp.style.width = "0";
}

const ROUTES = [
  [/^$/, vHome], [/^trayectoria$/, vAbout], [/^articulos$/, vArticles], [/^articulos\/([^/]+)$/, vArticle],
  [/^muro$/, vWall], [/^muro\/([^/]+)$/, vWallPost], [/^galeria$/, vGallery], [/^libros$/, vBooks], [/^libros\/([^/]+)$/, vBook],
  [/^contacto$/, vContact], [/^guardados$/, vSaved]
];
let lastPath = null;
async function route() {
  const raw = location.hash.replace(/^#\/?/, "");
  const [path, qs] = raw.split("?");
  const q = new URLSearchParams(qs || "");
  refreshers.clear();
  $("#drawer").classList.remove("open");
  document.documentElement.classList.remove("locked");
  setNavActive(path.split("/")[0]);
  if (path !== lastPath) { view.innerHTML = loader(); scrollTo({ top: 0, behavior: "instant" }); }
  lastPath = path;
  for (const [re, fn] of ROUTES) {
    const m = path.match(re);
    if (m) {
      try { await (m[1] ? fn(decodeURIComponent(m[1]), q) : fn(q)); }
      catch (e) { console.error(e); view.innerHTML = pageHead("Error", "Algo salió <em>mal</em>", "No se pudo cargar esta sección. Intentá recargar la página."); }
      view.classList.remove("view-enter"); void view.offsetWidth; view.classList.add("view-enter");
      reveal(); onScroll();
      const titles = { "": "", trayectoria: "Trayectoria", articulos: "Artículos", muro: "Muro", galeria: "Galería", libros: "Libros", contacto: "Contacto", guardados: "Guardados" };
      const t = $(".article-head h1, .book-detail h1")?.textContent || titles[path.split("/")[0]];
      document.title = (t ? t + " · " : "") + S.name + " · " + S.role.split("·").pop().trim();
      return;
    }
  }
  vNotFound();
}

// ───────────── inicio ─────────────
(async function init() {
  await D.ready;
  S = await D.getSettings();
  renderChrome(); renderUser();
  D.onAuth(() => { renderUser(); refreshers.forEach(fn => fn()); });
  $("#btnSearch").onclick = openSearch;
  $("#btnMenu").onclick = () => { $("#drawer").classList.add("open"); document.documentElement.classList.add("locked"); };
  $$("#drawer [data-close]").forEach(b => b.onclick = () => { $("#drawer").classList.remove("open"); document.documentElement.classList.remove("locked"); });
  addEventListener("hashchange", route);
  addEventListener("scroll", onScroll, { passive: true });
  if (D.isDemo() && !sessionStorage.getItem("ma-demo-hide")) {
    const b = document.createElement("div"); b.className = "demo-banner";
    b.innerHTML = `<div><b>Modo demostración.</b> El contenido es de ejemplo. Probá el <a href="admin.html" style="text-decoration:underline">panel de administración</a> (cualquier correo y clave).</div><button aria-label="Cerrar">${icon("x")}</button>`;
    b.querySelector("button").onclick = () => { b.remove(); try { sessionStorage.setItem("ma-demo-hide", "1"); } catch { } };
    document.body.appendChild(b);
    setTimeout(() => b.remove(), 12000);
  }
  route();
})();
