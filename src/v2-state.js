export const CP_STATE = {
  user: null,
  page: 'dashboard',
  cache: {}
};

export const ROLE_PERMS = {
  staff: ['own'],
  financeEmployee: ['finance','payroll'],
  fcSupervisor: ['finance','payroll','adjust'],
  cfo: ['finance','payroll','adjust','lock','rates'],
  management: ['finance','audit'],
  board: ['finance','audit','editAny','deleteAny'],
  executive: ['finance','approve','editAny','deleteAny','users'],
  owner: ['*']
};

export const ROLE_LABELS = {
  staff: 'Staff Member',
  financeEmployee: 'Finance Employee',
  fcSupervisor: 'FC Supervisor',
  cfo: 'Chief Financial Officer',
  management: 'Management',
  board: 'Board',
  executive: 'Executive',
  owner: 'Owner'
};

export const money = (value) => `R$${Number(value || 0).toLocaleString()}`;
export const can = (permission) => CP_STATE.user?.permissions?.includes('*') || CP_STATE.user?.permissions?.includes(permission);
export const newId = (prefix) => `${prefix}-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random()*900+100)}`;
