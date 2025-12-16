
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Activity, Search, Calendar, FileText, Building2, MapPin, ArrowLeft } from "lucide-react";
import AddPatientDialog from "@/components/AddPatientDialog";
import DeletePatientDialog from "@/components/DeletePatientDialog";
import AddICUDialog from "@/components/AddICUDialog";
import DeleteICUDialog from "@/components/DeleteICUDialog";

interface Patient {
    patient_id: number;
    patient_name: string;
    age: number;
    gender: string;
    diagnosis: string;
    admission_date: string;
    bed_id: number | null;
    bed_number?: string;
    icu_id: number | null;
}

interface ICU {
    icu_id: number;
    icu_name: string;
    location: string;
    created_at: string;
}

const PatientRecords = () => {
    const [viewMode, setViewMode] = useState<'icus' | 'patients'>('icus');
    const [icus, setIcus] = useState<ICU[]>([]);
    const [selectedICU, setSelectedICU] = useState<ICU | null>(null);

    const [patients, setPatients] = useState<Patient[]>([]);
    const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");
    const [icuSearchQuery, setIcuSearchQuery] = useState("");
    const [dateFilter, setDateFilter] = useState({ start: "", end: "" });

    const fetchICUs = async () => {
        try {
            const res = await fetch('http://localhost:3000/api/icus');
            const data = await res.json();
            setIcus(data);
        } catch (error) {
            console.error("Error fetching ICUs:", error);
        }
    };

    const fetchPatients = async () => {
        try {
            const res = await fetch('http://localhost:3000/api/patients');
            const data = await res.json();
            setPatients(data);
        } catch (error) {
            console.error("Error fetching patients:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchICUs();
        fetchPatients();
    }, []);

    const filteredIcus = icus.filter(icu =>
        icu.icu_name.toLowerCase().includes(icuSearchQuery.toLowerCase()) ||
        icu.location.toLowerCase().includes(icuSearchQuery.toLowerCase())
    );

    useEffect(() => {
        if (selectedICU) {
            const filtered = patients.filter(patient => {
                const matchesICU = patient.icu_id === selectedICU.icu_id;
                const matchesSearch = (
                    patient.patient_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    patient.patient_id.toString().includes(searchQuery) ||
                    patient.diagnosis.toLowerCase().includes(searchQuery.toLowerCase())
                );

                let matchesDate = true;
                if (dateFilter.start) {
                    matchesDate = matchesDate && new Date(patient.admission_date) >= new Date(dateFilter.start);
                }
                if (dateFilter.end) {
                    matchesDate = matchesDate && new Date(patient.admission_date) <= new Date(dateFilter.end);
                }

                return matchesICU && matchesSearch && matchesDate;
            });
            setFilteredPatients(filtered);
        }
    }, [searchQuery, patients, selectedICU, dateFilter]);

    const handleICUClick = (icu: ICU) => {
        setSelectedICU(icu);
        setViewMode('patients');
    };

    const handleBackToICUs = () => {
        setSelectedICU(null);
        setViewMode('icus');
        setSearchQuery("");
        setIcuSearchQuery("");
        setDateFilter({ start: "", end: "" });
    };

    return (
        <div className="min-h-screen bg-background font-sans selection:bg-primary/20 selection:text-primary">
            {/* Dynamic Background */}
            <div className="fixed inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px] animate-grid-flow"></div>
                <div className="absolute top-0 left-0 right-0 h-full bg-gradient-to-br from-primary/5 via-background to-secondary/5"></div>
            </div>

            {/* Header Section */}
            <div className="sticky top-0 z-30 bg-white/70 backdrop-blur-xl border-b border-white/20 shadow-sm transition-all duration-300">
                <div className="max-w-7xl mx-auto px-6 py-4">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            {viewMode === 'patients' && (
                                <Button variant="ghost" onClick={handleBackToICUs} className="mr-2">
                                    <ArrowLeft className="w-5 h-5" />
                                </Button>
                            )}
                            <div className="p-2.5 bg-primary/10 rounded-xl text-primary">
                                {viewMode === 'icus' ? <Building2 className="w-6 h-6" /> : <FileText className="w-6 h-6" />}
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-foreground tracking-tight">
                                    {viewMode === 'icus' ? 'Intensive Care Units' : `${selectedICU?.icu_name} - Patients`}
                                </h1>
                                <p className="text-sm text-muted-foreground">
                                    {viewMode === 'icus' ? 'Manage your hospital units' : `Managing patients in ${selectedICU?.location}`}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <Link to="/">
                                <Button variant="ghost" className="text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-full">
                                    Back to Home
                                </Button>
                            </Link>
                            {viewMode === 'icus' ? (
                                <AddICUDialog onICUAdded={fetchICUs} />
                            ) : (
                                <AddPatientDialog onPatientAdded={fetchPatients} icuId={selectedICU?.icu_id} />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="relative z-10 max-w-7xl mx-auto px-6 py-8">

                {viewMode === 'icus' ? (
                    // ICU Grid View
                    <>
                        <div className="mb-8 flex flex-col sm:flex-row gap-4 max-w-md">
                            <div className="relative flex-1 group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                    placeholder="Search ICU by name or location..."
                                    className="pl-10 bg-white/50 border-border focus:border-primary/50 focus:ring-primary/20 transition-all rounded-full shadow-sm hover:bg-white/80"
                                    value={icuSearchQuery}
                                    onChange={(e) => setIcuSearchQuery(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up">
                            {filteredIcus.map((icu) => (
                                <Card
                                    key={icu.icu_id}
                                    className="group cursor-pointer hover:shadow-2xl transition-all duration-300 border-white/20 hover:border-primary/20 bg-white/60 backdrop-blur-md overflow-hidden rounded-2xl hover:-translate-y-1"
                                    onClick={() => handleICUClick(icu)}
                                >
                                    <div className="h-1.5 w-full bg-gradient-to-r from-primary to-secondary opacity-80 group-hover:opacity-100 transition-opacity"></div>
                                    <CardHeader className="pb-3 pt-5">
                                        <div className="flex justify-between items-start">
                                            <div className="flex items-center gap-3">
                                                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center text-primary font-bold text-xl group-hover:scale-110 transition-transform shadow-inner">
                                                    <Building2 className="w-6 h-6" />
                                                </div>
                                                <div>
                                                    <CardTitle className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                                                        {icu.icu_name}
                                                    </CardTitle>
                                                    <div className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mt-1">
                                                        <MapPin className="w-3 h-3" /> {icu.location || 'Unknown Location'}
                                                    </div>
                                                </div>
                                            </div>
                                            <DeleteICUDialog
                                                icuId={icu.icu_id}
                                                icuName={icu.icu_name}
                                                onICUDeleted={fetchICUs}
                                            />
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-sm text-muted-foreground">
                                            Click to view patients in this unit.
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                            {icus.length === 0 && (
                                <div className="col-span-full text-center py-24 bg-white/40 backdrop-blur-sm rounded-3xl border border-dashed border-slate-300/50">
                                    <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                                        <Building2 className="w-10 h-10 text-muted-foreground/50" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-foreground">No ICU Units Found</h3>
                                    <p className="text-muted-foreground max-w-sm mx-auto mt-2">
                                        Create your first Intensive Care Unit to start adding patients.
                                    </p>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    // Patient List View
                    <>
                        {/* Search and Filter Bar */}
                        <div className="mb-8 flex flex-col lg:flex-row gap-4">
                            <div className="relative flex-1 max-w-md group">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                    placeholder="Search by name, ID, or diagnosis..."
                                    className="pl-10 bg-white/50 border-border focus:border-primary/50 focus:ring-primary/20 transition-all rounded-full shadow-sm hover:bg-white/80"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>

                            <div className="flex flex-col sm:flex-row gap-2 items-center">
                                <div className="flex items-center gap-2 bg-white/50 px-3 py-1.5 rounded-full border border-white/20 shadow-sm">
                                    <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">From:</span>
                                    <Input
                                        type="date"
                                        className="h-8 w-auto bg-transparent border-0 focus-visible:ring-0 p-0 text-sm"
                                        value={dateFilter.start}
                                        onChange={(e) => setDateFilter(prev => ({ ...prev, start: e.target.value }))}
                                    />
                                </div>
                                <div className="flex items-center gap-2 bg-white/50 px-3 py-1.5 rounded-full border border-white/20 shadow-sm">
                                    <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">To:</span>
                                    <Input
                                        type="date"
                                        className="h-8 w-auto bg-transparent border-0 focus-visible:ring-0 p-0 text-sm"
                                        value={dateFilter.end}
                                        onChange={(e) => setDateFilter(prev => ({ ...prev, end: e.target.value }))}
                                    />
                                </div>
                                {(dateFilter.start || dateFilter.end) && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setDateFilter({ start: "", end: "" })}
                                        className="text-muted-foreground hover:text-destructive h-8 px-2"
                                    >
                                        Clear Dates
                                    </Button>
                                )}
                            </div>

                            <div className="flex items-center gap-2 text-sm text-muted-foreground ml-auto bg-white/50 px-4 py-2 rounded-full border border-white/20 shadow-sm whitespace-nowrap">
                                <span className="font-bold text-primary">{filteredPatients.length}</span> patients found
                            </div>
                        </div>

                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="h-64 bg-muted/50 rounded-2xl animate-pulse"></div>
                                ))}
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in-up">
                                {filteredPatients.map((patient) => (
                                    <Card key={patient.patient_id} className="group hover:shadow-2xl transition-all duration-300 border-white/20 hover:border-primary/20 bg-white/60 backdrop-blur-md overflow-hidden rounded-2xl hover:-translate-y-1">
                                        <div className="h-1.5 w-full bg-gradient-to-r from-primary to-secondary opacity-80 group-hover:opacity-100 transition-opacity"></div>
                                        <CardHeader className="pb-3 pt-5">
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center text-primary font-bold text-xl group-hover:scale-110 transition-transform shadow-inner">
                                                        {patient.patient_name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <CardTitle className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                                                            {patient.patient_name}
                                                        </CardTitle>
                                                        <div className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 mt-1">
                                                            <span className="bg-muted px-2 py-0.5 rounded-md border border-border">ID: #{patient.patient_id}</span>
                                                            {patient.bed_number && (
                                                                <>
                                                                    <span className="bg-secondary/10 px-2 py-0.5 rounded-md text-secondary-foreground border border-secondary/20 font-medium">Bed #{patient.bed_number}</span>
                                                                </>
                                                            )}
                                                        </div>
                                                        <div className="text-xs text-muted-foreground mt-1 flex gap-2">
                                                            <span>{patient.gender}</span>
                                                            <span>•</span>
                                                            <span>{patient.age} yrs</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="relative">
                                                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse absolute top-0 right-0 ring-4 ring-white/50"></div>
                                                    <Activity className="text-muted-foreground/50 w-6 h-6" />
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-4">
                                                <div className="bg-white/50 rounded-xl p-4 border border-white/40 shadow-sm">
                                                    <div className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-1.5 flex items-center gap-1">
                                                        <FileText className="w-3 h-3" /> Diagnosis
                                                    </div>
                                                    <div className="font-medium text-foreground">{patient.diagnosis}</div>
                                                </div>

                                                <div className="flex items-center gap-2 text-sm text-muted-foreground px-1">
                                                    <Calendar className="w-4 h-4 text-primary/60" />
                                                    <span>Admitted: {new Date(patient.admission_date).toLocaleDateString()}</span>
                                                </div>

                                                <div className="pt-2 flex gap-3">
                                                    <Link to={`/dashboard?patientId=${patient.patient_id}`} className="flex-1">
                                                        <Button className="w-full bg-white border border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground font-semibold transition-all shadow-sm hover:shadow-md rounded-xl">
                                                            Patient Dashboard
                                                        </Button>
                                                    </Link>
                                                    <DeletePatientDialog
                                                        patientId={patient.patient_id}
                                                        patientName={patient.patient_name}
                                                        onPatientDeleted={fetchPatients}
                                                    />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                                {filteredPatients.length === 0 && (
                                    <div className="col-span-full text-center py-24 bg-white/40 backdrop-blur-sm rounded-3xl border border-dashed border-slate-300/50">
                                        <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                                            <Search className="w-10 h-10 text-muted-foreground/50" />
                                        </div>
                                        <h3 className="text-xl font-semibold text-foreground">No patients found in this ICU</h3>
                                        <p className="text-muted-foreground max-w-sm mx-auto mt-2">
                                            Try adjusting your search terms or add a new patient to this unit.
                                        </p>
                                        <div className="mt-8">
                                            <AddPatientDialog onPatientAdded={fetchPatients} icuId={selectedICU!.icu_id} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default PatientRecords;
