// Capa de datos: funciona igual en MODO DEMO (navegador) y con Firebase (producción).
import { firebaseConfig, DEMO_MODE, FIREBASE_VERSION, ADMIN_EMAILS } from "./config.js?v=20261104e";
import { buildSeed, DEFAULT_SETTINGS, DEFAULT_TEXTS } from "./seed.js?v=20261104e";

const newId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const listeners = new Set();
let currentUser = null;
let impl = null;

function setUser(u) { currentUser = u; listeners.forEach(fn => { try { fn(u); } catch (e) { console.error(e); } }); }

// ───────────── MODO DEMO ─────────────
function demoImpl() {
  const KEY = "ma-demo-v1", UK = "ma-demo-user";
  let s = null;
  try { s = JSON.parse(localStorage.getItem(KEY) || "null"); } catch { }
  if (!s) s = buildSeed();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (e) { console.warn("Demo: el almacenamiento local está lleno; los cambios se mantienen solo en esta pestaña.", e); } };
  save();
  const col = n => (s[n] ||= {});
  const match = (d, f) => f.every(([k, op, v]) => op === "==" ? d[k] === v : true);
  try { const u = JSON.parse(sessionStorage.getItem(UK) || "null"); if (u) currentUser = u; } catch { }
  const setU = u => { try { u ? sessionStorage.setItem(UK, JSON.stringify(u)) : sessionStorage.removeItem(UK); } catch { } setUser(u); };
  const clone = o => JSON.parse(JSON.stringify(o));
  return {
    demo: true,
    async list(n, f = []) { return Object.entries(col(n)).map(([id, d]) => ({ id, ...clone(d) })).filter(d => match(d, f)); },
    async get(n, id) { const d = col(n)[id]; return d ? { id, ...clone(d) } : null; },
    async add(n, d) { const id = newId(); col(n)[id] = clone(d); save(); return id; },
    async set(n, id, d, merge) { col(n)[id] = merge ? { ...(col(n)[id] || {}), ...clone(d) } : clone(d); save(); },
    async update(n, id, d) { if (!col(n)[id]) throw new Error("No existe"); col(n)[id] = { ...col(n)[id], ...clone(d) }; save(); },
    async remove(n, id) { delete col(n)[id]; save(); },
    async count(n, f = []) { return Object.values(col(n)).filter(d => match(d, f)).length; },
    async loginAdmin(email, pass) {
      if (!email || !pass) throw new Error("Completá correo y contraseña.");
      setU({ uid: "demo-admin", name: s.settings?.site?.name || "Administradora", email, photo: null, isAdmin: true });
    },
    async loginVisitor() { setU({ uid: "demo-visitor", name: "Visitante (demo)", email: "", photo: null, isAdmin: false }); },
    async logout() { setU(null); },
    async resetDemo() { try { localStorage.removeItem(KEY); } catch { } location.reload(); }
  };
}

// ───────────── FIREBASE ─────────────
async function firebaseImpl() {
  const b = `https://www.gstatic.com/firebasejs/${FIREBASE_VERSION}/`;
  const [A, F, U] = await Promise.all([import(b + "firebase-app.js"), import(b + "firebase-firestore.js"), import(b + "firebase-auth.js")]);
  const app = A.initializeApp(firebaseConfig);
  const db = F.getFirestore(app);
  const auth = U.getAuth(app);
  const q = (n, f = []) => F.query(F.collection(db, n), ...f.map(([k, op, v]) => F.where(k, op, v)));
  let first; const firstAuth = new Promise(r => (first = r));
  U.onAuthStateChanged(auth, async u => {
    if (!u) { setUser(null); first(); return; }
    let isAdmin = !!(u.emailVerified && ADMIN_EMAILS.includes((u.email || "").toLowerCase()));
    if (!isAdmin) { try { isAdmin = (await F.getDoc(F.doc(db, "admins", u.uid))).exists(); } catch { } }
    setUser({ uid: u.uid, name: u.displayName || (u.email || "Usuario").split("@")[0], email: u.email, photo: u.photoURL || null, isAdmin });
    first();
  });
  await firstAuth;
  return {
    demo: false,
    async list(n, f) { const s = await F.getDocs(q(n, f)); return s.docs.map(d => ({ id: d.id, ...d.data() })); },
    async get(n, id) { const d = await F.getDoc(F.doc(db, n, id)); return d.exists() ? { id: d.id, ...d.data() } : null; },
    async add(n, d) { return (await F.addDoc(F.collection(db, n), d)).id; },
    async set(n, id, d, merge) { await F.setDoc(F.doc(db, n, id), d, { merge: !!merge }); },
    async update(n, id, d) { await F.updateDoc(F.doc(db, n, id), d); },
    async remove(n, id) { await F.deleteDoc(F.doc(db, n, id)); },
    async count(n, f) { return (await F.getCountFromServer(q(n, f))).data().count; },
    async loginAdmin(e, p) { await U.signInWithEmailAndPassword(auth, e, p); },
    async loginVisitor() { await U.signInWithPopup(auth, new U.GoogleAuthProvider()); },
    async logout() { await U.signOut(auth); },
    async resetDemo() { }
  };
}

