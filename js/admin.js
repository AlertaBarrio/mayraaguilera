import * as D from "./data.js";
import { DEFAULT_TEXTS } from "./seed.js";
import { $, $$, esc, icon, timeAgo, fmtDate, sanitize, toast, modal, confirmBox, lightbox, processImage, avatar, readTime } from "./ui.js";

const root = $("#root");
let S = null, mode = "";
const SECTIONS = [
  ["resumen", "grid", "Resumen"], ["articulos", "article", "Artículos"], ["muro", "wall", "Muro"], ["comentarios", "comment", "Comentarios"],
  ["galeria", "image", "Galería"], ["libros", "book", "Libros"], ["mensajes", "mail", "Mensajes"], ["perfil", "user", "Perfil y trayectoria"], ["textos", "edit", "Textos del sitio"], ["ajustes", "settings", "Ajustes"]
];
const byDate = (a, b) => (b.createdAt || 0) - (a.createdAt || 0);
const thumb = img => esc(img?.thumb || img?.src || "");
const val = (form, n) => (form.elements[n]?.value ?? "").trim();
const toDateInput = ts => { const d = new Date(ts || Date.now()); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 10); };
const fromDateInput = (v, fallback) => { if (!v) return fallback || Date.now(); const [y, m, d] = v.split("-").map(Number); const old = new Date(fallback || Date.now()); return new Date(y, m - 1, d, old.getHours(), old.getMinutes()).getTime(); };
const pickFiles = (multiple = false) => new Promise(res => { const i = document.createElement("input"); i.type = "file"; i.accept = "image/*"; i.multiple = multiple; i.onchange = () => res([...i.files]); i.click(); });
const fail = (e, msg = "Ocurrió un error") => { console.error(e); toast(e?.code === "permission-denied" ? "Sin permisos: revisá que tu usuario esté en la colección admins." : msg, "err"); };

// ───────────── selector de imagen (sube al guardar) ─────────────
function imagePicker(el, current, { cls = "", label = "Subir imagen", full = 1600, thumbSize = 640 } = {}) {
  let state = { existing: current || null, pending: null, removed: null };
  const draw = () => {
    const src = state.pending ? state.pending.thumb : (state.existing ? (state.existing.thumb || state.existing.src) : "");
    el.innerHTML = `<div class="img-pick ${cls}">${src ? `<img src="${esc(src)}" alt=""><button type="button" class="x" aria-label="Quitar">${icon("trash")}</button>` : `<div>${icon("upload")}<b style="display:block;color:var(--text)">${label}</b>Tocá o arrastrá una imagen</div>`}</div>`;
    const box = $(".img-pick", el);
    box.onclick = async e => {
      if (e.target.closest(".x")) { e.stopPropagation(); if (state.existing) state.removed = state.existing; state.existing = null; state.pending = null; draw(); return; }
      const [f] = await pickFiles(); if (f) handle(f);
    };
    box.ondragover = e => { e.preventDefault(); box.classList.add("drag"); };
    box.ondragleave = () => box.classList.remove("drag");
    box.ondrop = e => { e.preventDefault(); box.classList.remove("drag"); const f = e.dataTransfer.files[0]; if (f) handle(f); };
  };
  const handle = async f => {
    $(".img-pick", el).insertAdjacentHTML("beforeend", `<div class="busy"><div class="loader" style="min-height:0"><span></span></div></div>`);
    try { const p = await processImage(f, { full, thumb: thumbSize }); if (state.existing) state.removed = state.existing; state.existing = null; state.pending = p; }
    catch (e) { toast(e.message || "Imagen no válida", "err"); }
    draw();
  };
  draw();
  return {
    async commit() {
      if (state.removed) { await D.removeImage(state.removed); state.removed = null; }
      if (state.pending) { state.existing = await D.saveImage(state.pending); state.pending = null; }
      return state.existing || null;
    },
    get changed() { return !!(state.pending || state.removed); }
  };
}

function multiPicker(el, current = [], max = 10) {
  let items = (current || []).map(x => ({ existing: x }));
  const removed = [];
  const draw = () => {
    el.innerHTML = `<div class="thumbs">${items.map((it, k) => `<div class="t"><img src="${esc(it.pending ? it.pending.thumb : (it.existing.thumb || it.existing.src))}" alt=""><button type="button" data-k="${k}" aria-label="Quitar">${icon("x")}</button></div>`).join("")}${items.length < max ? `<button type="button" class="add" aria-label="Agregar fotos">${icon("plus")}</button>` : ""}</div>`;
    $$("[data-k]", el).forEach(b => b.onclick = () => { const it = items.splice(+b.dataset.k, 1)[0]; if (it.existing) removed.push(it.existing); draw(); });
    const add = $(".add", el);
    if (add) add.onclick = async () => {
      const files = (await pickFiles(true)).slice(0, max - items.length);
      add.innerHTML = `<div class="loader" style="min-height:0"><span style="width:24px;height:24px"></span></div>`;
      for (const f of files) { try { items.push({ pending: await processImage(f) }); } catch (e) { toast(e.message, "err"); } }
      draw();
    };
  };
  draw();
  return {
    async commit() {
      for (const r of removed.splice(0)) await D.removeImage(r);
      const out = [];
      for (const it of items) { if (it.pending) { it.existing = await D.saveImage(it.pending); it.pending = null; } out.push(it.existing); }
      return out;
    },
    get count() { return items.length; },
    reset() { items = []; removed.length = 0; draw(); }
  };
}

