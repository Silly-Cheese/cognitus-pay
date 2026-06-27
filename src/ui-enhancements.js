import { getApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const db = getFirestore(getApp());
const pick = (s, root = document) => root.querySelector(s);
const all = (s, root = document) => Array.from(root.querySelectorAll(s));
let cachedStaff = [];
let cachedPaystubs = [];
let isLoadingStaff = false;
let isLoadingPaystubs = false;

async function loadStaff() {
  if (cachedStaff.length || isLoadingStaff) return cachedStaff;
  isLoadingStaff = true;
  try {
    const snap = await getDocs(collection(db, "users"));
    cachedStaff = snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => String(a.employeeName || "").localeCompare(String(b.employeeName || "")));
  } finally {
    isLoadingStaff = false;
  }
  return cachedStaff;
}

async function loadPaystubs() {
  if (cachedPaystubs.length || isLoadingPaystubs) return cachedPaystubs;
  isLoadingPaystubs = true;
  try {
    const snap = await getDocs(collection(db, "paystubs"));
    cachedPaystubs = snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort((a, b) => String(b.periodId || "").localeCompare(String(a.periodId || "")));
  } finally {
    isLoadingPaystubs = false;
  }
  return cachedPaystubs;
}

window.CS_CUSTOM_MODAL = function modalBox(options = {}) {
  const title = options.title || "Notice";
  const message = options.message || "";
  const buttonText = options.buttonText || "OK";
  return new Promise((resolve) => {
    const id = `modal-${Date.now()}`;
    document.body.insertAdjacentHTML("beforeend", `<div class="modal-backdrop" id="${id}"><div class="modal"><h2>${title}</h2><p class="muted">${message}</p><div class="actions"><button id="${id}-ok">${buttonText}</button><button class="secondary" id="${id}-cancel">Cancel</button></div></div></div>`);
    const wrap = document.getElementById(id);
    document.getElementById(`${id}-ok`).onclick = () => { wrap.remove(); resolve(true); };
    document.getElementById(`${id}-cancel`).onclick = () => { wrap.remove(); resolve(false); };
    wrap.onclick = (e) => { if (e.target === wrap) { wrap.remove(); resolve(false); } };
  });
};

function removeNaNMoney() {
  all("td").forEach((cell) => {
    if (cell.textContent.trim() === "R$NaN") cell.textContent = "";
  });
}

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
    return `<option value="${paystubId}" data-amount="${Number(p.finalRobuxAmount || 0)}" data-employee="${p.employeeId || ""}" data-payroll="${p.payrollId || ""}">${employee} | ${period} | ${paystubId} | ${amount} | ${status}</option>`;
  }).join("");
  input.parentElement.insertBefore(select, input);
  input.style.display = "none";
  select.onchange = () => {
    const selected = select.selectedOptions[0];
    input.value = selected?.value || "";
    const form = input.closest("form");
    if (!form || !selected) return;
    const requestedAmount = form.querySelector('input[name="requestedAmount"]');
    if (requestedAmount && selected.dataset.amount) requestedAmount.value = selected.dataset.amount;
  };
}

function enhanceOpenForms() {
  const formArea = pick(".modal");
  if (!formArea) return;
  all('input[name="employeeId"], input[name="subjectEmployeeId"]', formArea).forEach(addStaffPicker);
  all('input[name="paystubId"]', formArea).forEach(addPaystubPicker);
}

function addPayrollIdShortcut() {
  const title = pick(".topbar h1")?.textContent || "";
  if (title !== "Employees") return;
  const actions = pick(".toolbar .actions");
  if (!actions || pick("#payrollIdShortcut")) return;
  const button = document.createElement("button");
  button.id = "payrollIdShortcut";
  button.className = "secondary";
  button.textContent = "Adjust Payroll ID";
  button.onclick = () => window.CS_PAYROLL_ID_MANAGER?.openPayrollIdModal();
  actions.appendChild(button);
}

setInterval(() => {
  removeNaNMoney();
  enhanceOpenForms();
  addPayrollIdShortcut();
}, 700);
