import { getApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getFirestore, collection, getDocs, query, where } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const db = getFirestore(getApp());
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const money = (v) => Number.isFinite(Number(v)) ? `R$${Number(v).toLocaleString()}` : "R$0";

async function getAll(col) {
  try { return (await getDocs(collection(db, col))).docs.map((d) => ({ id: d.id, ...d.data() })); }
  catch { return []; }
}
async function getByEmployee(col, employeeId) {
  try { return (await getDocs(query(collection(db, col), where("employeeId", "==", employeeId)))).docs.map((d) => ({ id: d.id, ...d.data() })); }
  catch { return []; }
}
function card(label, value) { return `<div class="card"><small>${label}</small><div class="stat small-stat">${value || "—"}</div></div>`; }
function simpleRows(data, cols) {
  if (!data.length) return `<div class="empty">No records found.</div>`;
  return `<div class="table-wrap compact-table"><table><thead><tr>${cols.map(c=>`<th>${c.label}</th>`).join("")}</tr></thead><tbody>${data.map(r=>`<tr>${cols.map(c=>`<td>${c.money ? money(r[c.key]) : (r[c.key] ?? "—")}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
}
async function openEmployeeProfile(employeeId) {
  const users = await getAll("users");
  const user = users.find((u) => u.employeeId === employeeId || u.id === employeeId);
  if (!user) return;
  const [profiles, stubs, payReqs, raises, adjusts, audits] = await Promise.all([
    getAll("payrollProfiles"), getByEmployee("paystubs", user.employeeId), getByEmployee("payRequests", user.employeeId), getByEmployee("raiseRequests", user.employeeId), getByEmployee("adjustmentRequests", user.employeeId), getByEmployee("managementAudits", user.employeeId)
  ]);
  const profile = profiles.find((p) => p.payrollId === user.payrollId || p.employeeId === user.employeeId) || {};
  const unpaid = stubs.filter((s)=>s.paymentStatus !== "Paid").reduce((n,s)=>n+Number(s.finalRobuxAmount||0),0);
  const paid = stubs.filter((s)=>s.paymentStatus === "Paid").reduce((n,s)=>n+Number(s.finalRobuxAmount||0),0);
  const html = `
  <div class="modal-backdrop employee-profile-backdrop">
    <div class="modal employee-profile-modal">
      <div class="employee-profile-head">
        <div><h2>${user.employeeName || user.discordUsername || user.employeeId}</h2><p class="muted">${user.employeeId || "—"} • ${user.payrollId || "No Payroll ID"}</p></div>
        <button class="secondary employee-profile-close">Close</button>
      </div>
      <div class="employee-profile-tabs">
        <button class="active" data-tab="overview">Overview</button><button data-tab="paystubs">Paystubs</button><button data-tab="requests">Requests</button><button data-tab="audits">Audits</button><button data-tab="permissions">Permissions</button>
      </div>
      <div class="employee-tab" id="tab-overview">
        <div class="cards profile-cards">${card("Payroll ID", user.payrollId)}${card("Department", user.department)}${card("Rank", user.rank)}${card("Status", user.accountStatus || user.payrollStatus)}${card("Pay Rate", money(user.payRate || 0))}${card("Eligible/Unpaid", money(unpaid))}${card("Paid From Stubs", money(paid))}${card("Lifetime Paid", money(profile.lifetimePaid || 0))}</div>
      </div>
      <div class="employee-tab hidden" id="tab-paystubs">${simpleRows(stubs,[{key:"paystubId",label:"Paystub"},{key:"periodId",label:"Period"},{key:"finalRobuxAmount",label:"Final",money:true},{key:"requestStatus",label:"Request"},{key:"paymentStatus",label:"Payment"}])}</div>
      <div class="employee-tab hidden" id="tab-requests"><h3>Pay Requests</h3>${simpleRows(payReqs,[{key:"requestId",label:"Request"},{key:"paystubId",label:"Paystub"},{key:"requestedAmount",label:"Amount",money:true},{key:"status",label:"Status"}])}<h3>Raise Requests</h3>${simpleRows(raises,[{key:"requestId",label:"Request"},{key:"currentPayRate",label:"Current",money:true},{key:"requestedPayRate",label:"Requested",money:true},{key:"status",label:"Status"}])}<h3>Adjustments</h3>${simpleRows(adjusts,[{key:"requestId",label:"Request"},{key:"type",label:"Type"},{key:"status",label:"Status"},{key:"reason",label:"Reason"}])}</div>
      <div class="employee-tab hidden" id="tab-audits">${simpleRows(audits,[{key:"auditId",label:"Audit"},{key:"periodId",label:"Period"},{key:"auditType",label:"Type"},{key:"status",label:"Status"},{key:"recommendation",label:"Recommendation"}])}</div>
      <div class="employee-tab hidden" id="tab-permissions"><div class="card"><h3>Role</h3><p>${user.role || "—"}</p><h3>Permissions</h3><p class="muted">${(user.permissions || []).join(", ") || "No permissions listed."}</p></div></div>
    </div>
  </div>`;
  document.body.insertAdjacentHTML("beforeend", html);
  const wrap = $(".employee-profile-backdrop");
  $(".employee-profile-close", wrap).onclick = () => wrap.remove();
  wrap.onclick = (e) => { if (e.target === wrap) wrap.remove(); };
  $$(".employee-profile-tabs button", wrap).forEach((btn) => btn.onclick = () => {
    $$(".employee-profile-tabs button", wrap).forEach(b=>b.classList.remove("active")); btn.classList.add("active");
    $$(".employee-tab", wrap).forEach(t=>t.classList.add("hidden")); $(`#tab-${btn.dataset.tab}`, wrap)?.classList.remove("hidden");
  });
}
function enhanceEmployeeRows() {
  if (($(".topbar h1")?.textContent || "") !== "Employees") return;
  const headers = $$('thead th').map((h)=>h.textContent.trim());
  const empIndex = headers.indexOf("employeeId");
  if (empIndex < 0) return;
  $$('tbody tr').forEach((row) => {
    if (row.dataset.profileReady) return;
    const employeeId = row.querySelectorAll("td")[empIndex]?.textContent.trim();
    if (!employeeId || employeeId === "—") return;
    row.classList.add("employee-click-row");
    row.title = "Open employee profile";
    row.addEventListener("dblclick", () => openEmployeeProfile(employeeId));
    const actionCell = row.querySelectorAll("td")[row.querySelectorAll("td").length - 1];
    const btn = document.createElement("button"); btn.className = "secondary"; btn.textContent = "Open Profile"; btn.onclick = (e) => { e.stopPropagation(); openEmployeeProfile(employeeId); };
    actionCell?.prepend(btn);
    row.dataset.profileReady = "true";
  });
}
setInterval(enhanceEmployeeRows, 800);
window.CS_EMPLOYEE_PROFILE = { openEmployeeProfile };