// ───────────── editor de texto enriquecido ─────────────
function makeEditor(el, html = "", placeholder = "Escribí aquí el contenido…") {
  el.innerHTML = `<div class="rte"><div class="rte-bar">
    <button type="button" data-cmd="formatBlock" data-v="<h2>" title="Título">H2</button>
    <button type="button" data-cmd="formatBlock" data-v="<h3>" title="Subtítulo">H3</button>
    <button type="button" data-cmd="formatBlock" data-v="<p>" title="Párrafo">¶</button>
    <span class="sep"></span>
    <button type="button" data-cmd="bold" title="Negrita"><b>B</b></button>
    <button type="button" data-cmd="italic" title="Cursiva"><i style="font-family:serif">I</i></button>
    <button type="button" data-cmd="underline" title="Subrayado"><u>U</u></button>
    <span class="sep"></span>
    <button type="button" data-cmd="formatBlock" data-v="<blockquote>" title="Cita">${icon("quote")}</button>
    <button type="button" data-cmd="insertUnorderedList" title="Lista">•≡</button>
    <button type="button" data-cmd="insertOrderedList" title="Lista numerada">1≡</button>
    <button type="button" data-cmd="insertHorizontalRule" title="Separador">—</button>
    <span class="sep"></span>
    <button type="button" data-act="link" title="Enlace">${icon("link")}</button>
    <button type="button" data-act="img" title="Imagen">${icon("image")}</button>
    <button type="button" data-cmd="removeFormat" title="Limpiar formato">Tx</button>
  </div><div class="rte-area prose" contenteditable="true" data-ph="${esc(placeholder)}"></div></div>`;
  const area = $(".rte-area", el);
  area.innerHTML = sanitize(html);
  let range = null;
  const keep = () => { const s = getSelection(); if (s.rangeCount && area.contains(s.anchorNode)) range = s.getRangeAt(0).cloneRange(); };
  const restore = () => { area.focus(); if (range) { const s = getSelection(); s.removeAllRanges(); s.addRange(range); } };
  area.addEventListener("keyup", keep); area.addEventListener("mouseup", keep); area.addEventListener("blur", keep);
  $(".rte-bar", el).addEventListener("mousedown", e => { if (e.target.closest("button")) e.preventDefault(); });
  $(".rte-bar", el).onclick = async e => {
    const b = e.target.closest("button"); if (!b) return;
    restore();
    if (b.dataset.cmd) { document.execCommand(b.dataset.cmd, false, b.dataset.v || null); keep(); return; }
    if (b.dataset.act === "link") { const u = prompt("Dirección del enlace (https://…)"); if (u) { restore(); document.execCommand("createLink", false, /^https?:|^mailto:/.test(u) ? u : "https://" + u); } }
    if (b.dataset.act === "img") {
      const [f] = await pickFiles(); if (!f) return;
      try { const p = await processImage(f, { full: 1400, thumb: 10 }); restore(); document.execCommand("insertHTML", false, `<figure><img src="${p.full}" alt=""></figure><p><br></p>`); }
      catch (err) { toast(err.message, "err"); }
    }
  };
  area.addEventListener("paste", e => {
    const h = e.clipboardData.getData("text/html"), t = e.clipboardData.getData("text/plain");
    e.preventDefault();
    if (h) document.execCommand("insertHTML", false, sanitize(h.replace(/<(\/?)(h1)/gi, "<$1h2")));
    else document.execCommand("insertText", false, t);
  });
  return { html: () => sanitize(area.innerHTML), text: () => area.innerText.trim() };
}

// ───────────── login ─────────────
function loginView(msg = "") {
  mode = "login";
  root.innerHTML = `<div class="login"><div class="hero-grid"></div><div class="orb o1"></div><div class="orb o2"></div>
    <form class="login-card glass" id="lf">
      <img class="logo login-logo" src="assets/logo-ma.webp" alt="MA">
      <h1>Panel de administración</h1>
      <p>Ingresá para gestionar el contenido del sitio.</p>
      ${D.isDemo() ? `<div class="f"><label for="em">Correo</label><input id="em" name="email" type="email" required autocomplete="username"></div>
      <div class="f"><label for="pw">Contraseña</label><input id="pw" name="pass" type="password" required autocomplete="current-password"></div>
      <button class="btn gold">Ingresar ${icon("arrow")}</button>
      <div class="or"><span>o</span></div>
      <button type="button" class="btn ghost-light" id="gbtn" style="margin-top:0">${icon("user")} Ingresar con Google</button>` : `<button type="button" class="btn gold" id="gbtn" style="margin-top:.5rem">${icon("user")} Ingresar con Google</button>`}
      <div class="login-err">${esc(msg)}</div>
      ${D.isDemo() ? `<div class="login-note"><b>Modo demostración:</b> escribí cualquier correo y contraseña para explorar el panel. Los cambios solo se guardan en este navegador.</div>` : ""}
      <a href="./" class="login-back">${icon("left")} Volver al sitio</a>
    </form></div>`;
  $("#gbtn").onclick = async () => { $(".login-err").textContent = ""; try { await D.loginVisitor(); } catch (err) { if (err?.code !== "auth/popup-closed-by-user") $(".login-err").textContent = "No se pudo ingresar con Google."; } };
  $("#lf").onsubmit = async e => {
    e.preventDefault();
    const btn = $("button", e.target); btn.disabled = true; $(".login-err").textContent = "";
    try { await D.loginAdmin(e.target.email.value.trim(), e.target.pass.value); }
    catch (err) {
      const m = { "auth/invalid-credential": "Correo o contraseña incorrectos.", "auth/wrong-password": "Correo o contraseña incorrectos.", "auth/user-not-found": "Correo o contraseña incorrectos.", "auth/too-many-requests": "Demasiados intentos. Esperá unos minutos." }[err.code] || err.message || "No se pudo ingresar.";
      $(".login-err").textContent = m; btn.disabled = false;
    }
  };
}

function notAdminView() {
  mode = "noadmin";
  const u = D.user();
  root.innerHTML = `<div class="login"><div class="hero-grid"></div><div class="login-card glass"><img class="logo login-logo" src="assets/logo-ma.webp" alt="MA"><h1>Acceso restringido</h1>
    <p>La cuenta <b>${esc(u.email || u.name)}</b> no tiene permisos de administración.</p>
    <p style="font-size:.8rem">UID de esta cuenta (para habilitarla en Firestore → colección <code>admins</code>):<br><code style="color:var(--gold-2);word-break:break-all">${esc(u.uid)}</code></p>
    <button class="btn gold" id="out">${icon("logout")} Cerrar sesión</button><a href="./" class="login-back">${icon("left")} Volver al sitio</a></div></div>`;
  $("#out").onclick = () => D.logout();
}

// ───────────── estructura ─────────────
function shell() {
  mode = "app";
  const u = D.user();
  root.innerHTML = `<div class="adm" id="adm">
    <aside class="side">
      <a href="./" class="brand"><img class="logo" src="assets/logo-ma.webp" alt="MA"><span class="brand-text"><b>${esc(S.name)}</b><small>Panel</small></span></a>
      <nav>${SECTIONS.map(([k, ic, t], i) => `${i === 7 ? '<div class="side-sep">Sitio</div>' : ""}<a href="#${k}" data-s="${k}">${icon(ic)}<span>${t}</span>${k === "comentarios" || k === "mensajes" ? `<span class="cnt" data-cnt="${k}" hidden></span>` : ""}</a>`).join("")}</nav>
      <div class="side-foot">
        <div class="side-user">${avatar(S.name, S.photo?.avatar || S.photo?.thumb || S.photo?.src)}<div><b>${esc(S.name)}</b><small>${esc(u.email || "")}</small></div></div>
        <a href="./" target="_blank">${icon("eye")} Ver sitio</a>
        <button id="logout">${icon("logout")} Cerrar sesión</button>
      </div>
    </aside>
    <div class="side-back" id="sideBack"></div>
    <div class="main">
      <header class="topbar"><button class="icon-btn menu-btn" id="menuBtn" aria-label="Menú">${icon("menu")}</button><h2 id="ttl"></h2><span class="sp"></span><div id="tact"></div></header>
      <div class="content" id="content"></div>
    </div></div>`;
  $("#logout").onclick = async () => { await D.logout(); };
  $("#menuBtn").onclick = () => $("#adm").classList.add("menu");
  $("#sideBack").onclick = () => $("#adm").classList.remove("menu");
  route();
}

async function refreshBadges() {
  try {
    const [pc, um] = await Promise.all([D.count("comments", [["approved", "==", false]]), D.count("messages", [["read", "==", false]])]);
    [["comentarios", pc], ["mensajes", um]].forEach(([k, n]) => { const b = $(`[data-cnt="${k}"]`); if (b) { b.hidden = !n; b.textContent = n; } });
  } catch { }
}

