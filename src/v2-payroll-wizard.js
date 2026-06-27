import { getApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getFirestore, collection, doc, getDocs, setDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const db = getFirestore(getApp());
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

async function getAll(name) {
  return (await getDocs(collection(db, name))).docs.map(d => ({ id: d.id, ...d.data() }));
}
function showForm(title, fields) {
  return new Promise((resolve) => {
    const wrap = document.createElement('div');
    wrap.className = 'modal-backdrop';
    wrap.innerHTML = `<div class="modal"><div class="modal-head"><h2>${title}</h2><button type="button" class="secondary" data-close>Close</button></div><form id="wizardForm" class="grid">${fields.map(f => `<label>${f.label}<${f.type === 'select' ? 'select' : 'input'} name="${f.name}" ${f.type && f.type !== 'select' ? `type="${f.type}" value="${f.value || ''}"` : ''}>${f.type === 'select' ? f.options.map(o => `<option value="${o.value || o}">${o.label || o}</option>`).join('') : ''}${f.type === 'select' ? '</select>' : ''}</label>`).join('')}<div class="actions"><button>Generate</button><button type="button" class="secondary" data-close>Cancel</button></div></form></div>`;
    document.body.appendChild(wrap);
    wrap.querySelectorAll('[data-close]').forEach(b => b.onclick = () => { wrap.remove(); resolve(null); });
    $('#wizardForm', wrap).onsubmit = e => { e.preventDefault(); const data = Object.fromEntries(new FormData(e.target)); wrap.remove(); resolve(data); };
  });
}
function toast(msg) {
  document.body.insertAdjacentHTML('beforeend', `<div class="toast">${msg}</div>`);
  setTimeout(() => document.querySelector('.toast')?.remove(), 2500);
}
async function generatePaystubs() {
  const periods = await getAll('payrollPeriods');
  const employees = await getAll('users');
  const form = await showForm('Generate Paystubs for Period', [
    { name: 'periodId', label: 'Payroll Period', type: 'select', options: periods.map(p => p.periodId) },
    { name: 'defaultTickets', label: 'Default Tickets', type: 'number', value: 0 },
    { name: 'defaultBonus', label: 'Default Bonus R$', type: 'number', value: 0 }
  ]);
  if (!form) return;
  let count = 0;
  for (const emp of employees.filter(e => !['Terminated','Archived'].includes(e.accountStatus))) {
    const base = Number(emp.payRate || 0) * Number(form.defaultTickets || 0);
    const final = base + Number(form.defaultBonus || 0);
    const clean = String(emp.payrollId || emp.employeeId).replace(/[^A-Za-z0-9]/g, '');
    const paystubId = `PS-${String(form.periodId).replace('PP-','')}-${clean}`;
    await setDoc(doc(db, 'paystubs', paystubId), {
      paystubId,
      periodId: form.periodId,
      employeeId: emp.employeeId,
      employeeName: emp.employeeName,
      payrollId: emp.payrollId || '',
      ticketsCompleted: Number(form.defaultTickets || 0),
      baseEarnings: base,
      bonusPay: Number(form.defaultBonus || 0),
      adjustments: 0,
      deductions: 0,
      finalRobuxAmount: final,
      requestStatus: 'Not Requested',
      paymentStatus: 'Eligible to Request',
      createdAt: serverTimestamp()
    }, { merge: true });
    count++;
  }
  toast(`Generated ${count} paystubs.`);
  location.reload();
}
function addButton() {
  if (($('.topbar h1')?.textContent || '') !== 'Payroll Periods') return;
  const bar = $('.toolbar .actions') || $('.toolbar');
  if (!bar || $('#v2Wizard')) return;
  const btn = document.createElement('button');
  btn.id = 'v2Wizard';
  btn.className = 'secondary';
  btn.textContent = 'Generate Paystubs';
  btn.onclick = generatePaystubs;
  bar.appendChild(btn);
}
setInterval(addButton, 800);
