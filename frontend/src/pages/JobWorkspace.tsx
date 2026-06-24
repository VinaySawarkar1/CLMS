import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Alert, Box, Button, Chip, Divider, ListSubheader, MenuItem, Paper, Stack, Tab, Table,
  TableBody, TableCell, TableHead, TableRow, Tabs, TextField, Typography,
} from '@mui/material';
import {
  computeDatasheet, computeUncertainty, createDatasheet, generateCertificate,
  getDatasheet, getJob, openCertificateReport, signCertificate,
} from '../api';
import { findProcedure, groupedProcedures, Procedure } from '../procedures';

const SIG_STAGES = ['ENGINEER', 'REVIEWER', 'TECHNICAL_MANAGER', 'QUALITY_MANAGER', 'FINAL_LOCK'];
const DISTRIBUTIONS = ['normal', 'rectangular', 'triangular', 'u-shaped'];
const NREAD = 5;

type Row = { pointLabel: string; unit: string; nominal: string; standardValue: string; readings: string[] };
const emptyRow = (unit = ''): Row => ({ pointLabel: '', unit, nominal: '', standardValue: '', readings: Array(NREAD).fill('') });

export default function JobWorkspace() {
  const { id } = useParams();
  const jobId = id!;
  const nav = useNavigate();
  const qc = useQueryClient();
  const [tab, setTab] = useState(0);

  const { data: job } = useQuery({ queryKey: ['job-detail', jobId], queryFn: () => getJob(jobId) });
  const datasheetId: string | undefined = job?.datasheets?.[job.datasheets.length - 1]?.id;
  const { data: datasheet } = useQuery({ queryKey: ['datasheet', datasheetId], queryFn: () => getDatasheet(datasheetId!), enabled: !!datasheetId });

  if (!job) return <Typography>Loading…</Typography>;
  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ['job-detail', jobId] });
    qc.invalidateQueries({ queryKey: ['datasheet', datasheetId] });
  };

  return (
    <>
      <Button onClick={() => nav('/jobs')} sx={{ mb: 1 }}>← Back to Jobs</Button>
      <Typography variant="h5">{job.jobNumber} — {job.instrument?.name}</Typography>
      <Typography variant="body2" color="text.secondary" gutterBottom>
        {job.customer?.name} · <Chip size="small" label={job.status} />
      </Typography>
      <Tabs value={tab} onChange={(_, v) => setTab(v)} sx={{ mb: 2 }}>
        <Tab label="1. Datasheet" />
        <Tab label="2. Uncertainty" />
        <Tab label="3. Certificate" />
      </Tabs>
      {tab === 0 && <DatasheetTab job={job} datasheet={datasheet} onChanged={invalidate} />}
      {tab === 1 && <UncertaintyTab datasheet={datasheet} onChanged={invalidate} />}
      {tab === 2 && <CertificateTab job={job} onChanged={() => qc.invalidateQueries({ queryKey: ['job-detail', jobId] })} />}
    </>
  );
}

