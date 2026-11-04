// ─────────────────────────────────────────────────────────────
//  CONFIGURACIÓN DEL SITIO
// ─────────────────────────────────────────────────────────────
//  1) Creá un proyecto gratis en https://console.firebase.google.com
//  2) Agregá una "App web" y copiá aquí los valores que te da Firebase.
//  3) Mientras apiKey esté vacío, el sitio funciona en MODO DEMO:
//     muestra contenido de ejemplo y lo que edités se guarda solo en tu navegador.
// ─────────────────────────────────────────────────────────────

export const firebaseConfig = {
  apiKey: "",
  authDomain: "",
  projectId: "",
  storageBucket: "",
  messagingSenderId: "",
  appId: ""
};

export const DEMO_MODE = !firebaseConfig.apiKey;
export const FIREBASE_VERSION = "10.12.2";
