import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Filter, Download, RefreshCw, Activity, Trash2 } from 'lucide-react';
import { io } from 'socket.io-client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

import ConnectWithPatient from './ConnectWithPatient';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface VitalRecord {
  vital_id?: number;
  created_at: string;
  hr: number | null;
  pulse: number | null;
  spo2: number | null;
  etco2: number | null;
  abp: string | null;
  pap: string | null;
  awrr: number | null;
  source?: string;
  patient_id?: number;
}

interface Patient {
  patient_id: number;
  patient_name: string;
  age: number;
  gender: string;
  diagnosis: string;
  admission_date: string;
  bed_id: number | null;
  bed_number?: string;
  icu_name?: string;
}

interface DashboardProps {
  patientId?: string | null;
}

const Dashboard = ({ patientId }: DashboardProps) => {
  const [vitalsHistory, setVitalsHistory] = useState<VitalRecord[]>([]);
  const [filteredVitals, setFilteredVitals] = useState<VitalRecord[]>([]);
  const [patient, setPatient] = useState<Patient | null>(null);
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [averages, setAverages] = useState({
    hr: 0,
    pulse: 0,
    spo2: 0,
    abpSys: 0,
    papDia: 0,
    etco2: 0,
    awrr: 0
  });

  useEffect(() => {
    fetchVitalsHistory();
    if (patientId) {
      fetchPatientDetails();
    }

    // Connect to Socket.io server
    const socket = io('http://localhost:3000');

    if (patientId) {
      socket.emit('join-patient', patientId);
    }

    socket.on('vital-update', () => {
      fetchVitalsHistory();
    });

    return () => {
      socket.disconnect();
    };
  }, [patientId]);

  useEffect(() => {
    applyDateFilter();
  }, [vitalsHistory, dateFrom, dateTo]);

  const fetchPatientDetails = async () => {
    try {
      const response = await fetch(`http://localhost:3000/api/patients/${patientId}`);
      if (response.ok) {
        const data = await response.json();
        setPatient(data);
      }
    } catch (error) {
      console.error('Error fetching patient:', error);
    }
  };

  const fetchVitalsHistory = async () => {
    try {
      const url = patientId
        ? `http://localhost:3000/api/vitals/${patientId}`
        : 'http://localhost:3000/api/vitals?limit=1000';

      console.log('[Dashboard] Fetching vitals from:', url);
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        console.log('[Dashboard] Received vitals:', data.length, 'records');
        console.log('[Dashboard] Latest vital:', data[data.length - 1]);
        setVitalsHistory(data);
      }
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  const applyDateFilter = () => {
    let filtered = [...vitalsHistory];

    if (dateFrom) {
      const fromDate = new Date(`${dateFrom}T00:00:00`);
      filtered = filtered.filter(
        (v) => new Date(v.created_at) >= fromDate
      );
    }

    if (dateTo) {
      const toDate = new Date(`${dateTo}T23:59:59`);
      filtered = filtered.filter(
        (v) => new Date(v.created_at) <= toDate
      );
    }

    setFilteredVitals(filtered);
    calculateAverages(filtered);
  };
  const clearAllVitals = async () => {
    if (!confirm('Are you sure you want to clear ALL vital history? This cannot be undone.')) return;

    try {
      const url = patientId
        ? `http://localhost:3000/api/vitals?patientId=${patientId}`
        : 'http://localhost:3000/api/vitals';

      const response = await fetch(url, {
        method: 'DELETE',
      });

      if (response.ok) {
        setVitalsHistory([]);
        setFilteredVitals([]);
      } else {
        console.error('Failed to clear vitals');
        alert('Failed to clear vitals');
      }
    } catch (error) {
      console.error('Error clearing vitals:', error);
    }
  };

  const clearFilters = () => {
    setDateFrom('');
    setDateTo('');
  };

  const calculateAverages = (data: VitalRecord[]) => {
    const validData = data.filter(d => d.hr !== null || d.pulse !== null);
    if (validData.length === 0) return;

    const sum = validData.reduce((acc, curr) => ({
      hr: acc.hr + (curr.hr || 0),
      pulse: acc.pulse + (curr.pulse || 0),
      spo2: acc.spo2 + (curr.spo2 || 0),
      abpSys: acc.abpSys + (curr.abp ? parseInt(curr.abp.split('/')[0]) : 0),
      papDia: acc.papDia + (curr.pap ? parseInt(curr.pap.split('/')[1]) : 0),
      etco2: acc.etco2 + (curr.etco2 || 0),
      awrr: acc.awrr + (curr.awrr || 0)
    }), { hr: 0, pulse: 0, spo2: 0, abpSys: 0, papDia: 0, etco2: 0, awrr: 0 });

    setAverages({
      hr: Math.round(sum.hr / validData.length),
      pulse: Math.round(sum.pulse / validData.length),
      spo2: Math.round(sum.spo2 / validData.length),
      abpSys: Math.round(sum.abpSys / validData.length),
      papDia: Math.round(sum.papDia / validData.length),
      etco2: Math.round(sum.etco2 / validData.length),
      awrr: Math.round(sum.awrr / validData.length)
    });
  };

  const chartData = filteredVitals.map((record) => ({
    time: new Date(record.created_at).toLocaleTimeString(),
    HR: record.hr || 0,
    Pulse: record.pulse || 0,
    SpO2: record.spo2 || 0,
    EtCO2: record.etco2 || 0
  }));

  const exportToCSV = () => {
    const headers = ['Timestamp', 'Source', 'HR (bpm)', 'Pulse (bpm)', 'SpO2 (%)', 'ABP (mmHg)', 'PAP (mmHg)', 'EtCO2 (mmHg)', 'awRR (/min)'];
    const rows = (filteredVitals.length > 0 ? filteredVitals : vitalsHistory)
      .slice()
      .map(record => [
        new Date(record.created_at).toLocaleString(),
        record.source || 'N/A',
        record.hr ?? 'N/A',
        record.pulse ?? 'N/A',
        record.spo2 ?? 'N/A',
        record.abp ?? 'N/A',
        record.pap ?? 'N/A',
        record.etco2 ?? 'N/A',
        record.awrr ?? 'N/A'
      ]);

    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vitals-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (value: number | null, type: 'hr' | 'spo2' | 'etco2' | 'awrr') => {
    if (value === null) return 'text-muted-foreground';

    if (type === 'hr') {
      if (value < 60 || value > 100) return 'text-red-600 font-semibold';
      if (value < 70 || value > 90) return 'text-yellow-600';
      return 'text-green-600';
    }

    if (type === 'spo2') {
      if (value < 90) return 'text-red-600 font-semibold';
      if (value < 95) return 'text-yellow-600';
      return 'text-green-600';
    }

    return 'text-foreground';
  };

  return (
    <div className="space-y-8 animate-fade-in">


      {/* Connect with Patient Button */}
      {patient && (
        <div className="flex justify-end animate-slide-in-right">
          <ConnectWithPatient patientName={patient.patient_name} />
        </div>
      )}

      {/* Banner Image */}
      <div className="relative w-full h-64 md:h-80 rounded-3xl overflow-hidden shadow-2xl animate-scale-in group">
        <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 to-transparent z-10"></div>
        <img
          src="/Gemini_Generated_Image_6xwqr56xwqr56xwq.png"
          alt="Patient Monitoring"
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute inset-0 flex items-center z-20">
          <div className="p-8 md:p-12 text-white max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs font-medium mb-4">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              Live Monitoring
            </div>
            <h1 className="text-3xl md:text-5xl font-bold mb-4 tracking-tight">
              {patient ? `${patient.patient_name}'s Dashboard` : 'Patient Vitals Dashboard'}
            </h1>
            <p className="text-base md:text-lg text-slate-200 font-light leading-relaxed">
              {patient ? (
                <>
                  <span className="font-semibold text-white">{patient.diagnosis}</span>
                  {patient.icu_name && (
                    <>
                      <span className="mx-2">•</span>
                      <span className="font-semibold text-white">{patient.icu_name}</span>
                    </>
                  )}
                  {patient.bed_number && (
                    <>
                      <span className="mx-2">•</span>
                      <span className="font-semibold text-white">Bed {patient.bed_number}</span>
                    </>
                  )}
                  <span className="mx-2">•</span>
                  Admitted {new Date(patient.admission_date).toLocaleDateString()}
                </>
              ) : (
                'View patient vital signs and trends with real-time AI analysis.'
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Date Filter */}
      <Card className="p-6 bg-white/60 backdrop-blur-md border-white/20 shadow-lg rounded-2xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <Filter className="w-5 h-5" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Filter by Date</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              Start Date
            </label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full bg-white/50 border-border focus:ring-primary/20 rounded-xl"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-2 block">
              End Date
            </label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full bg-white/50 border-border focus:ring-primary/20 rounded-xl"
            />
          </div>
          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={clearFilters}
              className="w-full rounded-xl hover:bg-muted/50 border-border"
            >
              Reset Filters
            </Button>
          </div>
        </div>
        {(dateFrom || dateTo) && (
          <p className="text-sm text-muted-foreground mt-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
            Found <span className="font-semibold text-foreground">{filteredVitals.length}</span> records
            {dateFrom && ` from ${dateFrom}`}
            {dateTo && ` to ${dateTo}`}
          </p>
        )}
      </Card>

      {/* Average Vitals */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {[
          { label: 'Avg HR', value: averages.hr, unit: 'bpm', color: 'text-rose-500' },
          { label: 'Avg Pulse', value: averages.pulse, unit: 'bpm', color: 'text-rose-500' },
          { label: 'Avg SpO2', value: averages.spo2, unit: '%', color: 'text-cyan-500' },
          { label: 'Avg ABP Sys', value: averages.abpSys, unit: 'mmHg', color: 'text-amber-500' },
          { label: 'Avg PAP Dia', value: averages.papDia, unit: 'mmHg', color: 'text-amber-500' },
          { label: 'Avg EtCO2', value: averages.etco2, unit: 'mmHg', color: 'text-emerald-500' },
          { label: 'Avg awRR', value: averages.awrr, unit: '/min', color: 'text-blue-500' },
        ].map((item, idx) => (
          <Card key={idx} className="p-4 bg-white/60 backdrop-blur-sm border-white/20 shadow-sm hover:shadow-md transition-all hover:-translate-y-1 rounded-2xl">
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">{item.label}</p>
            <p className={`text-2xl font-bold ${item.color}`}>{item.value}</p>
            <p className="text-xs text-muted-foreground font-medium">{item.unit}</p>
          </Card>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="p-6 bg-white/60 backdrop-blur-md border-white/20 shadow-lg rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-foreground">Heart Rate & Pulse</h2>
            <div className="flex gap-2">
              <span className="flex items-center gap-1 text-xs font-medium text-rose-500"><span className="w-2 h-2 rounded-full bg-rose-500"></span> HR</span>
              <span className="flex items-center gap-1 text-xs font-medium text-rose-300"><span className="w-2 h-2 rounded-full bg-rose-300"></span> Pulse</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
              <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  borderRadius: '12px',
                  border: '1px solid rgba(0,0,0,0.1)',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  fontSize: '12px'
                }}
              />
              <Line type="monotone" dataKey="HR" stroke="#f43f5e" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
              <Line type="monotone" dataKey="Pulse" stroke="#fda4af" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-6 bg-white/60 backdrop-blur-md border-white/20 shadow-lg rounded-2xl">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-foreground">Oxygen Saturation (SpO2)</h2>
            <span className="flex items-center gap-1 text-xs font-medium text-cyan-500"><span className="w-2 h-2 rounded-full bg-cyan-500"></span> SpO2</span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" vertical={false} />
              <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis domain={[80, 100]} stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.9)',
                  borderRadius: '12px',
                  border: '1px solid rgba(0,0,0,0.1)',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                  fontSize: '12px'
                }}
              />
              <Line type="monotone" dataKey="SpO2" stroke="#06b6d4" strokeWidth={3} dot={false} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Real-Time Monitoring Data Table */}
      <Card className="p-6 bg-white/60 backdrop-blur-md border-white/20 shadow-lg rounded-2xl overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-1">Detailed Vitals Log</h2>
            <p className="text-sm text-muted-foreground">
              Complete record of all vital signs monitoring sessions
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchVitalsHistory}
              className="gap-2 rounded-full hover:bg-white border-border"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportToCSV}
              className="gap-2 rounded-full hover:bg-white border-border"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={clearAllVitals}
              className="gap-2 rounded-full shadow-red-500/20"
            >
              <Trash2 className="w-4 h-4" />
              Clear History
            </Button>
          </div>
        </div>

        <div className="rounded-xl border border-white/20 overflow-hidden bg-white/40">
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-muted/80 backdrop-blur-sm z-10">
                <TableRow className="hover:bg-transparent border-b border-white/10">
                  <TableHead className="font-semibold text-foreground min-w-[180px]">Timestamp</TableHead>
                  <TableHead className="font-semibold text-foreground min-w-[100px]">Source</TableHead>
                  <TableHead className="font-semibold text-foreground text-center min-w-[80px]">HR (bpm)</TableHead>
                  <TableHead className="font-semibold text-foreground text-center min-w-[80px]">Pulse (bpm)</TableHead>
                  <TableHead className="font-semibold text-foreground text-center min-w-[90px]">SpO2 (%)</TableHead>
                  <TableHead className="font-semibold text-foreground text-center min-w-[110px]">ABP (mmHg)</TableHead>
                  <TableHead className="font-semibold text-foreground text-center min-w-[110px]">PAP (mmHg)</TableHead>
                  <TableHead className="font-semibold text-foreground text-center min-w-[100px]">EtCO2 (mmHg)</TableHead>
                  <TableHead className="font-semibold text-foreground text-center min-w-[90px]">awRR (/min)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(filteredVitals.length > 0 ? filteredVitals : vitalsHistory)
                  .slice()
                  .slice(0, 100)
                  .map((record, index) => (
                    <TableRow
                      key={record.vital_id || index}
                      className="hover:bg-white/50 transition-colors border-b border-white/10"
                    >
                      <TableCell className="font-medium text-foreground/80">
                        {new Date(record.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${record.source === 'camera'
                          ? 'bg-blue-100/50 text-blue-700 border border-blue-200'
                          : record.source === 'video'
                            ? 'bg-emerald-100/50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100/50 text-slate-700 border border-slate-200'
                          }`}>
                          {record.source?.toUpperCase() || 'N/A'}
                        </span>
                      </TableCell>
                      <TableCell className={`text-center font-bold ${getStatusColor(record.hr, 'hr')}`}>
                        {record.hr ?? '-'}
                      </TableCell>
                      <TableCell className={`text-center font-bold ${getStatusColor(record.pulse, 'hr')}`}>
                        {record.pulse ?? '-'}
                      </TableCell>
                      <TableCell className={`text-center font-bold ${getStatusColor(record.spo2, 'spo2')}`}>
                        {record.spo2 ?? '-'}
                      </TableCell>
                      <TableCell className="text-center font-medium text-muted-foreground">
                        {record.abp ?? '-'}
                      </TableCell>
                      <TableCell className="text-center font-medium text-muted-foreground">
                        {record.pap ?? '-'}
                      </TableCell>
                      <TableCell className={`text-center font-bold ${getStatusColor(record.etco2, 'etco2')}`}>
                        {record.etco2 ?? '-'}
                      </TableCell>
                      <TableCell className={`text-center font-bold ${getStatusColor(record.awrr, 'awrr')}`}>
                        {record.awrr ?? '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                {((filteredVitals.length > 0 ? filteredVitals : vitalsHistory).length === 0) && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-full bg-muted/50 flex items-center justify-center mb-2">
                          <Activity className="w-6 h-6 text-muted-foreground/50" />
                        </div>
                        <p>No monitoring data available</p>
                        <p className="text-xs text-muted-foreground/70">Start capturing from Camera or Video tab to see real-time data.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="p-4 border-t border-white/10 bg-white/20">
            <p className="text-sm text-muted-foreground">
              Showing <span className="font-semibold text-foreground">
                {Math.min(100, (filteredVitals.length > 0 ? filteredVitals : vitalsHistory).length)}
              </span> of <span className="font-semibold text-foreground">
                {(filteredVitals.length > 0 ? filteredVitals : vitalsHistory).length}
              </span> records
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;