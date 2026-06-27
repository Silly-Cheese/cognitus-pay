import { getApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getFirestore, doc, getDoc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const db = getFirestore(getApp());

function formModal(title, fields) {
  return new Promise((resolve) => {
    const wrap = document.createElement('div');
    wrap.className = 'modal-backdrop';
    wrap.innerHTML = `<div class="modal"><div class="modal-head"><h2>${title}</h2><button type="button" class="secondary" data-close>Close</button></div><form id="financeEditForm" class="grid">${fields.map(f => `<label>${f.label}<${f.kind === 'textarea' ? 'textarea' : 'input'} name="${f.name}" ${f.kind !== 'textarea' ? `type="${f.kind || 'text'}" value="${f.value || ''}"` : ''}>${f.kind === 'textarea' ? (f.value || '') : ''}${f.kind === 'textarea' ? '</textarea>' : ''}</label>`).join('')}<div class="actions"><button>Save</button><button type="button" class="secondary" data-close>Cancel</button></div></form></div>`;
    document.body.appendChild(wrap);
    wrap.querySelectorAll('[data-close]').forEach(b => b.onclick = () => { wrap.remove(); resolve(null); });
    wrap.querySelector('#financeEditForm').onsubmit = (e) => { e.preventDefault(); const data = Object.fromEntries(new FormData(e.target)); wrap.remove(); resolve(data); };
  });
}

const timer = setInterval(() => {
  if (!window.CS || window.CS.v2FinanceEditReady) return;
  window.CS.v2FinanceEditReady = true;
  window.CS.editLog = async function editLog(col, id) {
    const ref = doc(db, col, id);
    const rec = (await getDoc(ref)).data() || {};
    const data = await formModal('Edit Finance Record', [
      { name: 'amount', label: 'Amount R$', kind: 'number', value: rec.amount || 0 },
      { name: 'description', label: 'Description', kind: 'textarea', value: rec.description || '' }
    ]);
    if (!data) return;
    await updateDoc(ref, { amount: Number(data.amount || 0), description: data.description, updatedAt: serverTimestamp() });
    location.reload();
  };
}, 500);
