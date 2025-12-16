import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Activity, Camera, FileVideo, ArrowRight, Stethoscope, Check, HeartPulse, ShieldCheck, Video } from "lucide-react";

const Home = () => {
  return (
    <div className="min-h-screen bg-background overflow-hidden font-sans selection:bg-primary/20 selection:text-primary">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:24px_24px] animate-grid-flow"></div>
        <div className="absolute top-0 left-0 right-0 h-full bg-gradient-to-b from-primary/5 via-background to-background"></div>
        <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[50%] rounded-full bg-primary/10 blur-[120px] animate-pulse-glow"></div>
        <div className="absolute top-[20%] -left-[10%] w-[40%] h-[40%] rounded-full bg-secondary/10 blur-[100px] animate-pulse-glow" style={{ animationDelay: '2s' }}></div>
      </div>

      {/* Header with PATH Logo */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl border-b border-white/20 shadow-sm animate-fade-in transition-all duration-300">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4 animate-slide-in-right">
            <img
              src="/PATH_Logo_Color (1).png"
              alt="PATH Logo"
              className="h-10 w-auto transition-transform hover:scale-105 drop-shadow-sm"
            />
          </div>
          <div className="flex items-center gap-4">

            <Link to="/multicamera" className="animate-slide-in-right group" style={{ animationDelay: '0.1s' }}>
              <Button variant="outline" className="border-primary/20 hover:bg-primary/5 text-primary hover:text-primary shadow-sm transition-all hover:scale-105 rounded-full px-6 py-2 text-sm font-medium">
                Multi Camera View
                <Camera className="ml-2 w-4 h-4 transition-transform group-hover:scale-110" />
              </Button>
            </Link>
            <Link to="/patients" className="animate-slide-in-right group" style={{ animationDelay: '0.2s' }}>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-primary/25 transition-all hover:scale-105 rounded-full px-6 py-2 text-sm font-medium">
                Patient Records
                <ArrowRight className="ml-2 w-4 h-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </Link>
          </div>
        </div>
      </header>


      {/* Main Content */}
      <div className="relative z-10 pt-32 pb-20 px-6">
        <div className="max-w-7xl mx-auto">

          {/* Hero Section */}
          <div className="relative w-full rounded-[2.5rem] overflow-hidden mb-24 shadow-2xl border border-white/20 animate-scale-in group bg-white/50 backdrop-blur-sm">
            {/* Split Layout Container */}
            <div className="grid lg:grid-cols-2 min-h-[600px]">

              {/* Left Section - Text Content */}
              <div className="relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-10 md:p-16 flex flex-col justify-center overflow-hidden">

                {/* Animated Background Elements */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
                  <div className="absolute -top-24 -left-24 w-96 h-96 bg-primary rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-float"></div>
                  <div className="absolute top-1/2 right-0 w-72 h-72 bg-secondary rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-float" style={{ animationDelay: '2s' }}></div>
                </div>

                {/* Content */}
                <div className="relative z-10 animate-fade-in-up space-y-8">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-md border border-white/10 text-primary-glow text-sm font-medium w-fit shadow-inner">
                    <Activity className="w-4 h-4 text-primary animate-pulse" />
                    <span className="tracking-wide uppercase text-xs font-bold">Next-Gen Tele-ICU Platform</span>
                  </div>

                  <div className="flex items-center gap-4">
                    <img
                      src="/e-Drishti (2).svg"
                      alt="e-Drishti Logo"
                      className="h-16 md:h-20 lg:h-24 w-auto drop-shadow-2xl"
                    />
                    <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-white leading-tight tracking-tight">
                      e-<span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">Drishti</span>
                    </h1>
                  </div>

                  <p className="text-slate-300 text-lg md:text-xl leading-relaxed max-w-xl font-light">
                    Revolutionizing critical care with real-time AI monitoring, instant vital extraction, and seamless patient management infrastructure.
                  </p>

                  {/* Features Grid */}
                  <div className="grid grid-cols-2 gap-8 pt-8 border-t border-white/5">
                    <div className="flex items-start gap-4 group/item">
                      <div className="p-3 rounded-xl bg-primary/10 text-primary group-hover/item:bg-primary/20 transition-colors">
                        <HeartPulse className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-white font-semibold text-lg">Real-time Vitals</h4>
                        <p className="text-slate-400 text-sm">Instant health tracking</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 group/item">


                    </div>
                  </div>
                </div>
              </div>

              {/* Right Section - Image/Visual */}
              <div className="relative hidden lg:block overflow-hidden bg-slate-900">
                <div className="absolute inset-0 bg-gradient-to-l from-transparent to-slate-900/90 z-10"></div>
                <img
                  src="/Gemini_Generated_Image_6xwqr56xwqr56xwq.png"
                  alt="ICU Monitoring"
                  className="w-full h-full object-cover transform transition-transform duration-1000 group-hover:scale-105 opacity-90"
                />
              </div>
            </div>
          </div>

          {/* Feature Cards Section */}
          <div className="grid md:grid-cols-3 gap-8 mb-24">
            {[
              {
                icon: <Camera className="w-8 h-8 text-primary" />,
                title: "AI Vision Analysis",
                desc: "Powered by Hugging Face VLMs and Tesseract OCR for high-precision vital sign extraction from monitor feeds.",
                bg: "bg-primary/5",
                border: "border-primary/10"
              },
              {
                icon: <Activity className="w-8 h-8 text-secondary" />,
                title: "Live Monitoring",
                desc: "Real-time dashboard updates with sub-second latency for critical decision making.",
                bg: "bg-secondary/5",
                border: "border-secondary/10"
              },
              {
                icon: <FileVideo className="w-8 h-8 text-blue-500" />,
                title: "Patient Dashboards",
                desc: "Centralized patient profiles with detailed vital history logs, graphical trends, and instant dashboard access.",
                bg: "bg-blue-500/5",
                border: "border-blue-500/10"
              }
            ].map((feature, idx) => (
              <Card key={idx} className={`p-8 border ${feature.border} shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 bg-white/60 backdrop-blur-md group relative overflow-hidden`}>
                <div className={`absolute top-0 right-0 w-32 h-32 ${feature.bg} rounded-bl-full -mr-10 -mt-10 transition-transform group-hover:scale-150`}></div>
                <div className={`w-16 h-16 rounded-2xl ${feature.bg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform relative z-10`}>
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-foreground mb-3 relative z-10">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed relative z-10">
                  {feature.desc}
                </p>
              </Card>
            ))}
          </div>

          {/* Call to Action */}
          <div className="flex justify-center">
            <Link to="/patients" className="w-full max-w-2xl">
              <div className="relative group cursor-pointer">
                <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-teal-600 rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>

              </div>
            </Link>
          </div>

        </div>
      </div>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12 border-t border-slate-800 relative z-10">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-4">

                <div className="flex flex-col">
                  <span className="font-bold text-xl tracking-tight text-blue-400">e-Drishti</span>

                </div>
              </div>
            </div>
            <p className="text-slate-500 text-sm font-light">
              Empowering Healthcare with <span className="text-primary font-medium">Artificial Intelligence</span>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;

