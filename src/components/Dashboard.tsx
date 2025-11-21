import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { TrendingUp, Filter, Download, RefreshCw } from 'lucide-react';
import { io } from 'socket.io-client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import VitalNotifications from './VitalNotifications';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface VitalRecord {
  id?: string;
  created_at: string;
  hr: number | null;
  pulse: number | null;
  spo2: number | null;
  etco2: number | null;
  abp: string | null;
  pap: string | null;
  awrr: number | null;
  source?: string;
}

const Dashboard = () => {
  const [vitalsHistory, setVitalsHistory] = useState<VitalRecord[]>([]);
  const [filteredVitals, setFilteredVitals] = useState<VitalRecord[]>([]);
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

    // Connect to Socket.io server
    const socket = io('http://localhost:3000');

    socket.on('vital-update', () => {
      fetchVitalsHistory();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    applyDateFilter();
  }, [vitalsHistory, dateFrom, dateTo]);

  const fetchVitalsHistory = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/vitals?limit=1000');
      if (response.ok) {
        const data = await response.json();
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
      .reverse()
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
    <div className="space-y-6">
      {/* Banner Image */}
      <div className="relative w-full h-64 md:h-80 rounded-lg overflow-hidden">
        <img
          src="/Gemini_Generated_Image_6xwqr56xwqr56xwq.png"
          alt="Patient Monitoring"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end">
          <div className="p-6 text-white">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Patient Vitals Dashboard</h1>
            <p className="text-sm md:text-base text-white/90">
              View patient vital signs and trends
            </p>
          </div>
        </div>
      </div>

      {/* Date Filter */}
      <Card className="p-6 bg-card border-border">
        <div className="flex items-center gap-3 mb-4">
          <Filter className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold text-foreground">Filter by Date</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              Start Date
            </label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-foreground mb-2 block">
              End Date
            </label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={clearFilters}
              className="w-full"
            >
              Reset
            </Button>
          </div>
        </div>
        {(dateFrom || dateTo) && (
          <p className="text-sm text-muted-foreground mt-4">
            Found {filteredVitals.length} records
            {dateFrom && ` from ${dateFrom}`}
            {dateTo && ` to ${dateTo}`}
          </p>
        )}
      </Card>

      {/* Vital Notifications */}
      <VitalNotifications vitals={filteredVitals.length > 0 ? filteredVitals : vitalsHistory} />

      {/* Average Vitals */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        <Card className="p-4 bg-card border-border">
          <p className="text-xs text-muted-foreground uppercase">Avg HR</p>
          <p className="text-2xl font-bold text-foreground">{averages.hr}</p>
          <p className="text-xs text-muted-foreground">bpm</p>
        </Card>
        <Card className="p-4 bg-card border-border">
          <p className="text-xs text-muted-foreground uppercase">Avg Pulse</p>
          <p className="text-2xl font-bold text-foreground">{averages.pulse}</p>
          <p className="text-xs text-muted-foreground">bpm</p>
        </Card>
        <Card className="p-4 bg-card border-border">
          <p className="text-xs text-muted-foreground uppercase">Avg SpO2</p>
          <p className="text-2xl font-bold text-foreground">{averages.spo2}</p>
          <p className="text-xs text-muted-foreground">%</p>
        </Card>
        <Card className="p-4 bg-card border-border">
          <p className="text-xs text-muted-foreground uppercase">Avg ABP Sys</p>
          <p className="text-2xl font-bold text-foreground">{averages.abpSys}</p>
          <p className="text-xs text-muted-foreground">mmHg</p>
        </Card>
        <Card className="p-4 bg-card border-border">
          <p className="text-xs text-muted-foreground uppercase">Avg PAP Dia</p>
          <p className="text-2xl font-bold text-foreground">{averages.papDia}</p>
          <p className="text-xs text-muted-foreground">mmHg</p>
        </Card>
        <Card className="p-4 bg-card border-border">
          <p className="text-xs text-muted-foreground uppercase">Avg EtCO2</p>
          <p className="text-2xl font-bold text-foreground">{averages.etco2}</p>
          <p className="text-xs text-muted-foreground">mmHg</p>
        </Card>
        <Card className="p-4 bg-card border-border">
          <p className="text-xs text-muted-foreground uppercase">Avg awRR</p>
          <p className="text-2xl font-bold text-foreground">{averages.awrr}</p>
          <p className="text-xs text-muted-foreground">/min</p>
        </Card>
      </div>

      {/* Charts */}
      <Card className="p-6 bg-card border-border">
        <h2 className="text-xl font-bold text-foreground mb-4">Heart Rate and Pulse</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" />
            <YAxis stroke="hsl(var(--muted-foreground))" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))'
              }}
            />
            <Legend />
            <Line type="monotone" dataKey="HR" stroke="hsl(var(--primary))" strokeWidth={2} />
            <Line type="monotone" dataKey="Pulse" stroke="hsl(var(--vital-success))" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      <Card className="p-6 bg-card border-border">
        <h2 className="text-xl font-bold text-foreground mb-4">Oxygen and Carbon Dioxide</h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" />
            <YAxis stroke="hsl(var(--muted-foreground))" />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))'
              }}
            />
            <Legend />
            <Line type="monotone" dataKey="SpO2" stroke="hsl(var(--chart-2))" strokeWidth={2} />
            <Line type="monotone" dataKey="EtCO2" stroke="hsl(var(--chart-3))" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Real-Time Monitoring Data Table */}
      <Card className="p-6 bg-card border-border">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Real-Time Monitoring Data</h2>
            <p className="text-sm text-muted-foreground">
              Complete record of all vital signs monitoring sessions
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={fetchVitalsHistory}
              className="gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={exportToCSV}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Export CSV
            </Button>
          </div>
        </div>

        <div className="rounded-lg border border-border overflow-hidden">
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-muted z-10">
                <TableRow className="hover:bg-muted/50">
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
                  .reverse()
                  .slice(0, 100)
                  .map((record, index) => (
                    <TableRow
                      key={record.id || index}
                      className="hover:bg-muted/30 transition-colors"
                    >
                      <TableCell className="font-medium text-foreground">
                        {new Date(record.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${record.source === 'camera'
                            ? 'bg-blue-100 text-blue-700'
                            : record.source === 'video'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}>
                          {record.source?.toUpperCase() || 'N/A'}
                        </span>
                      </TableCell>
                      <TableCell className={`text-center font-semibold ${getStatusColor(record.hr, 'hr')}`}>
                        {record.hr ?? 'N/A'}
                      </TableCell>
                      <TableCell className={`text-center font-semibold ${getStatusColor(record.pulse, 'hr')}`}>
                        {record.pulse ?? 'N/A'}
                      </TableCell>
                      <TableCell className={`text-center font-semibold ${getStatusColor(record.spo2, 'spo2')}`}>
                        {record.spo2 ?? 'N/A'}
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {record.abp ?? 'N/A'}
                      </TableCell>
                      <TableCell className="text-center font-medium">
                        {record.pap ?? 'N/A'}
                      </TableCell>
                      <TableCell className={`text-center font-semibold ${getStatusColor(record.etco2, 'etco2')}`}>
                        {record.etco2 ?? 'N/A'}
                      </TableCell>
                      <TableCell className={`text-center font-semibold ${getStatusColor(record.awrr, 'awrr')}`}>
                        {record.awrr ?? 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
                {((filteredVitals.length > 0 ? filteredVitals : vitalsHistory).length === 0) && (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                      No monitoring data available. Start capturing from Camera or Video tab to see real-time data.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="p-4 border-t border-border bg-muted/30">
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