function setTop(title, actions = "") { $("#ttl").textContent = title; $("#tact").innerHTML = actions; }
const C = () => $("#content");

const VIEWS = {};
async function route() {
  if (mode !== "app") return;
  const [sec, sub] = (location.hash.slice(1) || "resumen").split("/");
  $$(".side nav a").forEach(a => a.classList.toggle("on", a.dataset.s === sec));
  $("#adm").classList.remove("menu");
  $$(".modal.in [data-close]").forEach(b => b.click());
  C().innerHTML = `<div class="loader" style="min-height:40vh"><span></span></div>`;
  scrollTo(0, 0);
  try { await (VIEWS[sec] || VIEWS.resumen)(sub ? decodeURIComponent(sub) : undefined); }
  catch (e) { fail(e, "No se pudo cargar la sección"); C().innerHTML = `<div class="panel list-empty">No se pudo cargar esta sección. ${esc(e.message || "")}</div>`; }
  refreshBadges();
}

const demoNote = () => D.isDemo() ? `<div class="demo-note">${icon("star")}<div><b>Modo demostración.</b> Todo funciona, pero los cambios se guardan solo en este navegador. Cuando conectes Firebase (ver README) el contenido quedará publicado para todos.</div></div>` : "";

// ───────────── RESUMEN ─────────────
VIEWS.resumen = async () => {
  setTop("Resumen", `<a href="#articulos/nuevo" class="btn gold sm">${icon("plus")}<span>Nuevo artículo</span></a>`);
  const [posts, gal, books, comments, msgs] = await Promise.all([D.list("posts"), D.list("gallery"), D.list("books"), D.list("comments"), D.list("messages")]);
  const arts = posts.filter(p => p.type === "article"), wall = posts.filter(p => p.type === "wall");
  C().innerHTML = demoNote() + `
  <div class="kpis">
    <a class="kpi" href="#articulos">${icon("article")}<b>${arts.length}</b><span>Artículos</span></a>
    <a class="kpi" href="#muro">${icon("wall")}<b>${wall.length}</b><span>Publicaciones del muro</span></a>
    <a class="kpi" href="#comentarios">${icon("comment")}<b>${comments.length}</b><span>Comentarios · ${comments.filter(c => !c.approved).length} pendientes</span></a>
    <a class="kpi" href="#mensajes">${icon("mail")}<b>${msgs.filter(m => !m.read).length}</b><span>Mensajes sin leer</span></a>
  </div>
  <div class="panel" style="margin-bottom:1.2rem"><h3>Acciones rápidas</h3><div class="quick">
    <a href="#articulos/nuevo" class="btn dark sm">${icon("article")} Escribir artículo</a>
    <a href="#muro" class="btn ghost sm">${icon("wall")} Publicar en el muro</a>
    <a href="#galeria" class="btn ghost sm">${icon("image")} Subir fotos (${gal.length})</a>
    <a href="#libros/nuevo" class="btn ghost sm">${icon("book")} Agregar libro (${books.length})</a>
    <a href="#perfil" class="btn ghost sm">${icon("user")} Editar perfil</a>
  </div></div>
  <div class="two">
    <div class="panel"><h3>Últimos comentarios <a href="#comentarios" class="link-arrow" style="font-size:.8rem">Ver todos ${icon("arrow")}</a></h3><div class="rows">${comments.sort(byDate).slice(0, 5).map(c => `<div class="row">${avatar(c.name, c.photo)}<div class="grow"><b>${esc(c.name)} ${!c.approved ? '<span class="st pend">Pendiente</span>' : ""}</b><small>${esc(c.text.slice(0, 90))}${c.text.length > 90 ? "…" : ""}</small></div></div>`).join("") || '<div class="list-empty">Sin comentarios todavía.</div>'}</div></div>
    <div class="panel"><h3>Últimos mensajes <a href="#mensajes" class="link-arrow" style="font-size:.8rem">Ver todos ${icon("arrow")}</a></h3><div class="rows">${msgs.sort(byDate).slice(0, 5).map(m => `<div class="row ${m.read ? "" : "unread"}"><div class="grow"><b>${esc(m.subject || "(sin asunto)")}</b><small>${esc(m.name)} · ${timeAgo(m.createdAt)}</small></div></div>`).join("") || '<div class="list-empty">Sin mensajes todavía.</div>'}</div></div>
  </div>`;
};

// ───────────── ARTÍCULOS ─────────────
VIEWS.articulos = async sub => {
  if (sub) return articleEditor(sub === "nuevo" ? null : sub);
  setTop("Artículos", `<a href="#articulos/nuevo" class="btn gold sm">${icon("plus")}<span>Nuevo artículo</span></a>`);
  const all = (await D.list("posts")).filter(p => p.type === "article").sort(byDate);
  C().innerHTML = demoNote() + `<div class="panel"><h3>Todos los artículos <small>${all.length}</small></h3><div class="rows">${all.map(p => `
    <div class="row">${p.cover ? `<img class="th" src="${thumb(p.cover)}" alt="">` : `<span class="th"></span>`}
      <div class="grow"><b>${esc(p.title || "(sin título)")}</b><small>${esc(p.category || "Sin tema")} · ${fmtDate(p.createdAt)}${p.featured ? " · ★ Destacado" : ""}</small></div>
      <span class="st ${p.published ? "pub" : "draft"}">${p.published ? "Publicado" : "Borrador"}</span>
      <div class="acts"><a class="icon-btn" href="./#/articulos/${p.id}" target="_blank" title="Ver">${icon("eye")}</a><a class="icon-btn" href="#articulos/${p.id}" title="Editar">${icon("edit")}</a><button class="icon-btn del" data-del="${p.id}" title="Eliminar">${icon("trash")}</button></div>
    </div>`).join("") || `<div class="list-empty">Aún no hay artículos. <a href="#articulos/nuevo" style="color:var(--gold)">Escribí el primero</a>.</div>`}</div></div>`;
  $$("[data-del]").forEach(b => b.onclick = () => deletePost(all.find(p => p.id === b.dataset.del)));
};

async function deletePost(p) {
  if (!(await confirmBox("¿Eliminar esta publicación? También se borrarán sus comentarios. Esta acción no se puede deshacer."))) return;
  try {
    await D.removeImage(p.cover);
    for (const im of p.images || []) await D.removeImage(im);
    const cs = await D.list("comments", [["postId", "==", p.id]]).catch(() => []);
    for (const c of cs) await D.remove("comments", c.id);
    if (p.type === "article") await D.remove("bodies", p.id).catch(() => { });
    await D.remove("posts", p.id);
    toast("Eliminado"); route();
  } catch (e) { fail(e, "No se pudo eliminar"); }
}