// ───────────── API PÚBLICA ─────────────
export const ready = (async () => {
  if (DEMO_MODE) { impl = demoImpl(); return impl; }
  try { impl = await firebaseImpl(); }
  catch (e) { console.error("No se pudo iniciar Firebase, usando modo demo.", e); impl = demoImpl(); }
  return impl;
})();

export const isDemo = () => !!impl?.demo;
export const list = (n, f) => impl.list(n, f);
export const get = (n, id) => impl.get(n, id);
export const add = (n, d) => impl.add(n, d);
export const set = (n, id, d, m) => impl.set(n, id, d, m);
export const update = (n, id, d) => impl.update(n, id, d);
export const remove = (n, id) => impl.remove(n, id);
export const count = (n, f) => impl.count(n, f);
export const resetDemo = () => impl.resetDemo();

export const user = () => currentUser;
export const onAuth = fn => { listeners.add(fn); return () => listeners.delete(fn); };
export const loginAdmin = (e, p) => impl.loginAdmin(e, p);
export const loginVisitor = () => impl.loginVisitor();
export const logout = () => impl.logout();

// Imágenes: miniatura dentro del documento + imagen completa en la colección "media".
const imgCache = new Map();
export async function saveImage(p) {
  const id = await impl.add("media", { full: p.full, createdAt: Date.now() });
  imgCache.set(id, p.full);
  return { id, thumb: p.thumb, w: p.w, h: p.h };
}
export async function imageSrc(img) {
  if (!img) return "";
  if (img.src) return img.src;
  if (imgCache.has(img.id)) return imgCache.get(img.id);
  try {
    const d = await impl.get("media", img.id);
    const s = d?.full || img.thumb;
    imgCache.set(img.id, s);
    return s;
  } catch { return img.thumb; }
}
export async function removeImage(img) { if (img?.id && !img.src) { try { await impl.remove("media", img.id); } catch { } } }

export async function getSettings() {
  let d = null;
  try { d = await impl.get("settings", "site"); } catch { }
  const out = { ...DEFAULT_SETTINGS, ...(d || {}) };
  out.socials = { ...DEFAULT_SETTINGS.socials, ...(d?.socials || {}) };
  out.texts = { ...DEFAULT_TEXTS };
  Object.entries(d?.texts || {}).forEach(([k, v]) => { if (typeof v === "string" && v.trim()) out.texts[k] = v; });
  return out;
}

// Likes
export async function likeInfo(postId) {
  const u = currentUser;
  const [n, mine] = await Promise.all([
    impl.count("likes", [["postId", "==", postId]]).catch(() => 0),
    u ? impl.get("likes", postId + "_" + u.uid).catch(() => null) : null
  ]);
  return { count: n, liked: !!mine };
}
export async function toggleLike(postId) {
  const u = currentUser; if (!u) throw new Error("login");
  const id = postId + "_" + u.uid;
  const ex = await impl.get("likes", id).catch(() => null);
  if (ex) await impl.remove("likes", id);
  else await impl.set("likes", id, { postId, uid: u.uid, createdAt: Date.now() });
  return !ex;
}
