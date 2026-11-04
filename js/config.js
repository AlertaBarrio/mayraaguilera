// ─────────────────────────────────────────────────────────────
//  CONFIGURACIÓN DEL SITIO
// ─────────────────────────────────────────────────────────────
//  1) Creá un proyecto gratis en https://console.firebase.google.com
//  2) Agregá una "App web" y copiá aquí los valores que te da Firebase.
//  3) Mientras apiKey esté vacío, el sitio funciona en MODO DEMO:
//     muestra contenido de ejemplo y lo que edités se guarda solo en tu navegador.
// ─────────────────────────────────────────────────────────────

export const firebaseConfig = {
  apiKey: "AIzaSyDP1j8p_cmNZ66JdRHOnNFt64U70vKLeSo",
  authDomain: "mayraaguilera-c7272.firebaseapp.com",
  projectId: "mayraaguilera-c7272",
  storageBucket: "mayraaguilera-c7272.firebasestorage.app",
  messagingSenderId: "20852907723",
  appId: "1:20852907723:web:3986d0cc563b37144b054e"
};

// Correos con acceso al panel (deben coincidir con la lista en firestore.rules)
export const ADMIN_EMAILS = ["mayraaguilerahn@gmail.com"];

export const DEMO_MODE = !firebaseConfig.apiKey;
export const FIREBASE_VERSION = "10.12.2";