async function articleEditor(id) {
  const p = id ? await D.get("posts", id) : null;
  if (id && !p) { toast("No encontrado", "err"); location.hash = "articulos"; return; }
  const body = id ? (await D.get("bodies", id).catch(() => null))?.content || "" : "";
  const cats = [...new Set([...(S.categories || []), p?.category].filter(Boolean))];
  setTop(p ? "Editar artículo" : "Nuevo artículo", `<a href="#articulos" class="btn ghost sm">${icon("left")}<span>Volver</span></a>`);
  C().innerHTML = `<form id="af" class="editor-layout">
    <div class="panel">
      <textarea class="title-in" name="title" rows="1" placeholder="Título del artículo" required>${esc(p?.title || "")}</textarea>
      <div class="f" style="margin:1rem 0 1.2rem"><label>Resumen (aparece en las tarjetas)</label><textarea name="excerpt" rows="2" style="min-height:70px" maxlength="320" placeholder="Una o dos frases que inviten a leer…">${esc(p?.excerpt || "")}</textarea></div>
      <div id="ed"></div>
    </div>
    <div class="editor-side">
      <div class="panel"><h3>Publicación</h3>
        <div style="display:grid;gap:1rem">
          <label class="switch"><input type="checkbox" name="published" ${p ? (p.published ? "checked" : "") : "checked"}> Publicado (visible al público)</label>
          <label class="switch"><input type="checkbox" name="featured" ${p?.featured ? "checked" : ""}> Destacado</label>
          <div class="f"><label>Tema / rama del Derecho</label><input name="category" list="catlist" value="${esc(p?.category || cats[0] || "")}" placeholder="Ej. Derecho Penal"><datalist id="catlist">${cats.map(c => `<option value="${esc(c)}">`).join("")}</datalist></div>
          <div class="f"><label>Fecha</label><input type="date" name="date" value="${toDateInput(p?.createdAt)}"></div>
        </div>
      </div>
      <div class="panel"><h3>Imagen de portada</h3><div id="cov"></div></div>
      <div class="panel" style="display:grid;gap:.6rem">
        <button class="btn gold">${icon("check")} Guardar</button>
        ${p ? `<a class="btn ghost" href="./#/articulos/${p.id}" target="_blank">${icon("eye")} Ver en el sitio</a><button type="button" class="btn ghost" id="delA" style="color:var(--danger)">${icon("trash")} Eliminar</button>` : ""}
      </div>
    </div></form>`;
  const ed = makeEditor($("#ed"), body);
  const cov = imagePicker($("#cov"), p?.cover, { label: "Subir portada" });
  const f = $("#af"), ti = f.title;
  const fit = () => { ti.style.height = "auto"; ti.style.height = ti.scrollHeight + "px"; }; ti.oninput = fit; fit();
  if (p) $("#delA").onclick = () => deletePost(p).then(() => { location.hash = "articulos"; });
  f.onsubmit = async e => {
    e.preventDefault();
    const content = ed.html();
    if (content.length > 950000) { toast("El artículo es demasiado pesado: usá menos imágenes dentro del texto.", "err"); return; }
    const btn = $("button.btn.gold", f); btn.disabled = true; btn.innerHTML = "Guardando…";
    try {
      const text = ed.text();
      const data = {
        type: "article", title: val(f, "title"), excerpt: val(f, "excerpt") || text.slice(0, 220) + (text.length > 220 ? "…" : ""),
        category: val(f, "category"), published: f.published.checked, featured: f.featured.checked,
        cover: await cov.commit(), readMin: readTime(content), createdAt: fromDateInput(f.date.value, p?.createdAt), updatedAt: Date.now()
      };
      let pid = p?.id;
      if (pid) await D.update("posts", pid, data); else pid = await D.add("posts", data);
      await D.set("bodies", pid, { content });
      if (data.category && !(S.categories || []).includes(data.category)) { S.categories = [...(S.categories || []), data.category]; await D.set("settings", "site", { categories: S.categories }, true); }
      toast("Artículo guardado");
      location.hash = "articulos/" + pid;
      if (pid === p?.id) route();
    } catch (err) { fail(err, "No se pudo guardar"); btn.disabled = false; btn.innerHTML = icon("check") + " Guardar"; }
  };
}

// ───────────── MURO ─────────────
function wallComposer(el, p, onDone) {
  el.innerHTML = `<form class="composer">
    <div style="display:flex;gap:.9rem">${avatar(S.name, S.photo?.avatar || S.photo?.thumb || S.photo?.src)}<textarea name="text" placeholder="¿Qué querés compartir hoy?" maxlength="5000">${esc(p?.text || "")}</textarea></div>
    <div data-imgs style="margin-top:.8rem"></div>
    <div class="composer-foot">
      <div style="display:flex;gap:1.2rem;flex-wrap:wrap"><label class="switch"><input type="checkbox" name="pinned" ${p?.pinned ? "checked" : ""}> Fijar arriba</label><label class="switch"><input type="checkbox" name="published" ${p ? (p.published ? "checked" : "") : "checked"}> Visible</label></div>
      <button class="btn gold sm">${icon("check")} ${p ? "Guardar cambios" : "Publicar"}</button>
    </div></form>`;
  const mp = multiPicker($("[data-imgs]", el), p?.images || [], 10);
  const f = $("form", el);
  f.onsubmit = async e => {
    e.preventDefault();
    const text = f.text.value.trim();
    if (!text && !mp.count) { toast("Escribí algo o agregá fotos", "err"); return; }
    const btn = $("button.btn", f); btn.disabled = true;
    try {
      const data = { type: "wall", text, images: await mp.commit(), pinned: f.pinned.checked, published: f.published.checked, updatedAt: Date.now() };
      if (p) await D.update("posts", p.id, data); else await D.add("posts", { ...data, createdAt: Date.now() });
      toast(p ? "Publicación actualizada" : "¡Publicado en el muro!");
      onDone && onDone();
    } catch (err) { fail(err, "No se pudo publicar"); btn.disabled = false; }
  };
}

VIEWS.muro = async () => {
  setTop("Muro", `<a href="./#/muro" target="_blank" class="btn ghost sm">${icon("eye")}<span>Ver muro</span></a>`);
  const all = (await D.list("posts")).filter(p => p.type === "wall").sort(byDate);
  C().innerHTML = demoNote() + `<div class="panel" id="comp"></div>
    <div class="panel"><h3>Publicaciones <small>${all.length}</small></h3><div class="rows">${all.map(p => `
      <div class="row">${p.images?.[0] ? `<img class="th" src="${thumb(p.images[0])}" alt="">` : `<span class="th" style="display:grid;place-items:center;color:var(--gold)">${icon("wall")}</span>`}
        <div class="grow"><div class="wall-row-text">${esc(p.text || "(solo fotos)")}</div><small>${timeAgo(p.createdAt)} · ${p.images?.length || 0} foto(s)${p.pinned ? " · 📌 Fijada" : ""}</small></div>
        <span class="st ${p.published ? "pub" : "draft"}">${p.published ? "Visible" : "Oculta"}</span>
        <div class="acts"><button class="icon-btn" data-pin="${p.id}" title="${p.pinned ? "Desfijar" : "Fijar"}">${icon("pinTop")}</button><button class="icon-btn" data-ed="${p.id}" title="Editar">${icon("edit")}</button><button class="icon-btn del" data-del="${p.id}" title="Eliminar">${icon("trash")}</button></div>
      </div>`).join("") || '<div class="list-empty">Aún no hay publicaciones en el muro.</div>'}</div></div>`;
  wallComposer($("#comp"), null, route);
  $$("[data-del]").forEach(b => b.onclick = () => deletePost(all.find(p => p.id === b.dataset.del)));
  $$("[data-pin]").forEach(b => b.onclick = async () => { const p = all.find(x => x.id === b.dataset.pin); try { await D.update("posts", p.id, { pinned: !p.pinned }); route(); } catch (e) { fail(e); } });
  $$("[data-ed]").forEach(b => b.onclick = () => { const p = all.find(x => x.id === b.dataset.ed); const m = modal({ title: "Editar publicación", wide: true }); wallComposer(m.body, p, () => { m.close(); route(); }); });
};

