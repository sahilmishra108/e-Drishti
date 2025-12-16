import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Dashboard from "@/components/Dashboard";
import CameraFeed from "@/components/CameraFeed";
import VideoProcessor from "@/components/VideoProcessor";

import { Activity, Camera, FileVideo } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import { useEffect, useState } from "react";



const DashboardPage = () => {
  const [searchParams] = useSearchParams();
  const [defaultTab, setDefaultTab] = useState("dashboard");

  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && ["dashboard", "camera", "video"].includes(tab)) {
      setDefaultTab(tab);
    }
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-background overflow-hidden font-sans selection:bg-primary/20 selection:text-primary">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px] animate-grid-flow"></div>
        <div className="absolute top-0 left-0 right-0 h-full bg-gradient-to-br from-primary/5 via-background to-secondary/5"></div>
        <div className="absolute top-[10%] left-[20%] w-[30%] h-[30%] rounded-full bg-primary/5 blur-[100px] animate-pulse-glow"></div>
        <div className="absolute bottom-[10%] right-[20%] w-[25%] h-[25%] rounded-full bg-secondary/5 blur-[80px] animate-pulse-glow" style={{ animationDelay: '1.5s' }}></div>
      </div>

      {/* Top-left logo */}
      <div className="absolute top-6 left-6 z-20 animate-slide-in-right">
        <Link to="/" className="transition-transform hover:scale-105 block">
          <img
            src="/PATH_Logo_Color (1).png"
            alt="PATH Logo"
            className="h-10 w-auto drop-shadow-sm"
          />
        </Link>
      </div>

      {/* Top-right notification bell and home */}
      <div className="absolute top-6 right-6 z-20 flex items-center gap-4 animate-slide-in-right">

        <Link to="/">
          <Button variant="outline" size="sm" className="bg-white/50 backdrop-blur-sm border-slate-200 hover:bg-white hover:border-primary/50 transition-all hover:scale-105 shadow-sm rounded-full px-4">
            <Home className="w-4 h-4 mr-2 text-primary" />
            Home
          </Button>
        </Link>
      </div>

      <div className="relative z-10 p-6 pt-24 min-h-screen">
        <div className="max-w-7xl mx-auto space-y-8">

          <Tabs defaultValue={defaultTab} className="space-y-8 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            <div className="flex justify-center">
              <TabsList className="grid w-full grid-cols-3 max-w-2xl mx-auto bg-white/40 backdrop-blur-md border border-white/20 shadow-lg">
                <TabsTrigger value="dashboard" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-primary">
                  <Activity className="w-4 h-4" />
                  Dashboard
                </TabsTrigger>
                <TabsTrigger value="camera" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-primary">
                  <Camera className="w-4 h-4" />
                  Live Camera Feed
                </TabsTrigger>
                <TabsTrigger value="video" className="flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-primary">
                  <FileVideo className="w-4 h-4" />
                  Video Analysis
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="dashboard" className="space-y-6 animate-scale-in">
              <Dashboard patientId={searchParams.get("patientId")} />
            </TabsContent>

            <TabsContent value="camera" className="space-y-6 animate-scale-in">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-bold text-foreground">Camera Feed</h2>
              </div>

              <div className="grid grid-cols-1 gap-6">
                <CameraFeed patientId={searchParams.get("patientId")} />
              </div>
            </TabsContent>

            <TabsContent value="video" className="space-y-6 animate-scale-in">
              <VideoProcessor patientId={searchParams.get("patientId")} />
            </TabsContent>
          </Tabs>

          {/* Footer */}
          <footer className="text-center py-8 text-sm text-muted-foreground border-t border-border/50 mt-12">
            <p className="flex items-center justify-center gap-2">
              Powered by <span className="font-bold text-primary">PATH</span>
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;

