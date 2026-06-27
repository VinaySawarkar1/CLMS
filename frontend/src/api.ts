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
export const getCustomerTimeline = (id: string) => get(`/customers/${id}/timeline`);
export const createCustomer = (b: any) => post('/customers', b);
export const updateCustomer = (id: string, b: any) => patch(`/customers/${id}`, b);
export const deleteCustomer = (id: string) => del(`/customers/${id}`);
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
// Multi-instrument intake (Module 2.1): one customer → one batch → a job per instrument.
export const createJobBatch = (b: any) => post('/jobs/batch', b);
export const getJobBatches = (customerId?: string) => get('/jobs/batches', { customerId });
export const getJobBatch = (id: string) => get(`/jobs/batches/${id}`);
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

// Open the printable calibration sticker (auth-protected) in a new tab.
export async function openStickerReport(certificateId: string) {
  const res = await api.get(`/reports/sticker/${certificateId}.html`, { responseType: 'text' });
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
export const payInvoice = (id: string, b: any) => post(`/billing/invoices/${id}/pay`, b);

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

// Reference standard — utilization, certificate versions & maintenance (Module 3)
export const getMasterUtilization = (id: string) => get(`/masters/${id}/utilization`);
export const getMasterCertificates = (id: string) => get(`/masters/${id}/certificates`);
export const uploadMasterCertificate = (id: string, b: any) => post(`/masters/${id}/certificates`, b);
// Fetch the stored certificate file (auth-protected) and open it in a new tab.
export async function openMasterCertificateFile(id: string, certId: string) {
  const res = await api.get(`/masters/${id}/certificates/${certId}/file`, { responseType: 'blob' });
  window.open(URL.createObjectURL(res.data), '_blank');
}
export const getMasterMaintenance = (id: string) => get(`/masters/${id}/maintenance`);
export const addMasterMaintenance = (id: string, b: any) => post(`/masters/${id}/maintenance`, b);

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

// Reusable formulas + unit conversion (Module 13)
export const getFormulas = () => get('/calibration-masters/formulas');
export const createFormula = (b: any) => post('/calibration-masters/formulas', b);
export const updateFormula = (id: string, b: any) => patch(`/calibration-masters/formulas/${id}`, b);
export const deleteFormula = (id: string) => del(`/calibration-masters/formulas/${id}`);
export const evaluateFormula = (b: { expression: string; variables?: Record<string, number> }) =>
  post('/calibration-masters/formulas/evaluate', b);
export const getUnits = () => get('/calibration-masters/units');
export const convertUnit = (p: { value: number; from: string; to: string }) =>
  get('/calibration-masters/convert', p);

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

// Instrument Images (Module 8)
export const getInstrumentImages = (params?: { jobId?: string; instrumentId?: string }) =>
  get('/instrument-images', params);
export const uploadInstrumentImage = (b: any) => post('/instrument-images', b);
export const deleteInstrumentImage = (id: string) => del(`/instrument-images/${id}`);
export async function openInstrumentImageFile(id: string) {
  const res = await api.get(`/instrument-images/${id}/file`, { responseType: 'blob' });
  window.open(URL.createObjectURL(res.data), '_blank');
}

// Complaints (Module 9)
export const getComplaints = () => get('/complaints');
export const createComplaint = (b: any) => post('/complaints', b);
export const updateComplaint = (id: string, b: any) => patch(`/complaints/${id}`, b);
export const deleteComplaint = (id: string) => del(`/complaints/${id}`);

// KPI Dashboard (Module 10)
export const getKpis = () => get('/dashboard/kpis');

// Customer Feedback (Module 11)
export const getFeedback = () => get('/feedback');
export const getFeedbackSummary = () => get('/feedback/summary');
export const createFeedback = (b: any) => post('/feedback', b);

// Backup (Module 5) — admin-only JSON export
export async function downloadBackup() {
  const res = await api.get('/backup/export', { responseType: 'json' });
  const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `clms-backup-${new Date().toISOString().slice(0, 10)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

// ── CRM Modules ──────────────────────────────────────────────────────────────

// Enhanced Customer API
export const getCustomerStats = (id: string) => get(`/customers/${id}/stats`);
export const getCustomerLedger = (id: string) => get(`/customers/${id}/ledger`);
export const importCustomers = (records: any[]) => post('/customers/import', { records });

// Enhanced Quotations
export const getQuotation = (id: string) => get(`/quotations/${id}`);
export const updateQuotation = (id: string, b: any) => patch(`/quotations/${id}`, b);
export const deleteQuotation = (id: string) => del(`/quotations/${id}`);
export const duplicateQuotation = (id: string) => post(`/quotations/${id}/duplicate`, {});
export const getQuotationStats = () => get('/quotations/stats');

// Purchase Orders
export const getPurchaseOrders = (params?: { search?: string; status?: string }) => get('/purchase-orders', params);
export const getPurchaseOrder = (id: string) => get(`/purchase-orders/${id}`);
export const createPurchaseOrder = (b: any) => post('/purchase-orders', b);
export const updatePurchaseOrder = (id: string, b: any) => patch(`/purchase-orders/${id}`, b);
export const setPurchaseOrderStatus = (id: string, status: string, reason?: string) =>
  patch(`/purchase-orders/${id}/status`, { status, reason });
export const deletePurchaseOrder = (id: string) => del(`/purchase-orders/${id}`);
export const getPurchaseOrderStats = () => get('/purchase-orders/stats');

// Delivery Challans
export const getDeliveryChallans = (params?: { search?: string; status?: string }) => get('/delivery-challans', params);
export const getDeliveryChallan = (id: string) => get(`/delivery-challans/${id}`);
export const createDeliveryChallan = (b: any) => post('/delivery-challans', b);
export const updateDeliveryChallan = (id: string, b: any) => patch(`/delivery-challans/${id}`, b);
export const dispatchChallan = (id: string) => patch(`/delivery-challans/${id}/dispatch`, {});
export const markChallanDelivered = (id: string) => patch(`/delivery-challans/${id}/deliver`, {});
export const setDeliveryChallanStatus = (id: string, status: string, reason?: string) =>
  patch(`/delivery-challans/${id}/status`, { status, reason });
export const deleteDeliveryChallan = (id: string) => del(`/delivery-challans/${id}`);
export const getDeliveryChallanStats = () => get('/delivery-challans/stats');

// Enhanced Invoices
export const getInvoice = (id: string) => get(`/billing/invoices/${id}`);
export const createInvoiceDraft = (b: any) => post('/billing/invoices/draft', b);
export const finaliseInvoice = (id: string) => patch(`/billing/invoices/${id}/finalise`, {});
export const updateInvoice = (id: string, b: any) => patch(`/billing/invoices/${id}`, b);
export const recordPayment = (id: string, b: any) => post(`/billing/invoices/${id}/pay`, b);
export const cancelInvoice = (id: string) => patch(`/billing/invoices/${id}/cancel`, {});
export const deleteInvoice = (id: string) => del(`/billing/invoices/${id}`);
export const getInvoiceStats = () => get('/billing/invoices/stats');

// Leads / Pipeline
export const getLeads = (params?: { stage?: string; search?: string }) => get('/leads', params);
export const getLead = (id: string) => get(`/leads/${id}`);
export const createLead = (b: any) => post('/leads', b);
export const updateLead = (id: string, b: any) => patch(`/leads/${id}`, b);
export const setLeadStage = (id: string, stage: string, lostReason?: string) =>
  patch(`/leads/${id}/stage`, { stage, lostReason });
export const convertLead = (id: string) => post(`/leads/${id}/convert`, {});
export const deleteLead = (id: string) => del(`/leads/${id}`);
export const getLeadStats = () => get('/leads/stats');

// CRM Activities
export const getCrmActivities = (params?: { type?: string; customerId?: string; leadId?: string; isDone?: string }) =>
  get('/crm-activities', params);
export const createCrmActivity = (b: any) => post('/crm-activities', b);
export const updateCrmActivity = (id: string, b: any) => patch(`/crm-activities/${id}`, b);
export const completeCrmActivity = (id: string, outcome?: string) =>
  patch(`/crm-activities/${id}/complete`, { outcome });
export const deleteCrmActivity = (id: string) => del(`/crm-activities/${id}`);
export const getCrmActivityStats = () => get('/crm-activities/stats');

// Task CRUD + Assign
export const updateTask = (id: string, b: any) => patch(`/tasks/${id}`, b);
export const deleteTask = (id: string) => del(`/tasks/${id}`);
export const getMyTasks = () => get('/tasks/mine');