// ───────────── COMENTARIOS ─────────────
VIEWS.comentarios = async (filter = "todos") => {
  setTop("Comentarios");
  const all = (await D.list("comments")).sort(byDate);
  const posts = await D.list("posts");
  const pend = all.filter(c => !c.approved);
  const list = filter === "pendientes" ? pend : all;
  const link = c => { const p = posts.find(x => x.id === c.postId); return p ? `./#/${p.type === "wall" ? "muro" : "articulos"}/${p.id}` : "./"; };
  C().innerHTML = `<div class="tabs"><a href="#comentarios" class="chip ${filter !== "pendientes" ? "on" : ""}">Todos · ${all.length}</a><a href="#comentarios/pendientes" class="chip ${filter === "pendientes" ? "on" : ""}">Pendientes · ${pend.length}</a></div>
  <div class="panel"><div class="rows">${list.map(c => `
    <div class="row" style="align-items:flex-start">${avatar(c.name, c.photo)}
      <div class="grow"><b style="-webkit-line-clamp:1">${esc(c.name)} ${c.isAdmin ? '<span class="c-badge">Autora</span>' : ""} ${!c.approved ? '<span class="st pend">Pendiente</span>' : ""}</b>
        <p class="comment-text">${esc(c.text)}</p>
        <small>${timeAgo(c.createdAt)} · en <a href="${link(c)}" target="_blank" style="color:var(--gold)">${esc(c.postTitle || "publicación")}</a></small>
        <div class="reply-box" data-rb="${c.id}" hidden><input placeholder="Escribí tu respuesta…" maxlength="2000"><button class="btn dark sm" data-send="${c.id}">Responder</button></div>
      </div>
      <div class="acts">${!c.approved ? `<button class="icon-btn" data-ok="${c.id}" title="Aprobar" style="color:var(--ok)">${icon("check")}</button>` : ""}${!c.isAdmin ? `<button class="icon-btn" data-rep="${c.id}" title="Responder">${icon("comment")}</button>` : ""}<button class="icon-btn del" data-del="${c.id}" title="Eliminar">${icon("trash")}</button></div>
    </div>`).join("") || '<div class="list-empty">No hay comentarios aquí.</div>'}</div></div>`;
  $$("[data-ok]").forEach(b => b.onclick = async () => { try { await D.update("comments", b.dataset.ok, { approved: true }); toast("Comentario aprobado"); route(); } catch (e) { fail(e); } });
  $$("[data-del]").forEach(b => b.onclick = async () => { if (!(await confirmBox("¿Eliminar este comentario?"))) return; try { await D.remove("comments", b.dataset.del); toast("Comentario eliminado"); route(); } catch (e) { fail(e); } });
  $$("[data-rep]").forEach(b => b.onclick = () => { const r = $(`[data-rb="${b.dataset.rep}"]`); r.hidden = !r.hidden; if (!r.hidden) $("input", r).focus(); });
  $$("[data-send]").forEach(b => b.onclick = async () => {
    const c = all.find(x => x.id === b.dataset.send), inp = $(`[data-rb="${c.id}"] input`), text = inp.value.trim(); if (!text) return;
    b.disabled = true;
    try {
      if (!c.approved) await D.update("comments", c.id, { approved: true });
      await D.add("comments", { postId: c.postId, postTitle: c.postTitle || "", uid: D.user().uid, name: S.name, photo: null, text: `@${c.name} ${text}`, approved: true, isAdmin: true, createdAt: Date.now() });
      toast("Respuesta publicada"); route();
    } catch (e) { fail(e); b.disabled = false; }
  });
};

// ───────────── GALERÍA ─────────────
VIEWS.galeria = async () => {
  setTop("Galería", `<a href="./#/galeria" target="_blank" class="btn ghost sm">${icon("eye")}<span>Ver galería</span></a>`);
  const all = (await D.list("gallery")).sort(byDate);
  const albums = [...new Set(all.map(g => g.album).filter(Boolean))];
  C().innerHTML = demoNote() + `<div class="panel">
    <div class="fgrid" style="margin-bottom:1rem"><div class="f"><label>Álbum para las fotos nuevas</label><input id="alb" list="albl" placeholder="Ej. Conferencias" value="${esc(albums[0] || "")}"><datalist id="albl">${albums.map(a => `<option value="${esc(a)}">`).join("")}</datalist></div>
    <div class="f"><label>Descripción (opcional, se aplica a todas)</label><input id="cap" placeholder="Ej. Conferencia en la UNICAH"></div></div>
    <div class="drop" id="drop">${icon("upload")}<b>Subí tus fotos</b><small>Tocá aquí o arrastrá varias imágenes a la vez. Se optimizan automáticamente.</small><div class="prog" hidden><i></i></div></div>
  </div>
  <div class="panel"><h3>Fotos <small>${all.length}</small></h3><div class="ggrid">${all.map((g, i) => `
    <div class="gcard"><div class="gi" data-i="${i}"><img src="${thumb(g.image)}" alt="" loading="lazy"></div>
      <div class="gb"><input data-f="caption" data-id="${g.id}" value="${esc(g.caption || "")}" placeholder="Descripción"><input data-f="album" data-id="${g.id}" value="${esc(g.album || "")}" placeholder="Álbum" list="albl">
      <div class="ga"><small>${fmtDate(g.createdAt)}</small><button class="icon-btn del" data-del="${g.id}" title="Eliminar" style="width:34px;height:34px">${icon("trash")}</button></div></div></div>`).join("") || '<div class="list-empty" style="grid-column:1/-1">Aún no hay fotos.</div>'}</div></div>`;
  const drop = $("#drop"), prog = $(".prog", drop), bar = $("i", prog);
  const upload = async files => {
    files = files.filter(f => f.type.startsWith("image/")); if (!files.length) return;
    prog.hidden = false; let done = 0;
    const album = $("#alb").value.trim(), caption = $("#cap").value.trim();
    for (const f of files) {
      try { const p = await processImage(f); const image = await D.saveImage(p); await D.add("gallery", { album, caption, image, createdAt: Date.now() }); }
      catch (e) { fail(e, `No se pudo subir ${f.name}`); }
      done++; bar.style.width = (done / files.length * 100) + "%";
    }
    toast(`${done} foto(s) subida(s)`); route();
  };
  drop.onclick = async () => upload(await pickFiles(true));
  drop.ondragover = e => { e.preventDefault(); drop.classList.add("drag"); };
  drop.ondragleave = () => drop.classList.remove("drag");
  drop.ondrop = e => { e.preventDefault(); drop.classList.remove("drag"); upload([...e.dataTransfer.files]); };
  $$("[data-f]").forEach(inp => inp.onchange = async () => { try { await D.update("gallery", inp.dataset.id, { [inp.dataset.f]: inp.value.trim() }); toast("Guardado"); } catch (e) { fail(e); } });
  $$(".gi").forEach(el => el.onclick = () => lightbox(all.map(g => ({ img: g.image, title: g.album, caption: g.caption })), +el.dataset.i));
  $$("[data-del]").forEach(b => b.onclick = async () => {
    if (!(await confirmBox("¿Eliminar esta foto de la galería?"))) return;
    const g = all.find(x => x.id === b.dataset.del);
    try { await D.removeImage(g.image); await D.remove("gallery", g.id); toast("Foto eliminada"); route(); } catch (e) { fail(e); }
  });
};

