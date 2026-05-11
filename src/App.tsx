/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ExcelUploader } from '@/components/ExcelUploader';
import { TemplateEditor } from '@/components/TemplateEditor';
import { ContactTable } from '@/components/ContactTable';
import { TemplateManager } from '@/components/TemplateManager';
import { BlacklistManager } from '@/components/BlacklistManager';
import { AIMessageGenerator } from '@/components/AIMessageGenerator';
import { AnalyticsDashboard } from '@/components/AnalyticsDashboard';
import { VariableFiller } from '@/components/VariableFiller';
import { ScheduledQueue } from '@/components/ScheduledQueue';
import { SchedulePicker } from '@/components/SchedulePicker';
import { Contact, generateWhatsAppLink, replacePlaceholders, Campaign, PREMADE_TEMPLATES, BlacklistEntry, Template, ValidationReport, ScheduledCampaign } from '@/lib/whatsapp';
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
import { Toaster, toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format, isAfter, parseISO } from "date-fns";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from 'recharts';
import * as XLSX from 'xlsx';
import { authService } from '@/lib/auth';
import { LoginPage } from '@/components/LoginPage';
import { AdminSystem } from '@/components/AdminSystem';
import { User } from '@/types';
import { 
  MessageSquare, Send, Trash2, Users, LayoutDashboard, Settings, 
  Play, Pause, AlertTriangle, Info, HelpCircle, ExternalLink, 
  CheckCircle2, Moon, Sun, History, BarChart3, Calendar as CalendarIcon,
  Paperclip, Download, Filter, UserCheck, UserPlus, Clock, Sparkles, Layers,
  LogOut, ShieldCheck
} from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [systemSettings, setSystemSettings] = useState(authService.getSettings());

  // Auth Check
  useEffect(() => {
    const auth = authService.getAuth();
    if (auth.isAuthenticated) {
      setUser(auth.user);
    }
    setSystemSettings(authService.getSettings());
    setIsAuthLoading(false);
  }, []);

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    toast.info("Logged out successfully");
  };

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [template, setTemplate] = useState("Hello {{Name}},\n\nThis is a test message from our WhatsApp Bulk Sender tool.");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [isAutoSending, setIsAutoSending] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [delay, setDelay] = useState(15000);
  const [useRandomDelay, setUseRandomDelay] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [safetySuffix, setSafetySuffix] = useState(true);
  const [darkMode, setDarkMode] = useState(false);
  const [campaignName, setCampaignName] = useState("");
  const [blacklist, setBlacklist] = useState<BlacklistEntry[]>([]);
  const [customTemplates, setCustomTemplates] = useState<Template[]>([]);
  const [isSafetyActive, setIsSafetyActive] = useState(true);
  const [customDelay, setCustomDelay] = useState<string>("15");
  const [isPauseRequested, setIsPauseRequested] = useState(false);
  const [isVarModalOpen, setIsVarModalOpen] = useState(false);
  const [selectedTemplateContent, setSelectedTemplateContent] = useState("");
  
  // New States for Phase 2 & 3
  const [campaignHistory, setCampaignHistory] = useState<Campaign[]>([]);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [scheduledTime, setScheduledTime] = useState<Date | undefined>(undefined);
  const [isScheduling, setIsScheduling] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedHour, setSelectedHour] = useState("10");
  const [selectedMinute, setSelectedMinute] = useState("00");
  const [timezone, setTimezone] = useState("IST");
  const [scheduledQueue, setScheduledQueue] = useState<ScheduledCampaign[]>([]);
  const [isHumanMode, setIsHumanMode] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<string>('All');
  const [activeTab, setActiveTab] = useState('campaign');
  const [logs, setLogs] = useState<{id: string, time: string, message: string, type: 'info' | 'success' | 'warning' | 'error'}[]>([]);
  const [showSuccessAnim, setShowSuccessAnim] = useState(false);
  const [isDataLoading, setIsDataLoading] = useState(false);

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
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const bestTimeToSend = useMemo(() => {
    if (campaignHistory.length === 0) return "10:00 AM - 12:00 PM (Peak Engagement)";
    // Simple logic: check which campaigns had highest success or just random for now based on stats
    return "09:30 AM - 11:45 AM (Optimized)";
  }, [campaignHistory]);

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
    const savedBlacklist = localStorage.getItem('whatsapp_sync_blacklist');
    const savedCustomTemplates = localStorage.getItem('whatsapp_sync_templates');
    const savedQueue = localStorage.getItem('whatsapp_sync_queue');

    if (savedContacts) setContacts(JSON.parse(savedContacts));
    if (savedTemplate) setTemplate(savedTemplate);
    if (savedIndex) setCurrentIndex(parseInt(savedIndex, 10));
    if (savedHistory) setCampaignHistory(JSON.parse(savedHistory));
    if (savedDarkMode) setDarkMode(savedDarkMode === 'true');
    if (savedBlacklist) setBlacklist(JSON.parse(savedBlacklist));
    if (savedCustomTemplates) setCustomTemplates(JSON.parse(savedCustomTemplates));
    if (savedQueue) setScheduledQueue(JSON.parse(savedQueue));
  }, []);

  // Theme effect
  useEffect(() => {
    // Check for system preference if no localStorage preference
    const savedDarkMode = localStorage.getItem('whatsapp_sync_darkmode');
    if (savedDarkMode === null) {
      if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        setDarkMode(true);
      }
    } else {
      setDarkMode(savedDarkMode === 'true');
    }

    // Media query listener for system theme changes
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => {
      if (localStorage.getItem('whatsapp_sync_darkmode') === null) {
        setDarkMode(e.matches);
      }
    };
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

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

  useEffect(() => {
    localStorage.setItem('whatsapp_sync_blacklist', JSON.stringify(blacklist));
  }, [blacklist]);

  useEffect(() => {
    localStorage.setItem('whatsapp_sync_templates', JSON.stringify(customTemplates));
  }, [customTemplates]);

  useEffect(() => {
    localStorage.setItem('whatsapp_sync_queue', JSON.stringify(scheduledQueue));
  }, [scheduledQueue]);

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

  const [validationReport, setValidationReport] = useState<ValidationReport | null>(null);
  
  const handleContactsLoaded = (newContacts: Contact[], report: ValidationReport) => {
    setIsDataLoading(true);
    // Simulate processing delay for UX
    setTimeout(() => {
      setContacts(newContacts);
      setValidationReport(report);
      setCurrentIndex(0);
      setIsDataLoading(false);
      addLog(`Ingested ${newContacts.length} valid nodes from dataset.`, 'success');
      toast.success(`Loaded ${newContacts.length} contacts. ${report.invalid} invalid entries ignored.`);
    }, 1000);
  };

  const handleTemplateSelect = (content: string) => {
    setSelectedTemplateContent(content);
    setIsVarModalOpen(true);
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

  const retryFailed = () => {
    const failedContacts = contacts.filter(c => c.status === 'failed');
    if (failedContacts.length === 0) {
      toast.info("No failed nodes detected.");
      return;
    }
    const resetContacts = contacts.map(c => 
      c.status === 'failed' ? { ...c, status: 'pending' as const } : c
    );
    setContacts(resetContacts);
    setCurrentIndex(contacts.findIndex(c => c.status === 'failed'));
    addLog(`Rescheduling ${failedContacts.length} failed nodes for retry.`, 'warning');
    toast.success(`Retrying ${failedContacts.length} failed messages.`);
  };

  const exportValidNumbers = () => {
    if (contacts.length === 0) return;
    
    const headers: string[] = ['Name', 'Phone', 'Group', ...Array.from(new Set(contacts.flatMap(c => 
      Object.keys(c).filter(k => !['id', 'name', 'phone', 'status', 'group'].includes(k))
    ))) as string[]];
    
    const csvContent = [
      headers.join(','),
      ...contacts.map(c => headers.map(h => {
        const val = c[h.toLowerCase()] || c[h] || '';
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `valid_contacts_${format(new Date(), 'yyyyMMdd_HHmm')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV Export Triggered!");
  };

  const removeContact = (id: string) => {
    setContacts(prev => prev.filter(c => c.id !== id));
    addLog("Node manually removed from sequence.", 'warning');
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
    
    // Track usage for the current operator
    if (user && user.email) {
      authService.incrementUserMessages(user.email, stats.sent);
    }
  };

  const exportReport = () => {
    if (contacts.length === 0) return;
    
    // Create detailed report based on user requirement
    const data = contacts.map(c => ({
      'Recipient Name': c.name,
      'Phone Number': c.phone,
      'Group': c.group || 'General',
      'Transmission Status': c.status.toUpperCase(),
      'Timestamp': new Date().toLocaleString()
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Campaign Report");
    XLSX.writeFile(wb, `WhatsApp_Broadcast_Report_${format(new Date(), 'yyyyMMdd_HHmm')}.xlsx`);
    addLog("Campaign report generated and exported.", 'success');
    toast.success("Detailed Report Exported!");
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setAttachedFile(e.target.files[0]);
      toast.success(`File attached: ${e.target.files[0].name}`);
    }
  };

  const sendNext = () => {
    if (currentIndex >= filteredContacts.length) {
      setIsAutoSending(false);
      saveCampaignToHistory();
      toast.success("Campaign processes successfully!");
      return;
    }

    const contact = filteredContacts[currentIndex];
    if (!contact) return;

    if (blacklist.some(b => b.phone === contact.phone)) {
      addLog(`Skipped blacklisted node: ${contact.phone}`, 'warning');
      setContacts(prev => prev.map(c => c.id === contact.id ? { ...c, status: 'failed' } : c));
      setCurrentIndex(prev => prev + 1);
      return;
    }

    const uniqueSuffix = safetySuffix ? `\n\n[ID: ${Math.random().toString(36).substring(7)}]` : '';
    const message = replacePlaceholders(template, contact) + uniqueSuffix;
    const link = generateWhatsAppLink(contact.phone, message);

    // Update status
    setContacts(prev => prev.map(c => c.id === contact.id ? { ...c, status: 'sent' } : c));
    addLog(`Redirecting to WhatsApp for ${contact.name}...`, 'info');

    // Open in SAME tab
    const wpWindow = window.open(link, 'whatsapp_sync_window');
    whatsappWindowRef.current = wpWindow;
    
    // Increment index
    setCurrentIndex(prev => prev + 1);
    
    // Start countdown for next if auto-sending
    if (isAutoSending && !isPaused) {
      const waitTime = (parseInt(customDelay) || 10) + (useRandomDelay ? Math.floor(Math.random() * 5) : 0);
      setCountdown(waitTime);
    }
  };

  const skipActive = () => {
    if (currentIndex < filteredContacts.length) {
      addLog(`Skipped node: ${filteredContacts[currentIndex].name}`, 'warning');
      setCurrentIndex(prev => prev + 1);
      setCountdown(0);
      if (isAutoSending && !isPaused) {
        setCountdown(2); // Short delay before next
      }
    }
  };

  const markFailedActive = () => {
    if (currentIndex < filteredContacts.length) {
      const contact = filteredContacts[currentIndex];
      addLog(`Marked as failed: ${contact.name}`, 'error');
      setContacts(prev => prev.map(c => c.id === contact.id ? { ...c, status: 'failed' } : c));
      setCurrentIndex(prev => prev + 1);
      setCountdown(0);
      if (isAutoSending && !isPaused) {
        setCountdown(2);
      }
    }
  };

  // Countdown effect
  useEffect(() => {
    if (countdown > 0 && isAutoSending && !isPaused) {
      countdownIntervalRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownIntervalRef.current!);
            sendNext();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    }

    return () => {
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, [countdown, isAutoSending, isPaused]);

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

  // Global Scheduler Worker
  useEffect(() => {
    const checkSchedule = () => {
      const now = new Date();
      setScheduledQueue(currentQueue => {
        let changed = false;
        const newQueue = currentQueue.map(item => {
          if (item.status === 'upcoming') {
            const scheduledDate = parseISO(item.scheduledTime);
            if (!isAfter(scheduledDate, now)) {
              changed = true;
              // Trigger Send Logic
              setContacts(item.contacts);
              setTemplate(item.template);
              setCampaignName(item.name);
              setIsAutoSending(true);
              setActiveTab('campaign');
              
              // Browser Notification
              if ("Notification" in window && Notification.permission === "granted") {
                new Notification(`WPSync: ${item.name}`, { 
                  body: `Scheduling window reached for ${item.contacts.length} recipients. Initating transmission...`,
                  icon: '/favicon.ico'
                });
              }
              
              return { ...item, status: 'sending' as const };
            }
          }
          return item;
        });
        return changed ? newQueue : currentQueue;
      });
    };

    const interval = setInterval(checkSchedule, 10000); // Check every 10s
    return () => clearInterval(interval);
  }, []);

  const handleRetry = (id: string) => {
    const contactIndex = filteredContacts.findIndex(c => c.id === id);
    if (contactIndex !== -1) {
      setCurrentIndex(contactIndex);
      toast.info(`Adjusting active cursor to node ${id.substring(0, 8)} for retry.`);
    }
  };

  const handleSchedule = () => {
    if (contacts.length === 0) {
      toast.error("Pehle recipients upload karein!");
      return;
    }
    if (!selectedDate) {
      toast.error("Please select a target date.");
      return;
    }

    const scheduledDate = new Date(selectedDate);
    scheduledDate.setHours(parseInt(selectedHour));
    scheduledDate.setMinutes(parseInt(selectedMinute));

    const newSchedule: ScheduledCampaign = {
      id: Date.now().toString(),
      name: campaignName || `Sequence_${format(new Date(), 'HHmm')}`,
      scheduledTime: scheduledDate.toISOString(),
      contacts: [...filteredContacts],
      template,
      status: 'upcoming',
      createdAt: new Date().toISOString(),
      timezone
    };

    setScheduledQueue([newSchedule, ...scheduledQueue]);
    addLog(`Sequence ${newSchedule.name} queued for ${format(scheduledDate, 'PPP p')}.`, 'success');
    toast.success(`Campaign scheduled for ${format(scheduledDate, 'HH:mm')}`);
    setIsScheduling(false);
    setActiveTab('scheduled');
  };

  const cancelScheduled = (id: string) => {
    setScheduledQueue(prev => prev.map(item => 
      item.id === id ? { ...item, status: 'cancelled' as const } : item
    ));
    addLog("Sequence node manually cancelled.", 'warning');
    toast.info("Schedule cancelled.");
  };

  const toggleAutoSend = () => {
    if (contacts.length === 0) {
      toast.error("Pehle Excel file upload karein!");
      return;
    }
    
    if (!isAutoSending) {
      // Check usage limits for users
      if (user?.role === 'user') {
        const fullUser = authService.findUserByEmail(user.email);
        const today = new Date().toISOString().split('T')[0];
        const messagesToday = (fullUser.history || [])
          .filter((h: any) => h.timestamp.startsWith(today))
          .reduce((acc: number, h: any) => acc + h.recipientCount, 0);
        
        if (messagesToday + contacts.length > systemSettings.maxMessagesPerUser) {
          toast.error(`Daily limit exceeded! Max ${systemSettings.maxMessagesPerUser} messages per day. You have already sent ${messagesToday} today.`);
          return;
        }
      }

      setIsAutoSending(true);
      setIsPaused(false);
      addLog("Campaign engine initiated. Sequential processing enabled.", 'info');
      toast.info("Auto-Send starting... Make sure to allow popups!", {
        icon: <AlertTriangle className="text-amber-500" />,
      });
      // Start first one
      sendNext();
    } else {
      setIsAutoSending(false);
      setIsPaused(false);
      setCountdown(0);
      addLog("Processing suspended by user command.", 'warning');
    }
  };

  if (isAuthLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="w-16 h-16 border-4 border-whatsapp-green border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <LoginPage onLoginSuccess={setUser} />
        <Toaster position="top-center" richColors closeButton />
      </>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-app-bg cyber-grid relative">
      <div className="scanline" />
      <Toaster position="top-center" expand={true} richColors closeButton />
      
      {/* Header Area */}
      <header className="h-16 glass-panel border-b border-border bg-white/80 dark:bg-card/80 backdrop-blur-md flex items-center justify-between px-4 md:px-8 shrink-0 z-20">
        <div className="flex items-center gap-3 md:gap-4">
          <div className="w-8 h-8 md:w-10 md:h-10 bg-slate-900 dark:bg-whatsapp-green rounded-xl flex items-center justify-center shadow-lg shadow-slate-900/10 transition-transform hover:scale-105 active:scale-95">
            <MessageSquare className="w-4 h-4 md:w-5 md:h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xs md:text-sm font-black text-slate-900 dark:text-white tracking-tight uppercase">{systemSettings.appName}</h1>
            <p className="text-[8px] md:text-[10px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest leading-none">
              {user.role === 'admin' ? 'SYSTEM OVERLORD' : 'OPERATOR'} ACCESS
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 md:gap-6">
          <div className="hidden lg:flex items-center gap-4 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-r pr-6 border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-green-500 rounded-full" /> API ACTIVE
            </div>
            {user.role === 'admin' && (
              <div className="flex items-center gap-1.5 text-whatsapp-green bg-whatsapp-green/5 px-2 py-0.5 rounded border border-whatsapp-green/20">
                <ShieldCheck className="w-3 h-3" /> ADMIN MODE
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <div className="w-2 h-2 bg-whatsapp-green rounded-full shadow-[0_0_8px_rgba(37,211,102,0.6)]" />
              <span className="text-[10px] font-black text-slate-700 dark:text-slate-300 uppercase tracking-widest">{user.name}</span>
            </div>
            
            <Button 
              size="icon" 
              variant="ghost" 
              className="w-8 h-8 md:w-9 md:h-9 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              onClick={() => setDarkMode(!darkMode)}
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </Button>

            <Button 
              size="icon" 
              variant="ghost" 
              className="w-8 h-8 md:w-9 md:h-9 rounded-full text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Grid Layout */}
      <div className="flex-1 flex flex-col md:grid md:grid-cols-[280px_1fr] lg:grid-cols-[300px_1fr_360px] gap-0 bg-slate-50/50 dark:bg-background overflow-hidden pb-20 md:pb-0">
        
        {/* Left Sidebar: Control Center */}
        <aside className="hidden md:flex bg-white dark:bg-card border-r border-border p-6 md:p-8 flex-col gap-6 md:gap-10 overflow-y-auto custom-scrollbar">
          <div className="space-y-8">
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[11px] uppercase tracking-widest font-black text-slate-400 dark:text-muted-foreground">Data Ingestion</h3>
                <div className="w-1.5 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full" />
              </div>
              <ExcelUploader onContactsLoaded={handleContactsLoaded} />
            </section>

            {validationReport && (
              <Card className="p-4 border-slate-200 dark:border-slate-800 glass-panel rounded-2xl space-y-3 stagger-item">
                <div className="flex items-center justify-between">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Validation Scan</h4>
                  <Badge variant="outline" className="text-[9px] font-bold border-whatsapp-green text-whatsapp-green">{validationReport.valid} VALID</Badge>
                </div>
                
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-slate-50 dark:bg-black/40 p-2 rounded-xl text-center border border-slate-100 dark:border-slate-800">
                    <p className="text-[8px] font-bold text-slate-400 uppercase">Total</p>
                    <p className="text-sm font-black text-slate-700 dark:text-slate-200">{validationReport.total}</p>
                  </div>
                  <div className="bg-amber-50 dark:bg-amber-900/10 p-2 rounded-xl text-center border border-amber-100 dark:border-amber-900/20">
                    <p className="text-[8px] font-bold text-amber-500 uppercase">Dupes</p>
                    <p className="text-sm font-black text-amber-600">{validationReport.duplicates}</p>
                  </div>
                  <div className="bg-red-50 dark:bg-red-900/10 p-2 rounded-xl text-center border border-red-100 dark:border-red-900/20">
                    <p className="text-[8px] font-bold text-red-500 uppercase">Invalid</p>
                    <p className="text-sm font-black text-red-600">{validationReport.invalid}</p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="flex-1 text-[9px] font-black h-8 rounded-xl border-slate-200 dark:border-slate-800"
                    onClick={exportValidNumbers}
                    disabled={contacts.length === 0}
                  >
                    <Download className="w-3 h-3 mr-1.5" /> EXPORT
                  </Button>
                  
                  {validationReport.invalid > 0 && (
                    <Dialog>
                      <DialogTrigger
                        render={
                          <Button 
                            variant="ghost" 
                            size="sm"
                            className="flex-1 text-[9px] font-black h-8 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10"
                          >
                            ERRORS
                          </Button>
                        }
                      />
                      <DialogContent className="dark:bg-slate-900 dark:border-slate-800 max-w-md">
                        <DialogHeader>
                          <DialogTitle className="text-sm font-bold uppercase tracking-widest text-red-500">Validation Errors</DialogTitle>
                        </DialogHeader>
                        <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                          {validationReport.invalidEntries.map((entry, idx) => (
                            <div key={idx} className="p-3 bg-slate-50 dark:bg-black rounded-xl border border-slate-100 dark:border-slate-800">
                              <div className="flex justify-between items-start">
                                <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">{entry.name}</span>
                                <Badge variant="secondary" className="text-[8px] font-black bg-red-100 text-red-600 border-none">{entry.reason}</Badge>
                              </div>
                              <p className="text-[10px] font-mono text-slate-400 mt-1">{entry.phone || 'NO_PHONE'}</p>
                            </div>
                          ))}
                        </div>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </Card>
            )}

            <BlacklistManager blacklist={blacklist} setBlacklist={setBlacklist} />

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
                    className="text-[10px] font-black h-10 border-orange-200 dark:border-orange-900/50 text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-xl"
                    onClick={retryFailed}
                  >
                    RETRY FAILED
                  </Button>
                  <Button 
                    variant="outline" 
                    className="text-[10px] font-black h-10 border-slate-200 dark:border-slate-800 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 hover:border-red-100 rounded-xl col-span-2"
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
        <main className="flex-1 min-w-0 bg-transparent overflow-hidden flex flex-col p-4 md:p-8 z-10">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden glass-panel rounded-2xl md:rounded-[2rem] border border-slate-200/60 dark:border-slate-800 shadow-2xl shadow-slate-200/20 dark:shadow-none">
            <div className="px-4 md:px-8 h-14 md:h-16 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 overflow-x-auto custom-scrollbar no-scrollbar">
              <TabsList className="bg-transparent gap-6 md:gap-10 h-full p-0 flex-nowrap">
                <TabsTrigger value="campaign" className="h-full text-[10px] md:text-[11px] font-black tracking-widest uppercase data-[state=active]:text-slate-900 dark:data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-slate-900 dark:data-[state=active]:border-whatsapp-green rounded-none px-0 bg-transparent shadow-none border-b-2 border-transparent transition-all whitespace-nowrap">
                  Registry
                </TabsTrigger>
                {user.role === 'admin' && (
                  <TabsTrigger value="dashboard" className="h-full text-[10px] md:text-[11px] font-black tracking-widest uppercase data-[state=active]:text-slate-900 dark:data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-slate-900 dark:data-[state=active]:border-whatsapp-green rounded-none px-0 bg-transparent shadow-none border-b-2 border-transparent transition-all whitespace-nowrap">
                    Dashboard
                  </TabsTrigger>
                )}
                <TabsTrigger value="history" className="h-full text-[10px] md:text-[11px] font-black tracking-widest uppercase data-[state=active]:text-slate-900 dark:data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-slate-900 dark:data-[state=active]:border-whatsapp-green rounded-none px-0 bg-transparent shadow-none border-b-2 border-transparent transition-all whitespace-nowrap">
                  History
                </TabsTrigger>
                <TabsTrigger value="scheduled" className="h-full text-[10px] md:text-[11px] font-black tracking-widest uppercase data-[state=active]:text-slate-900 dark:data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-slate-900 dark:data-[state=active]:border-whatsapp-green rounded-none px-0 bg-transparent shadow-none border-b-2 border-transparent transition-all whitespace-nowrap">
                  Scheduled
                </TabsTrigger>
                <TabsTrigger value="templates" className="h-full text-[10px] md:text-[11px] font-black tracking-widest uppercase data-[state=active]:text-slate-900 dark:data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-slate-900 dark:data-[state=active]:border-whatsapp-green rounded-none px-0 bg-transparent shadow-none border-b-2 border-transparent transition-all whitespace-nowrap">
                  Templates
                </TabsTrigger>
                <TabsTrigger value="guide" className="h-full text-[10px] md:text-[11px] font-black tracking-widest uppercase data-[state=active]:text-slate-900 dark:data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-slate-900 dark:data-[state=active]:border-whatsapp-green rounded-none px-0 bg-transparent shadow-none border-b-2 border-transparent transition-all whitespace-nowrap">
                  KB
                </TabsTrigger>
                {user.role === 'admin' && (
                  <TabsTrigger value="users" className="h-full text-[10px] md:text-[11px] font-black tracking-widest uppercase data-[state=active]:text-slate-900 dark:data-[state=active]:text-white data-[state=active]:border-b-2 data-[state=active]:border-slate-900 dark:data-[state=active]:border-whatsapp-green rounded-none px-0 bg-transparent shadow-none border-b-2 border-transparent transition-all whitespace-nowrap">
                    Users
                  </TabsTrigger>
                )}
              </TabsList>
              <div className="hidden sm:flex items-center gap-2">
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
                  {filteredContacts.length} NODES
                </div>
              </div>
            </div>

            <TabsContent value="campaign" className="flex-1 overflow-auto outline-none m-0 relative">
              <AnimatePresence>
                {showSuccessAnim && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-50 flex items-center justify-center bg-white/60 dark:bg-slate-950/60 backdrop-blur-sm pointer-events-none"
                  >
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-20 h-20 bg-whatsapp-green rounded-full flex items-center justify-center shadow-2xl shadow-whatsapp-green/40">
                        <CheckCircle2 className="w-10 h-10 text-white" />
                      </div>
                      <h4 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Transmission Complete</h4>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Queue Controller Overlay */}
              {(isAutoSending || countdown > 0 || isPaused) && (
                <div className="sticky top-0 z-20 p-4 border-b border-slate-200 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-sm">
                  <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="w-12 h-12 rounded-full border-4 border-slate-100 dark:border-slate-800 flex items-center justify-center relative">
                        {countdown > 0 && !isPaused ? (
                          <span className="text-lg font-black text-whatsapp-green">{countdown}</span>
                        ) : isPaused ? (
                          <Pause className="w-5 h-5 text-amber-500" />
                        ) : (
                          <Send className="w-5 h-5 text-whatsapp-green animate-pulse" />
                        )}
                        <svg className="absolute inset-0 w-full h-full -rotate-90">
                           <circle 
                            cx="24" cy="24" r="20" 
                            fill="none" 
                            stroke="currentColor" 
                            strokeWidth="4" 
                            className="text-whatsapp-green/20"
                          />
                          {countdown > 0 && (
                            <motion.circle 
                              cx="24" cy="24" r="20" 
                              fill="none" 
                              stroke="currentColor" 
                              strokeWidth="4" 
                              strokeDasharray="125.6"
                              initial={{ strokeDashoffset: 125.6 }}
                              animate={{ strokeDashoffset: 125.6 * (1 - countdown / (parseInt(customDelay) || 10)) }}
                              className="text-whatsapp-green"
                            />
                          )}
                        </svg>
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          {isPaused ? 'Sequence Paused' : countdown > 0 ? 'Cooldown Cycle' : 'Ready to Send'}
                        </p>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                          Node {currentIndex + 1} of {filteredContacts.length} — {filteredContacts[currentIndex]?.name}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                       {countdown > 0 && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-9 px-4 text-[10px] font-black text-whatsapp-green hover:bg-whatsapp-green/5"
                          onClick={() => {
                            setCountdown(0);
                            sendNext();
                          }}
                        >
                          SKIP DELAY
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-9 px-4 text-[10px] font-black border-slate-200 dark:border-slate-800"
                        onClick={() => setIsPaused(!isPaused)}
                      >
                        {isPaused ? <><Play className="w-3 h-3 mr-2" /> RESUME</> : <><Pause className="w-3 h-3 mr-2" /> PAUSE</>}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-9 px-4 text-[10px] font-black border-red-100 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10"
                        onClick={() => {
                          setIsAutoSending(false);
                          setCountdown(0);
                          setIsPaused(false);
                        }}
                      >
                        STOP QUEUE
                      </Button>
                      <Button 
                        size="sm" 
                        className="h-9 px-6 text-[10px] font-black bg-whatsapp-green text-white hover:bg-whatsapp-green/90"
                        onClick={() => {
                          setCountdown(0);
                          sendNext();
                        }}
                        disabled={countdown > 0 && !isPaused}
                      >
                        SEND NEXT
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {filteredContacts.length > 0 || isDataLoading ? (
                <div className="p-0 md:p-2">
                   <ContactTable 
                    contacts={filteredContacts} 
                    currentIndex={currentIndex} 
                    onRemove={removeContact}
                    onRetry={handleRetry}
                    isLoading={isDataLoading}
                  />
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-12 md:p-20 space-y-6">
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-slate-50 dark:bg-slate-800 rounded-3xl flex items-center justify-center rotate-3 border border-slate-100 dark:border-slate-700">
                    <Users className="w-8 h-8 md:w-10 md:h-10 text-slate-200 dark:text-slate-700 -rotate-3" />
                  </div>
                  <div className="space-y-2">
                    <p className="text-sm md:text-base font-bold text-slate-900 dark:text-white tracking-tight">System Idle</p>
                    <p className="text-[11px] md:text-xs text-slate-400 max-w-[240px] leading-relaxed">Please ingest recipient data via Excel/CSV to initialize the campaign engine.</p>
                    <div className="md:hidden pt-4">
                      <ExcelUploader onContactsLoaded={handleContactsLoaded} />
                    </div>
                  </div>
                </div>
              ) }
              
              {/* Message Composer for Mobile - Embedded in Registry Tab */}
              <div className="lg:hidden p-4 md:p-8 space-y-8 bg-slate-50/50 dark:bg-black/20 border-t border-slate-100 dark:border-slate-800">
                 <div className="flex items-center justify-between">
                    <h3 className="text-[11px] uppercase tracking-widest font-bold text-slate-400">Mobile Composer</h3>
                    <div className="flex items-center gap-2">
                      <span className={`text-[8px] font-black uppercase ${isScheduling ? 'text-whatsapp-green' : 'text-slate-400'}`}>
                        {isScheduling ? 'Scheduler' : 'Instant'}
                      </span>
                      <Switch checked={isScheduling} onCheckedChange={setIsScheduling} className="scale-75" />
                    </div>
                  </div>

                  <AnimatePresence mode="wait">
                    {isScheduling && (
                      <motion.div
                        key="schedule-mobile"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                      >
                        <SchedulePicker
                          selectedDate={selectedDate}
                          onDateSelect={setSelectedDate}
                          selectedHour={selectedHour}
                          onHourChange={setSelectedHour}
                          selectedMinute={selectedMinute}
                          onMinuteChange={setSelectedMinute}
                          timezone={timezone}
                          onTimezoneChange={setTimezone}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <Input 
                    value={campaignName} 
                    onChange={e => setCampaignName(e.target.value)} 
                    placeholder="Campaign Label" 
                    className="h-12 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs font-bold rounded-2xl"
                  />

                  <TemplateEditor 
                    template={template} 
                    setTemplate={setTemplate} 
                    availableFields={contacts.length > 0 ? Object.keys(contacts[0]).filter(k => !['id', 'status'].includes(k)) : ['Name', 'Phone']} 
                  />

                  <div className="grid grid-cols-2 gap-3">
                    <Button 
                      variant="outline"
                      className={`h-14 font-black text-[11px] tracking-widest rounded-2xl border-2 ${isAutoSending ? 'bg-red-50 text-red-600 border-red-100' : 'border-slate-900 dark:border-slate-700 dark:text-white'}`}
                      onClick={isScheduling ? handleSchedule : toggleAutoSend}
                      disabled={filteredContacts.length === 0}
                    >
                      {isScheduling ? 'QUEUE' : isAutoSending ? 'STOP' : 'AUTO'}
                    </Button>
                    <Button 
                      className="h-14 font-black text-[11px] tracking-widest bg-whatsapp-green text-white rounded-2xl"
                      onClick={sendNext}
                      disabled={filteredContacts.length === 0 || isAutoSending || isScheduling}
                    >
                      NEXT
                    </Button>
                  </div>
              </div>
            </TabsContent>

            <TabsContent value="dashboard" className="flex-1 overflow-auto outline-none m-0 p-8">
              <AnalyticsDashboard />
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
            
            <TabsContent value="scheduled" className="flex-1 overflow-auto outline-none m-0 p-8">
              <div className="max-w-5xl mx-auto space-y-6">
                <div>
                  <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Sequence Repository</h2>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Manage future transmission windows</p>
                </div>
                <ScheduledQueue queue={scheduledQueue} onCancel={cancelScheduled} />
              </div>
            </TabsContent>
            
            <TabsContent value="templates" className="flex-1 overflow-auto outline-none m-0 p-8 space-y-8">
              <div className="max-w-4xl mx-auto">
                <TemplateManager 
                  customTemplates={customTemplates} 
                  setCustomTemplates={setCustomTemplates} 
                  onSelect={(content) => {
                    handleTemplateSelect(content);
                    setActiveTab('campaign');
                  }} 
                />
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
            <TabsContent value="users" className="flex-1 overflow-auto outline-none m-0 p-8">
              <div className="max-w-5xl mx-auto">
                <AdminSystem />
              </div>
            </TabsContent>
          </Tabs>
        </main>

        {/* Right Sidebar: Composer */}
        <aside className="hidden lg:flex bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800 p-8 flex-col overflow-y-auto">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-[11px] uppercase tracking-widest font-bold text-slate-400">Message Logic</h3>
            <div className="flex gap-2">
              <Button size="icon" variant="ghost" className="w-8 h-8 rounded-full text-slate-400" onClick={() => setShowSettings(true)}>
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <div className="flex-1 space-y-8">
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Operational Metadata</h4>
                <div className="flex items-center gap-2">
                  <span className={`text-[8px] font-black uppercase ${isScheduling ? 'text-whatsapp-green' : 'text-slate-400'}`}>
                    {isScheduling ? 'Schedule Mode' : 'Instant Mode'}
                  </span>
                  <Switch checked={isScheduling} onCheckedChange={setIsScheduling} className="scale-75" />
                </div>
              </div>
              
              <AnimatePresence mode="wait">
                {isScheduling ? (
                  <motion.div
                    key="schedule"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <SchedulePicker
                      selectedDate={selectedDate}
                      onDateSelect={setSelectedDate}
                      selectedHour={selectedHour}
                      onHourChange={setSelectedHour}
                      selectedMinute={selectedMinute}
                      onMinuteChange={setSelectedMinute}
                      timezone={timezone}
                      onTimezoneChange={setTimezone}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="instant"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <Input 
                      value={campaignName} 
                      onChange={e => setCampaignName(e.target.value)} 
                      placeholder="Campaign / Target Label" 
                      className="bg-slate-50 dark:bg-black border-slate-200 dark:border-slate-800 text-xs font-bold rounded-xl"
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <Button 
                variant="outline" 
                className="w-full text-[10px] font-black h-10 border-whatsapp-green/20 text-whatsapp-green hover:bg-whatsapp-green/5 rounded-xl border-dashed"
                onClick={() => setActiveTab('templates')}
              >
                <Layers className="w-3.5 h-3.5 mr-2" /> CHOOSE FROM REPOSITORY
              </Button>
            </section>


            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-whatsapp-green" />
                <h4 className="text-[10px] uppercase tracking-wider font-bold text-slate-400">AI Message Generator</h4>
              </div>
              <AIMessageGenerator onApply={(msg) => {
                setTemplate(msg);
                toast.success("AI message applied to editor!");
              }} />
            </section>

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
              </div>
            </section>
          </div>

          <div className="mt-10 pt-10 border-t border-slate-100 dark:border-slate-800 space-y-8">
            {isAutoSending && (
              <div className="space-y-2">
                <div className="flex justify-between text-[8px] font-black uppercase text-slate-400 px-1">
                  <span>Syncing Cluster...</span>
                  <span>{stats.sent} / {filteredContacts.length}</span>
                </div>
                <Progress value={(stats.sent / filteredContacts.length) * 100} className="h-1 bg-slate-100 dark:bg-slate-800" />
              </div>
            )}
              <div className="grid grid-cols-2 gap-4">
                <Button 
                  variant="outline"
                  className={`h-14 font-black text-[11px] tracking-widest transition-all rounded-2xl border-2 ${isAutoSending ? 'bg-red-50 text-red-600 border-red-100 dark:bg-red-900/20 dark:border-red-900' : 'border-slate-900 dark:border-slate-700 text-slate-900 dark:text-white hover:bg-slate-900 dark:hover:bg-slate-800 hover:text-white shadow-lg shadow-slate-900/5'}`}
                  onClick={isScheduling ? handleSchedule : toggleAutoSend}
                  disabled={filteredContacts.length === 0}
                >
                  {isScheduling ? 'QUEUE' : isAutoSending ? 'STOP ENGINE' : 'AUTO CYCLE'}
                </Button>
                <Button 
                  className="h-14 font-black text-[11px] tracking-widest bg-whatsapp-green hover:bg-[#1ebe5d] text-white shadow-xl shadow-whatsapp-green/20 rounded-2xl flex-1"
                  onClick={sendNext}
                  disabled={filteredContacts.length === 0 || isAutoSending || isScheduling}
                >
                  {currentIndex === 0 ? 'START SENDING' : 'OPEN & SEND NEXT'}
                </Button>
              </div>
          </div>
        </aside>

        {/* Mobile Navbar */}
        <nav className="fixed bottom-0 left-0 right-0 h-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-t border-slate-200 dark:border-slate-800 flex items-center justify-around px-2 z-50 md:hidden">
          {[
            { id: 'campaign', icon: LayoutDashboard, label: 'Home' },
            { id: 'templates', icon: Layers, label: 'Library' },
            ...(user.role === 'admin' ? [{ id: 'dashboard', icon: BarChart3, label: 'Analytics' }] : []),
            { id: 'scheduled', icon: Clock, label: 'Schedule' },
            { id: 'guide', icon: HelpCircle, label: 'Support' },
            ...(user.role === 'admin' ? [{ id: 'users', icon: UserCheck, label: 'Users' }] : []),
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col items-center justify-center gap-1.5 flex-1 h-full min-h-[44px] transition-all ${
                activeTab === tab.id ? 'text-whatsapp-green' : 'text-slate-400'
              }`}
            >
              <tab.icon className={`w-5 h-5 ${activeTab === tab.id ? 'scale-110 drop-shadow-[0_0_8px_rgba(37,211,102,0.5)]' : ''}`} />
              <span className="text-[9px] font-black uppercase tracking-tighter">{tab.label}</span>
              {activeTab === tab.id && <motion.div layoutId="mobile-indicator" className="w-1 h-1 bg-whatsapp-green rounded-full mt-0.5" />}
            </button>
          ))}
        </nav>
      </div>

      <VariableFiller 
        isOpen={isVarModalOpen} 
        onClose={() => setIsVarModalOpen(false)} 
        templateContent={selectedTemplateContent} 
        onApply={(final) => {
          setTemplate(final);
          toast.success("Template logic applied to sequence!");
        }} 
      />
    </div>
  );
}
