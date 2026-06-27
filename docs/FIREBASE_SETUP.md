# Firebase Setup for Cognitus Pay

This portal is hosted by GitHub Pages. Firebase is only used for login support and database records.

## 1. Authentication

Open Firebase Console for `cognitus-pay`.

Go to:

Authentication -> Sign-in method -> Anonymous -> Enable

The portal uses anonymous Firebase Auth in the background so Firestore can require an authenticated Firebase session while your staff still log in with Discord Username, Discord ID, and PIN.

## 2. Firestore

Go to:

Firestore Database -> Create database

Start in production mode, then publish the repository's `firestore.rules` file.

## 3. Firestore Collections

The app creates records automatically as you use it. Main collections:

- users
- payrollProfiles
- payrollPeriods
- paystubs
- payRequests
- raiseRequests
- adjustmentRequests
- expenseLogs
- revenueLogs
- managementAudits
- auditLogs

## 4. First Site Visit

The first visit will show Owner Bootstrap if no protected Owner account exists.

Use your actual Discord Username and Discord User ID, then create a 4-digit PIN.

## 5. Security Reminder

This is designed for Cognitus Robux payroll and internal tracking. Do not store real banking credentials, tax documents, real SSNs, or sensitive legal identity records.
