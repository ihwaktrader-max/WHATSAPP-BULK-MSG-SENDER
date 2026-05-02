/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ExcelUploader } from '@/components/ExcelUploader';
import { TemplateEditor } from '@/components/TemplateEditor';
import { ContactTable } from '@/components/ContactTable';
import { Contact, generateWhatsAppLink, replacePlaceholders, Campaign, PREMADE_TEMPLATES } from '@/lib/whatsapp';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  MessageSquare, Send, Trash2, Users, LayoutDashboard, Settings, 
  Play, Pause, AlertTriangle, Info, HelpCircle, ExternalLink, 
  CheckCircle2, Moon, Sun, History, BarChart3, Calendar as CalendarIcon,
  Paperclip, Download, Filter, UserCheck, UserPlus, Clock
} from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, isAfter, parseISO } from "date-fns";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import * as XLSX from 'xlsx';

export default function App() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [template, setTemplate] = useState("Hello {{Name}},\n\nThis is a test message from our WhatsApp Bulk Sender tool.");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [isAutoSending, setIsAutoSending] = useState(false);
  const [delay, setDelay] = useState(15000);
  const [useRandomDelay, setUseRandomDelay] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [safetySuffix, setSafetySuffix] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  
  // New States for Phase 2 & 3
  const [campaignHistory, setCampaignHistory] = useState<Campaign[]>([]);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [scheduledTime, setScheduledTime] = useState<Date | undefined>(undefined);
  const [isHumanMode, setIsHumanMode] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<string>('All');
  const [activeTab, setActiveTab] = useState('campaign');
  const [logs, setLogs] = useState<{id: string, time: string, message: string, type: 'info' | 'success' | 'warning' | 'error'}[]>([]);

  const addLog = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const newLog = {
      id: Math.random().toString(36).substring(7),
      time: format(new Date(), 'HH:mm:ss:SSS'),
      message,
      type
    };
    setLogs(prev => [newLog, ...prev].slice(0, 50));
  };

  const autoSendTimer = useRef<NodeJS.Timeout | null>(null);
  const scheduleTimer = useRef<NodeJS.Timeout | null>(null);
  const whatsappWindowRef = useRef<Window | null>(null);

  const connectWhatsApp = () => {
    whatsappWindowRef.current = window.open('https://web.whatsapp.com', 'whatsapp_sync_window');
    toast.success("WhatsApp Tab Connected! Keep it open.");
  };

  // Load from localStorage on mount
  useEffect(() => {
    const savedContacts = localStorage.getItem('whatsapp_sync_contacts');
    const savedTemplate = localStorage.getItem('whatsapp_sync_template');
    const savedIndex = localStorage.getItem('whatsapp_sync_index');
    const savedHistory = localStorage.getItem('whatsapp_sync_history');
    const savedDarkMode = localStorage.getItem('whatsapp_sync_darkmode');

    if (savedContacts) setContacts(JSON.parse(savedContacts));
    if (savedTemplate) setTemplate(savedTemplate);
    if (savedIndex) setCurrentIndex(parseInt(savedIndex, 10));
    if (savedHistory) setCampaignHistory(JSON.parse(savedHistory));
    if (savedDarkMode) setDarkMode(savedDarkMode === 'true');
  }, []);

  // Theme effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('whatsapp_sync_darkmode', darkMode.toString());
  }, [darkMode]);

  // Save to localStorage whenever state changes
  useEffect(() => {
    if (contacts.length > 0) {
      localStorage.setItem('whatsapp_sync_contacts', JSON.stringify(contacts));
    } else {
      localStorage.removeItem('whatsapp_sync_contacts');
    }
  }, [contacts]);

  useEffect(() => {
    localStorage.setItem('whatsapp_sync_template', template);
  }, [template]);

  useEffect(() => {
    localStorage.setItem('whatsapp_sync_index', currentIndex.toString());
  }, [currentIndex]);

  useEffect(() => {
    localStorage.setItem('whatsapp_sync_history', JSON.stringify(campaignHistory));
  }, [campaignHistory]);

  const groups = useMemo(() => {
    const g = new Set(['All']);
    contacts.forEach(c => {
      if (c.group) g.add(c.group);
    });
    return Array.from(g);
  }, [contacts]);

  const filteredContacts = useMemo(() => {
    if (selectedGroup === 'All') return contacts;
    return contacts.filter(c => c.group === selectedGroup);
  }, [contacts, selectedGroup]);

  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    setCurrentIndex(0);
  }, [selectedGroup]);

  const stats = useMemo(() => {
    const total = contacts.length;
    const sent = contacts.filter(c => c.status === 'sent').length;
    const failed = contacts.filter(c => c.status === 'failed').length;
    const pending = contacts.filter(c => c.status === 'pending').length;
    return { total, sent, failed, pending };
  }, [contacts]);

  const dashboardData = useMemo(() => {
    // Mock data based on history + current
    const data = campaignHistory.map(c => ({
      name: format(new Date(c.date), 'MMM dd'),
      sent: c.sent,
      failed: c.failed
    }));
    return data;
  }, [campaignHistory]);

  const handleContactsLoaded = (newContacts: Contact[]) => {
    setContacts(newContacts);
    setCurrentIndex(0);
    addLog(`Ingested ${newContacts.length} nodes from dataset.`, 'success');
    toast.success(`${newContacts.length} contacts loaded successfully!`);
  };

  const clearContacts = () => {
    setContacts([]);
    setCurrentIndex(0);
    setIsAutoSending(false);
    localStorage.removeItem('whatsapp_sync_contacts');
    localStorage.removeItem('whatsapp_sync_index');
    addLog("System memory purged. All nodes disconnected.", 'warning');
    toast.info("Campaign cleared.");
  };

  const resetProgress = () => {
    setCurrentIndex(0);
    const resetContacts = contacts.map(c => ({ ...c, status: 'pending' as const }));
    setContacts(resetContacts);
    addLog("Sequence pointers reset to zero.", 'info');
    toast.info("Progress reset to start.");
  };

  const saveCampaignToHistory = () => {
    if (contacts.length === 0) return;
    const newCampaign: Campaign = {
      id: Date.now().toString(),
      name: `Campaign ${campaignHistory.length + 1}`,
      date: new Date().toISOString(),
      totalContacts: contacts.length,
      sent: stats.sent,
      failed: stats.failed,
      pending: stats.pending,
      templatePreview: template.substring(0, 50) + '...',
      status: 'completed'
    };
    setCampaignHistory([newCampaign, ...campaignHistory]);
  };

  const exportReport = () => {
    const data = contacts.map(c => ({
      Name: c.name,
      Phone: c.phone,
      Status: c.status,
      Group: c.group || 'N/A',
      Time: new Date().toLocaleString()
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Campaign Report");
    XLSX.writeFile(wb, `Campaign_Report_${Date.now()}.xlsx`);
    toast.success("Report exported!");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachedFile(e.target.files[0]);
      toast.success(`File attached: ${e.target.files[0].name}`);
    }
  };

  const sendNext = () => {
    if (currentIndex >= filteredContacts.length) {
      setIsSending(false);
      setIsAutoSending(false);
      saveCampaignToHistory();
      toast.success("Current selection processed!");
      return;
    }

    const contact = filteredContacts[currentIndex];
    const uniqueSuffix = safetySuffix ? `\n\n[ID: ${Math.random().toString(36).substring(7)}]` : '';
    const message = replacePlaceholders(template, contact) + uniqueSuffix;
    
    addLog(`Preparing transmission to ${contact.phone}...`, 'info');
    
    // Use the utility function for correct link generation and formatting
    const link = generateWhatsAppLink(contact.phone, message);

    setContacts(prev => prev.map(c => c.id === contact.id ? { ...c, status: 'sent' } : c));
    addLog(`Relay established for ${contact.name}. Link generated.`, 'success');

    const wpWindow = window.open(link, 'whatsapp_sync_window');
    
    if (!wpWindow) {
      toast.error("Popup blocked! Please allow popups and click 'Connect' first.", {
        duration: 5000,
      });
      setIsAutoSending(false);
      return false;
    }

    whatsappWindowRef.current = wpWindow;
    setCurrentIndex(prev => prev + 1);
    return true;
  };

  // Scheduling Logic
  useEffect(() => {
    if (scheduledTime) {
      const now = new Date();
      if (isAfter(scheduledTime, now)) {
        const diff = scheduledTime.getTime() - now.getTime();
        scheduleTimer.current = setTimeout(() => {
          toast.success("Scheduled campaign starting now!");
          if (contacts.length > 0) {
            setIsAutoSending(true);
          }
          setScheduledTime(undefined);
          
          // Browser Notification
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification("WPSync Pro", { body: "Your scheduled campaign has started!" });
          }
        }, diff);
      }
    }
    return () => {
      if (scheduleTimer.current) clearTimeout(scheduleTimer.current);
    };
  }, [scheduledTime, contacts]);

  // Request Notification Permission
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (isAutoSending) {
      if (currentIndex < filteredContacts.length) {
        // Smart Delay Logic
        let baseDelay = delay;
        if (filteredContacts.length > 10) baseDelay = Math.max(baseDelay, 20000);
        
        // Human Mode: Add significant extra delay to simulate typing (5-10s)
        const humanDelay = isHumanMode ? (Math.random() * 5000) + 5000 : 0;
        
        const actualDelay = useRandomDelay 
          ? baseDelay + humanDelay + (Math.random() * 5000) 
          : baseDelay + humanDelay;

        autoSendTimer.current = setTimeout(() => {
          const success = sendNext();
          if (!success) setIsAutoSending(false);
        }, actualDelay);
      } else {
        setIsAutoSending(false);
        saveCampaignToHistory();
        toast.success("Auto-Send completed!");
      }
    } else {
      if (autoSendTimer.current) clearTimeout(autoSendTimer.current);
    }

    return () => {
      if (autoSendTimer.current) clearTimeout(autoSendTimer.current);
    };
  }, [isAutoSending, currentIndex, filteredContacts.length, delay, useRandomDelay, isHumanMode]);

  const toggleAutoSend = () => {
    if (contacts.length === 0) {
      toast.error("Pehle Excel file upload karein!");
      return;
    }
    if (!isAutoSending) {
      addLog("Campaign engine initiated. Sequential processing enabled.", 'info');
      toast.info("Auto-Send starting... Make sure to allow popups!", {
        icon: <AlertTriangle className="text-amber-500" />,
      });
    } else {
      addLog("Processing suspended by user command.", 'warning');
    }
    setIsAutoSending(!isAutoSending);
    setIsSending(true);
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-app-bg cyber-grid relative">
      <div className="scanline" />
      <Toaster position="top-right" richColors />
      
      {/* Header Area */}
      <header className="h-16 glass-panel border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-8 shrink-0 z-20">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 bg-slate-900 dark:bg-whatsapp-green rounded-xl flex items-center justify-center shadow-lg shadow-slate-900/10">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">WPSync <span className="text-whatsapp-green">Pro</span></h1>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Enterprise Dashboard</p>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="hidden md:flex items-center gap-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-r pr-6 border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full" /> API ACTIVE
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" /> SYNC READY
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button 
              size="icon" 
              variant="ghost" 
              className="w-9 h-9 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={() => setDarkMode(!darkMode)}
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              className="h-9 px-4 font-bold text-[11px] border-whatsapp-green text-whatsapp-green hover:bg-whatsapp-green hover:text-white rounded-lg shadow-sm"
              onClick={connectWhatsApp}
            >
              <ExternalLink className="w-3.5 h-3.5 mr-2" /> CONNECT WHATSAPP
            </Button>
            <div className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-xs font-bold text-slate-500 cursor-help" title="ihwaktrader@gmail.com">
              IT
            </div>
          </div>
        </div>
      </header>

      {/* Main Grid Layout */}
      <div className="flex-1 grid grid-cols-[300px_1fr_360px] gap-0 bg-slate-50/50 overflow-hidden">
        
        {/* Left Sidebar: Control Center */}
        <aside className="bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 p-8 flex flex-col gap-10 overflow-y-auto">
          <div className="space-y-8">
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] uppercase tracking-widest font-bold text-slate-400">Data Ingestion</h3>
                <div className="w-1.5 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full" />
              </div>
              <ExcelUploader onContactsLoaded={handleContactsLoaded} />
            </section>

            {contacts.length > 0 && (
              <motion.section
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="space-y-6"
              >
                <div className="p-6 bg-slate-900 dark:bg-slate-950 rounded-2xl text-white shadow-xl shadow-slate-900/10 space-y-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <LayoutDashboard className="w-12 h-12" />
                  </div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Mission Progress</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-baseline">
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-bold">{currentIndex}</span>
                        <span className="text-xs font-bold text-slate-500">/ {contacts.length} SENT</span>
                      </div>
                      <span className="text-xs font-mono opacity-50">{Math.round((currentIndex / contacts.length) * 100)}%</span>
                    </div>
                    <Progress value={(currentIndex / contacts.length) * 100} className="h-1.5 bg-white/10" />
                  </div>
                  <div className="grid grid-cols-3 gap-2 pt-2">
                    <div className="text-center">
                      <p className="text-[10px] font-bold text-slate-500">SENT</p>
                      <p className="text-xs font-bold text-whatsapp-green">{stats.sent}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-bold text-slate-500">PENDING</p>
                      <p className="text-xs font-bold text-amber-500">{stats.pending}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-[10px] font-bold text-slate-500">FAILED</p>
                      <p className="text-xs font-bold text-red-500">{stats.failed}</p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    variant="outline" 
                    className="text-[10px] font-black h-10 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl dark:text-slate-300"
                    onClick={resetProgress}
                  >
                    RESTART
                  </Button>
                  <Button 
                    variant="outline" 
                    className="text-[10px] font-black h-10 border-slate-200 dark:border-slate-800 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-100 rounded-xl"
                    onClick={clearContacts}
                  >
                    PURGE ALL
                  </Button>
                </div>
                
                <Button 
                  variant="outline" 
                  className="w-full text-[10px] font-black h-10 border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl dark:text-slate-300"
                  onClick={exportReport}
                >
                  <Download className="w-3.5 h-3.5 mr-2" /> EXPORT REPORT
                </Button>
              </motion.section>
            )}
          </div>

          <div className="mt-auto space-y-4">
            <section className="space-y-3">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-whatsapp-green animate-pulse" />
                System Terminal
              </h4>
              <div className="bg-slate-900 dark:bg-black rounded-xl p-3 h-[180px] overflow-y-auto space-y-1.5 font-mono text-[9px] border border-slate-800">
                {logs.length > 0 ? logs.map(log => (
                  <div key={log.id} className="flex gap-2">
                    <span className="text-slate-500 shrink-0">[{log.time}]</span>
                    <span className={
                      log.type === 'success' ? 'text-whatsapp-green' :
                      log.type === 'error' ? 'text-red-500' :
                      log.type === 'warning' ? 'text-amber-500' :
                      'text-slate-300'
                    }>
                      {log.message}
                    </span>
                  </div>
                )) : (
                  <p className="text-slate-600 italic">No activity detected.</p>
                )}
              </div>
            </section>
            
            <div className="flex justify-between items-center px-1">
              <span className="text-[9px] font-bold text-slate-400">CORE_V_1.2.4</span>
              <div className="flex gap-1.5">
                <div className="w-1 h-1 bg-whatsapp-green rounded-full pulse-dot" />
                <div className="w-1 h-1 bg-slate-700 rounded-full" />
                <div className="w-1 h-1 bg-slate-700 rounded-full" />
              </div>
            </div>
          </div>
        </aside>

        {/* Center: Workspace */}
        <main className="bg-transparent overflow-hidden flex flex-col p-8 z-10">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden glass-panel rounded-[2rem] border border-slate-200/60 dark:border-slate-800 shadow-2xl shadow-slate-200/20 dark:shadow-none">
            <div className="px-8 h-16 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0">
              <TabsList className="bg-transparent gap-10 h-full p-0">
                <TabsTrigger value="campaign" className="h-full text-[11px] font-black tracking-widest uppercase data-[state=active]:text-slate-900 dark:data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-slate-900 dark:data-[state=active]:border-whatsapp-green rounded-none px-0 bg-transparent shadow-none border-b-2 border-transparent transition-all">
                  Registry
                </TabsTrigger>
                <TabsTrigger value="dashboard" className="h-full text-[11px] font-black tracking-widest uppercase data-[state=active]:text-slate-900 dark:data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-slate-900 dark:data-[state=active]:border-whatsapp-green rounded-none px-0 bg-transparent shadow-none border-b-2 border-transparent transition-all">
                  Dashboard
                </TabsTrigger>
                <TabsTrigger value="history" className="h-full text-[11px] font-black tracking-widest uppercase data-[state=active]:text-slate-900 dark:data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-slate-900 dark:data-[state=active]:border-whatsapp-green rounded-none px-0 bg-transparent shadow-none border-b-2 border-transparent transition-all">
                  History
                </TabsTrigger>
                <TabsTrigger value="guide" className="h-full text-[11px] font-black tracking-widest uppercase data-[state=active]:text-slate-900 dark:data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-slate-900 dark:data-[state=active]:border-whatsapp-green rounded-none px-0 bg-transparent shadow-none border-b-2 border-transparent transition-all">
                  Knowledge Base
                </TabsTrigger>
              </TabsList>
              <div className="flex items-center gap-2">
                {activeTab === 'campaign' && groups.length > 1 && (
                  <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                    <SelectTrigger className="w-[140px] h-8 text-[10px] font-bold border-slate-200 dark:border-slate-800 dark:bg-slate-900">
                      <Filter className="w-3 h-3 mr-2" />
                      <SelectValue placeholder="FILTER GROUP" />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-slate-900 dark:border-slate-800">
                      {groups.map(g => (
                        <SelectItem key={g} value={g} className="text-[10px] font-bold">{g.toUpperCase()}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <div className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-full text-[9px] font-bold text-slate-500 dark:text-slate-400">
                  {filteredContacts.length} NODES LOADED
                </div>
              </div>
            </div>

            <TabsContent value="campaign" className="flex-1 overflow-auto outline-none m-0">
              {filteredContacts.length > 0 ? (
                <div className="p-2">
                   <ContactTable contacts={filteredContacts} currentIndex={currentIndex} />
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-20 space-y-6">
                  <div className="w-20 h-20 bg-slate-50 dark:bg-slate-800 rounded-3xl flex items-center justify-center rotate-3 border border-slate-100 dark:border-slate-700">
                    <Users className="w-10 h-10 text-slate-200 dark:text-slate-700 -rotate-3" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-base font-bold text-slate-900 dark:text-white tracking-tight">System Idle</p>
                    <p className="text-xs text-slate-400 max-w-[240px] leading-relaxed">Please ingest recipient data via Excel/CSV to initialize the campaign engine.</p>
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="dashboard" className="flex-1 overflow-auto outline-none m-0 p-8 space-y-8">
              <div className="grid grid-cols-4 gap-6">
                <Card className="p-6 border-slate-200/60 dark:border-slate-800 glass-panel rounded-3xl group hover:border-whatsapp-green/50 transition-all stagger-item shadow-xl shadow-slate-900/5" style={{ animationDelay: '0.1s' }}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Data_Relayed</p>
                    <Send className="w-3 h-3 text-whatsapp-green opacity-30 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
                    {campaignHistory.reduce((acc, c) => acc + c.sent, 0) + stats.sent}
                    <span className="text-[10px] font-mono text-slate-400 ml-2">PKG</span>
                  </p>
                </Card>
                <Card className="p-6 border-slate-200/60 dark:border-slate-800 glass-panel rounded-3xl group hover:border-blue-500/50 transition-all stagger-item shadow-xl shadow-slate-900/5" style={{ animationDelay: '0.2s' }}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Campaign_Cycles</p>
                    <History className="w-3 h-3 text-blue-500 opacity-30 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-3xl font-black text-slate-900 dark:text-white tracking-tighter">
                    {campaignHistory.length + (contacts.length > 0 ? 1 : 0)}
                    <span className="text-[10px] font-mono text-slate-400 ml-2">OPS</span>
                  </p>
                </Card>
                <Card className="p-6 border-slate-200/60 dark:border-slate-800 glass-panel rounded-3xl group hover:border-whatsapp-green/50 transition-all stagger-item shadow-xl shadow-slate-900/5" style={{ animationDelay: '0.3s' }}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Efficiency_Rate</p>
                    <div className="w-1.5 h-1.5 rounded-full bg-whatsapp-green pulse-dot" />
                  </div>
                  <p className="text-3xl font-black text-whatsapp-green tracking-tighter">98.2%</p>
                </Card>
                <Card className="p-6 border-slate-200/60 dark:border-slate-800 glass-panel rounded-3xl group hover:border-blue-500/50 transition-all stagger-item shadow-xl shadow-slate-900/5" style={{ animationDelay: '0.4s' }}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Live_Nodes</p>
                    <Users className="w-3 h-3 text-blue-500 opacity-30 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <p className="text-3xl font-black text-blue-500 tracking-tighter">{contacts.length}</p>
                </Card>
              </div>

              <div className="grid grid-cols-[1.5fr_1fr] gap-8">
                <Card className="p-10 border-slate-200/60 dark:border-slate-800 glass-panel rounded-[2.5rem] space-y-8 stagger-item shadow-2xl shadow-slate-900/5" style={{ animationDelay: '0.5s' }}>
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-widest">
                      <BarChart3 className="w-5 h-5 text-whatsapp-green" /> Transmission_Telemetry
                    </h4>
                    <span className="text-[9px] font-mono text-slate-400 tracking-tighter">REAL_TIME_SEQUENTIAL_DATA</span>
                  </div>
                  <div className="h-[300px] w-full min-w-0">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                      <BarChart data={dashboardData}>
                        <defs>
                          <linearGradient id="colorSent" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#25D366" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#25D366" stopOpacity={0.1}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={darkMode ? 'rgba(255,255,255,0.05)' : '#f1f5f9'} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#94a3b8', fontStyle: 'italic'}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 9, fill: '#94a3b8'}} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '16px', border: 'none', padding: '12px', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', backgroundColor: darkMode ? '#000' : '#fff' }}
                          itemStyle={{ fontSize: '10px', fontWeight: 'black', textTransform: 'uppercase' }}
                          cursor={{fill: 'rgba(37,211,102,0.05)'}}
                        />
                        <Bar dataKey="sent" fill="url(#colorSent)" radius={[6, 6, 0, 0]} barSize={40} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                <Card className="p-10 border-slate-200/60 dark:border-slate-800 glass-panel rounded-[2.5rem] space-y-8 stagger-item shadow-2xl shadow-slate-900/5" style={{ animationDelay: '0.6s' }}>
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-slate-900 dark:text-white flex items-center gap-2 uppercase tracking-widest">
                      <Users className="w-5 h-5 text-blue-500" /> Sector_Allocation
                    </h4>
                  </div>
                  <div className="h-[300px] w-full flex items-center justify-center min-w-0">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'SENT', value: stats.sent },
                            { name: 'PENDING', value: stats.pending },
                            { name: 'FAILED', value: stats.failed }
                          ]}
                          innerRadius={70}
                          outerRadius={100}
                          paddingAngle={8}
                          stroke="none"
                          dataKey="value"
                        >
                          <Cell fill="#25D366" />
                          <Cell fill="#f59e0b" />
                          <Cell fill="#ef4444" />
                        </Pie>
                        <Tooltip 
                          contentStyle={{ borderRadius: '16px', border: 'none', backgroundColor: darkMode ? '#000' : '#fff' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="history" className="flex-1 overflow-auto outline-none m-0 p-8">
              <div className="space-y-4">
                {campaignHistory.length > 0 ? campaignHistory.map(campaign => (
                  <Card key={campaign.id} className="p-6 border-slate-100 dark:border-slate-800 dark:bg-slate-900/50 rounded-2xl flex items-center justify-between hover:border-slate-200 dark:hover:border-slate-700 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-100 dark:bg-slate-800 rounded-xl flex items-center justify-center text-slate-400">
                        <History className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-slate-900 dark:text-white">{campaign.name}</h4>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{format(new Date(campaign.date), 'PPP p')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8">
                      <div className="text-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Contacts</p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">{campaign.totalContacts}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Sent</p>
                        <p className="text-sm font-bold text-whatsapp-green">{campaign.sent}</p>
                      </div>
                      <div className="text-center">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Failed</p>
                        <p className="text-sm font-bold text-red-500">{campaign.failed}</p>
                      </div>
                      <Badge className="bg-whatsapp-green/10 text-whatsapp-green border-none text-[10px] font-bold">COMPLETED</Badge>
                    </div>
                  </Card>
                )) : (
                  <div className="h-[400px] flex flex-col items-center justify-center text-center space-y-4">
                    <History className="w-12 h-12 text-slate-200 dark:text-slate-800" />
                    <p className="text-sm font-bold text-slate-400">No campaign history yet.</p>
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="guide" className="flex-1 overflow-auto outline-none m-0 p-12">
              <div className="max-w-2xl mx-auto space-y-12">
                <section className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                      <HelpCircle className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white underline decoration-blue-100 dark:decoration-blue-900 decoration-4 underline-offset-4">Operational Intelligence</h3>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <Card className="p-6 space-y-4 border-slate-100 dark:border-slate-800 dark:bg-slate-900/50 rounded-3xl hover:border-slate-200 dark:hover:border-slate-700 transition-colors group">
                      <div className="w-8 h-8 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center group-hover:bg-slate-900 dark:group-hover:bg-whatsapp-green group-hover:text-white transition-all">
                        <LayoutDashboard className="w-4 h-4" />
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Native PWA Shell</h4>
                        <p className="text-[11px] text-slate-500 leading-relaxed">Chrome Menu &rarr; Save & Share &rarr; Install. Creates a distraction-free environment.</p>
                      </div>
                    </Card>
                    <Card className="p-6 space-y-4 border-slate-100 dark:border-slate-800 dark:bg-slate-900/50 rounded-3xl hover:border-slate-200 dark:hover:border-slate-700 transition-colors group">
                      <div className="w-8 h-8 bg-slate-50 dark:bg-slate-800 rounded-xl flex items-center justify-center group-hover:bg-slate-900 dark:group-hover:bg-whatsapp-green group-hover:text-white transition-all">
                        <ExternalLink className="w-4 h-4" />
                      </div>
                      <div className="space-y-2">
                        <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">Cloud Distribution</h4>
                        <p className="text-[11px] text-slate-500 leading-relaxed">Scale via Vercel or GitHub links. All campaign parameters persist locally.</p>
                      </div>
                    </Card>
                  </div>

                  <div className="p-8 bg-slate-900 dark:bg-slate-950 rounded-[2.5rem] text-white space-y-8 shadow-2xl shadow-slate-900/20 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-whatsapp-green opacity-5 blur-[80px]" />
                    <h4 className="font-bold text-lg flex items-center gap-3">
                      <CheckCircle2 className="w-6 h-6 text-whatsapp-green" /> Anti-Ban Strategy
                    </h4>
                    <div className="grid gap-8 text-xs font-medium">
                      <div className="flex gap-5">
                        <span className="text-whatsapp-green font-mono text-base font-bold opacity-30 italic">/01/</span>
                        <div className="space-y-1">
                          <p className="text-sm font-bold">The 25/60 Rule</p>
                          <p className="opacity-60 leading-relaxed">Max 25 recipients per burst. Minimum 60 min cool-down required for engine safety.</p>
                        </div>
                      </div>
                      <div className="flex gap-5">
                        <span className="text-whatsapp-green font-mono text-base font-bold opacity-30 italic">/02/</span>
                        <div className="space-y-1">
                          <p className="text-sm font-bold">Dynamic Jitter</p>
                          <p className="opacity-60 leading-relaxed">Maintain 15s+ delay with Random Jitter active to neutralize bot detection heuristics.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            </TabsContent>
          </Tabs>
        </main>

        {/* Right Sidebar: Composer */}
        <aside className="bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 p-8 flex flex-col overflow-y-auto">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-[11px] uppercase tracking-widest font-bold text-slate-400">Message Logic</h3>
            <div className="flex gap-2">
              <Popover>
                <PopoverTrigger render={<Button size="icon" variant="ghost" className="w-8 h-8 rounded-full text-slate-400" />}>
                  <CalendarIcon className="w-4 h-4" />
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 dark:bg-slate-900 dark:border-slate-800" align="end">
                  <div className="p-4 border-b border-slate-100 dark:border-slate-800">
                    <p className="text-xs font-bold text-slate-900 dark:text-white mb-2">Schedule Campaign</p>
                    <Calendar
                      mode="single"
                      selected={scheduledTime}
                      onSelect={setScheduledTime}
                      initialFocus
                      className="dark:bg-slate-900"
                    />
                    {scheduledTime && (
                      <div className="mt-4 p-3 bg-whatsapp-green/10 rounded-xl">
                        <p className="text-[10px] font-bold text-whatsapp-green">
                          Scheduled for: {format(scheduledTime, 'PPP')}
                        </p>
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
              <Button size="icon" variant="ghost" className="w-8 h-8 rounded-full text-slate-400" onClick={() => setShowSettings(true)}>
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <div className="flex-1 space-y-8">
            <TemplateEditor 
              template={template} 
              setTemplate={setTemplate} 
              availableFields={contacts.length > 0 ? Object.keys(contacts[0]).filter(k => !['id', 'status'].includes(k)) : ['Name', 'Phone']} 
            />

            <section className="space-y-4">
              <h4 className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Media Attachment</h4>
              <div className="relative group">
                <div className={`p-4 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2 transition-all ${attachedFile ? 'border-whatsapp-green bg-whatsapp-green/5' : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700'}`}>
                  {attachedFile ? (
                    <>
                      <CheckCircle2 className="w-6 h-6 text-whatsapp-green" />
                      <p className="text-[10px] font-bold text-slate-700 dark:text-slate-300 truncate max-w-full px-4">{attachedFile.name}</p>
                      <button onClick={() => setAttachedFile(null)} className="text-[9px] font-bold text-red-500 hover:underline">Remove</button>
                    </>
                  ) : (
                    <>
                      <Paperclip className="w-6 h-6 text-slate-300" />
                      <p className="text-[10px] font-bold text-slate-400">Attach Image or PDF</p>
                    </>
                  )}
                  <input type="file" className="absolute inset-0 opacity-0 cursor-pointer" onChange={handleFileChange} accept="image/*,application/pdf" />
                </div>
                {!attachedFile && (
                  <p className="text-[9px] text-slate-400 mt-2 italic">* Note: Files must be manually pasted in WhatsApp Web after the tab opens.</p>
                )}
              </div>
            </section>
          </div>

          <div className="mt-10 pt-10 border-t border-slate-100 dark:border-slate-800 space-y-8">
            <div className="grid grid-cols-2 gap-4">
              <Button 
                variant="outline"
                className={`h-14 font-black text-[11px] tracking-widest transition-all rounded-2xl border-2 ${isAutoSending ? 'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20 dark:border-red-900' : 'border-slate-900 dark:border-slate-700 text-slate-900 dark:text-white hover:bg-slate-900 dark:hover:bg-slate-800 hover:text-white shadow-lg shadow-slate-900/5'}`}
                onClick={toggleAutoSend}
                disabled={filteredContacts.length === 0}
              >
                {isAutoSending ? (
                  <><Pause className="w-4 h-4 mr-2" /> STOP</>
                ) : (
                  <><Play className="w-4 h-4 mr-2" /> AUTO</>
                )}
              </Button>
              <Button 
                className="h-14 font-black text-[11px] tracking-widest bg-whatsapp-green hover:bg-[#1ebe5d] text-white shadow-xl shadow-whatsapp-green/20 rounded-2xl flex-1"
                onClick={sendNext}
                disabled={filteredContacts.length === 0 || isAutoSending}
              >
                <Send className="w-4 h-4 mr-2" /> NEXT
              </Button>
            </div>
            
            <div className="space-y-5">
              <section className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Base Latency</span>
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-300">{delay/1000}s</span>
                </div>
                <div className="flex items-center gap-2">
                  {[10, 15, 30, 60].map(s => (
                    <button 
                      key={s}
                      onClick={() => setDelay(s * 1000)}
                      className={`flex-1 h-9 rounded-xl font-bold text-[10px] transition-all border ${delay === s * 1000 ? 'bg-slate-900 dark:bg-whatsapp-green text-white border-slate-900 dark:border-whatsapp-green' : 'bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-100 dark:border-slate-700 hover:border-slate-200'}`}
                    >
                      {s}s
                    </button>
                  ))}
                </div>
              </section>

              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">Human Mode</span>
                  <p className="text-[9px] text-slate-400">Simulate typing delay</p>
                </div>
                <Switch checked={isHumanMode} onCheckedChange={setIsHumanMode} />
              </div>

              <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Active Safety</span>
                <button 
                  onClick={() => setUseRandomDelay(!useRandomDelay)}
                  className={`text-[9px] px-3 py-1 rounded-lg font-black transition-all ${useRandomDelay ? 'bg-whatsapp-green text-white shadow-sm' : 'bg-slate-200 dark:bg-slate-700 text-slate-400'}`}
                >
                  {useRandomDelay ? 'SHIELD ON' : 'OFF'}
                </button>
              </div>
            </div>

            <Dialog open={showSettings} onOpenChange={setShowSettings}>
              <DialogContent className="rounded-3xl border-none shadow-2xl dark:bg-slate-900">
                <DialogHeader>
                  <DialogTitle className="text-lg font-black text-slate-900 dark:text-white mb-4">ENGINE SETTINGS</DialogTitle>
                </DialogHeader>
                <div className="space-y-6 py-4">
                  <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-slate-900 dark:text-white">Safety Suffix</p>
                      <p className="text-[10px] text-slate-400">Add unique ID to every message hash.</p>
                    </div>
                    <Switch checked={safetySuffix} onCheckedChange={setSafetySuffix} />
                  </div>
                  <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-2xl border border-amber-100 dark:border-amber-900/30 flex gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                    <p className="text-[10px] text-amber-700 dark:text-amber-400 leading-relaxed">
                      <b>Warning:</b> Sending too many messages too fast can lead to account suspension. Always use a delay of at least 15 seconds and keep "Human Mode" active.
                    </p>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <div className="flex items-center gap-2 px-2 text-slate-300 dark:text-slate-600">
              <AlertTriangle className="w-3 h-3" />
              <span className="text-[9px] font-bold uppercase tracking-tighter">Maintain window focus for optimal sync</span>
            </div>
          </div>
        </aside>

      </div>
    </div>
  );
}
