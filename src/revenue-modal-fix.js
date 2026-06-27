import { getApp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-app.js";
import { getFirestore, doc, getDoc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const db = getFirestore(getApp());

function askForText(title, message, defaultValue) {
  if (window.CS_CUSTOM_MODAL) {
    return window.CS_CUSTOM_MODAL({
      title: title,
      message: message,
      prompt: true,
      defaultValue: defaultValue,
      okText: "Save",
      cancelText: "Cancel"
    });
  }
  return Promise.resolve(defaultValue);
}

function showMessage(title, message) {
  if (window.CS_CUSTOM_MODAL) {
    return window.CS_CUSTOM_MODAL({ title: title, message: message, okText: "OK", cancelText: "Close" });
  }
  return Promise.resolve(true);
}

const patchTimer = setInterval(() => {
  if (!window.CS || !window.CS_CUSTOM_MODAL) return;
  clearInterval(patchTimer);

  window.CS.editLog = async function themedFinanceEdit(collectionName, recordId) {
    const recordRef = doc(db, collectionName, recordId);
    const recordSnap = await getDoc(recordRef);
    const record = recordSnap.data() || {};

    const amount = await askForText("Edit Amount", "Enter the corrected Robux amount.", String(record.amount ?? 0));
    if (amount === null || amount === false || amount === "") return;

    const description = await askForText("Edit Description", "Enter the corrected description.", record.description || "");
    if (description === null || description === false) return;

    await updateDoc(recordRef, {
      amount: Number(amount),
      description: description,
      updatedAt: serverTimestamp()
    });

    await showMessage("Saved", "The revenue or expense record was updated.");
    location.reload();
  };
}, 250);
