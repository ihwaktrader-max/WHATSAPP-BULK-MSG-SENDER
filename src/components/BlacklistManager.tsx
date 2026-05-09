import React, { useState } from 'react';
import { BlacklistEntry } from '@/lib/whatsapp';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, 
  DialogTrigger, DialogFooter 
} from "@/components/ui/dialog";
import { UserMinus, Trash2, ShieldAlert, Plus } from 'lucide-react';
import { format } from 'date-fns';

interface BlacklistManagerProps {
  blacklist: BlacklistEntry[];
  setBlacklist: React.Dispatch<React.SetStateAction<BlacklistEntry[]>>;
}

export function BlacklistManager({ blacklist, setBlacklist }: BlacklistManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [phone, setPhone] = useState("");
  const [reason, setReason] = useState("");

  const handleAdd = () => {
    if (!phone) return;
    const newEntry: BlacklistEntry = {
      id: Math.random().toString(36).substring(7),
      phone,
      reason: reason || "Universal Exclusion",
      addedAt: new Date().toISOString()
    };
    setBlacklist(prev => [...prev, newEntry]);
    setPhone("");
    setReason("");
    setIsOpen(false);
  };

  const removeEntry = (id: string) => {
    setBlacklist(prev => prev.filter(e => e.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Exclusion Zone</h4>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger
            render={
              <Button size="icon" variant="ghost" className="w-8 h-8 rounded-full text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10">
                <Plus className="w-4 h-4" />
              </Button>
            }
          />
          <DialogContent className="dark:bg-slate-900 dark:border-slate-800">
            <DialogHeader>
              <DialogTitle className="text-sm font-bold uppercase tracking-widest flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-red-500" /> Add to Blacklist
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-slate-400 uppercase">Target Phone Number</Label>
                <Input 
                  value={phone} 
                  onChange={e => setPhone(e.target.value)} 
                  placeholder="919988776655" 
                  className="bg-slate-50 dark:bg-black border-slate-200 dark:border-slate-800" 
                />
              </div>
              <div className="space-y-2">
                <Label className="text-[10px] font-bold text-slate-400 uppercase">Reason for Exclusion</Label>
                <Input 
                  value={reason} 
                  onChange={e => setReason(e.target.value)} 
                  placeholder="Unsubscribed / DNS" 
                  className="bg-slate-50 dark:bg-black border-slate-200 dark:border-slate-800" 
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsOpen(false)} className="rounded-xl font-bold text-xs">CANCEL</Button>
              <Button onClick={handleAdd} className="bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold text-xs">ACTIVATE EXCLUSION</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-2 max-h-[200px] overflow-y-auto pr-2 custom-scrollbar">
        {blacklist.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 border border-dashed border-slate-100 dark:border-slate-800 rounded-xl space-y-2">
            <UserMinus className="w-6 h-6 text-slate-200 dark:text-slate-800" />
            <p className="text-[10px] text-slate-400 uppercase font-black">Clean Slate</p>
          </div>
        ) : (
          blacklist.map(entry => (
            <div key={entry.id} className="group p-3 bg-red-50/30 dark:bg-red-900/5 border border-red-50 dark:border-red-900/10 rounded-xl flex items-center justify-between hover:bg-red-50/50 transition-all">
              <div className="flex flex-col gap-0.5">
                <span className="text-[11px] font-black text-slate-700 dark:text-slate-300 font-mono tracking-tighter">{entry.phone}</span>
                <span className="text-[8px] font-bold text-red-500/70 uppercase tracking-widest">{entry.reason}</span>
              </div>
              <Button 
                size="icon" 
                variant="ghost" 
                className="w-6 h-6 rounded-lg text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => removeEntry(entry.id)}
              >
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
