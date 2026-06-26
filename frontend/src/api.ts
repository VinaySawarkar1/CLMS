import axios from 'axios';

// When hosted, VITE_API_BASE is the backend host. Locally/single-service it is
// unset and we use same-origin '/api'.
const apiHost = import.meta.env.VITE_API_BASE as string | undefined;
const baseURL = apiHost ? `https://${apiHost}/api` : '/api';

export const api = axios.create({ baseURL });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('clms_access_token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// If the token is rejected (expired/invalid), clear it and return to login
// instead of leaving the app stuck firing 401s.
api.interceptors.response.use(
  (res) => res,
  (error) => {
    if (error?.response?.status === 401 && localStorage.getItem('clms_access_token')) {
      localStorage.removeItem('clms_access_token');
      localStorage.removeItem('clms_refresh_token');
      window.location.reload();
    }
    return Promise.reject(error);
  },
);

export interface CurrentUser {
  id: string;
  email: string;
  fullName: string;
  role: string;
  labId: string | null;
  lab?: { id: string; name: string; status: string; accreditationNumber?: string | null } | null;
  permissions: string[];
}

export async function login(email: string, password: string) {
  const { data } = await api.post('/auth/login', { email, password });
  localStorage.setItem('clms_access_token', data.accessToken);
  localStorage.setItem('clms_refresh_token', data.refreshToken);
  // Fetch full profile (role + lab + permissions) and cache it.
  const me = await fetchMe();
  return me;
}

export async function fetchMe(): Promise<CurrentUser> {
  const { data } = await api.get('/auth/me');
  localStorage.setItem('clms_user', JSON.stringify(data));
  return data;
}

export function getUser(): CurrentUser | null {
  const raw = localStorage.getItem('clms_user');
  return raw ? (JSON.parse(raw) as CurrentUser) : null;
}

/** True if the current user can access a module/permission key. */
export function hasPermission(key: string): boolean {
  const user = getUser();
  if (!user) return false;
  if (user.permissions?.includes('*')) return true;
  return user.permissions?.includes(key) ?? false;
}

export function logout() {
  localStorage.removeItem('clms_access_token');
  localStorage.removeItem('clms_refresh_token');
  localStorage.removeItem('clms_user');
}

export function isAuthed() {
  return Boolean(localStorage.getItem('clms_access_token'));
}

const get = (url: string, params?: any) => api.get(url, { params }).then((r) => r.data);
const post = (url: string, body?: any) => api.post(url, body).then((r) => r.data);
const patch = (url: string, body?: any) => api.patch(url, body).then((r) => r.data);
const put = (url: string, body?: any) => api.put(url, body).then((r) => r.data);
const del = (url: string) => api.delete(url).then((r) => r.data);

// Public lab registration (no auth)
export const registerLab = (b: any) => post('/auth/register-lab', b);

// Labs (SUPER_ADMIN)
export const getLabs = (status?: string) => get('/labs', { status });
export const getLab = (id: string) => get(`/labs/${id}`);
export const updateLabStatus = (id: string, status: string) => patch(`/labs/${id}/status`, { status });
export const updateLabDetails = (id: string, b: any) => patch(`/labs/${id}/details`, b);

// Lab users (LAB_ADMIN or SUPER_ADMIN)
export const getLabUsers = (labId: string) => get(`/labs/${labId}/users`);
export const resetLabUserPassword = (labId: string, userId: string, newPassword: string) =>
  patch(`/labs/${labId}/users/${userId}/reset-password`, { newPassword });
export const createLabUser = (labId: string, b: any) => post(`/labs/${labId}/users`, b);
export const updateLabUserRole = (labId: string, userId: string, role: string) =>
  patch(`/labs/${labId}/users/${userId}/role`, { role });
export const setLabUserActive = (labId: string, userId: string, isActive: boolean) =>
  patch(`/labs/${labId}/users/${userId}/active`, { isActive });

// Lab role permissions (LAB_ADMIN)
export const getLabPermissions = (labId: string) => get(`/labs/${labId}/permissions`);
export const saveLabPermissions = (labId: string, matrix: any[]) => put(`/labs/${labId}/permissions`, matrix);

// Dashboard
export const getDashboard = () => get('/dashboard');

// Customers
export const getCustomers = (search?: string) => get('/customers', { search });
export const createCustomer = (b: any) => post('/customers', b);
export const updateCustomer = (id: string, b: any) => patch(`/customers/${id}`, b);
export const deleteCustomer = (id: string) => del(`/customers/${id}`);
export const importCustomers = (records: any[]) => post('/customers/import', { records });

// Instruments
export const getInstruments = (customerId?: string) => get('/instruments', { customerId });
export const createInstrument = (b: any) => post('/instruments', b);
export const updateInstrument = (id: string, b: any) => patch(`/instruments/${id}`, b);
export const deleteInstrument = (id: string) => del(`/instruments/${id}`);
export const importInstruments = (records: any[]) => post('/instruments/import', { records });

// Jobs
export const getJobs = (status?: string) => get('/jobs', { status });
export const getJob = (id: string) => get(`/jobs/${id}`);
export const createJob = (b: any) => post('/jobs', b);
export const assignJob = (id: string, engineerId: string) => patch(`/jobs/${id}/assign`, { engineerId });
export const setJobStatus = (id: string, status: string) => patch(`/jobs/${id}/status`, { status });

// Engineers
export const getEngineers = () => get('/engineers');
export const createEngineer = (b: any) => post('/engineers', b);

// Datasheets
export const createDatasheet = (b: any) => post('/datasheets', b);
export const getDatasheet = (id: string) => get(`/datasheets/${id}`);
export const recalcDatasheet = (id: string, formulas: any) => post(`/datasheets/${id}/recalculate`, { formulas });
export const computeDatasheet = (id: string) => post(`/datasheets/${id}/compute`);
export const computeUncertainty = (id: string, contributors: any) => post(`/datasheets/${id}/uncertainty`, { contributors });
export const autoUncertainty = (id: string) => post(`/datasheets/${id}/auto-uncertainty`);
export const updateDatasheetEnvironmental = (id: string, environmental: any) => patch(`/datasheets/${id}/environmental`, { environmental });

// Open the printable certificate report (auth-protected) in a new tab.
export async function openCertificateReport(certificateId: string) {
  const res = await api.get(`/reports/certificate/${certificateId}.html`, { responseType: 'text' });
  const blob = new Blob([res.data], { type: 'text/html' });
  window.open(URL.createObjectURL(blob), '_blank');
}

// Open the printable datasheet report in a new tab.
export async function openDatasheetReport(datasheetId: string) {
  const res = await api.get(`/datasheets/${datasheetId}/report`, { responseType: 'text' });
  const blob = new Blob([res.data], { type: 'text/html' });
  window.open(URL.createObjectURL(blob), '_blank');
}

// Certificates
export const generateCertificate = (b: any) => post('/certificates/generate', b);
export const getCertificate = (id: string) => get(`/certificates/${id}`);
export const signCertificate = (id: string, stage: string) => post(`/certificates/${id}/sign`, { stage });
export const reviseCertificate = (id: string, reason: string) => post(`/certificates/${id}/revise`, { reason });
export const getCertificateRevisions = (id: string) => get(`/certificates/${id}/revisions`);
// Public lookup (no auth) by certificate number or job number.
export const lookupCertificate = (q: string) => get('/certificates/lookup', { q });

// Tasks
export const getTaskBoard = () => get('/tasks/board');
export const createTask = (b: any) => post('/tasks', b);
export const setTaskStatus = (id: string, status: string) => patch(`/tasks/${id}/status`, { status });

// Billing
export const getInvoices = () => get('/billing/invoices');
export const createInvoice = (b: any) => post('/billing/invoices', b);
export const payInvoice = (id: string, b: any) => post(`/billing/invoices/${id}/payments`, b);

// Inventory
export const getInventory = (category?: string) => get('/inventory/items', { category });
export const upsertInventory = (b: any) => post('/inventory/items', b);
export const adjustStock = (id: string, delta: number) => patch(`/inventory/items/${id}/stock`, { delta });
export const deleteInventoryItem = (id: string) => del(`/inventory/items/${id}`);
export const importInventory = (records: any[]) => post('/inventory/items/import', { records });

// Quality
export const getNcrs = () => get('/quality/ncr');
export const raiseNcr = (b: any) => post('/quality/ncr', b);
export const addCapa = (id: string, b: any) => post(`/quality/ncr/${id}/capa`, b);
export const closeNcr = (id: string) => patch(`/quality/ncr/${id}/close`, {});

// Environmental
export const getEnvironmental = () => get('/environmental');
export const recordEnvironmental = (b: any) => post('/environmental', b);
export const deleteEnvironmental = (id: string) => del(`/environmental/${id}`);
export const importEnvironmental = (records: any[]) => post('/environmental/import', { records });

// Notifications
export const getNotifications = () => get('/notifications');

// Audit
export const getAudit = () => get('/audit');

// Reference Standards (Master Instruments)
export const getMasters = () => get('/masters');
export const createMaster = (b: any) => post('/masters', b);
export const updateMaster = (id: string, b: any) => patch(`/masters/${id}`, b);
export const deleteMaster = (id: string) => del(`/masters/${id}`);
export const importMasters = (records: any[]) => post('/masters/import', { records });

// Calibration masters — CMC / NABL Scope (Module 4.3 + 4.4)
export const getCmcScopes = () => get('/calibration-masters/cmc');
export const createCmcScope = (b: any) => post('/calibration-masters/cmc', b);
export const updateCmcScope = (id: string, b: any) => patch(`/calibration-masters/cmc/${id}`, b);
export const deleteCmcScope = (id: string) => del(`/calibration-masters/cmc/${id}`);
export const importCmcScopes = (records: any[]) => post('/calibration-masters/cmc/import', { records });
export const lookupCmc = (p: { discipline: string; parameter: string; value?: number }) =>
  get('/calibration-masters/cmc/lookup', p);

// Calibration masters — MPE rules (Module 4.2)
export const getMpeRules = () => get('/calibration-masters/mpe');
export const createMpeRule = (b: any) => post('/calibration-masters/mpe', b);
export const updateMpeRule = (id: string, b: any) => patch(`/calibration-masters/mpe/${id}`, b);
export const deleteMpeRule = (id: string) => del(`/calibration-masters/mpe/${id}`);
export const importMpeRules = (records: any[]) => post('/calibration-masters/mpe/import', { records });
export const lookupMpe = (p: { discipline: string; parameter: string; value?: number; accuracyClass?: string; standard?: string }) =>
  get('/calibration-masters/mpe/lookup', p);

// Instrument calibration recall (due / overdue)
export const getRecallDue = (days?: number) => get('/instruments/due/recall', { days });

// Notifications — recall trigger
export const triggerRecallCheck = () => post('/notifications/trigger-recall');

// Quotations
export const getQuotations = () => get('/quotations');
export const createQuotation = (b: any) => post('/quotations', b);
export const setQuotationStatus = (id: string, status: string) => patch(`/quotations/${id}/status`, { status });

// Documents
export const getDocuments = () => get('/documents');
export const createDocument = (b: any) => post('/documents', b);
export const updateDocument = (id: string, b: any) => patch(`/documents/${id}`, b);
export const deleteDocument = (id: string) => del(`/documents/${id}`);

// Lab Settings
export const getLabSettings = (labId: string) => get(`/labs/${labId}/settings`);
export const updateLabSettings = (labId: string, b: any) => patch(`/labs/${labId}/settings`, b);

// Seed
export const loadSampleData = () => post('/seed/demo');

// Audit Plans (Internal Audit)
export const getAuditPlans = () => get('/audit-plans');
export const createAuditPlan = (b: any) => post('/audit-plans', b);
export const updateAuditPlan = (id: string, b: any) => patch(`/audit-plans/${id}`, b);
export const addAuditFinding = (id: string, b: any) => post(`/audit-plans/${id}/findings`, b);
export const updateAuditFinding = (id: string, fid: string, b: any) => patch(`/audit-plans/${id}/findings/${fid}`, b);
