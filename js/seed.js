// Perfil por defecto y contenido de ejemplo (solo se usa en MODO DEMO).
// Todo lo de aquí se puede cambiar desde el panel de administración.

export const DEFAULT_SETTINGS = {
  name: "Mayra Aguilera",
  fullName: "Mayra Aguilera Torres",
  role: "Abogada · Doctora en Derecho Penal",
  heroKicker: "Justicia · Servicio público · Compromiso con Honduras",
  heroText: "Una trayectoria construida en la justicia, la academia y el servicio público. Aquí comparto mis libros, ideas y actividades, y abro un espacio de diálogo sobre los temas que importan a Honduras.",
  currentPosition: "Asesora Legal Presidencial",
  currentRank: "con rango de Secretaria de Estado",
  photo: { src: "assets/mayra-retrato.webp", thumb: "assets/mayra-retrato-sm.webp", avatar: "assets/mayra-avatar.webp", w: 860, h: 1075 },
  bioShort: "Abogada, doctora en Derecho Penal y con posgrado en Derecho Penal y Procesal Penal. Ha servido al sistema de justicia hondureño desde la fiscalía, la judicatura y la magistratura, y ha formado a nuevas generaciones de juristas como capacitadora y catedrática.",
  bioHtml: "<p>Mayra Aguilera es abogada, doctora en Derecho Penal y posee un posgrado en Derecho Penal y Procesal Penal. Ha sido capacitadora del Colegio de Abogados de Honduras (CAH) y catedrática en la UCENM y la UNICAH.</p><p>Posee una amplia trayectoria dentro del sistema de justicia hondureño, con experiencia tanto en la persecución penal como en la judicatura. Inició su carrera como fiscal del Ministerio Público, donde adquirió formación en investigación y judicialización de delitos. Más adelante se desempeñó como jueza de Sentencia en tribunales de primera instancia en Tegucigalpa.</p><p>Posteriormente fue nombrada magistrada de la Corte de Apelaciones de lo Civil de Francisco Morazán, desde donde conoció casos de alto impacto en materia civil.</p><p>En 2018 fue una de las candidatas más destacadas en el proceso para elegir fiscal general de la República, postulada por la Confederación de Trabajadores de Honduras (CTH), y obtuvo una de las calificaciones más altas del proceso: un 95 % en las evaluaciones técnicas.</p><p>Actualmente se desempeña como Asesora Legal Presidencial, con rango de Secretaria de Estado.</p>",
  credentials: [
    "Doctora en Derecho Penal",
    "Posgrado en Derecho Penal y Procesal Penal",
    "Capacitadora del Colegio de Abogados de Honduras (CAH)",
    "Catedrática en UCENM y UNICAH"
  ],
  stats: [
    { value: "95%", label: "En las evaluaciones técnicas del proceso para elegir Fiscal General (2018)" },
    { value: "4", label: "Ámbitos del sistema de justicia: Fiscalía, Juzgado, Corte y Estado" },
    { value: "2", label: "Universidades donde ha ejercido la cátedra" }
  ],
  timeline: [
    { year: "Inicio", title: "Fiscal del Ministerio Público", text: "Formación en investigación y judicialización de delitos." },
    { year: "Judicatura", title: "Jueza de Sentencia", text: "Tribunales de primera instancia en Tegucigalpa." },
    { year: "Magistratura", title: "Magistrada de la Corte de Apelaciones de lo Civil", text: "Francisco Morazán. Conocimiento de casos de alto impacto en materia civil." },
    { year: "2018", title: "Candidata a Fiscal General de la República", text: "Postulada por la CTH. Obtuvo 95 % en las evaluaciones técnicas, una de las calificaciones más altas del proceso." },
    { year: "Actualidad", title: "Asesora Legal Presidencial", text: "Con rango de Secretaria de Estado." }
  ],
  categories: ["Justicia", "Derecho Penal", "Derecho Constitucional", "Derechos Humanos", "Política y sociedad", "Comunidad", "Educación", "Opinión"],
  email: "contacto@mayraaguilera.com",
  phone: "",
  whatsapp: "",
  location: "Tegucigalpa, Honduras",
  socials: { facebook: "", instagram: "", x: "", linkedin: "", youtube: "", tiktok: "" },
  moderateComments: false
};