// ───────────── LIBROS ─────────────
VIEWS.libros = async sub => {
  setTop("Libros", `<a href="#libros/nuevo" class="btn gold sm">${icon("plus")}<span>Nuevo libro</span></a>`);
  const all = (await D.list("books")).sort((a, b) => (+a.order || 99) - (+b.order || 99));
  C().innerHTML = demoNote() + `<div class="panel"><h3>Catálogo <small>${all.length}</small></h3><div class="rows">${all.map(b => `
    <div class="row">${b.cover ? `<img class="th" src="${thumb(b.cover)}" style="width:44px;height:64px" alt="">` : `<span class="th" style="width:44px;height:64px"></span>`}
      <div class="grow"><b>${esc(b.title)}</b><small>${b.price ? esc((b.currency || "L") + " " + b.price) + " · " : ""}${esc(b.year || "")}${b.buyUrl ? " · enlace de compra ✓" : ""}</small></div>
      <span class="st ${b.status === "disponible" ? "pub" : b.status === "preventa" ? "pend" : "draft"}">${esc(b.status || "")}</span>
      <div class="acts"><a class="icon-btn" href="./#/libros/${b.id}" target="_blank">${icon("eye")}</a><a class="icon-btn" href="#libros/${b.id}">${icon("edit")}</a><button class="icon-btn del" data-del="${b.id}">${icon("trash")}</button></div>
    </div>`).join("") || '<div class="list-empty">Aún no hay libros.</div>'}</div></div>`;
  $$("[data-del]").forEach(btn => btn.onclick = async () => {
    if (!(await confirmBox("¿Eliminar este libro?"))) return;
    const b = all.find(x => x.id === btn.dataset.del);
    try { await D.removeImage(b.cover); await D.remove("books", b.id); toast("Libro eliminado"); route(); } catch (e) { fail(e); }
  });
  if (sub) bookEditor(sub === "nuevo" ? null : all.find(b => b.id === sub));
};

function bookEditor(b) {
  const m = modal({ title: b ? "Editar libro" : "Nuevo libro", wide: true, onClose: () => { if (location.hash.includes("/")) history.replaceState(null, "", "#libros"); } });
  m.body.innerHTML = `<form id="bf"><div class="editor-layout" style="grid-template-columns:200px 1fr">
    <div><div id="bcov"></div><small class="muted" style="display:block;margin-top:.5rem;font-size:.74rem">Portada vertical (proporción 2:3)</small></div>
    <div class="fgrid">
      <div class="f full"><label>Título</label><input name="title" required value="${esc(b?.title || "")}"></div>
      <div class="f full"><label>Subtítulo</label><input name="subtitle" value="${esc(b?.subtitle || "")}"></div>
      <div class="f full"><label>Sinopsis / descripción</label><textarea name="description" rows="5">${esc(b?.description || "")}</textarea></div>
      <div class="f"><label>Precio</label><input name="price" inputmode="decimal" value="${esc(b?.price || "")}" placeholder="450"></div>
      <div class="f"><label>Moneda</label><select name="currency">${["L", "US$", "€"].map(c => `<option ${b?.currency === c ? "selected" : ""}>${c}</option>`).join("")}</select></div>
      <div class="f"><label>Estado</label><select name="status">${[["disponible", "Disponible"], ["preventa", "Preventa"], ["proximamente", "Próximamente"], ["agotado", "Agotado"]].map(([v, t]) => `<option value="${v}" ${b?.status === v ? "selected" : ""}>${t}</option>`).join("")}</select></div>
      <div class="f"><label>Orden en el catálogo</label><input name="order" type="number" value="${esc(b?.order ?? "")}" placeholder="1"></div>
      <div class="f"><label>Año</label><input name="year" value="${esc(b?.year || "")}"></div>
      <div class="f"><label>Páginas</label><input name="pages" value="${esc(b?.pages || "")}"></div>
      <div class="f"><label>ISBN (opcional)</label><input name="isbn" value="${esc(b?.isbn || "")}"></div>
      <div class="f full"><label>Enlace de compra (opcional)</label><input name="buyUrl" type="url" value="${esc(b?.buyUrl || "")}" placeholder="https://…"><span class="hint">PayPal, Hotmart, Amazon, link de pago de tu banco, etc. Si lo dejás vacío se ofrece pedir por WhatsApp (configurado en Ajustes).</span></div>
    </div></div>
    <div class="form-actions"><button type="button" class="btn ghost" data-cancel>Cancelar</button><button class="btn gold">${icon("check")} Guardar libro</button></div></form>`;
  const cov = imagePicker($("#bcov", m.body), b?.cover, { cls: "book", label: "Portada", full: 1200, thumbSize: 600 });
  $("[data-cancel]", m.body).onclick = m.close;
  $("#bf", m.body).onsubmit = async e => {
    e.preventDefault();
    const f = e.target, btn = $("button.gold", f); btn.disabled = true;
    try {
      const data = { title: val(f, "title"), subtitle: val(f, "subtitle"), description: val(f, "description"), price: val(f, "price"), currency: val(f, "currency"), status: val(f, "status"), order: +val(f, "order") || 99, year: val(f, "year"), pages: val(f, "pages"), isbn: val(f, "isbn"), buyUrl: val(f, "buyUrl"), cover: await cov.commit(), updatedAt: Date.now() };
      if (b) await D.update("books", b.id, data); else await D.add("books", { ...data, createdAt: Date.now() });
      toast("Libro guardado"); m.close(); route();
    } catch (err) { fail(err, "No se pudo guardar"); btn.disabled = false; }
  };
}

