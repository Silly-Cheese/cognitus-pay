# Cognitus Pay

Cognitus Solutions Financial Portal for Robux payroll and finance tracking.

## Hosting

Use GitHub Pages for the website. Firebase is used only for Authentication and Firestore data.

## First Launch

1. Enable Anonymous sign-in in Firebase Authentication.
2. Enable Cloud Firestore.
3. Open the GitHub Pages site.
4. Complete Owner Bootstrap.

Owner Bootstrap creates:

- Employee Name: Executive_Eagle
- Employee ID: COG-EXC-001
- Payroll ID: CS-1205
- Department: Executive
- Role: Owner

## Login

There is no public signup page.

Employees log in with:

- Discord Username
- Discord User ID
- 4-digit PIN

Owners create staff accounts inside the portal. First-time staff login prompts the employee to create their PIN.

## Current Features

- Owner bootstrap
- Discord Username and Discord ID login
- First-time PIN setup
- PIN hashing
- Account lockout after failed PINs
- Owner employee creation
- Role-based navigation
- Robux payroll tracking
- Payroll IDs
- Paystubs
- Pay requests
- Raise requests
- Adjustment requests
- Payroll periods
- Payroll profiles
- Expense logs
- Revenue logs
- Management audits
- Approval queue
- Audit log
- Black and white interface

## Required Firebase Settings

Authentication:

- Enable Anonymous sign-in.

Firestore:

- Create the database.
- Publish `firestore.rules`.

## GitHub Pages Setup

In the repository settings:

1. Go to Settings.
2. Go to Pages.
3. Set Source to GitHub Actions.
4. Run the Deploy static site workflow.

## Important Note

This is a fast free-only Roblox/Cognitus finance portal. Do not store real banking details, SSNs, tax documents, legal identity records, or real payment credentials in it.