// ── Imágenes abstractas generadas (para que el demo no dependa de fotos externas)
const PALETTES = [
  ["#0b1120", "#1d2b4f", "#c9a45c"],
  ["#14213d", "#3a4f7a", "#e5cf9f"],
  ["#1a1a2e", "#5b4a3a", "#d9bf8c"],
  ["#0f2027", "#2c5364", "#b8955a"],
  ["#231a12", "#6b4f2e", "#f1e3c4"],
  ["#101827", "#4a3f63", "#cdb37c"]
];

export function art(seed, w = 1200, h = 800, label = "") {
  const p = PALETTES[seed % PALETTES.length];
  const r = n => ((Math.sin(seed * 999 + n * 77) + 1) / 2);
  const cx = Math.round(w * (0.25 + r(1) * 0.5)), cy = Math.round(h * (0.3 + r(2) * 0.4));
  const rad = Math.round(Math.min(w, h) * (0.25 + r(3) * 0.25));
  const lines = Array.from({ length: 9 }, (_, i) => `<line x1="0" y1="${Math.round(h / 9 * i + r(i) * 20)}" x2="${w}" y2="${Math.round(h / 9 * i - 60 + r(i + 4) * 40)}" stroke="${p[2]}" stroke-opacity=".08"/>`).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${p[0]}"/><stop offset="1" stop-color="${p[1]}"/></linearGradient><radialGradient id="o" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="${p[2]}" stop-opacity=".75"/><stop offset="1" stop-color="${p[2]}" stop-opacity="0"/></radialGradient></defs><rect width="100%" height="100%" fill="url(#g)"/>${lines}<circle cx="${cx}" cy="${cy}" r="${rad}" fill="url(#o)"/><circle cx="${cx}" cy="${cy}" r="${Math.round(rad * 0.62)}" fill="none" stroke="${p[2]}" stroke-opacity=".35"/><circle cx="${w - cx}" cy="${h - cy}" r="${Math.round(rad * 0.3)}" fill="${p[2]}" fill-opacity=".12"/>${label ? `<text x="50%" y="${h - 48}" text-anchor="middle" font-family="Georgia,serif" font-style="italic" font-size="${Math.round(h / 22)}" fill="${p[2]}" fill-opacity=".8">${label}</text>` : ""}</svg>`;
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

export function bookCover(seed, title, subtitle = "") {
  const p = PALETTES[seed % PALETTES.length];
  const words = title.split(" ");
  const linesTxt = [];
  let cur = "";
  words.forEach(wd => { if ((cur + " " + wd).trim().length > 14) { linesTxt.push(cur.trim()); cur = wd; } else cur += " " + wd; });
  if (cur.trim()) linesTxt.push(cur.trim());
  const t = linesTxt.map((l, i) => `<text x="60" y="${330 + i * 62}" font-family="Georgia,serif" font-size="54" fill="#f7f1e3">${l}</text>`).join("");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900" viewBox="0 0 600 900"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${p[0]}"/><stop offset="1" stop-color="${p[1]}"/></linearGradient></defs><rect width="600" height="900" fill="url(#g)"/><rect x="30" y="30" width="540" height="840" fill="none" stroke="${p[2]}" stroke-opacity=".55"/><circle cx="470" cy="180" r="120" fill="${p[2]}" fill-opacity=".14"/><circle cx="470" cy="180" r="80" fill="none" stroke="${p[2]}" stroke-opacity=".5"/><text x="60" y="120" font-family="Helvetica,Arial,sans-serif" font-size="18" letter-spacing="6" fill="${p[2]}">MAYRA AGUILERA</text><line x1="60" y1="250" x2="160" y2="250" stroke="${p[2]}" stroke-width="3"/>${t}<text x="60" y="${360 + linesTxt.length * 62}" font-family="Georgia,serif" font-style="italic" font-size="26" fill="${p[2]}">${subtitle}</text><text x="60" y="820" font-family="Helvetica,Arial,sans-serif" font-size="14" letter-spacing="4" fill="#f7f1e3" fill-opacity=".6">EDICIÓN DE EJEMPLO</text></svg>`;
  return "data:image/svg+xml;charset=utf-8," + encodeURIComponent(svg);
}

const img = (seed, label, w, h) => { const s = art(seed, w, h, label); return { src: s, thumb: s, w: w || 1200, h: h || 800 }; };
const day = 86400000;

export function buildSeed() {
  const now = Date.now();
  const posts = {
    p1: { type: "article", title: "El debido proceso como garantía viva: más allá del formalismo", category: "Derecho Procesal Penal", excerpt: "El debido proceso no es un trámite: es la condición que legitima toda decisión judicial. Una reflexión sobre su alcance real en la práctica de los tribunales.", cover: img(1, ""), published: true, featured: true, createdAt: now - 2 * day, readMin: 4 },
    p2: { type: "article", title: "Presunción de inocencia y opinión pública", category: "Derecho Penal", excerpt: "Cuando un caso llega a los medios antes que a la sala de juicio, ¿cómo se protege uno de los principios más antiguos del Derecho Penal?", cover: img(3, ""), published: true, featured: false, createdAt: now - 9 * day, readMin: 5 },
    p3: { type: "article", title: "Claves para entender el recurso de apelación en materia civil", category: "Derecho Civil", excerpt: "Una guía práctica, escrita desde la experiencia en segunda instancia, sobre lo que todo litigante debe cuidar al apelar.", cover: img(5, ""), published: true, featured: false, createdAt: now - 20 * day, readMin: 6 },
    w1: { type: "wall", text: "Gracias a todos los estudiantes que participaron hoy en el conversatorio sobre reforma procesal penal. Sus preguntas demuestran que el futuro del Derecho en Honduras está en buenas manos. ⚖️\n\n(Publicación de ejemplo)", images: [img(2, "Conversatorio", 1200, 900), img(4, "", 900, 1200)], published: true, createdAt: now - 1 * day },
    w2: { type: "wall", text: "Pronto les compartiré novedades sobre mi próximo libro. ¿Qué tema del Derecho Penal les gustaría que abordara en profundidad? Los leo en los comentarios. 📚\n\n(Publicación de ejemplo)", images: [], published: true, createdAt: now - 5 * day },
    w3: { type: "wall", text: "Una jornada de capacitación con colegas del gremio. La formación continua es un deber ético de toda persona que ejerce el Derecho.\n\n(Publicación de ejemplo)", images: [img(0, "", 1200, 800), img(3, "", 1200, 800), img(5, "", 1200, 800)], published: true, createdAt: now - 12 * day }
  };
  const p = "<p>";
  const bodies = {
    p1: { content: `${p}<em>Este es un artículo de ejemplo para mostrar el diseño. Podés reemplazarlo desde el panel de administración.</em></p><p>El debido proceso suele enseñarse como una lista de garantías: derecho a ser oído, a la defensa técnica, a un juez imparcial, a recurrir. Sin embargo, su verdadero valor no está en la lista, sino en la manera en que cada una de esas garantías se materializa en la sala de audiencias.</p><h2>Una garantía que se vive en cada audiencia</h2><p>Un proceso puede cumplir todas las formas y, aun así, vaciar de contenido el derecho de defensa. Por eso el control judicial no puede limitarse a verificar requisitos: debe preguntarse si las partes tuvieron una oportunidad real de influir en la decisión.</p><blockquote>La legitimidad de una sentencia no nace de su firmeza, sino del camino que se recorrió para dictarla.</blockquote><h3>Tres preguntas para todo operador de justicia</h3><ul><li>¿La persona imputada comprendió de qué se le acusa y con qué pruebas?</li><li>¿La defensa tuvo tiempo y medios suficientes para preparar su estrategia?</li><li>¿La resolución explica por qué se descartaron los argumentos de quien pierde?</li></ul><p>Responder estas preguntas con honestidad es la mejor forma de honrar el debido proceso.</p>` },
    p2: { content: `${p}<em>Artículo de ejemplo.</em></p><p>La presunción de inocencia es una regla de trato y una regla de juicio. Como regla de trato, exige que nadie sea tratado como culpable antes de una sentencia firme; como regla de juicio, impone a la acusación la carga de probar más allá de toda duda razonable.</p><h2>El desafío mediático</h2><p>En tiempos de redes sociales, los juicios paralelos se desarrollan a una velocidad que ningún tribunal puede igualar. La respuesta no es el silencio institucional, sino la comunicación responsable y la independencia de quienes deciden.</p>` },
    p3: { content: `${p}<em>Artículo de ejemplo.</em></p><p>Apelar no es repetir la demanda. Es identificar con precisión el agravio y demostrar por qué la resolución recurrida se aparta del Derecho o de la prueba.</p><h2>Lo que más se descuida</h2><ol><li>Plazos y forma de interposición.</li><li>Expresión clara de agravios.</li><li>Vinculación de cada agravio con la prueba del expediente.</li></ol>` }
  };
  const gallery = {};
  const caps = [
    ["Conferencias", "Conferencia magistral sobre garantías procesales"],
    ["Academia", "Clase de Derecho Procesal Penal"],
    ["Conferencias", "Panel sobre justicia y transparencia"],
    ["Eventos", "Encuentro con el gremio de abogados"],
    ["Academia", "Graduación de estudiantes de Derecho"],
    ["Eventos", "Presentación institucional"],
    ["Conferencias", "Foro sobre derechos humanos"],
    ["Academia", "Taller de litigación oral"],
    ["Eventos", "Jornada de capacitación"]
  ];
  const sizes = [[1200, 800], [900, 1200], [1200, 900], [1000, 1000], [1200, 800], [900, 1300], [1200, 800], [1000, 1250], [1200, 850]];
  caps.forEach(([album, caption], i) => {
    gallery["g" + i] = { album, caption: caption + " (ejemplo)", image: img(i, "", sizes[i][0], sizes[i][1]), createdAt: now - i * day * 3 };
  });
  const bk = (seed, t, s) => { const c = bookCover(seed, t, s); return { src: c, thumb: c, w: 600, h: 900 }; };
  const books = {
    b1: { title: "Garantías del proceso penal", subtitle: "Título de ejemplo", description: "Este es un libro de ejemplo para mostrar cómo se verá la sección. Desde el panel podés agregar el título real, la sinopsis, el precio, la portada y el enlace de compra.", price: "450", currency: "L", status: "preventa", year: "2026", pages: "320", buyUrl: "", cover: bk(0, "Garantías del proceso penal", "Título de ejemplo"), featured: true, order: 1, createdAt: now },
    b2: { title: "La prueba en el juicio oral", subtitle: "Título de ejemplo", description: "Libro de ejemplo. Reemplazalo con la información real desde el panel de administración.", price: "390", currency: "L", status: "proximamente", year: "2026", pages: "240", buyUrl: "", cover: bk(3, "La prueba en el juicio oral", "Título de ejemplo"), featured: false, order: 2, createdAt: now },
    b3: { title: "Ensayos sobre justicia", subtitle: "Título de ejemplo", description: "Libro de ejemplo. Reemplazalo con la información real desde el panel de administración.", price: "350", currency: "L", status: "disponible", year: "2025", pages: "198", buyUrl: "", cover: bk(2, "Ensayos sobre justicia", "Título de ejemplo"), featured: false, order: 3, createdAt: now }
  };
  const comments = {
    c1: { postId: "p1", postTitle: posts.p1.title, uid: "x1", name: "Lic. Carlos M.", photo: null, text: "Excelente reflexión. La pregunta sobre la motivación de las resoluciones debería estar en la mente de todo juez. (Comentario de ejemplo)", approved: true, isAdmin: false, createdAt: now - day },
    c2: { postId: "p1", postTitle: posts.p1.title, uid: "demo-admin", name: "Mayra Aguilera", photo: null, text: "Muchas gracias, colega. Es un tema que merece un artículo propio. (Respuesta de ejemplo)", approved: true, isAdmin: true, createdAt: now - day + 3600000 },
    c3: { postId: "w2", postTitle: "Publicación del muro", uid: "x2", name: "Andrea R.", photo: null, text: "¡Me encantaría leer sobre delitos económicos! (Comentario de ejemplo)", approved: true, isAdmin: false, createdAt: now - 4 * day }
  };
  return { settings: { site: { ...DEFAULT_SETTINGS } }, posts, bodies, gallery, books, comments, likes: {}, messages: {}, media: {} };
}

// Textos editables del sitio (panel → Textos del sitio). En los títulos, *palabra* se muestra en cursiva dorada.
export const DEFAULT_TEXTS = {
  brandTagline: "Abogada · Servidora pública",
  nav_inicio: "Inicio", nav_trayectoria: "Trayectoria", nav_articulos: "Artículos", nav_muro: "Muro", nav_galeria: "Galería", nav_libros: "Libros", nav_contacto: "Contacto",
  heroBadgeValue: "Dra.", heroBadgeLabel: "Doctora en Derecho Penal",
  heroBtn1: "Ver sus libros", heroBtn2: "Conocer trayectoria",
  homeProfileEyebrow: "Perfil", homeProfileTitle: "Una vida de *servicio* público",
  homeBooksEyebrow: "Publicaciones", homeBooksTitle: "Libros de la *autora*", homeBooksLead: "Obras para estudiantes, profesionales y para toda persona interesada en la justicia y en el futuro del país.",
  homeArticlesEyebrow: "Artículos", homeArticlesTitle: "Ideas y *reflexiones*",
  homeGalleryEyebrow: "Galería", homeGalleryTitle: "Actividades y *momentos*",
  ctaTitle: "¿Querés comunicarte con *Mayra*?", ctaText: "Invitaciones, entrevistas, prensa, actividades comunitarias o información sobre sus libros.", ctaButton: "Escribir mensaje",
  aboutEyebrow: "Trayectoria", aboutBioEyebrow: "Biografía",
  timelineEyebrow: "Recorrido", timelineTitle: "Del Ministerio Público a la *Asesoría de Estado*", timelineLead: "Experiencia en la persecución penal, la judicatura, la magistratura, la academia y el servicio al Estado.",
  articlesEyebrow: "Artículos", articlesTitle: "Ideas y *opinión*", articlesLead: "Análisis y opiniones sobre justicia, institucionalidad, sociedad y los temas que importan a Honduras. Guardá los que te interesen para leerlos después.",
  wallEyebrow: "Muro", wallTitle: "Novedades y *conversación*", wallLead: "Publicaciones, anuncios y momentos compartidos. Reaccioná y comentá.",
  galleryEyebrow: "Galería", galleryTitle: "Actividades y *momentos*", galleryLead: "Actividades públicas, encuentros con la comunidad, conferencias, eventos y momentos compartidos.",
  booksEyebrow: "Libros", booksTitle: "Obras de la *autora*", booksLead: "Adquirí sus publicaciones directamente. Cada libro incluye la información para comprarlo o pedirlo.",
  contactEyebrow: "Contacto", contactTitle: "Conversemos", contactLead: "Invitaciones a eventos, entrevistas, prensa, propuestas o pedidos de libros.", contactNote: "Tu mensaje llega directamente a su panel.",
  savedTitle: "Tus *temas*", savedLead: "Los artículos que guardás quedan en este dispositivo para leerlos cuando quieras."
};