// ───────────── MENSAJES ─────────────
VIEWS.mensajes = async () => {
  setTop("Mensajes");
  const all = (await D.list("messages")).sort(byDate);
  C().innerHTML = `<div class="panel"><h3>Bandeja de entrada <small>${all.filter(m => !m.read).length} sin leer</small></h3><div class="rows">${all.map(m => `
    <div class="row ${m.read ? "" : "unread"}" style="cursor:pointer" data-open="${m.id}">${avatar(m.name)}
      <div class="grow"><b>${esc(m.subject || "(sin asunto)")}</b><small>${esc(m.name)} · ${esc(m.email)} · ${timeAgo(m.createdAt)}</small></div>
      <div class="acts"><button class="icon-btn del" data-del="${m.id}">${icon("trash")}</button></div></div>`).join("") || '<div class="list-empty">No hay mensajes. Los mensajes del formulario de contacto aparecerán aquí.</div>'}</div></div>`;
  $$("[data-del]").forEach(b => b.onclick = async e => { e.stopPropagation(); if (!(await confirmBox("¿Eliminar este mensaje?"))) return; try { await D.remove("messages", b.dataset.del); toast("Mensaje eliminado"); route(); } catch (err) { fail(err); } });
  $$("[data-open]").forEach(r => r.onclick = async () => {
    const msg = all.find(x => x.id === r.dataset.open);
    if (!msg.read) { D.update("messages", msg.id, { read: true }).then(refreshBadges).catch(() => { }); r.classList.remove("unread"); msg.read = true; }
    const mm = modal({ title: msg.subject || "Mensaje", wide: true, body: `<p style="margin:0"><b>${esc(msg.name)}</b> · <a href="mailto:${esc(msg.email)}" style="color:var(--gold)">${esc(msg.email)}</a>${msg.phone ? ` · ${esc(msg.phone)}` : ""}</p><small class="muted">${fmtDate(msg.createdAt)}</small><div class="msg-body">${esc(msg.message)}</div>
      <div class="modal-actions"><a class="btn gold" href="mailto:${esc(msg.email)}?subject=${encodeURIComponent("Re: " + (msg.subject || ""))}">${icon("mail")} Responder por correo</a>${msg.phone ? `<a class="btn ghost" target="_blank" href="https://wa.me/${esc(msg.phone.replace(/\D/g, ""))}">${icon("whatsapp")} WhatsApp</a>` : ""}</div>` });
  });
};

// ───────────── PERFIL ─────────────
VIEWS.perfil = async () => {
  setTop("Perfil y trayectoria");
  S = await D.getSettings();
  C().innerHTML = demoNote() + `<form id="pf">
    <div class="editor-layout">
      <div class="panel"><h3>Datos principales</h3><div class="fgrid">
        <div class="f"><label>Nombre que se muestra</label><input name="name" required value="${esc(S.name)}"></div>
        <div class="f"><label>Nombre completo</label><input name="fullName" value="${esc(S.fullName)}"></div>
        <div class="f full"><label>Título profesional</label><input name="role" value="${esc(S.role)}"><span class="hint">Usá « · » para separar, ej. Abogada · Doctora en Ciencias Penales</span></div>
        <div class="f"><label>Cargo actual</label><input name="currentPosition" value="${esc(S.currentPosition)}"></div>
        <div class="f"><label>Detalle del cargo</label><input name="currentRank" value="${esc(S.currentRank)}"><span class="hint">Se muestra así: «Asesora Legal Presidencial, con rango de Secretaria de Estado».</span></div>
        <div class="f full"><label>Frase superior de la portada</label><input name="heroKicker" value="${esc(S.heroKicker)}"></div>
        <div class="f full"><label>Texto de bienvenida</label><textarea name="heroText" rows="3" style="min-height:90px">${esc(S.heroText)}</textarea></div>
        <div class="f full"><label>Biografía corta (inicio)</label><textarea name="bioShort" rows="3" style="min-height:90px">${esc(S.bioShort)}</textarea></div>
      </div></div>
      <div class="editor-side"><div class="panel"><h3>Fotografía</h3><div id="ph"></div><small class="muted" style="display:block;margin-top:.6rem;font-size:.75rem">Foto vertical, idealmente de estudio. Se muestra en la portada, la trayectoria y como avatar.</small></div></div>
    </div>
    <div class="panel"><h3>Biografía completa</h3><div id="bio"></div></div>
    <div class="panel"><h3>Credenciales <small>una por línea</small></h3><div class="f"><textarea name="credentials" rows="5">${esc((S.credentials || []).join("\n"))}</textarea></div></div>
    <div class="two" style="margin-top:1.2rem">
      <div class="panel"><h3>Cifras destacadas <small>valor | descripción</small></h3><div class="f"><textarea name="stats" rows="5">${esc((S.stats || []).map(s => `${s.value} | ${s.label}`).join("\n"))}</textarea><span class="hint">Ej.: 95% | Evaluación técnica 2018. La primera también aparece flotando junto a la foto.</span></div></div>
      <div class="panel"><h3>Línea de tiempo <small>etiqueta | cargo | detalle</small></h3><div class="f"><textarea name="timeline" rows="7">${esc((S.timeline || []).map(t => `${t.year} | ${t.title} | ${t.text}`).join("\n"))}</textarea><span class="hint">En orden cronológico. La última se marca como actual.</span></div></div>
    </div>
    <div class="form-actions"><button class="btn gold">${icon("check")} Guardar perfil</button></div>
  </form>`;
  const ph = imagePicker($("#ph"), S.photo, { cls: "portrait", label: "Subir fotografía", full: 1400, thumbSize: 500 });
  const bio = makeEditor($("#bio"), S.bioHtml, "Biografía completa…");
  $("#pf").onsubmit = async e => {
    e.preventDefault();
    const f = e.target, btn = $(".form-actions .btn", f); btn.disabled = true;
    const lines = n => val(f, n).split("\n").map(l => l.trim()).filter(Boolean);
    try {
      const data = {
        name: val(f, "name"), fullName: val(f, "fullName"), role: val(f, "role"), currentPosition: val(f, "currentPosition"), currentRank: val(f, "currentRank"),
        heroKicker: val(f, "heroKicker"), heroText: val(f, "heroText"), bioShort: val(f, "bioShort"), bioHtml: bio.html(),
        credentials: lines("credentials"),
        stats: lines("stats").map(l => { const [value, ...r] = l.split("|"); return { value: value.trim(), label: r.join("|").trim() }; }),
        timeline: lines("timeline").map(l => { const [year = "", title = "", ...r] = l.split("|"); return { year: year.trim(), title: title.trim(), text: r.join("|").trim() }; }),
        photo: await ph.commit()
      };
      await D.set("settings", "site", data, true);
      S = { ...S, ...data };
      toast("Perfil actualizado");
    } catch (err) { fail(err, "No se pudo guardar"); }
    btn.disabled = false;
  };
};

