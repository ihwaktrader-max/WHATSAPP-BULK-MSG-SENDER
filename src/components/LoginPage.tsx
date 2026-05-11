import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { MessageSquare, Lock, Mail, User, Phone, LogIn, UserPlus, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { authService } from '@/lib/auth';

interface LoginPageProps {
  onLoginSuccess: (user: any) => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onLoginSuccess }) => {
  const [activeTab, setActiveTab] = useState<'user' | 'admin' | 'register'>('user');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const handleUserLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = authService.findUserByEmail(email);
    if (user && user.password === password) {
      if (user.status === 'blocked') {
        toast.error('Your account has been suspended. Please contact the administrator.');
        return;
      }
      const state = authService.login(user.email, 'user', user.name);
      onLoginSuccess(state.user);
      toast.success(`Welcome back, ${user.name}!`);
    } else {
      toast.error('Invalid email or password');
    }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (email === 'admin' && authService.verifyAdmin(password)) {
      const state = authService.login('admin@system.local', 'admin', 'System Admin');
      onLoginSuccess(state.user);
      toast.success('Admin access granted');
    } else {
      toast.error('Invalid admin credentials');
    }
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (authService.findUserByEmail(email)) {
      toast.error('Email already registered');
      return;
    }
    const newUser = { name, email, password, phone, createdAt: new Date().toISOString() };
    authService.register(newUser);
    toast.success('Registration successful! Please login.');
    setActiveTab('user');
  };

  return (
    <div className="min-h-screen bg-app-bg dark:bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-whatsapp-green rounded-2xl shadow-lg shadow-whatsapp-green/20 mb-4 animate-in zoom-in duration-500">
            <MessageSquare className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">WPSync Pro</h1>
          <p className="text-slate-500 dark:text-muted-foreground font-medium">Enterprise WhatsApp Bulk Messaging</p>
        </div>

        <Card className="border-none shadow-2xl rounded-[32px] overflow-hidden bg-white dark:bg-card border-border">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
            <div className="px-8 pt-8 pb-4">
              <TabsList className="grid w-full grid-cols-2 bg-slate-100 dark:bg-slate-800/50 p-1 h-12 rounded-2xl">
                <TabsTrigger 
                  value="user" 
                  className="rounded-xl font-bold text-xs uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-whatsapp-green transition-all shadow-none"
                >
                  <LogIn className="w-4 h-4 mr-2" /> Login
                </TabsTrigger>
                <TabsTrigger 
                  value="register" 
                   className="rounded-xl font-bold text-xs uppercase tracking-widest data-[state=active]:bg-white dark:data-[state=active]:bg-slate-700 data-[state=active]:text-whatsapp-green transition-all shadow-none"
                >
                  <UserPlus className="w-4 h-4 mr-2" /> Join
                </TabsTrigger>
              </TabsList>
            </div>

            <div className="px-8 pb-8">
              <TabsContent value="user" className="mt-0 space-y-6 animate-in slide-in-from-left-4 duration-300">
                <form onSubmit={handleUserLogin} className="space-y-5">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-muted-foreground">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input 
                        type="email" 
                        placeholder="john@example.com" 
                        className="pl-12 h-14 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl focus-visible:ring-whatsapp-green transition-all"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-muted-foreground">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input 
                        type="password" 
                        placeholder="••••••••" 
                        className="pl-12 h-14 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl focus-visible:ring-whatsapp-green transition-all"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="remember" 
                        checked={rememberMe}
                        onCheckedChange={(v) => setRememberMe(v as any)}
                        className="border-slate-300 dark:border-slate-700 rounded focus-visible:ring-whatsapp-green data-[state=checked]:bg-whatsapp-green data-[state=checked]:border-whatsapp-green" 
                      />
                      <label htmlFor="remember" className="text-xs font-bold text-slate-500 dark:text-muted-foreground cursor-pointer">Remember me</label>
                    </div>
                    <button type="button" className="text-xs font-bold text-whatsapp-green hover:underline">Forgot Password?</button>
                  </div>
                  <Button type="submit" className="w-full h-14 bg-whatsapp-green hover:bg-[#1ebe5d] text-white font-black text-sm tracking-widest rounded-2xl shadow-xl shadow-whatsapp-green/20 focus-visible:ring-offset-2">
                    SIGN IN
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="register" className="mt-0 space-y-6 animate-in slide-in-from-right-4 duration-300">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-muted-foreground">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input 
                        placeholder="John Doe" 
                        className="pl-12 h-12 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl focus-visible:ring-whatsapp-green"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-muted-foreground">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input 
                        type="email" 
                        placeholder="john@example.com" 
                        className="pl-12 h-12 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl focus-visible:ring-whatsapp-green"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-muted-foreground">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input 
                        placeholder="+91 99999 99999" 
                        className="pl-12 h-12 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl focus-visible:ring-whatsapp-green"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-muted-foreground">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <Input 
                        type="password" 
                        placeholder="Create password" 
                        className="pl-12 h-12 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl focus-visible:ring-whatsapp-green"
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                  </div>
                  <Button type="submit" className="w-full h-14 bg-whatsapp-green hover:bg-[#1ebe5d] text-white font-black text-sm tracking-widest rounded-2xl mt-4">
                    CREATE ACCOUNT
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="admin" className="mt-0 space-y-6 animate-in zoom-in-95 duration-300">
                <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-2xl flex gap-3 items-start">
                  <ShieldAlert className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-[10px] leading-relaxed text-amber-700 dark:text-amber-400 font-bold">
                    ADMIN PANEL ENTRANCE restricted to system operators only. All login attempts are recorded.
                  </p>
                </div>
                <form onSubmit={handleAdminLogin} className="space-y-5">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-muted-foreground">Operator ID</Label>
                    <Input 
                      placeholder="admin" 
                      className="h-14 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl focus-visible:ring-whatsapp-green"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-muted-foreground">Security Key</Label>
                    <Input 
                      type="password" 
                      placeholder="••••••••" 
                      className="h-14 bg-slate-50 dark:bg-slate-900 border-none rounded-2xl focus-visible:ring-whatsapp-green"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                  </div>
                  <Button type="submit" className="w-full h-14 bg-slate-900 dark:bg-foreground dark:text-background text-white font-black text-sm tracking-widest rounded-2xl transition-all active:scale-[0.98]">
                    AUTHORIZE ACCESS
                  </Button>
                </form>
              </TabsContent>
            </div>
          </Tabs>

          <div className="bg-slate-50 dark:bg-slate-800/30 p-4 text-center border-t border-slate-100 dark:border-slate-800">
            <button 
              onClick={() => setActiveTab('admin')} 
              className={`text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'admin' ? 'text-whatsapp-green' : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'}`}
            >
              System Administrator Access
            </button>
          </div>
        </Card>
        
        <p className="text-center mt-8 text-[10px] font-black text-slate-400 uppercase tracking-widest">
          Node Secure — Build 4.2.0-STABLE
        </p>
      </div>
    </div>
  );
};
