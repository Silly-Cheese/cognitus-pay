import { getApps, getApp, initializeApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const firebaseConfig = { apiKey:"AIzaSyCWD3utr1FC1pIGZ1A9mvurPNkN3ndZZlo", authDomain:"cognitus-pay.firebaseapp.com", projectId:"cognitus-pay", storageBucket:"cognitus-pay.firebasestorage.app", messagingSenderId:"89172973354", appId:"1:89172973354:web:2be42b5279a45052acb053" };
const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);
const pick = (s, root = document) => root.querySelector(s);
const all = (s, root = document) => Array.from(root.querySelectorAll(s));
let cachedStaff = [];
let cachedPaystubs = [];

async function loadCollection(name) {
  try { return (await getDocs(collection(db, name))).docs.map((d) => ({ id: d.id, ...d.data() })); }
  catch (err) { console.warn(`Could not load ${name}`, err); return []; }
}
async function loadStaff() {
  if (!cachedStaff.length) cachedStaff = (await loadCollection("users")).sort((a,b)=>String(a.employeeName||"").localeCompare(String(b.employeeName||"")));
  return cachedStaff;
}
async function loadPaystubs() {
  if (!cachedPaystubs.length) cachedPaystubs = (await loadCollection("paystubs")).sort((a,b)=>String(b.periodId||"").localeCompare(String(a.periodId||"")));
  return cachedPaystubs;
}

window.CS_CUSTOM_MODAL = function modalBox(options = {}) {
  const title = options.title || "Notice";
  const message = options.message || "";
  const okText = options.okText || "OK";
  const cancelText = options.cancelText || "Cancel";
  const isPrompt = Boolean(options.prompt);
  return new Promise((resolve) => {
    const id = `cs-modal-${Date.now()}`;
    document.body.insertAdjacentHTML("beforeend", `<div class="modal-backdrop" id="${id}"><div class="modal cs-custom-modal"><h2>${title}</h2><p class="muted">${message}</p>${isPrompt?`<label>Response<input id="${id}-input" value="${options.defaultValue||""}" placeholder="${options.placeholder||""}"></label>`:""}<div class="actions"><button id="${id}-ok">${okText}</button><button class="secondary" id="${id}-cancel">${cancelText}</button></div></div></div>`);
    const wrap = document.getElementById(id);
    const input = document.getElementById(`${id}-input`);
    document.getElementById(`${id}-ok`).onclick = () => { const value = isPrompt ? input.value : true; wrap.remove(); resolve(value); };
    document.getElementById(`${id}-cancel`).onclick = () => { wrap.remove(); resolve(isPrompt ? null : false); };
    wrap.onclick = (e) => { if (e.target === wrap) { wrap.remove(); resolve(isPrompt ? null : false); } };
    input?.focus();
  });
};

function removeNaNMoney() { all("td").forEach((cell) => { if (cell.textContent.trim() === "R$NaN") cell.textContent = ""; }); }

async function addStaffPicker(input) {
  if (!input || input.dataset.staffPickerReady) return;
  input.dataset.staffPickerReady = "true";
  const staff = await loadStaff();
  const select = document.createElement("select");
  select.className = "staff-picker";
  select.innerHTML = `<option value="">Select staff member...</option>` + staff.map((u) => {
    const name = u.employeeName || u.discordUsername || u.employeeId || "Unnamed";
    const emp = u.employeeId || "";
    const pay = u.payrollId || "";
    return `<option value="${emp}" data-name="${name}" data-payroll="${pay}">${name} | ${emp} | ${pay || "No Payroll ID"}</option>`;
  }).join("");
  input.parentElement.insertBefore(select, input);
  input.style.display = "none";
  select.onchange = () => {
    const selected = select.selectedOptions[0];
    input.value = selected?.value || "";
    const form = input.closest("form");
    if (!form || !selected) return;
    const nameInput = form.querySelector('input[name="employeeName"]');
    const payrollInput = form.querySelector('input[name="payrollId"]');
    const currentPayrollInput = form.querySelector('input[name="currentPayrollId"]');
    if (nameInput) nameInput.value = selected.dataset.name || "";
    if (payrollInput) payrollInput.value = selected.dataset.payroll || "";
    if (currentPayrollInput) currentPayrollInput.value = selected.dataset.payroll || "";
  };
}

async function addPaystubPicker(input) {
  if (!input || input.dataset.paystubPickerReady) return;
  input.dataset.paystubPickerReady = "true";
  const paystubs = await loadPaystubs();
  const select = document.createElement("select");
  select.className = "staff-picker paystub-picker";
  select.innerHTML = `<option value="">Select paystub...</option>` + paystubs.map((p) => {
    const paystubId = p.paystubId || p.id || "";
    const employee = p.employeeName || p.employeeId || "Unknown Employee";
    const period = p.periodId || "No Period";
    const amount = Number.isFinite(Number(p.finalRobuxAmount)) ? `R$${Number(p.finalRobuxAmount).toLocaleString()}` : "R$0";
    const status = p.paymentStatus || p.requestStatus || "No Status";
    return `<option value="${paystubId}" data-amount="${Number(p.finalRobuxAmount || 0)}">${employee} | ${period} | ${paystubId} | ${amount} | ${status}</option>`;
  }).join("");
  input.parentElement.insertBefore(select, input);
  input.style.display = "none";
  select.onchange = () => {
    const selected = select.selectedOptions[0];
    input.value = selected?.value || "";
    const amountInput = input.closest("form")?.querySelector('input[name="requestedAmount"]');
    if (amountInput && selected?.dataset.amount) amountInput.value = selected.dataset.amount;
  };
}

function enhanceOpenForms() {
  const formArea = pick(".modal");
  if (!formArea) return;
  all('input[name="employeeId"], input[name="subjectEmployeeId"]', formArea).forEach(addStaffPicker);
  all('input[name="paystubId"]', formArea).forEach(addPaystubPicker);
}
function addPayrollIdShortcut() {
  if ((pick(".topbar h1")?.textContent || "") !== "Employees") return;
  const actions = pick(".toolbar .actions");
  if (!actions || pick("#payrollIdShortcut")) return;
  const button = document.createElement("button");
  button.id = "payrollIdShortcut"; button.className = "secondary"; button.textContent = "Adjust Payroll ID";
  button.onclick = () => window.CS_PAYROLL_ID_MANAGER?.openPayrollIdModal();
  actions.appendChild(button);
}
setInterval(() => { removeNaNMoney(); enhanceOpenForms(); addPayrollIdShortcut(); }, 700);