// ───────────── TEXTOS DEL SITIO ─────────────
const TEXT_GROUPS = [
  ["Menú y encabezado", [["brandTagline", "Frase bajo el nombre (arriba a la izquierda)"], ["nav_inicio", "Menú: Inicio"], ["nav_trayectoria", "Menú: Trayectoria"], ["nav_articulos", "Menú: Artículos"], ["nav_muro", "Menú: Muro"], ["nav_galeria", "Menú: Galería"], ["nav_libros", "Menú: Libros"], ["nav_contacto", "Menú: Contacto"]]],
  ["Página de inicio", [["heroBtn1", "Botón principal de la portada"], ["heroBtn2", "Botón secundario de la portada"], ["homeProfileEyebrow", "Perfil · etiqueta"], ["homeProfileTitle", "Perfil · título"], ["homeBooksEyebrow", "Libros · etiqueta"], ["homeBooksTitle", "Libros · título"], ["homeBooksLead", "Libros · descripción", 1], ["homeArticlesEyebrow", "Artículos · etiqueta"], ["homeArticlesTitle", "Artículos · título"], ["homeGalleryEyebrow", "Galería · etiqueta"], ["homeGalleryTitle", "Galería · título"], ["ctaTitle", "Recuadro de contacto · título"], ["ctaText", "Recuadro de contacto · texto", 1], ["ctaButton", "Recuadro de contacto · botón"]]],
  ["Trayectoria", [["aboutEyebrow", "Etiqueta de la página"], ["aboutBioEyebrow", "Etiqueta de la biografía"], ["timelineEyebrow", "Línea de tiempo · etiqueta"], ["timelineTitle", "Línea de tiempo · título"], ["timelineLead", "Línea de tiempo · descripción", 1]]],
  ["Artículos", [["articlesEyebrow", "Etiqueta"], ["articlesTitle", "Título"], ["articlesLead", "Descripción", 1]]],
  ["Muro", [["wallEyebrow", "Etiqueta"], ["wallTitle", "Título"], ["wallLead", "Descripción", 1]]],
  ["Galería", [["galleryEyebrow", "Etiqueta"], ["galleryTitle", "Título"], ["galleryLead", "Descripción", 1]]],
  ["Libros", [["booksEyebrow", "Etiqueta"], ["booksTitle", "Título"], ["booksLead", "Descripción", 1]]],
  ["Contacto", [["contactEyebrow", "Etiqueta"], ["contactTitle", "Título"], ["contactLead", "Descripción", 1], ["contactNote", "Nota junto al botón de enviar"]]],
  ["Guardados", [["savedTitle", "Título"], ["savedLead", "Descripción", 1]]]
];
VIEWS.textos = async () => {
  setTop("Textos del sitio", `<a href="./" target="_blank" class="btn ghost sm">${icon("eye")}<span>Ver sitio</span></a>`);
  S = await D.getSettings();
  const t = S.texts || {};
  C().innerHTML = `<div class="demo-note">${icon("edit")}<div>Acá cambiás los títulos y descripciones de cada página. En los títulos, escribí una palabra entre asteriscos para resaltarla en <em style="color:var(--gold)">cursiva dorada</em>: <code>Actividades y *momentos*</code>. Si borrás un campo, vuelve al texto original.</div></div>
  <form id="tf">${TEXT_GROUPS.map(([g, fields]) => `<div class="panel"><h3>${esc(g)}</h3><div class="fgrid">${fields.map(([k, label, long]) => `
    <div class="f ${long ? "full" : ""}"><label>${esc(label)}</label>${long ? `<textarea name="${k}" rows="2" style="min-height:70px" placeholder="${esc(DEFAULT_TEXTS[k])}">${esc(t[k] ?? "")}</textarea>` : `<input name="${k}" value="${esc(t[k] ?? "")}" placeholder="${esc(DEFAULT_TEXTS[k])}">`}</div>`).join("")}</div></div>`).join("")}
  <div class="form-actions"><button class="btn gold">${icon("check")} Guardar textos</button></div></form>`;
  $("#tf").onsubmit = async e => {
    e.preventDefault();
    const f = e.target, btn = $(".form-actions .btn", f); btn.disabled = true;
    try {
      const texts = {};
      TEXT_GROUPS.forEach(([, fields]) => fields.forEach(([k]) => { texts[k] = val(f, k) || DEFAULT_TEXTS[k]; }));
      await D.set("settings", "site", { texts }, true);
      toast("Textos guardados. Recargá el sitio para verlos.");
    } catch (err) { fail(err, "No se pudo guardar"); }
    btn.disabled = false;
  };
};

// ───────────── AJUSTES ─────────────
VIEWS.ajustes = async () => {
  setTop("Ajustes");
  S = await D.getSettings();
  const so = S.socials || {};
  C().innerHTML = `<form id="sf">
    <div class="panel"><h3>Contacto</h3><div class="fgrid">
      <div class="f"><label>Correo público</label><input name="email" type="email" value="${esc(S.email)}"></div>
      <div class="f"><label>WhatsApp (con código de país)</label><input name="whatsapp" value="${esc(S.whatsapp)}" placeholder="+504 9999-9999"><span class="hint">Activa los botones «Pedir por WhatsApp» en los libros.</span></div>
      <div class="f"><label>Teléfono</label><input name="phone" value="${esc(S.phone)}"></div>
      <div class="f"><label>Ubicación</label><input name="location" value="${esc(S.location)}"></div>
    </div></div>
    <div class="panel"><h3>Redes sociales <small>pegá el enlace completo</small></h3><div class="fgrid">
      ${[["facebook", "Facebook"], ["instagram", "Instagram"], ["x", "X (Twitter)"], ["linkedin", "LinkedIn"], ["youtube", "YouTube"], ["tiktok", "TikTok"]].map(([k, t]) => `<div class="f"><label>${t}</label><input name="so_${k}" type="url" value="${esc(so[k] || "")}" placeholder="https://"></div>`).join("")}
    </div></div>
    <div class="two" style="margin-top:1.2rem">
      <div class="panel"><h3>Temas de los artículos <small>uno por línea</small></h3><div class="f"><textarea name="categories" rows="8">${esc((S.categories || []).join("\n"))}</textarea></div></div>
      <div class="panel"><h3>Comentarios</h3><label class="switch"><input type="checkbox" name="moderateComments" ${S.moderateComments ? "checked" : ""}> Aprobar comentarios antes de publicarlos</label><p class="muted" style="font-size:.85rem">Si está activo, los comentarios nuevos quedan en «Pendientes» hasta que los apruebes. Si no, se publican al instante y podés eliminarlos cuando quieras.</p>
      ${D.isDemo() ? `<hr style="border:0;border-top:1px solid var(--line);margin:1.4rem 0"><h3>Modo demostración</h3><p class="muted" style="font-size:.85rem">Restaura el contenido de ejemplo y borra los cambios hechos en este navegador.</p><button type="button" class="btn ghost sm" id="reset" style="color:var(--danger)">${icon("trash")} Restablecer demo</button>` : ""}</div>
    </div>
    <div class="form-actions"><button class="btn gold">${icon("check")} Guardar ajustes</button></div></form>`;
  $("#reset") && ($("#reset").onclick = async () => { if (await confirmBox("¿Restablecer todo el contenido de ejemplo?", "Restablecer")) D.resetDemo(); });
  $("#sf").onsubmit = async e => {
    e.preventDefault();
    const f = e.target, btn = $(".form-actions .btn", f); btn.disabled = true;
    try {
      const socials = {}; ["facebook", "instagram", "x", "linkedin", "youtube", "tiktok"].forEach(k => socials[k] = val(f, "so_" + k));
      const data = { email: val(f, "email"), whatsapp: val(f, "whatsapp"), phone: val(f, "phone"), location: val(f, "location"), socials, categories: val(f, "categories").split("\n").map(s => s.trim()).filter(Boolean), moderateComments: f.moderateComments.checked };
      await D.set("settings", "site", data, true);
      S = { ...S, ...data };
      toast("Ajustes guardados");
    } catch (err) { fail(err, "No se pudo guardar"); }
    btn.disabled = false;
  };
};

// ───────────── inicio ─────────────
function render() {
  const u = D.user();
  if (!u) return loginView();
  if (!u.isAdmin) return notAdminView();
  if (mode !== "app") shell();
}
(async () => {
  await D.ready;
  S = await D.getSettings();
  D.onAuth(render);
  addEventListener("hashchange", route);
  render();
})();
