import React, { useState } from 'react';
import { Template } from '@/lib/whatsapp';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, 
  DialogTrigger, DialogFooter 
} from "@/components/ui/dialog";
import { Plus, Edit2, Trash2, Tag, BookOpen, Layers } from 'lucide-react';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { PREMADE_TEMPLATES } from '@/lib/whatsapp';

interface TemplateManagerProps {
  customTemplates: Template[];
  setCustomTemplates: React.Dispatch<React.SetStateAction<Template[]>>;
  onSelect: (content: string) => void;
}

export function TemplateManager({ customTemplates, setCustomTemplates, onSelect }: TemplateManagerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<Template['category']>('Other/Custom');

  const MAX_CHARS = 1000;

  const handleSave = () => {
    if (!name || !content) return;

    if (editingId) {
      setCustomTemplates(prev => prev.map(t => t.id === editingId ? { ...t, name, content, category } : t));
    } else {
      const newTemplate: Template = {
        id: Math.random().toString(36).substring(7),
        name,
        content,
        category
      };
      setCustomTemplates(prev => [...prev, newTemplate]);
    }
    resetForm();
    setIsOpen(false);
  };

  const handleDelete = (id: string) => {
    setCustomTemplates(prev => prev.filter(t => t.id !== id));
  };

  const startEdit = (t: Template) => {
    setEditingId(t.id);
    setName(t.name);
    setContent(t.content);
    setCategory(t.category);
    setIsOpen(true);
  };

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setContent("");
    setCategory('Other/Custom');
  };

  const renderTemplateCard = (t: Template, isPremade = false) => (
    <div key={t.id} className="group p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl flex flex-col gap-3 hover:border-whatsapp-green/40 transition-all shadow-sm hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h5 className="text-[11px] font-black text-slate-800 dark:text-slate-100 uppercase tracking-tight">{t.name}</h5>
          <Badge variant="secondary" className="text-[8px] font-black bg-slate-100 dark:bg-slate-800 text-slate-500 border-none">
            {t.category}
          </Badge>
        </div>
        {!isPremade && (
          <div className="flex gap-1">
            <Button size="icon" variant="ghost" className="w-7 h-7 rounded-lg text-slate-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20" onClick={(e) => { e.stopPropagation(); startEdit(t); }}>
              <Edit2 className="w-3.5 h-3.5" />
            </Button>
            <Button size="icon" variant="ghost" className="w-7 h-7 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20" onClick={(e) => { e.stopPropagation(); handleDelete(t.id); }}>
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </div>
      <p className="text-[10px] text-slate-500 font-medium line-clamp-3 italic">
        "{t.content}"
      </p>
      <Button 
        variant="outline" 
        size="sm" 
        className="w-full text-[9px] font-black h-8 rounded-xl border-slate-200 dark:border-slate-800 hover:bg-whatsapp-green hover:text-white hover:border-whatsapp-green transition-all"
        onClick={() => onSelect(t.content)}
      >
        USE TEMPLATE
      </Button>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-whatsapp-green" />
          <h4 className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Message Repository</h4>
        </div>
        <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if(!open) resetForm(); }}>
          <DialogTrigger
            render={
              <Button size="icon" variant="ghost" className="w-8 h-8 rounded-full text-whatsapp-green hover:bg-whatsapp-green/10">
                <Plus className="w-4 h-4" />
              </Button>
            }
          />
          <DialogContent className="dark:bg-slate-900 dark:border-slate-800 max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-sm font-bold uppercase tracking-widest">{editingId ? 'Edit Repository Node' : 'Initialize New Template'}</DialogTitle>
            </DialogHeader>
            <div className="space-y-5 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase">Descriptor Name</Label>
                  <Input value={name} onChange={e => setName(e.target.value)} placeholder="Summer_Promo_2024" className="bg-slate-50 dark:bg-black border-slate-200 dark:border-slate-800 h-10 text-xs rounded-xl" />
                </div>
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase">Category Tag</Label>
                  <Select value={category} onValueChange={(val: any) => setCategory(val)}>
                    <SelectTrigger className="bg-slate-50 dark:bg-black border-slate-200 dark:border-slate-800 h-10 text-xs rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="dark:bg-slate-900 dark:border-slate-800">
                      <SelectItem value="Festival">Festival</SelectItem>
                      <SelectItem value="Sale/Offer">Sale / Offer</SelectItem>
                      <SelectItem value="Reminder">Reminder</SelectItem>
                      <SelectItem value="Welcome">Welcome</SelectItem>
                      <SelectItem value="Follow-up">Follow-up</SelectItem>
                      <SelectItem value="Other/Custom">Other / Custom</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label className="text-[10px] font-bold text-slate-400 uppercase">Message Logic</Label>
                  <span className={`text-[9px] font-bold ${content.length > MAX_CHARS ? 'text-red-500' : 'text-slate-400'}`}>
                    {content.length} / {MAX_CHARS}
                  </span>
                </div>
                <Textarea 
                  value={content} 
                  onChange={e => setContent(e.target.value)} 
                  placeholder="Hello {name}, your code is {code}..." 
                  className="min-h-[160px] bg-slate-50 dark:bg-black border-slate-200 dark:border-slate-800 font-mono text-xs rounded-2xl resize-none p-4" 
                />
                <div className="flex flex-wrap gap-2 pt-1">
                  {['{name}', '{date}', '{amount}', '{order_id}'].map(tag => (
                    <button 
                      key={tag}
                      onClick={() => setContent(prev => prev + tag)}
                      className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 hover:text-whatsapp-green rounded-lg transition-colors border border-slate-200 dark:border-slate-700"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsOpen(false)} className="rounded-xl font-bold text-[10px] h-10 uppercase tracking-widest border-slate-200 dark:border-slate-800">ABORT_ENTRY</Button>
              <Button onClick={handleSave} className="bg-whatsapp-green hover:bg-[#1ebe5d] text-white rounded-xl font-bold text-[10px] h-10 uppercase tracking-widest shadow-lg shadow-emerald-500/20">COMMIT_UPDATE</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="premade" className="w-full">
        <TabsList className="bg-slate-100/50 dark:bg-slate-800/50 p-1 rounded-2xl w-full grid grid-cols-2 h-10 border border-slate-200 dark:border-slate-800">
          <TabsTrigger value="premade" className="text-[10px] font-black uppercase rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-whatsapp-green">
            <BookOpen className="w-3 h-3 mr-1.5" /> Library
          </TabsTrigger>
          <TabsTrigger value="custom" className="text-[10px] font-black uppercase rounded-xl data-[state=active]:bg-white dark:data-[state=active]:bg-slate-900 data-[state=active]:text-whatsapp-green">
            <Layers className="w-3 h-3 mr-1.5" /> Workspace
          </TabsTrigger>
        </TabsList>
        <div className="pt-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
          <TabsContent value="premade" className="grid grid-cols-1 gap-3 m-0">
            {PREMADE_TEMPLATES.map(t => renderTemplateCard(t, true))}
          </TabsContent>
          <TabsContent value="custom" className="grid grid-cols-1 gap-3 m-0">
            {customTemplates.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-3xl space-y-2">
                <Layers className="w-8 h-8 text-slate-200 mx-auto" />
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">No Custom Entries Detected</p>
                <Button variant="ghost" className="text-[9px] font-black text-whatsapp-green hover:bg-whatsapp-green/5" onClick={() => setIsOpen(true)}>INITIALIZE FIRST ENTRY</Button>
              </div>
            ) : (
              customTemplates.map(t => renderTemplateCard(t))
            )}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

