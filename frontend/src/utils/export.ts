// Module 5 — Download restriction: only administrators may export data.
function isAdminUser(): boolean {
  try {
    const raw = localStorage.getItem('clms_user');
    if (!raw) return false;
    const user = JSON.parse(raw);
    const role = user?.role;
    return role === 'LAB_ADMIN' || role === 'SUPER_ADMIN' || role === 'TECHNICAL_MANAGER'
      || user?.permissions?.includes('*');
  } catch {
    return false;
  }
}

export function canExport(): boolean {
  return isAdminUser();
}

export function exportToCsv(filename: string, rows: Record<string, any>[], columns: { key: string; label: string }[]) {
  if (!isAdminUser()) {
    // eslint-disable-next-line no-alert
    alert('Only administrators can export data. Please contact your Lab Admin.');
    return;
  }
  const header = columns.map(c => c.label).join(',');
  const lines = rows.map(row =>
    columns.map(c => {
      const val = c.key.split('.').reduce((o: any, k: string) => o?.[k], row) ?? '';
      return `"${String(val).replace(/"/g, '""')}"`;
    }).join(',')
  );
  const csv = [header, ...lines].join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
