import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { 
  Users, MessageSquare, ShieldCheck, Search, ShieldAlert, 
  Settings as SettingsIcon, TrendingUp, History, Info, 
  Ban, CheckCircle2, User as UserIcon, Lock, Globe, Zap,
  Phone, Mail
} from 'lucide-react';
import { authService } from '@/lib/auth';
import { User, AppSettings } from '@/types';
import { format } from 'date-fns';
import { toast } from 'sonner';

export const AdminSystem: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [settings, setSettings] = useState<AppSettings>(authService.getSettings());
  const [stats, setStats] = useState({
    totalUsers: 0,
    messagesToday: 0,
    messagesMonth: 0,
    mostActive: 'N/A'
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    const allUsers = authService.getAllUsers();
    setUsers(allUsers);
    
    // Calculate stats
    const today = new Date().toISOString().split('T')[0];
    const month = new Date().toISOString().slice(0, 7);
    
    let todayCount = 0;
    let monthCount = 0;
    let maxMsgs = 0;
    let topUser = 'N/A';

    allUsers.forEach((u: any) => {
      const history = u.history || [];
      history.forEach((h: any) => {
        if (h.timestamp.startsWith(today)) todayCount += h.recipientCount;
        if (h.timestamp.startsWith(month)) monthCount += h.recipientCount;
      });
      if ((u.messagesSent || 0) > maxMsgs) {
        maxMsgs = u.messagesSent;
        topUser = u.name;
      }
    });

    setStats({
      totalUsers: allUsers.length,
      messagesToday: todayCount,
      messagesMonth: monthCount,
      mostActive: topUser
    });
  };

  const toggleBlock = (email: string, currentStatus: string) => {
    const newStatus = currentStatus === 'blocked' ? 'active' : 'blocked';
    authService.updateUserStatus(email, newStatus);
    loadData();
    toast.success(`User ${newStatus === 'blocked' ? 'suspended' : 'activated'}`);
  };

  const [newAdminPassword, setNewAdminPassword] = useState('');

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    const updatedSettings = { ...settings };
    if (newAdminPassword) {
      updatedSettings.adminPassword = newAdminPassword;
    }
    authService.saveSettings(updatedSettings);
    setSettings(updatedSettings);
    setNewAdminPassword('');
    toast.success("System configurations updated");
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    u.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: 'Registered Operators', value: stats.totalUsers, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: "Today's Transmissions", value: stats.messagesToday, icon: Zap, color: 'text-whatsapp-green', bg: 'bg-whatsapp-green/10' },
          { label: 'Monthly Volume', value: stats.messagesMonth, icon: TrendingUp, color: 'text-purple-500', bg: 'bg-purple-500/10' },
          { label: 'Most Active Agent', value: stats.mostActive, icon: ShieldCheck, color: 'text-amber-500', bg: 'bg-amber-500/10' },
        ].map((s, i) => (
          <Card key={i} className="p-4 border-border bg-white dark:bg-card rounded-2xl flex items-center gap-4 transition-all hover:scale-[1.02] active:scale-[0.98]">
            <div className={`w-12 h-12 rounded-xl ${s.bg} flex items-center justify-center`}>
              <s.icon className={`w-6 h-6 ${s.color}`} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest leading-none mb-1">{s.label}</p>
              <p className="text-xl font-black text-slate-900 dark:text-white">{s.value}</p>
            </div>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="users" className="w-full">
        <TabsList className="bg-slate-100 dark:bg-slate-800/60 h-14 p-1 rounded-2xl w-full max-w-md border border-slate-200 dark:border-border">
          <TabsTrigger value="users" className="flex-1 rounded-xl font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-whatsapp-green transition-all shadow-none">
            <Users className="w-4 h-4 mr-2" /> Users
          </TabsTrigger>
          <TabsTrigger value="settings" className="flex-1 rounded-xl font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-whatsapp-green transition-all shadow-none">
            <SettingsIcon className="w-4 h-4 mr-2" /> Config
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="mt-8 space-y-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="relative w-full md:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Search operators..." 
                className="pl-10 h-12 bg-white dark:bg-card border-border rounded-xl focus-visible:ring-whatsapp-green transition-all"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <p className="text-[10px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest">Showing {filteredUsers.length} active nodes</p>
          </div>

          <Card className="border-border rounded-3xl overflow-hidden shadow-xl shadow-slate-200/20 dark:shadow-none bg-white dark:bg-card">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-muted/30 border-b border-border">
                  <tr>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest pl-8">Operator</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest">Load (Msgs)</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest">Status</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest">Join Date</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest text-right pr-8">Protection</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/40">
                  {filteredUsers.map((u, i) => (
                    <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors group">
                      <td className="px-6 py-5 pl-8">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-2xl bg-whatsapp-green/5 border border-whatsapp-green/10 flex items-center justify-center text-whatsapp-green font-black text-xs">
                            {u.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">{u.name}</p>
                            <p className="text-[10px] font-bold text-muted-foreground leading-none mt-1">{u.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <Badge variant="outline" className="bg-slate-50 dark:bg-slate-900 border-border text-[10px] font-mono font-bold text-slate-600 dark:text-slate-400">
                          {u.messagesSent || 0}
                        </Badge>
                      </td>
                      <td className="px-6 py-5">
                        <Badge className={`${u.status === 'blocked' ? 'bg-destructive/10 text-destructive border-destructive/20' : 'bg-whatsapp-green/10 text-whatsapp-green border-whatsapp-green/20'} text-[9px] font-black uppercase tracking-widest`}>
                          {u.status || 'active'}
                        </Badge>
                      </td>
                      <td className="px-6 py-5 whitespace-nowrap text-[11px] font-bold text-slate-500">
                        {u.createdAt ? format(new Date(u.createdAt), 'MMM dd, yyyy') : 'N/A'}
                      </td>
                      <td className="px-6 py-5 text-right pr-8">
                        <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-9 px-4 text-[10px] font-black tracking-widest uppercase hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
                            onClick={() => setSelectedUser(u)}
                          >
                            <History className="w-4 h-4 mr-2" /> Log
                          </Button>
                          <Button 
                            variant={u.status === 'blocked' ? 'destructive' : 'outline'} 
                            size="sm" 
                            className={`h-9 px-4 text-[10px] font-black tracking-widest uppercase shadow-none rounded-xl ${u.status === 'blocked' ? '' : 'border-destructive text-destructive hover:bg-destructive/5'}`}
                            onClick={() => toggleBlock(u.email, u.status || 'active')}
                          >
                            {u.status === 'blocked' ? <><CheckCircle2 className="w-4 h-4 mr-2" /> Restore</> : <><Ban className="w-4 h-4 mr-2" /> Suspend</>}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="mt-8">
          <Card className="border-border rounded-[32px] p-10 bg-white dark:bg-card max-w-2xl shadow-xl shadow-slate-200/10 dark:shadow-none">
            <form onSubmit={handleSaveSettings} className="space-y-8">
              <div className="flex items-center gap-4 mb-2">
                <div className="w-12 h-12 rounded-2xl bg-whatsapp-green/10 flex items-center justify-center">
                  <ShieldCheck className="w-6 h-6 text-whatsapp-green" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none mb-1">System Core Settings</h3>
                  <p className="text-[10px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest">Global restrictions and branding</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Application Name</Label>
                  <div className="relative">
                    <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                      value={settings.appName}
                      onChange={(e) => setSettings({ ...settings, appName: e.target.value })}
                      className="pl-12 h-14 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl font-bold focus-visible:ring-whatsapp-green transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Daily Message Quota</Label>
                  <div className="relative">
                    <MessageSquare className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                      type="number"
                      value={settings.maxMessagesPerUser}
                      onChange={(e) => setSettings({ ...settings, maxMessagesPerUser: parseInt(e.target.value) })}
                      className="pl-12 h-14 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl font-bold focus-visible:ring-whatsapp-green transition-all"
                    />
                  </div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-tight pl-1">Max messages per node / 24h</p>
                </div>
              </div>

              <div className="space-y-3 pt-4 border-t border-border/40">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Update Administrator Access Key</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    type="password"
                    placeholder="Set new superkey..."
                    className="pl-12 h-14 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl font-bold focus-visible:ring-whatsapp-green transition-all"
                    value={newAdminPassword}
                    onChange={(e) => setNewAdminPassword(e.target.value)}
                  />
                </div>
              </div>

              <Button type="submit" className="w-full h-16 bg-whatsapp-green hover:bg-[#1ebe5d] text-white font-black text-sm tracking-widest rounded-2xl shadow-xl shadow-whatsapp-green/20 transition-all active:scale-[0.98]">
                COMMIT GLOBAL CHANGES
              </Button>
            </form>
          </Card>
        </TabsContent>
      </Tabs>

      {/* User Detail Sidebar/Overlay */}
      {selectedUser && (
        <div className="fixed inset-y-0 right-0 w-full md:w-[520px] bg-white dark:bg-card border-l border-border shadow-2xl z-50 p-10 flex flex-col animate-in slide-in-from-right duration-500">
          <div className="flex items-center justify-between mb-10">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase leading-none">Agent Intelligence</h2>
            <Button variant="ghost" size="icon" onClick={() => setSelectedUser(null)} className="rounded-2xl bg-slate-50 dark:bg-slate-800">
              <Ban className="w-5 h-5 rotate-45 text-muted-foreground" />
            </Button>
          </div>

          <div className="flex items-center gap-8 p-8 bg-slate-50 dark:bg-muted/50 rounded-[2.5rem] mb-10 border border-border/40">
            <div className="w-24 h-24 rounded-[2rem] bg-whatsapp-green flex items-center justify-center text-white text-4xl shadow-xl shadow-whatsapp-green/20 font-black">
              {selectedUser.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h3 className="text-3xl font-black text-slate-900 dark:text-white leading-none mb-3">{selectedUser.name}</h3>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                   <Phone className="w-3.5 h-3.5 text-whatsapp-green" />
                   <span className="text-xs font-black text-whatsapp-green uppercase tracking-widest">{selectedUser.phone || 'NO PHONE ATTACHED'}</span>
                </div>
                <div className="flex items-center gap-2">
                   <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                   <span className="text-xs font-bold text-muted-foreground">{selectedUser.email}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8 flex-1 overflow-auto pr-4 custom-scrollbar">
            <div>
              <h4 className="text-[11px] font-black text-slate-400 dark:text-muted-foreground uppercase tracking-widest mb-6 px-1">Transmission Logs</h4>
              <div className="space-y-4">
                {(selectedUser.history || []).map((h: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-5 bg-white dark:bg-slate-900/50 border border-border rounded-[2rem] transition-all hover:bg-slate-50 dark:hover:bg-slate-900">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center transition-transform hover:rotate-12">
                        <MessageSquare className="w-5 h-4 text-blue-500" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900 dark:text-white">Sent {h.recipientCount} messages</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{format(new Date(h.timestamp), 'MMM dd, HH:mm')}</p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-whatsapp-green border-whatsapp-green/30 bg-whatsapp-green/5 text-[10px] font-black px-3 rounded-xl tracking-widest">
                      SYNCED
                    </Badge>
                  </div>
                ))}
                {(!selectedUser.history || selectedUser.history.length === 0) && (
                  <div className="text-center py-20 px-8 border-2 border-dashed border-border rounded-[3rem] opacity-40">
                    <History className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                    <p className="text-xs font-black text-slate-400 uppercase tracking-widest">No activity recorded for this node</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="pt-10 mt-6 border-t border-border">
             <Button 
              className={`w-full h-16 font-black text-sm tracking-widest uppercase rounded-[2rem] transition-all active:scale-[0.98] ${selectedUser.status === 'blocked' ? 'bg-whatsapp-green text-white shadow-xl shadow-whatsapp-green/20' : 'bg-destructive/10 text-destructive hover:bg-destructive/20 border-none'}`}
              onClick={() => toggleBlock(selectedUser.email, selectedUser.status || 'active')}
            >
              {selectedUser.status === 'blocked' ? (
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5" /> Restore Agent Access
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Ban className="w-5 h-5" /> Terminate System Access
                </div>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