function DatasheetTab({ job, datasheet, onChanged }: any) {
  const [procId, setProcId] = useState('');
  const [unit, setUnit] = useState('');
  const [env, setEnv] = useState({ temperature: '23', humidity: '50', pressure: '101.3' });
  const [rows, setRows] = useState<Row[]>([emptyRow()]);

  const applyProcedure = (id: string) => {
    setProcId(id);
    const p = findProcedure(id);
    if (!p) return;
    setUnit(p.unit);
    setRows(p.points.map((pt) => ({ pointLabel: pt.label, unit: p.unit, nominal: String(pt.nominal), standardValue: String(pt.nominal), readings: Array(NREAD).fill('') })));
  };

  const createMut = useMutation({
    mutationFn: () => createDatasheet({
      jobId: job.id,
      templateName: findProcedure(procId)?.label || `${job.instrument?.name || 'Instrument'} Calibration`,
      environmental: { temperature: Number(env.temperature), humidity: Number(env.humidity), pressure: Number(env.pressure) },
      observations: rows.filter((r) => r.standardValue !== '').map((r) => ({
        pointLabel: r.pointLabel,
        unit: r.unit || unit,
        nominal: r.nominal ? Number(r.nominal) : undefined,
        standardValue: Number(r.standardValue),
        data: { readings: r.readings.map(Number).filter((n) => !Number.isNaN(n)) },
      })),
    }),
    onSuccess: onChanged,
  });
  const computeMut = useMutation({ mutationFn: () => computeDatasheet(datasheet.id), onSuccess: onChanged });

  const setRow = (i: number, patch: Partial<Row>) => setRows(rows.map((r, idx) => idx === i ? { ...r, ...patch } : r));
  const setReading = (i: number, j: number, v: string) => setRows(rows.map((r, idx) => idx === i ? { ...r, readings: r.readings.map((x, k) => k === j ? v : x) } : r));

  if (datasheet) {
    return (
      <Paper sx={{ p: 2 }}>
        <Typography variant="subtitle1" gutterBottom>{datasheet.templateName} (v{datasheet.version})</Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Conditions: {datasheet.environmental?.temperature ?? '—'} °C, {datasheet.environmental?.humidity ?? '—'} %RH, {datasheet.environmental?.pressure ?? '—'} kPa
        </Typography>
        <Table size="small">
          <TableHead><TableRow>
            <TableCell>Point</TableCell><TableCell>Unit</TableCell><TableCell>Nominal</TableCell><TableCell>Standard</TableCell>
            <TableCell>Observed (mean)</TableCell><TableCell>Correction</TableCell><TableCell>Error</TableCell><TableCell>uA</TableCell>
          </TableRow></TableHead>
          <TableBody>
            {datasheet.observations.map((o: any) => (
              <TableRow key={o.id}>
                <TableCell>{o.pointLabel || '—'}</TableCell>
                <TableCell>{o.unit || '—'}</TableCell>
                <TableCell>{o.nominal ?? '—'}</TableCell>
                <TableCell>{o.standardValue ?? '—'}</TableCell>
                <TableCell>{o.observedValue?.toFixed?.(4) ?? '—'}</TableCell>
                <TableCell>{o.correction?.toFixed?.(4) ?? '—'}</TableCell>
                <TableCell>{o.error?.toFixed?.(4) ?? '—'}</TableCell>
                <TableCell>{o.data?.uA != null ? Number(o.data.uA).toExponential(2) : '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <Button variant="contained" sx={{ mt: 2 }} disabled={computeMut.isPending} onClick={() => computeMut.mutate()}>
          Calculate (mean · correction · error · repeatability)
        </Button>
        <Alert severity="info" sx={{ mt: 2 }}>Saved. Use “Calculate”, then go to the Uncertainty tab.</Alert>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 2 }}>
      <Stack direction="row" spacing={2} sx={{ mb: 2 }} alignItems="center">
        <TextField select label="Discipline / Instrument procedure" size="small" value={procId} onChange={(e) => applyProcedure(e.target.value)} sx={{ minWidth: 340 }}>
          {Object.entries(groupedProcedures()).flatMap(([discipline, subs]) => [
            <ListSubheader key={discipline} sx={{ fontWeight: 700, color: 'primary.main' }}>{discipline}</ListSubheader>,
            ...Object.entries(subs).flatMap(([sub, procs]) => [
              <ListSubheader key={`${discipline}-${sub}`} sx={{ pl: 3, fontStyle: 'italic' }}>{sub}</ListSubheader>,
              ...procs.map((p: Procedure) => (
                <MenuItem key={p.id} value={p.id} sx={{ pl: 4 }}>{p.label} ({p.unit})</MenuItem>
              )),
            ]),
          ])}
        </TextField>
        <TextField label="Unit of measurement" size="small" value={unit} onChange={(e) => setUnit(e.target.value)} sx={{ width: 160 }} />
      </Stack>
      <Typography variant="subtitle1" gutterBottom>Environmental conditions</Typography>
      <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
        <TextField label="Temp °C" size="small" value={env.temperature} onChange={(e) => setEnv({ ...env, temperature: e.target.value })} />
        <TextField label="Humidity %RH" size="small" value={env.humidity} onChange={(e) => setEnv({ ...env, humidity: e.target.value })} />
        <TextField label="Pressure kPa" size="small" value={env.pressure} onChange={(e) => setEnv({ ...env, pressure: e.target.value })} />
      </Stack>
      <Typography variant="subtitle1" gutterBottom>Measurement points & readings {unit && `(${unit})`}</Typography>
      <Box sx={{ overflowX: 'auto' }}>
        <Table size="small">
          <TableHead><TableRow>
            <TableCell>Point</TableCell><TableCell>Unit</TableCell><TableCell>Nominal</TableCell><TableCell>Standard</TableCell>
            {Array.from({ length: NREAD }).map((_, j) => <TableCell key={j}>R{j + 1}</TableCell>)}
          </TableRow></TableHead>
          <TableBody>
            {rows.map((r, i) => (
              <TableRow key={i}>
                <TableCell><TextField size="small" sx={{ width: 90 }} value={r.pointLabel} onChange={(e) => setRow(i, { pointLabel: e.target.value })} /></TableCell>
                <TableCell><TextField size="small" sx={{ width: 60 }} value={r.unit} onChange={(e) => setRow(i, { unit: e.target.value })} /></TableCell>
                <TableCell><TextField size="small" sx={{ width: 80 }} value={r.nominal} onChange={(e) => setRow(i, { nominal: e.target.value })} /></TableCell>
                <TableCell><TextField size="small" sx={{ width: 80 }} value={r.standardValue} onChange={(e) => setRow(i, { standardValue: e.target.value })} /></TableCell>
                {r.readings.map((rv, j) => (
                  <TableCell key={j}><TextField size="small" sx={{ width: 70 }} value={rv} onChange={(e) => setReading(i, j, e.target.value)} /></TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Box>
      <Stack direction="row" spacing={1} sx={{ mt: 2 }}>
        <Button onClick={() => setRows([...rows, emptyRow(unit)])}>+ Add Point</Button>
        <Button variant="contained" disabled={createMut.isPending || !rows.some((r) => r.standardValue !== '')} onClick={() => createMut.mutate()}>Save Datasheet</Button>
      </Stack>
    </Paper>
  );
}

function UncertaintyTab({ datasheet, onChanged }: any) {
  const [contributors, setContributors] = useState<any[]>([]);
  const [result, setResult] = useState<any>(null);
  const procedure = useMemo(() => findProcedure(datasheet?.templateName), [datasheet?.templateName]);
  const unit = datasheet?.observations?.[0]?.unit || procedure?.unit || '';

  useEffect(() => {
    if (datasheet?.uncertainty) {
      setResult({
        combinedUncertainty: datasheet.uncertainty.combinedUncertainty,
        coverageFactor: datasheet.uncertainty.coverageFactor,
        expandedUncertainty: datasheet.uncertainty.expandedUncertainty,
      });
    }
  }, [datasheet?.id]);

  const maxUA = useMemo(() => {
    const us = (datasheet?.observations || []).map((o: any) => Number(o.data?.uA || 0));
    return us.length ? Math.max(...us) : 0;
  }, [datasheet]);

  const computeMut = useMutation({
    mutationFn: () => computeUncertainty(datasheet.id, contributors.map((c) => ({
      source: c.source, type: c.type, value: Number(c.value),
      distribution: c.distribution || undefined, divisor: c.divisor ? Number(c.divisor) : undefined,
      sensitivity: c.sensitivity ? Number(c.sensitivity) : 1, unit: c.unit,
    }))),
    onSuccess: (res: any) => { setResult(res.result); onChanged(); },
  });

  if (!datasheet) return <Alert severity="warning">Create and calculate a datasheet first (tab 1).</Alert>;

  const add = (c: any) => setContributors((cs) => [...cs, c]);
  const setC = (i: number, patch: any) => setContributors(contributors.map((c, idx) => idx === i ? { ...c, ...patch } : c));
  const loadDefaults = () => {
    const list: any[] = [{ source: 'Repeatability', type: 'A', value: maxUA.toExponential(4), divisor: 1, sensitivity: 1, unit }];
    if (procedure) procedure.typeB.forEach((b) => list.push({ ...b, type: 'B', value: String(b.value) }));
    setContributors(list);
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="subtitle1" gutterBottom>Uncertainty budget (GUM) {unit && `— ${unit}`}</Typography>
      <Stack direction="row" spacing={1} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
        <Button variant="outlined" onClick={loadDefaults}>Load {procedure ? procedure.label : 'default'} contributors</Button>
        <Button onClick={() => add({ source: 'Repeatability', type: 'A', value: maxUA.toExponential(4), divisor: 1, sensitivity: 1, unit })}>+ Type A</Button>
        <Button onClick={() => add({ source: '', type: 'B', value: '', distribution: 'normal', divisor: 2, sensitivity: 1, unit })}>+ Type B</Button>
      </Stack>
      <Table size="small">
        <TableHead><TableRow>
          <TableCell>Source</TableCell><TableCell>Type</TableCell><TableCell>Value</TableCell><TableCell>Unit</TableCell>
          <TableCell>Distribution</TableCell><TableCell>Divisor</TableCell><TableCell>Sensitivity</TableCell>
        </TableRow></TableHead>
        <TableBody>
          {contributors.map((c, i) => (
            <TableRow key={i}>
              <TableCell><TextField size="small" value={c.source} onChange={(e) => setC(i, { source: e.target.value })} /></TableCell>
              <TableCell>{c.type}</TableCell>
              <TableCell><TextField size="small" sx={{ width: 100 }} value={c.value} onChange={(e) => setC(i, { value: e.target.value })} /></TableCell>
              <TableCell><TextField size="small" sx={{ width: 60 }} value={c.unit || ''} onChange={(e) => setC(i, { unit: e.target.value })} /></TableCell>
              <TableCell>
                <TextField select size="small" sx={{ width: 120 }} value={c.distribution || ''} onChange={(e) => setC(i, { distribution: e.target.value })}>
                  <MenuItem value="">—</MenuItem>
                  {DISTRIBUTIONS.map((d) => <MenuItem key={d} value={d}>{d}</MenuItem>)}
                </TextField>
              </TableCell>
              <TableCell><TextField size="small" sx={{ width: 70 }} value={c.divisor ?? ''} onChange={(e) => setC(i, { divisor: e.target.value })} /></TableCell>
              <TableCell><TextField size="small" sx={{ width: 70 }} value={c.sensitivity ?? 1} onChange={(e) => setC(i, { sensitivity: e.target.value })} /></TableCell>
            </TableRow>
          ))}
          {contributors.length === 0 && <TableRow><TableCell colSpan={7}>Load defaults or add contributors above.</TableCell></TableRow>}
        </TableBody>
      </Table>
      <Button variant="contained" sx={{ mt: 2 }} disabled={!contributors.length || computeMut.isPending} onClick={() => computeMut.mutate()}>
        Compute Combined & Expanded Uncertainty
      </Button>
      {result && (
        <Box sx={{ mt: 2 }}>
          <Divider sx={{ mb: 1 }} />
          <Typography variant="body2">Combined standard uncertainty u_c = <b>{Number(result.combinedUncertainty).toExponential(3)} {unit}</b></Typography>
          <Typography variant="body2">Coverage factor k = <b>{Number(result.coverageFactor).toFixed(2)}</b></Typography>
          <Typography variant="body1">Expanded uncertainty U = <b>±{Number(result.expandedUncertainty).toExponential(3)} {unit}</b> (≈95%)</Typography>
        </Box>
      )}
    </Paper>
  );
}

function CertificateTab({ job, onChanged }: any) {
  const cert = job.certificate;
  const genMut = useMutation({ mutationFn: () => generateCertificate({ jobId: job.id, type: 'NABL' }), onSuccess: onChanged });
  const signMut = useMutation({ mutationFn: (stage: string) => signCertificate(cert.id, stage), onSuccess: onChanged });

  if (!cert) {
    return (
      <Paper sx={{ p: 2 }}>
        {job.status === 'APPROVED'
          ? <Button variant="contained" disabled={genMut.isPending} onClick={() => genMut.mutate()}>Generate Certificate</Button>
          : <Alert severity="info">Advance the job to <b>APPROVED</b> (Jobs page → status buttons) to generate the certificate. Current: {job.status}</Alert>}
      </Paper>
    );
  }

  const signed = (cert.signatures || []).map((s: any) => s.stage);
  const next = SIG_STAGES[signed.length];
  return (
    <Paper sx={{ p: 2 }}>
      <Typography variant="subtitle1">{cert.certificateNumber} — {cert.type}</Typography>
      <Typography variant="body2" gutterBottom>Locked (immutable): <b>{cert.isLocked ? 'Yes' : 'No'}</b></Typography>
      <Stack spacing={1} sx={{ my: 1 }}>
        {SIG_STAGES.map((st) => {
          const sig = (cert.signatures || []).find((s: any) => s.stage === st);
          return (
            <Box key={st} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Chip size="small" color={sig ? 'success' : 'default'} label={st} />
              <Typography variant="caption">{sig ? `signed by ${sig.signedByName}` : 'pending'}</Typography>
            </Box>
          );
        })}
      </Stack>
      <Stack direction="row" spacing={1}>
        {!cert.isLocked && next && <Button variant="contained" disabled={signMut.isPending} onClick={() => signMut.mutate(next)}>Sign as {next}</Button>}
        <Button variant="outlined" onClick={() => openCertificateReport(cert.id)}>Open printable certificate</Button>
      </Stack>
      {cert.isLocked && <Chip color="success" label="Finalised & immutable" sx={{ mt: 2 }} />}
    </Paper>
  );
}
