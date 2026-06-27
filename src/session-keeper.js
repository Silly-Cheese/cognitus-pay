import { getApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const db = getFirestore(getApp());
const SESSION_KEY = "COGNITUS_PAY_SESSION_V1";

function getStoredSession() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session = JSON.parse(raw);
    if (!session?.employeeId) return null;
    if (session.expiresAt && Date.now() > session.expiresAt) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
}

function saveSessionFromVisiblePortal() {
  const chip = document.querySelector(".user-chip small")?.textContent || "";
  const employeeId = chip.split("•")[0]?.trim();
  if (!employeeId || !employeeId.startsWith("COG-")) return;
  const expiresAt = Date.now() + 1000 * 60 * 60 * 12;
  localStorage.setItem(SESSION_KEY, JSON.stringify({ employeeId, expiresAt }));
}

function clearSessionWhenSignedOut() {
  const loginTitle = document.querySelector("#authBody h2")?.textContent || "";
  const appText = document.querySelector("#app")?.textContent || "";
  if (loginTitle.includes("Employee Login") || appText.includes("Employee Login")) {
    const hadPortal = sessionStorage.getItem("COGNITUS_WAS_IN_PORTAL") === "yes";
    if (!hadPortal) return;
  }
}

async function tryRestoreSession() {
  const session = getStoredSession();
  if (!session) return;
  setTimeout(async () => {
    const isLogin = (document.querySelector("#authBody h2")?.textContent || "").includes("Employee Login");
    if (!isLogin) return;
    const snap = await getDoc(doc(db, "users", session.employeeId));
    if (!snap.exists()) return localStorage.removeItem(SESSION_KEY);
    const user = snap.data();
    if (["Suspended", "Terminated", "Archived"].includes(user.accountStatus)) return localStorage.removeItem(SESSION_KEY);
    const usernameInput = document.querySelector('input[name="discordUsername"]');
    const idInput = document.querySelector('input[name="discordId"]');
    const form = document.querySelector("#login");
    if (!usernameInput || !idInput || !form) return;
    usernameInput.value = user.discordUsername || "";
    idInput.value = user.discordId || "";
    form.requestSubmit();
  }, 500);
}

setInterval(() => {
  if (document.querySelector(".user-chip")) {
    sessionStorage.setItem("COGNITUS_WAS_IN_PORTAL", "yes");
    saveSessionFromVisiblePortal();
  } else {
    clearSessionWhenSignedOut();
  }
}, 1000);

window.addEventListener("load", tryRestoreSession);
window.COGNITUS_CLEAR_SESSION = () => localStorage.removeItem(SESSION_KEY);
