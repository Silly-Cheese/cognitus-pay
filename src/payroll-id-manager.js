import { getApps, getApp, initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getFirestore, collection, doc, getDoc, getDocs, setDoc, updateDoc, addDoc, query, where, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCWD3utr1FC1pIGZ1A9mvurPNkN3ndZZlo",
  authDomain: "cognitus-pay.firebaseapp.com",
  projectId: "cognitus-pay",
  storageBucket: "cognitus-pay.firebasestorage.app",
  messagingSenderId: "89172973354",
  appId: "1:89172973354:web:2be42b5279a45052acb053"
};
const fbApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(fbApp);
const qs = (s) => document.querySelector(s);
const qsa = (s) => Array.from(document.querySelectorAll(s));
const val = (v) => String(v || "").trim();

async function addAudit(action, details, target) {
  await addDoc(collection(db, "auditLogs"), {
    action,
    details,
    target,
    actorName: "Payroll ID Manager",
    actorEmployeeId: "OWNER_TOOL",
    createdAt: serverTimestamp(),
    createdAtText: new Date().toISOString()
  });
}

async function findUser(employeeId) {
  const direct = await getDoc(doc(db, "users", employeeId));
  if (direct.exists()) return { id: direct.id, ...direct.data() };
  const snap = await getDocs(query(collection(db, "users"), where("employeeId", "==", employeeId)));
  if (snap.empty) return null;
  return { id: snap.docs[0].id, ...snap.docs[0].data() };
}

async function updateLinkedRecords(employeeId, oldPayrollId, newPayrollId) {
  const collectionNames = ["paystubs", "payRequests", "raiseRequests", "adjustmentRequests", "managementAudits"];
  for (const name of collectionNames) {
    const snap = await getDocs(query(collection(db, name), where("employeeId", "==", employeeId)));
    for (const item of snap.docs) {
      await updateDoc(doc(db, name, item.id), {
        payrollId: newPayrollId,
        previousPayrollId: oldPayrollId || null,
        payrollIdUpdatedAt: serverTimestamp()
      });
    }
  }
}

async function changePayrollId(employeeId, newPayrollId) {
  employeeId = val(employeeId);
  newPayrollId = val(newPayrollId);
  if (!employeeId || !newPayrollId) return alert("Employee ID and new Payroll ID are required.");

  const user = await findUser(employeeId);
  if (!user) return alert("Employee was not found.");

  const oldPayrollId = user.payrollId || "";
  if (oldPayrollId === newPayrollId) return alert("That employee already has this Payroll ID.");

  const existingNewProfile = await getDoc(doc(db, "payrollProfiles", newPayrollId));
  if (existingNewProfile.exists()) {
    const ok = confirm(`Payroll profile ${newPayrollId} already exists. Link this employee to that Payroll ID anyway?`);
    if (!ok) return;
  }

  let oldProfile = {};
  if (oldPayrollId) {
    const oldProfileSnap = await getDoc(doc(db, "payrollProfiles", oldPayrollId));
    if (oldProfileSnap.exists()) oldProfile = oldProfileSnap.data();
  }

  await setDoc(doc(db, "payrollProfiles", newPayrollId), {
    ...oldProfile,
    employeeId: user.employeeId || employeeId,
    payrollId: newPayrollId,
    payrollStatus: user.payrollStatus || oldProfile.payrollStatus || "Active",
    previousPayrollId: oldPayrollId || null,
    updatedAt: serverTimestamp(),
    updatedBy: "OWNER_TOOL"
  }, { merge: true });

  await updateDoc(doc(db, "users", user.id), {
    payrollId: newPayrollId,
    previousPayrollId: oldPayrollId || null,
    updatedAt: serverTimestamp(),
    updatedBy: "OWNER_TOOL"
  });

  await updateLinkedRecords(user.employeeId || employeeId, oldPayrollId, newPayrollId);
  await addAudit("payroll_id_changed", { employeeId: user.employeeId || employeeId, oldPayrollId, newPayrollId }, user.employeeId || employeeId);
  alert(`Payroll ID updated from ${oldPayrollId || "none"} to ${newPayrollId}.`);
  location.reload();
}

function openPayrollIdModal(employeeId = "", currentPayrollId = "") {
  document.body.insertAdjacentHTML("beforeend", `
    <div class="modal-backdrop payroll-id-tool">
      <div class="modal">
        <h2>Adjust Payroll ID</h2>
        <p class="muted">Use this to match your existing Cognitus records. This updates the employee profile and linked payroll/request records.</p>
        <form id="payrollIdForm" class="grid">
          <label>Employee ID<input name="employeeId" required value="${employeeId}"></label>
          <label>Current Payroll ID<input name="currentPayrollId" disabled value="${currentPayrollId}"></label>
          <label>New Payroll ID<input name="newPayrollId" required placeholder="Example: CS-1205"></label>
          <div class="actions"><button>Update Payroll ID</button><button type="button" class="secondary" id="cancelPayrollId">Cancel</button></div>
        </form>
      </div>
    </div>`);
  qs("#cancelPayrollId").onclick = () => qs(".payroll-id-tool")?.remove();
  qs(".payroll-id-tool").onclick = (e) => { if (e.target.classList.contains("payroll-id-tool")) e.target.remove(); };
  qs("#payrollIdForm").onsubmit = (e) => {
    e.preventDefault();
    const form = Object.fromEntries(new FormData(e.target));
    changePayrollId(form.employeeId, form.newPayrollId);
  };
}

function addPayrollButtons() {
  const pageTitle = qs(".topbar h1")?.textContent || "";
  if (pageTitle !== "Employees") return;
  qsa("tbody tr").forEach((row) => {
    if (row.dataset.payrollIdPatched) return;
    const cells = row.querySelectorAll("td");
    if (cells.length < 9) return;
    const employeeId = val(cells[1]?.textContent);
    const payrollId = val(cells[4]?.textContent);
    const actions = cells[cells.length - 1];
    if (!employeeId || !actions) return;
    const button = document.createElement("button");
    button.className = "secondary";
    button.textContent = "Edit Payroll ID";
    button.style.marginLeft = ".35rem";
    button.onclick = () => openPayrollIdModal(employeeId, payrollId);
    actions.appendChild(button);
    row.dataset.payrollIdPatched = "true";
  });
}

window.CS_PAYROLL_ID_MANAGER = { openPayrollIdModal, changePayrollId };
setInterval(addPayrollButtons, 800);
