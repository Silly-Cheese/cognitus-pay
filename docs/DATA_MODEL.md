# Cognitus Pay Data Model

## users

Primary ID should be the employee ID.

Fields:

- employeeName
- employeeId
- department
- rank
- payrollId
- discordUsername
- discordId
- pinHash
- pinSalt
- firstLoginComplete
- accountStatus
- role
- permissions
- payRate
- payRateType
- payrollStatus
- protectedAccount
- cannotDelete
- isBootstrapOwner

## payrollProfiles

Primary ID should be the payroll ID.

Fields:

- employeeId
- payrollId
- payrollStatus
- currentBalance
- lifetimePaid
- lastPaymentDate

## payrollPeriods

Fields:

- periodId
- startDate
- endDate
- status
- lockedBy
- lockedAt
- createdBy

Statuses:

- Open
- Under Review
- Locked
- Pay Requests Open
- Partially Paid
- Paid
- Archived

## paystubs

Fields:

- paystubId
- periodId
- employeeId
- employeeName
- payrollId
- ticketsCompleted
- baseEarnings
- bonusPay
- adjustments
- deductions
- finalRobuxAmount
- requestStatus
- paymentStatus
- preparedBy
- notes

## payRequests

Fields:

- requestId
- paystubId
- employeeId
- employeeName
- payrollId
- requestedAmount
- reason
- status
- reviewedBy
- decisionNotes

## raiseRequests

Fields:

- requestId
- employeeId
- employeeName
- payrollId
- currentPayRate
- requestedPayRate
- reason
- status
- reviewedBy
- decisionNotes

## adjustmentRequests

Fields:

- requestId
- employeeId
- employeeName
- payrollId
- type
- reason
- status
- reviewedBy
- decisionNotes

## expenseLogs

Fields:

- expenseId
- date
- payee
- category
- amount
- status
- description
- addedBy
- deletedBy
- deleteReason

## revenueLogs

Fields:

- revenueId
- date
- source
- category
- amount
- status
- description
- addedBy
- deletedBy
- deleteReason

## managementAudits

Fields:

- auditId
- managerEmployeeId
- managerName
- subjectEmployeeId
- payrollId
- periodId
- auditType
- findings
- recommendation
- status

## auditLogs

Fields:

- action
- target
- details
- actorEmployeeId
- actorName
- createdAt
- createdAtText
