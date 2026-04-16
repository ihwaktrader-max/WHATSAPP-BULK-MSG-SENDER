/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useEffect, useRef } from 'react';
import { ExcelUploader } from '@/components/ExcelUploader';
import { TemplateEditor } from '@/components/TemplateEditor';
import { ContactTable } from '@/components/ContactTable';
import { Contact, generateWhatsAppLink, replacePlaceholders } from '@/lib/whatsapp';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { MessageSquare, Send, Trash2, Users, LayoutDashboard, Settings, Play, Pause, AlertTriangle, Info, HelpCircle, ExternalLink, CheckCircle2 } from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export default function App() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [template, setTemplate] = useState("Hello {{Name}},\n\nThis is a test message from our WhatsApp Bulk Sender tool.");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isSending, setIsSending] = useState(false);
  const [isAutoSending, setIsAutoSending] = useState(false);
  const [delay, setDelay] = useState(15000); // Default to 15 seconds for safety
  const [useRandomDelay, setUseRandomDelay] = useState(true);
  const [showHelp, setShowHelp] = useState(false);
  const autoSendTimer = useRef<NodeJS.Timeout | null>(null);
  const whatsappWindowRef = useRef<Window | null>(null);

  // Load from localStorage on mount
  useEffect(() => {
    const savedContacts = localStorage.getItem('whatsapp_sync_contacts');
    const savedTemplate = localStorage.getItem('whatsapp_sync_template');
    const savedIndex = localStorage.getItem('whatsapp_sync_index');

    if (savedContacts) setContacts(JSON.parse(savedContacts));
    if (savedTemplate) setTemplate(savedTemplate);
    if (savedIndex) setCurrentIndex(parseInt(savedIndex, 10));
  }, []);

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

  const availableFields = useMemo(() => {
    if (contacts.length === 0) return ['Name', 'Phone'];
    return Object.keys(contacts[0]).filter(k => !['id', 'status'].includes(k));
  }, [contacts]);

  const handleContactsLoaded = (newContacts: Contact[]) => {
    setContacts(newContacts);
    setCurrentIndex(0);
    toast.success(`${newContacts.length} contacts loaded successfully!`);
  };

  const clearContacts = () => {
    setContacts([]);
    setCurrentIndex(0);
    setIsAutoSending(false);
    localStorage.removeItem('whatsapp_sync_contacts');
    localStorage.removeItem('whatsapp_sync_index');
    toast.info("Campaign cleared.");
  };

  const resetProgress = () => {
    setCurrentIndex(0);
    const resetContacts = contacts.map(c => ({ ...c, status: 'pending' as const }));
    setContacts(resetContacts);
    toast.info("Progress reset to start.");
  };

  const sendNext = () => {
    if (currentIndex >= contacts.length) {
      setIsSending(false);
      setIsAutoSending(false);
      toast.success("All messages processed!");
      return;
    }

    const contact = contacts[currentIndex];
    // Add a tiny random invisible character or reference to make each message unique
    const uniqueSuffix = `\n\n[Ref: ${Math.random().toString(36).substring(7)}]`;
    const message = replacePlaceholders(template, contact) + uniqueSuffix;
    const link = generateWhatsAppLink(contact.phone, message);

    // Update status locally
    const updatedContacts = [...contacts];
    updatedContacts[currentIndex].status = 'sent';
    setContacts(updatedContacts);

    // Open WhatsApp in a named window to reuse the same tab
    // We try to focus the existing window if it exists
    if (whatsappWindowRef.current && !whatsappWindowRef.current.closed) {
      whatsappWindowRef.current.location.href = link;
      whatsappWindowRef.current.focus();
    } else {
      whatsappWindowRef.current = window.open(link, 'whatsapp_sync_window');
    }
    
    if (!whatsappWindowRef.current) {
      toast.error("Popup blocked! Please allow popups for this site to use Auto-Send.", {
        duration: 5000,
      });
      setIsAutoSending(false);
      return false;
    }
    
    setCurrentIndex(prev => prev + 1);
    return true;
  };

  useEffect(() => {
    if (isAutoSending) {
      if (currentIndex < contacts.length) {
        const actualDelay = useRandomDelay 
          ? delay + (Math.random() * 5000) // Add 0-5s random jitter
          : delay;

        autoSendTimer.current = setTimeout(() => {
          const success = sendNext();
          if (!success) setIsAutoSending(false);
        }, actualDelay);
      } else {
        setIsAutoSending(false);
        toast.success("Auto-Send completed!");
      }
    } else {
      if (autoSendTimer.current) clearTimeout(autoSendTimer.current);
    }

    return () => {
      if (autoSendTimer.current) clearTimeout(autoSendTimer.current);
    };
  }, [isAutoSending, currentIndex, contacts.length, delay, useRandomDelay]);

  const startSending = () => {
    if (contacts.length === 0) {
      toast.error("Pehle Excel file upload karein!");
      return;
    }
    setIsSending(true);
    sendNext();
  };

  const toggleAutoSend = () => {
    if (contacts.length === 0) {
      toast.error("Pehle Excel file upload karein!");
      return;
    }
    if (!isAutoSending) {
      toast.info("Auto-Send starting... Make sure to allow popups!", {
        icon: <AlertTriangle className="text-amber-500" />,
      });
    }
    setIsAutoSending(!isAutoSending);
    setIsSending(true);
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-app-bg">
      <Toaster position="top-right" richColors />
      
      {/* Header Area */}
      <header className="h-16 bg-whatsapp-dark text-white flex items-center justify-between px-6 shrink-0 shadow-md z-10">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-1.5 rounded-lg">
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <h1 className="text-lg font-bold tracking-tight">WatsApp Excel-Sync v1.0</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-xs bg-white/10 px-3 py-1.5 rounded-full font-medium border border-white/20">
            WhatsApp Web Connected • Active
          </div>
          <div className="h-8 w-[1px] bg-white/20" />
          <p className="text-sm font-medium opacity-90 hidden sm:block">
            ihwaktrader@gmail.com
          </p>
        </div>
      </header>

      {/* Main Grid Layout */}
      <div className="flex-1 grid grid-cols-[280px_1fr_320px] gap-[1px] bg-border-muted overflow-hidden">
        
        {/* Left Sidebar: Upload & Data Source */}
        <aside className="bg-white p-6 flex flex-col gap-8 overflow-y-auto">
          <div>
            <h3 className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-4">Data Source</h3>
            <ExcelUploader onContactsLoaded={handleContactsLoaded} />
          </div>

          {contacts.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <h3 className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-2">Campaign Summary</h3>
              <div className="bg-slate-50 rounded-lg p-4 border space-y-3">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Total Contacts:</span>
                  <span className="font-bold">{contacts.length}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-slate-500">Processed:</span>
                  <span className="font-bold">{currentIndex}</span>
                </div>
                <div className="space-y-1">
                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-whatsapp-green transition-all duration-300"
                      style={{ width: `${(currentIndex / contacts.length) * 100}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl space-y-3">
                <h4 className="text-xs font-bold text-blue-800 flex items-center gap-2">
                  <Info className="w-4 h-4" /> AUTO-SEND KAISE CHALAYEIN?
                </h4>
                <div className="space-y-2">
                  <p className="text-[10px] text-blue-700 leading-tight">
                    1. <b>Auto Send</b> dabayein (3s ya 5s delay best hai).
                  </p>
                  <p className="text-[10px] text-blue-700 leading-tight">
                    2. Naya tab khulte hi bas <b>'Enter'</b> dabayein aur <b>'Ctrl+W'</b> se tab band kar dein.
                  </p>
                  <p className="text-[10px] text-blue-700 leading-tight font-bold">
                    Note: Maine link update kar diya hai, ab "Continue to Chat" wala button nahi dabana padega!
                  </p>
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-800 text-[10px] font-bold">
                    <AlertTriangle className="w-3 h-3" /> POPUP BLOCKER WARNING
                  </div>
                  <Dialog open={showHelp} onOpenChange={setShowHelp}>
                    <DialogTrigger render={
                      <button className="text-[10px] text-amber-600 underline font-bold hover:text-amber-700">
                        How to fix?
                      </button>
                    } />
                    <DialogContent className="sm:max-w-[500px]">
                      <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-whatsapp-dark">
                          <HelpCircle className="w-5 h-5" /> How to Enable Auto-Send
                        </DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 py-4">
                        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex gap-3">
                          <Info className="w-5 h-5 text-blue-500 shrink-0" />
                          <p className="text-sm text-blue-800">
                            Browser security ki wajah se bulk tabs block ho jate hain. Ise ek baar allow karna zaroori hai.
                          </p>
                        </div>
                        
                        <div className="space-y-3">
                          <h4 className="font-bold text-sm">Steps to follow:</h4>
                          <ol className="list-decimal pl-5 space-y-2 text-sm text-slate-600">
                            <li>App ko <strong>"Open in New Tab"</strong> icon par click karke naye tab mein kholein.</li>
                            <li><strong>"Auto Send"</strong> button par click karein.</li>
                            <li>Browser ke <strong>Address Bar</strong> (jahan URL hai) ke right side mein ek <span className="bg-red-100 text-red-600 px-1 rounded font-bold">x</span> wala icon dikhega.</li>
                            <li>Us par click karke <strong>"Always allow pop-ups from this site"</strong> select karein.</li>
                            <li><strong>Done</strong> karke page ko <strong>Refresh</strong> karein.</li>
                          </ol>
                        </div>

                        <div className="p-3 bg-slate-100 rounded-lg border flex items-center justify-between">
                          <span className="text-xs font-medium">Best Experience ke liye:</span>
                          <Button size="sm" variant="outline" className="h-8 text-xs" onClick={() => window.open(window.location.href, '_blank')}>
                            Open in New Tab <ExternalLink className="w-3 h-3 ml-2" />
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                <p className="text-[9px] text-amber-700 leading-tight">
                  Auto-Send use karne ke liye browser settings mein <strong>"Always allow popups"</strong> enable karein.
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs h-8"
                  onClick={resetProgress}
                >
                  Reset Progress
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  className="text-xs h-8"
                  onClick={clearContacts}
                >
                  <Trash2 className="w-3.5 h-3.5 mr-2" /> Clear All
                </Button>
              </div>
            </motion.div>
          )}
        </aside>

        {/* Center: Data Grid & Guide */}
        <main className="bg-white overflow-hidden flex flex-col">
          <Tabs defaultValue="campaign" className="flex-1 flex flex-col overflow-hidden">
            <div className="px-6 py-2 bg-slate-50 border-b border-border-muted flex items-center justify-between shrink-0">
              <TabsList className="bg-transparent gap-4">
                <TabsTrigger value="campaign" className="text-xs font-bold data-[state=active]:text-whatsapp-green data-[state=active]:border-b-2 data-[state=active]:border-whatsapp-green rounded-none px-0 pb-2">
                  CAMPAIGN DATA
                </TabsTrigger>
                <TabsTrigger value="guide" className="text-xs font-bold data-[state=active]:text-whatsapp-green data-[state=active]:border-b-2 data-[state=active]:border-whatsapp-green rounded-none px-0 pb-2">
                  DAILY USAGE GUIDE
                </TabsTrigger>
              </TabsList>
              <div className="text-[10px] text-slate-400 font-medium">
                {contacts.length} Contacts Loaded
              </div>
            </div>

            <TabsContent value="campaign" className="flex-1 overflow-auto outline-none m-0">
              {contacts.length > 0 ? (
                <ContactTable contacts={contacts} currentIndex={currentIndex} />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-12 space-y-4 text-slate-400">
                  <Users className="w-12 h-12 opacity-20" />
                  <p className="text-sm">Excel file upload karein contacts dekhne ke liye.</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="guide" className="flex-1 overflow-auto outline-none m-0 p-8">
              <div className="max-w-3xl mx-auto space-y-8">
                <div className="space-y-4">
                  <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                    <ExternalLink className="w-6 h-6 text-whatsapp-green" /> Daily Use & App Install
                  </h3>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <Card className="p-6 space-y-3 border-slate-200">
                      <h4 className="font-bold text-slate-700 flex items-center gap-2">
                        <LayoutDashboard className="w-4 h-4" /> Desktop App (PWA)
                      </h4>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        Chrome browser mein upar 3 dots par click karein, fir <b>"Save and Share"</b> &rarr; <b>"Install page as app"</b> par click karein. Ab ye aapke desktop par ek icon ban jayega aur bilkul ek software ki tarah khulega.
                      </p>
                    </Card>
                    <Card className="p-6 space-y-3 border-slate-200">
                      <h4 className="font-bold text-slate-700 flex items-center gap-2">
                        <Users className="w-4 h-4" /> Public Share Link
                      </h4>
                      <p className="text-xs text-slate-500 leading-relaxed">
                        AI Studio mein upar <b>"Share"</b> button par click karke <b>"Get Link"</b> karein. Ye link aap kisi ko bhi bhej sakte hain ya apne mobile par use kar sakte hain.
                      </p>
                    </Card>
                  </div>

                  <div className="p-6 bg-whatsapp-green/5 rounded-2xl border border-whatsapp-green/10 space-y-4">
                    <h4 className="font-bold text-whatsapp-dark flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5" /> Daily Safe Routine (Ban se bachne ke liye)
                    </h4>
                    <div className="grid gap-4 text-sm">
                      <div className="flex gap-3">
                        <div className="w-6 h-6 rounded-full bg-whatsapp-green text-white flex items-center justify-center shrink-0 font-bold text-xs">1</div>
                        <p className="text-slate-600"><b>Batch Sending:</b> Ek baar mein 20-30 se zyada messages na bhejein. Har batch ke beech mein 1 ghante ka break lein.</p>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-6 h-6 rounded-full bg-whatsapp-green text-white flex items-center justify-center shrink-0 font-bold text-xs">2</div>
                        <p className="text-slate-600"><b>Safety Settings:</b> Hamesha <b>15s-30s</b> ka delay aur <b>Random Jitter</b> ON rakhein. Ye WhatsApp ke bots ko dhokha dene mein madad karta hai.</p>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-6 h-6 rounded-full bg-whatsapp-green text-white flex items-center justify-center shrink-0 font-bold text-xs">3</div>
                        <p className="text-slate-600"><b>Personalization:</b> Message mein <b>{"{{Name}}"}</b> ka use zaroori karein. Alag-alag messages spam filter se bachate hain.</p>
                      </div>
                      <div className="flex gap-3">
                        <div className="w-6 h-6 rounded-full bg-whatsapp-green text-white flex items-center justify-center shrink-0 font-bold text-xs">4</div>
                        <p className="text-slate-600"><b>Warm-up:</b> Naye number se bulk na karein. Pehle 2-3 din normal chatting karein fir bulk shuru karein.</p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100 space-y-4">
                    <h4 className="font-bold text-blue-800 flex items-center gap-2">
                      <MessageSquare className="w-5 h-5" /> Image ya File Kaise Bhejein?
                    </h4>
                    <p className="text-xs text-blue-700 leading-relaxed">
                      WhatsApp link se file apne aap attach nahi ho sakti, isliye ye <b>"Copy-Paste"</b> trick use karein:
                    </p>
                    <div className="grid gap-3 text-xs">
                      <div className="flex items-start gap-2">
                        <div className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                        <p className="text-slate-600">Jo image bhejni hai, use computer par open karein aur <b>Right-click &rarr; Copy Image</b> karein.</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                        <p className="text-slate-600">App mein <b>Auto-Send</b> shuru karein.</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                        <p className="text-slate-600">Jaise hi WhatsApp tab khule, turant <b>Ctrl + V</b> (Paste) dabayein aur fir <b>Enter</b>.</p>
                      </div>
                      <div className="flex items-start gap-2">
                        <div className="mt-1 w-1.5 h-1.5 rounded-full bg-blue-400 shrink-0" />
                        <p className="text-slate-600">Aapka text aur image dono ek saath chale jayenge!</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </main>

        {/* Right Sidebar: Preview & Send */}
        <aside className="bg-white p-6 flex flex-col border-l border-border-muted overflow-y-auto">
          <h3 className="text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-4">Message Preview</h3>
          
          <div className="flex-1">
            <TemplateEditor 
              template={template} 
              setTemplate={setTemplate} 
              availableFields={availableFields} 
            />
          </div>

          <div className="mt-6 pt-6 border-t border-border-muted space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant="outline"
                className="h-12 font-bold border-whatsapp-green text-whatsapp-green hover:bg-whatsapp-green hover:text-white"
                onClick={toggleAutoSend}
              >
                {isAutoSending ? (
                  <><Pause className="w-4 h-4 mr-2" /> Stop Auto</>
                ) : (
                  <><Play className="w-4 h-4 mr-2" /> Auto Send</>
                )}
              </Button>
              <Button 
                className="h-12 font-bold bg-whatsapp-green hover:bg-[#1ebe5d] text-white"
                onClick={sendNext}
              >
                <Send className="w-4 h-4 mr-2" /> Send Next
              </Button>
            </div>
            
            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-bold text-slate-400">DELAY (SEC)</span>
              <div className="flex items-center gap-2">
                {[5, 10, 15, 30].map(s => (
                  <button 
                    key={s}
                    onClick={() => setDelay(s * 1000)}
                    className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${delay === s * 1000 ? 'bg-whatsapp-green text-white border-whatsapp-green' : 'bg-white text-slate-400 border-slate-200'}`}
                  >
                    {s}s
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between px-1">
              <span className="text-[10px] font-bold text-slate-400">RANDOM JITTER</span>
              <button 
                onClick={() => setUseRandomDelay(!useRandomDelay)}
                className={`text-[10px] px-3 py-1 rounded-full font-bold transition-colors ${useRandomDelay ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-400'}`}
              >
                {useRandomDelay ? 'ON (Safe)' : 'OFF'}
              </button>
            </div>

            <div className="p-3 bg-red-50 border border-red-100 rounded-lg space-y-1">
              <p className="text-[9px] text-red-700 font-bold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> SAFETY WARNING
              </p>
              <p className="text-[8px] text-red-600 leading-tight">
                WhatsApp 15s se kam delay par account block kar sakta hai. 15s-30s delay aur Random Jitter use karein.
              </p>
            </div>

            <p className="text-[10px] text-center text-slate-400 leading-tight">
              Note: Auto-Send will reuse the same tab. Keep it open.
            </p>
          </div>
        </aside>

      </div>
    </div>
  );
}
