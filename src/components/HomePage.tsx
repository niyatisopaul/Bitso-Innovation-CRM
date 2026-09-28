import React from 'react';
import { 
  Building2, 
  ShieldCheck, 
  Users, 
  Briefcase, 
  Headphones, 
  Cog, 
  BarChart3, 
  TrendingUp, 
  HeartHandshake,
  ArrowRight, 
  Database, 
  CheckCircle2, 
  Sparkles,
  Lock,
  UserPlus,
  LogIn,
  Layers,
  Activity,
  Globe2,
  Download
} from 'lucide-react';
import { AuthUser, Department } from '../types';

interface HomePageProps {
  adminUser: AuthUser | null;
  onOpenLogin: () => void;
  onOpenRegister: () => void;
  onEnterCrm: () => void;
  onLogout: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  adminUser,
  onOpenLogin,
  onOpenRegister,
  onEnterCrm,
  onLogout,
}) => {
  const departments: { 
    id: Department; 
    name: string; 
    description: string; 
    icon: React.ElementType; 
    color: string;
    tag: string;
  }[] = [
    {
      id: 'it_tech',
      name: 'IT & Tech',
      description: 'Core software architecture, API microservices, distributed cloud systems, and telemetry tooling.',
      icon: Cog,
      color: 'from-blue-600 to-cyan-500',
      tag: 'IT & Tech'
    },
    {
      id: 'sales',
      name: 'Sales & Commercial',
      description: 'Enterprise client acquisition, custom SLA negotiations, pipeline tracking, and revenue management.',
      icon: Briefcase,
      color: 'from-emerald-600 to-teal-500',
      tag: 'Revenue'
    },
    {
      id: 'support',
      name: 'Customer Support & Success',
      description: '24/7 client ticket resolution, escalation routing, SLA compliance, and customer satisfaction.',
      icon: Headphones,
      color: 'from-violet-600 to-indigo-500',
      tag: 'Client Ops'
    },
    {
      id: 'operations',
      name: 'Operations & Infrastructure',
      description: 'Zero-downtime cluster management, database snapshots, security compliance, and network uptime.',
      icon: Layers,
      color: 'from-amber-600 to-orange-500',
      tag: 'Reliability'
    },
    {
      id: 'finance',
      name: 'Finance & Accounts',
      description: 'Contract settlements, invoicing, annual client recurring revenues, and multi-department budget ledgers.',
      icon: BarChart3,
      color: 'from-cyan-600 to-blue-500',
      tag: 'Accounts'
    },
    {
      id: 'marketing',
      name: 'Marketing & Growth',
      description: 'Enterprise brand positioning, market research, inbound campaign attribution, and account retention.',
      icon: TrendingUp,
      color: 'from-pink-600 to-rose-500',
      tag: 'Growth'
    },
    {
      id: 'hr',
      name: 'HR & People Operations',
      description: 'Workforce directories, departmental headcounts, talent recruitment, onboarding, and team rosters.',
      icon: Users,
      color: 'from-teal-600 to-emerald-500',
      tag: 'Workforce'
    }
  ];

  return (
    <div id="bitso-home-page" className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Navigation Bar with Prominent "Bitso Innovation" in the upper right corner */}
      <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          
          {/* Left: Platform Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-blue-500 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30 ring-1 ring-white/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base sm:text-lg tracking-tight text-white">
                  Department CRM Platform
                </span>
                <span className="hidden md:inline text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Enterprise
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Multi-Department Workforce & Account Management System
              </p>
            </div>
          </div>

          {/* RIGHT ABOVE CORNER: PROMINENT BITSO INNOVATION BRANDING */}
          <div className="flex items-center gap-3">
            {/* BITSO INNOVATION NAME BADGE */}
            <div 
              id="header-bitso-innovation-badge"
              className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-950 border border-indigo-500/40 shadow-lg shadow-indigo-950/50"
            >
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse ring-2 ring-emerald-400/30" />
              <div className="flex flex-col">
                <span className="text-xs sm:text-sm font-extrabold tracking-wide uppercase text-white font-mono">
                  Bitso Innovation
                </span>
              </div>
            </div>

            {/* Auth / Workspace Buttons */}
            {adminUser ? (
              <div className="flex items-center gap-2">
                <button
                  id="btn-home-enter-crm"
                  onClick={onEnterCrm}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md shadow-indigo-600/30 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <span>Open CRM</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  id="btn-home-logout"
                  onClick={onLogout}
                  className="px-3 py-2 text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 rounded-xl transition-colors cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  id="btn-home-signin"
                  onClick={onOpenLogin}
                  className="px-3.5 py-2 text-xs sm:text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-900 border border-slate-700/80 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Sign In</span>
                </button>
                <button
                  id="btn-home-register"
                  onClick={onOpenRegister}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs sm:text-sm font-semibold rounded-xl shadow-md shadow-indigo-600/30 flex items-center gap-1.5 transition-all cursor-pointer"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Register</span>
                </button>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative overflow-hidden pt-16 pb-20 sm:pt-24 sm:pb-28">
          {/* Subtle atmospheric glow */}
          <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-indigo-600/10 blur-[140px] rounded-full pointer-events-none" />
          <div className="absolute top-1/2 right-1/4 w-[400px] h-[350px] bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            
            {/* Top Eyebrow Tag */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-950/70 border border-indigo-800/60 text-xs font-semibold text-indigo-300 mb-8 shadow-sm">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>Official Enterprise Workforce & Client CRM</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white max-w-4xl mx-auto leading-[1.15]">
              Unified Department CRM for{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-sky-300 to-blue-400">
                Bitso Innovation
              </span>
            </h1>

            {/* Subtitle */}
            <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
              Empower every department—from IT & Tech and Operations to Sales, Support, and Finance.
              Track employees, manage clients, monitor pipeline deals, and safeguard your data with automated backups.
            </p>

            {/* CTA Buttons */}
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              {adminUser ? (
                <button
                  id="btn-hero-launch-crm"
                  onClick={onEnterCrm}
                  className="px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-semibold text-sm rounded-xl shadow-xl shadow-indigo-600/30 flex items-center gap-2 cursor-pointer transition-all transform hover:-translate-y-0.5"
                >
                  <Building2 className="w-4 h-4" />
                  <span>Launch Bitso Innovation CRM</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <>
                  <button
                    id="btn-hero-open-login"
                    onClick={onOpenLogin}
                    className="px-6 py-3.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-semibold text-sm rounded-xl shadow-xl shadow-indigo-600/30 flex items-center gap-2 cursor-pointer transition-all transform hover:-translate-y-0.5"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>Sign In as Admin / Staff</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>

                  <button
                    id="btn-hero-open-register"
                    onClick={onOpenRegister}
                    className="px-6 py-3.5 bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white font-semibold text-sm rounded-xl border border-slate-700/80 flex items-center gap-2 cursor-pointer transition-colors"
                  >
                    <UserPlus className="w-4 h-4 text-indigo-400" />
                    <span>Register New Account</span>
                  </button>

                  <a
                    id="btn-hero-download-files"
                    href="/api/download-archive"
                    download="bitso_innovation_crm.tar.gz"
                    className="px-5 py-3.5 bg-emerald-950/50 hover:bg-emerald-900/60 text-emerald-300 hover:text-white font-semibold text-sm rounded-xl border border-emerald-500/40 flex items-center gap-2 cursor-pointer transition-all shadow-lg shadow-emerald-950/40"
                    title="Download entire CRM codebase & database in compressed file archive"
                  >
                    <Download className="w-4 h-4 text-emerald-400" />
                    <span>Download in File Form</span>
                  </a>
                </>
              )}
            </div>

            {/* Platform Highlights */}
            <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto text-left">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <div className="text-xs text-slate-400 font-medium">Departments</div>
                <div className="text-xl font-bold text-white mt-1">7 Disciplines</div>
                <div className="text-[11px] text-indigo-400 mt-1">IT & Tech to Sales</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <div className="text-xs text-slate-400 font-medium">Workspace State</div>
                <div className="text-xl font-bold text-emerald-400 mt-1">Clean & Ready</div>
                <div className="text-[11px] text-slate-400 mt-1">Zero sample data</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <div className="text-xs text-slate-400 font-medium">Workforce Directory</div>
                <div className="text-xl font-bold text-white mt-1">Full Employee CRUD</div>
                <div className="text-[11px] text-indigo-400 mt-1">Roles, status & contact</div>
              </div>
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80">
                <div className="text-xs text-slate-400 font-medium">Disaster Recovery</div>
                <div className="text-xl font-bold text-sky-400 mt-1">Snapshots & Rollback</div>
                <div className="text-[11px] text-slate-400 mt-1">Full database backup</div>
              </div>
            </div>

          </div>
        </section>

        {/* Departments Grid Section */}
        <section className="py-16 bg-slate-900/40 border-y border-slate-800/80">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-white">
                Bitso Innovation Department Ecosystem
              </h2>
              <p className="mt-2 text-sm text-slate-400">
                Every department has a dedicated workspace, employee listing, and synchronized pipeline
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {departments.map((dept) => {
                const IconComponent = dept.icon;
                return (
                  <div
                    key={dept.id}
                    className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all group flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-tr ${dept.color} flex items-center justify-center text-white shadow-md`}>
                          <IconComponent className="w-6 h-6" />
                        </div>
                        <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                          {dept.tag}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-white group-hover:text-indigo-400 transition-colors">
                        {dept.name}
                      </h3>
                      <p className="mt-2 text-xs text-slate-400 leading-relaxed">
                        {dept.description}
                      </p>
                    </div>

                    <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-500">
                      <span>Employees & Tickets</span>
                      <span className="text-indigo-400 font-medium group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                        Active in CRM <ArrowRight className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Security & Deployment Section */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="rounded-3xl bg-gradient-to-br from-indigo-950/60 via-slate-900/80 to-slate-900 border border-indigo-900/40 p-8 sm:p-12">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
                <div>
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-900/60 text-indigo-300 text-xs font-semibold mb-4 border border-indigo-700/50">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Production Grade Architecture</span>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-bold text-white">
                    Deploy Bitso Innovation CRM Publicly
                  </h2>
                  <p className="mt-3 text-sm text-slate-300 leading-relaxed">
                    Designed for production deployment on Google Cloud Run. Complete with full-stack Node.js API, authenticated administrative sessions, persistent data store, and one-click database recovery snapshots.
                  </p>

                  <div className="mt-6 space-y-3 text-xs text-slate-300">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Embedded SQLite 3 Relational Database Engine with real-time SQL console</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Full ACID compliance, ANSI SQL execution, and one-click .sqlite / .sql downloads</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Employee directory & CRM operations across all 7 corporate departments</span>
                    </div>
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span>Role-based login and registration for administrators and staff</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  {adminUser ? (
                    <button
                      onClick={onEnterCrm}
                      className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl shadow-xl shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer"
                    >
                      <Building2 className="w-5 h-5" />
                      <span>Enter Workspace</span>
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={onOpenLogin}
                        className="w-full sm:w-auto px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
                      >
                        <LogIn className="w-4 h-4" />
                        <span>Sign In</span>
                      </button>
                      <button
                        onClick={onOpenRegister}
                        className="w-full sm:w-auto px-6 py-3.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl border border-slate-700 flex items-center justify-center gap-2 transition-all cursor-pointer"
                      >
                        <UserPlus className="w-4 h-4 text-indigo-400" />
                        <span>Register Admin</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 bg-slate-950 py-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300 font-mono">Bitso Innovation</span>
            <span>•</span>
            <span>Enterprise Department CRM Platform</span>
          </div>
          <p>© {new Date().getFullYear()} Bitso Innovation. All systems operational.</p>
        </div>
      </footer>
    </div>
  );
};
