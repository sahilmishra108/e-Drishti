import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, Camera, Plus, X, Monitor, ChevronRight, Activity } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CameraFeed from "@/components/CameraFeed";

interface ICU {
    icu_id: number;
    icu_name: string;
}

interface Patient {
    patient_id: number;
    patient_name: string;
    icu_id: number | null;
}

interface MonitorSlot {
    id: number;
    icuId: string | null;
    patientId: string | null;
    status: 'selecting' | 'active';
}

const MultiCameraView = () => {
    const [monitors, setMonitors] = useState<MonitorSlot[]>([]);
    const [icus, setIcus] = useState<ICU[]>([]);
    const [patients, setPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(true);

    // Fetch initial data
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [icusRes, patientsRes] = await Promise.all([
                    fetch('http://localhost:3000/api/icus'),
                    fetch('http://localhost:3000/api/patients')
                ]);

                const icusData = await icusRes.json();
                const patientsData = await patientsRes.json();

                setIcus(icusData);
                setPatients(patientsData);
                setLoading(false);
            } catch (error) {
                console.error("Error fetching data:", error);
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    const addMonitorSlot = () => {
        const newId = Date.now();
        setMonitors(prev => [...prev, {
            id: newId,
            icuId: null,
            patientId: null,
            status: 'selecting'
        }]);
    };

    const removeMonitor = (id: number) => {
        setMonitors(prev => prev.filter(m => m.id !== id));
    };

    const updateMonitorSelection = (id: number, field: 'icuId' | 'patientId', value: string) => {
        setMonitors(prev => prev.map(m => {
            if (m.id === id) {
                // If changing ICU, reset patient
                if (field === 'icuId') {
                    return { ...m, icuId: value, patientId: null };
                }
                return { ...m, [field]: value };
            }
            return m;
        }));
    };

    const startMonitoring = (id: number) => {
        setMonitors(prev => prev.map(m =>
            m.id === id ? { ...m, status: 'active' } : m
        ));
    };

    const getFilteredPatients = (icuId: string | null) => {
        if (!icuId) return [];
        return patients.filter(p => p.icu_id?.toString() === icuId);
    };

    return (
        <div className="min-h-screen bg-background overflow-hidden font-sans selection:bg-primary/20 selection:text-primary">
            {/* Dynamic Background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px] animate-grid-flow"></div>
                <div className="absolute top-0 left-0 right-0 h-full bg-gradient-to-br from-primary/5 via-background to-secondary/5"></div>
            </div>

            {/* Header */}
            <div className="relative z-20 p-6 flex items-center justify-between bg-white/70 backdrop-blur-xl border-b border-white/20 shadow-sm">
                <div className="flex items-center gap-4">
                    <Link to="/" className="transition-transform hover:scale-105 block">
                        <img
                            src="/PATH_Logo_Color (1).png"
                            alt="PATH Logo"
                            className="h-10 w-auto drop-shadow-sm"
                        />
                    </Link>
                    <div className="h-8 w-px bg-slate-200 mx-2"></div>
                    <h1 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        <Monitor className="w-5 h-5 text-primary" />
                        Multi-Patient Live Monitoring
                    </h1>
                </div>

                <div className="flex items-center gap-4">
                    <Button onClick={addMonitorSlot} className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-primary/25 transition-all">
                        <Plus className="w-4 h-4 mr-2" />
                        Add Monitor
                    </Button>
                    <Link to="/">
                        <Button variant="outline" size="sm" className="bg-white/50 backdrop-blur-sm hover:bg-white transition-all">
                            <Home className="w-4 h-4 mr-2 text-primary" />
                            Home
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Main Content */}
            <div className="relative z-10 p-6 min-h-[calc(100vh-88px)] overflow-y-auto">
                {monitors.length === 0 ? (
                    <div className="h-[60vh] flex flex-col items-center justify-center text-center space-y-6 animate-fade-in-up">
                        <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                            <Monitor className="w-12 h-12 text-primary/60" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-700">No Active Monitors</h2>
                        <p className="text-slate-500 max-w-md">
                            Start by adding a monitor slot to select a patient for real-time Tele-ICU vitals tracking.
                        </p>
                        <Button onClick={addMonitorSlot} size="lg" className="bg-primary hover:bg-primary/90 shadow-xl hover:shadow-primary/25 transition-all hover:scale-105">
                            <Plus className="w-5 h-5 mr-2" />
                            Add First Monitor
                        </Button>
                    </div>
                ) : (
                    <div className={`grid grid-cols-1 ${monitors.length > 1 ? 'lg:grid-cols-2' : ''} xl:grid-cols-2 2xl:grid-cols-3 gap-6 animate-fade-in-up`}>
                        {monitors.map((monitor, index) => (
                            <div key={monitor.id} className="relative group animate-scale-in" style={{ animationDelay: `${index * 0.1}s` }}>

                                {monitor.status === 'selecting' ? (
                                    // Selection State
                                    <Card className="h-full min-h-[400px] border-dashed border-2 border-slate-300 bg-slate-50/50 flex flex-col items-center justify-center p-8 relative overflow-hidden">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="absolute top-2 right-2 hover:bg-red-50 hover:text-red-500 rounded-full"
                                            onClick={() => removeMonitor(monitor.id)}
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>

                                        <div className="w-full max-w-xs space-y-6 relative z-10">
                                            <div className="text-center space-y-2 mb-8">
                                                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mx-auto text-primary mb-3">
                                                    <Activity className="w-6 h-6" />
                                                </div>
                                                <h3 className="text-lg font-semibold">Configure Monitor</h3>
                                                <p className="text-sm text-muted-foreground">Select ICU and Patient to start</p>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Step 1: Select ICU</label>
                                                    <Select
                                                        value={monitor.icuId || ""}
                                                        onValueChange={(val) => updateMonitorSelection(monitor.id, 'icuId', val)}
                                                    >
                                                        <SelectTrigger className="w-full bg-white">
                                                            <SelectValue placeholder="Select ICU Unit" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {icus.map(icu => (
                                                                <SelectItem key={icu.icu_id} value={icu.icu_id.toString()}>
                                                                    {icu.icu_name}
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <div className="space-y-2">
                                                    <label className="text-xs font-medium text-slate-500 uppercase tracking-wider">Step 2: Select Patient</label>
                                                    <Select
                                                        value={monitor.patientId || ""}
                                                        onValueChange={(val) => updateMonitorSelection(monitor.id, 'patientId', val)}
                                                        disabled={!monitor.icuId}
                                                    >
                                                        <SelectTrigger className="w-full bg-white">
                                                            <SelectValue placeholder="Select Patient" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {getFilteredPatients(monitor.icuId).map(patient => (
                                                                <SelectItem key={patient.patient_id} value={patient.patient_id.toString()}>
                                                                    {patient.patient_name} (ID: #{patient.patient_id})
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>

                                                <Button
                                                    className="w-full mt-4"
                                                    disabled={!monitor.patientId}
                                                    onClick={() => startMonitoring(monitor.id)}
                                                >
                                                    Start Live Feed
                                                    <ChevronRight className="w-4 h-4 ml-2" />
                                                </Button>
                                            </div>
                                        </div>
                                    </Card>
                                ) : (
                                    // Active Monitoring State
                                    <div className="relative bg-background rounded-xl border shadow-lg overflow-hidden">
                                        <div className="absolute top-2 right-2 z-20 flex gap-2">
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                className="h-8 px-2 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => removeMonitor(monitor.id)}
                                            >
                                                <X className="w-4 h-4 mr-1" /> Remove
                                            </Button>
                                        </div>
                                        <div className="p-1">
                                            <div className="bg-slate-900/5 px-4 py-2 border-b flex justify-between items-center mb-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
                                                    <span className="font-semibold text-sm">
                                                        Patient: {patients.find(p => p.patient_id.toString() === monitor.patientId)?.patient_name}
                                                    </span>
                                                </div>
                                                <span className="text-xs text-muted-foreground uppercase font-mono">
                                                    {icus.find(i => i.icu_id.toString() === monitor.icuId)?.icu_name}
                                                </span>
                                            </div>
                                            <CameraFeed patientId={monitor.patientId} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default MultiCameraView;
