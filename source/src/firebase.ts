import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut, User } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, onSnapshot, Firestore, DocumentReference } from 'firebase/firestore';
import { getDB, setDB, subscribe, isApplyingRemote, uid, loadGithubMetrics, loadGithubContacts } from './store';

const config = {
  apiKey: 'AIzaSyAmCwiGLTuyQ7jYEJTTThJvuD9Nx8SYcGU',
  authDomain: 'cardesign-workspace.firebaseapp.com',
  projectId: 'cardesign-workspace',
  storageBucket: 'cardesign-workspace.firebasestorage.app',
  messagingSenderId: '217037893786',
  appId: '1:217037893786:web:289328833eb2884608af23',
};
const ALLOWED = ['revistacardesign@gmail.com', 'alvaro.murodunabeitia@gmail.com', 'alfondcc@telycom4.com'];
const DOCID = 'cardesignv2';

let auth: ReturnType<typeof getAuth>;
let dbf: Firestore;
let docRef: DocumentReference | null = null;
let email = '';
const clientId = (() => { let c = localStorage.getItem('cn_client'); if (!c) { c = uid() + Date.now().toString(36); localStorage.setItem('cn_client', c); } return c; })();
let onState: (s: string) => void = () => {};
export function setStatusListener(fn: (s: string) => void) { onState = fn; }
export function getEmail() { return email; }

export function initFirebase(onUser: (u: User | null) => void) {
  initializeApp(config); auth = getAuth(); dbf = getFirestore();
  onAuthStateChanged(auth, async (u) => {
    if (u && u.email && ALLOWED.includes(u.email)) { email = u.email; onUser(u); onState('Sincronizando…'); await start(); onState('Sincronizado · ' + email); }
    else { if (u) signOut(auth); onUser(null); }
  });
}
export function login() { signInWithPopup(auth, new GoogleAuthProvider()).catch(e => onState('Error: ' + e.message)); }
export function logout() { signOut(auth).then(() => location.reload()); }

async function start() {
  docRef = doc(dbf, 'workspaces', DOCID);
  try { const snap = await getDoc(docRef); if (snap.exists() && (snap.data() as any).data) setDB(JSON.parse((snap.data() as any).data), true); else pushNow(); } catch (e) { }
  onSnapshot(docRef, (s) => { if (!s.exists()) return; const d = s.data() as any; if (d && d.data && d.updatedByClient !== clientId) setDB(JSON.parse(d.data), true); });
  subscribe(() => { if (!isApplyingRemote()) schedulePush(); });
  loadGithubMetrics();
  loadGithubContacts();
}
let timer: any;
function schedulePush() { clearTimeout(timer); timer = setTimeout(pushNow, 700); }
function pushNow() { if (!docRef) return; setDoc(docRef, { data: JSON.stringify(getDB()), updatedBy: email, updatedByClient: clientId, updatedAt: Date.now() }).catch(() => {}); }
export function forcePull() { if (!docRef) return; onState('Actualizando…'); getDoc(docRef).then(s => { if (s.exists() && (s.data() as any).data) setDB(JSON.parse((s.data() as any).data), true); onState('Sincronizado · ' + email); }); }
