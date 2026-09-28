import React, { useState, useEffect, useCallback } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar, ViewTab } from './components/Sidebar';
import { OverviewView } from './components/OverviewView';
import { EmployeesView } from './components/EmployeesView';
import { ClientsView } from './components/ClientsView';
import { DealsPipelineView } from './components/DealsPipelineView';
import { TicketsView } from './components/TicketsView';
import { ContactsView } from './components/ContactsView';
import { BackupHubView } from './components/BackupHubView';
import { DatabaseView } from './components/DatabaseView';
import { AuditView } from './components/AuditView';
import { AiInsightModal } from './components/AiInsightModal';
import { LoginPage } from './components/LoginPage';
import { HomePage } from './components/HomePage';
import { 
  Client, 
  Contact, 
  Deal, 
  Ticket, 
  Activity, 
  Employee,
  CRMStats, 
  Department, 
  DealStage, 
  TicketStatus,
  BackupSnapshot,
  AuthUser
} from './types';
import { api } from './lib/api';

export default function App() {
  const [adminUser, setAdminUser] = useState<AuthUser | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState<boolean>(true);

  // App routing views: 'home' (public landing), 'auth' (login/register), 'crm' (main workspace)
  const [viewMode, setViewMode] = useState<'home' | 'auth' | 'crm'>('home');
  const [authInitialTab, setAuthInitialTab] = useState<'login' | 'register'>('login');

  const [currentTab, setCurrentTab] = useState<ViewTab>('overview');
  const [currentDepartment, setCurrentDepartment] = useState<Department | 'all'>('all');
  
  const [stats, setStats] = useState<CRMStats | null>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [deals, setDeals] = useState<Deal[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  
  const [latestBackup, setLatestBackup] = useState<BackupSnapshot | null>(null);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  // Initial Auth Check
  useEffect(() => {
    let isMounted = true;
    async function checkAuthSession() {
      try {
        const user = await api.getCurrentUser();
        if (isMounted) {
          setAdminUser(user);
        }
      } catch (e) {
        if (isMounted) setAdminUser(null);
      } finally {
        if (isMounted) setIsAuthChecking(false);
      }
    }
    checkAuthSession();
    return () => {
      isMounted = false;
    };
  }, []);

  const loadData = useCallback(async () => {
    try {
      const [statsRes, employeesRes, clientsRes, dealsRes, ticketsRes, contactsRes, actRes, backupsRes] = await Promise.all([
        api.getStats(),
        api.getEmployees({ department: currentDepartment === 'all' ? undefined : currentDepartment }),
        api.getClients({ department: currentDepartment === 'all' ? undefined : currentDepartment }),
        api.getDeals({ department: currentDepartment === 'all' ? undefined : currentDepartment }),
        api.getTickets({ department: currentDepartment === 'all' ? undefined : currentDepartment }),
        api.getContacts({ department: currentDepartment === 'all' ? undefined : currentDepartment }),
        api.getActivities({ department: currentDepartment === 'all' ? undefined : currentDepartment, limit: 30 }),
        api.getBackups(),
      ]);

      setStats(statsRes);
      setEmployees(employeesRes);
      setClients(clientsRes);
      setDeals(dealsRes);
      setTickets(ticketsRes);
      setContacts(contactsRes);
      setActivities(actRes);
      if (backupsRes && backupsRes.length > 0) {
        setLatestBackup(backupsRes[0]);
      }
    } catch (err) {
      console.error('Failed to load application data:', err);
    }
  }, [currentDepartment]);

  useEffect(() => {
    if (adminUser || viewMode === 'home' || viewMode === 'crm') {
      loadData();
    }
  }, [loadData, adminUser, viewMode]);

  const handleLogout = async () => {
    await api.logout();
    setAdminUser(null);
    showNotification('Session ended. You are now logged out.');
  };

  // Quick Snapshot Action from top navbar
  const handleQuickBackup = async () => {
    try {
      setIsBackingUp(true);
      const res = await api.createBackup(`Quick Snapshot (${new Date().toLocaleTimeString()})`, 'manual');
      setLatestBackup(res.snapshot);
      showNotification(`System snapshot saved (${res.snapshot.filename})`);
      await loadData();
    } catch (err: any) {
      alert(`Snapshot failed: ${err.message}`);
    } finally {
      setIsBackingUp(false);
    }
  };

  // Employee Operations
  const handleCreateEmployee = async (employeeData: Partial<Employee>) => {
    await api.createEmployee(employeeData);
    showNotification(`Employee "${employeeData.name}" added to directory.`);
    await loadData();
  };

  const handleUpdateEmployee = async (id: string, updates: Partial<Employee>) => {
    await api.updateEmployee(id, updates);
    showNotification(`Employee profile updated.`);
    await loadData();
  };

  const handleDeleteEmployee = async (id: string) => {
    await api.deleteEmployee(id);
    showNotification(`Employee removed from directory.`);
    await loadData();
  };

  // Client Operations
  const handleAddClient = async (clientData: Partial<Client>) => {
    await api.createClient(clientData);
    showNotification(`Account "${clientData.name}" created successfully.`);
    await loadData();
  };

  const handleUpdateClient = async (id: string, updates: Partial<Client>) => {
    await api.updateClient(id, updates);
    showNotification(`Account updated.`);
    await loadData();
  };

  const handleDeleteClient = async (id: string) => {
    await api.deleteClient(id);
    showNotification(`Account and associated records archived.`);
    await loadData();
  };

  // Deal Operations
  const handleAddDeal = async (dealData: Partial<Deal>) => {
    await api.createDeal(dealData);
    showNotification(`Opportunity "${dealData.title}" registered.`);
    await loadData();
  };

  const handleUpdateDeal = async (id: string, updates: Partial<Deal>) => {
    await api.updateDeal(id, updates);
    showNotification(`Deal updated.`);
    await loadData();
  };

  const handleUpdateDealStage = async (id: string, stage: DealStage) => {
    await api.updateDealStage(id, stage);
    showNotification(`Pipeline stage updated to ${stage.toUpperCase()}.`);
    await loadData();
  };

  const handleDeleteDeal = async (id: string) => {
    await api.deleteDeal(id);
    showNotification(`Opportunity removed.`);
    await loadData();
  };

  // Ticket Operations
  const handleAddTicket = async (ticketData: Partial<Ticket>) => {
    await api.createTicket(ticketData);
    showNotification(`Service ticket filed.`);
    await loadData();
  };

  const handleUpdateTicket = async (id: string, updates: Partial<Ticket>) => {
    await api.updateTicket(id, updates);
    showNotification(`Ticket updated.`);
    await loadData();
  };

  const handleUpdateTicketStatus = async (id: string, status: TicketStatus, resolutionSummary?: string) => {
    await api.updateTicketStatus(id, status, resolutionSummary);
    showNotification(`Ticket marked as ${status.toUpperCase()}.`);
    await loadData();
  };

  const handleDeleteTicket = async (id: string) => {
    await api.deleteTicket(id);
    showNotification(`Ticket removed.`);
    await loadData();
  };

  // Contact Operations
  const handleAddContact = async (contactData: Partial<Contact>) => {
    await api.createContact(contactData);
    showNotification(`Stakeholder contact added.`);
    await loadData();
  };

  const handleUpdateContact = async (id: string, updates: Partial<Contact>) => {
    await api.updateContact(id, updates);
    showNotification(`Stakeholder contact updated.`);
    await loadData();
  };

  const handleDeleteContact = async (id: string) => {
    await api.deleteContact(id);
    showNotification(`Contact removed.`);
    await loadData();
  };

  // Activity Operations
  const handleLogActivity = async (act: Partial<Activity>) => {
    await api.getActivities();
    showNotification(`Activity recorded.`);
    await loadData();
  };

  if (isAuthChecking) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-sm font-medium">Connecting to Bitso Innovation CRM...</p>
      </div>
    );
  }

  // 1. HOME VIEW (Default landing page requested by user)
  if (viewMode === 'home') {
    return (
      <HomePage
        adminUser={adminUser}
        onOpenLogin={() => {
          setAuthInitialTab('login');
          setViewMode('auth');
        }}
        onOpenRegister={() => {
          setAuthInitialTab('register');
          setViewMode('auth');
        }}
        onEnterCrm={() => {
          if (adminUser) {
            setViewMode('crm');
          } else {
            setAuthInitialTab('login');
            setViewMode('auth');
          }
        }}
        onLogout={handleLogout}
      />
    );
  }

  // 2. AUTH VIEW (Login / Register Modal/Page)
  if (viewMode === 'auth') {
    return (
      <LoginPage
        initialMode={authInitialTab}
        onLoginSuccess={(user) => {
          setAdminUser(user);
          setViewMode('crm');
          showNotification(`Welcome, ${user.name || user.email}!`);
        }}
        onBackToHome={() => setViewMode('home')}
      />
    );
  }

  // 3. CRM WORKSPACE VIEW
  // If user requested CRM but is not logged in, prompt login
  if (!adminUser) {
    return (
      <LoginPage
        initialMode="login"
        onLoginSuccess={(user) => {
          setAdminUser(user);
          setViewMode('crm');
          showNotification(`Welcome back, ${user.name || user.email}`);
        }}
        onBackToHome={() => setViewMode('home')}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 font-sans flex flex-col selection:bg-indigo-500 selection:text-white">
      
      {/* Top Navigation */}
      <Navbar
        currentDepartment={currentDepartment}
        onSelectDepartment={(dep) => setCurrentDepartment(dep)}
        latestBackup={latestBackup}
        onQuickBackup={handleQuickBackup}
        onRefresh={loadData}
        onOpenAiInsights={() => setIsAiModalOpen(true)}
        isBackingUp={isBackingUp}
        adminUser={adminUser}
        onLogout={() => {
          handleLogout();
          setViewMode('home');
        }}
        onNavigateHome={() => setViewMode('home')}
      />

      {/* Main Layout */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto">
        
        {/* Navigation Sidebar */}
        <Sidebar
          currentTab={currentTab}
          onSelectTab={(tab) => setCurrentTab(tab)}
          stats={stats}
        />

        {/* Dynamic View Area */}
        <main id="crm-main-viewport" className="flex-1 p-4 sm:p-6 lg:p-8 min-w-0 overflow-y-auto">
          
          {/* Action Notification Toast */}
          {notification && (
            <div className="mb-4 p-3 rounded-lg bg-slate-900 text-white text-xs font-medium shadow-md flex items-center justify-between animate-fade-in">
              <span>{notification}</span>
              <button 
                onClick={() => setNotification(null)}
                className="text-slate-400 hover:text-white cursor-pointer ml-3 font-bold"
              >
                ✕
              </button>
            </div>
          )}

          {currentTab === 'overview' && (
            <OverviewView
              stats={stats}
              activities={activities}
              deals={deals}
              currentDepartment={currentDepartment}
              onNavigate={(tab) => setCurrentTab(tab)}
              onQuickBackup={handleQuickBackup}
              onOpenAiInsights={() => setIsAiModalOpen(true)}
            />
          )}

          {currentTab === 'employees' && (
            <EmployeesView
              employees={employees}
              currentDepartment={currentDepartment}
              onDepartmentChange={(dep) => setCurrentDepartment(dep)}
              onCreateEmployee={handleCreateEmployee}
              onUpdateEmployee={handleUpdateEmployee}
              onDeleteEmployee={handleDeleteEmployee}
            />
          )}

          {currentTab === 'clients' && (
            <ClientsView
              clients={clients}
              currentDepartment={currentDepartment}
              onAddClient={handleAddClient}
              onUpdateClient={handleUpdateClient}
              onDeleteClient={handleDeleteClient}
            />
          )}

          {currentTab === 'deals' && (
            <DealsPipelineView
              deals={deals}
              clients={clients}
              currentDepartment={currentDepartment}
              onAddDeal={handleAddDeal}
              onUpdateDeal={handleUpdateDeal}
              onUpdateStage={handleUpdateDealStage}
              onDeleteDeal={handleDeleteDeal}
            />
          )}

          {currentTab === 'tickets' && (
            <TicketsView
              tickets={tickets}
              clients={clients}
              currentDepartment={currentDepartment}
              onAddTicket={handleAddTicket}
              onUpdateTicket={handleUpdateTicket}
              onUpdateStatus={handleUpdateTicketStatus}
              onDeleteTicket={handleDeleteTicket}
            />
          )}

          {currentTab === 'contacts' && (
            <ContactsView
              contacts={contacts}
              clients={clients}
              currentDepartment={currentDepartment}
              onAddContact={handleAddContact}
              onUpdateContact={handleUpdateContact}
              onDeleteContact={handleDeleteContact}
            />
          )}

          {currentTab === 'database' && (
            <DatabaseView
              onRefreshAllData={loadData}
              showNotification={showNotification}
            />
          )}

          {currentTab === 'backup' && (
            <BackupHubView
              stats={stats}
              onRefreshData={loadData}
            />
          )}

          {currentTab === 'audit' && (
            <AuditView
              activities={activities}
              currentDepartment={currentDepartment}
              onLogActivity={handleLogActivity}
            />
          )}

        </main>
      </div>

      {/* AI Intelligence Briefing Modal */}
      <AiInsightModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        currentDepartment={currentDepartment}
      />

    </div>
  );
}
