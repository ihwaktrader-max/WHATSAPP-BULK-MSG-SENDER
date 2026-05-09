import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Contact, PREMADE_TEMPLATES } from '@/lib/whatsapp';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Layout } from 'lucide-react';

interface TemplateEditorProps {
  template: string;
  setTemplate: (val: string) => void;
  availableFields: string[];
}

export function TemplateEditor({ template, setTemplate, availableFields }: TemplateEditorProps) {
  const addPlaceholder = (field: string) => {
    setTemplate(template + ` {{${field}}}`);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500">Quick Templates</h4>
          <Select onValueChange={(val) => {
            const t = PREMADE_TEMPLATES.find(x => x.id === val);
            if (t) setTemplate(t.content);
          }}>
            <SelectTrigger className="w-[180px] h-8 text-[10px] font-bold border-slate-200 dark:border-slate-800 dark:bg-slate-900">
              <SelectValue placeholder="SELECT TEMPLATE" />
            </SelectTrigger>
            <SelectContent className="dark:bg-slate-900 dark:border-slate-800">
              {PREMADE_TEMPLATES.map(t => (
                <SelectItem key={t.id} value={t.id} className="text-[10px] font-bold">
                  {t.category}: {t.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center justify-between">
          <h4 className="text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500">Message Content</h4>
          <span className="text-[10px] font-mono font-black text-slate-400">{template.length} CHARS</span>
        </div>
        
        <div className="flex flex-wrap gap-1.5 mb-2">
          {availableFields.map(field => (
            <button 
              key={field} 
              className="text-[9px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:border-whatsapp-green hover:text-whatsapp-green transition-all shadow-sm active:scale-95"
              onClick={() => addPlaceholder(field)}
            >
              +{field}
            </button>
          ))}
        </div>
        
        <Textarea
          placeholder="Apna message yahan likhein..."
          className="min-h-[150px] font-mono text-[13px] tracking-tight leading-relaxed bg-slate-50 dark:bg-black border-slate-200 dark:border-slate-800 focus-visible:ring-whatsapp-green dark:text-slate-200 rounded-xl"
          value={template}
          onChange={(e) => setTemplate(e.target.value)}
        />
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500">Node Output Preview</h4>
          <span className="text-[9px] font-mono text-slate-400">ENCRYPTED_STREAM</span>
        </div>
        <div className="glass-panel dark:bg-black rounded-2xl p-6 min-h-[180px] flex flex-col justify-end border border-slate-200 dark:border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Layout className="w-20 h-20" />
          </div>
          <div className="whatsapp-bubble max-w-[90%] bg-white dark:bg-slate-900 p-4 rounded-2xl shadow-xl shadow-slate-900/5 relative animate-in fade-in slide-in-from-bottom-2">
            <div className="flex items-center gap-2 mb-2 border-b border-slate-50 dark:border-slate-800 pb-2">
              <div className="w-2 h-2 rounded-full bg-whatsapp-green shadow-[0_0_5px_#25D366]" />
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Secure Transmission</span>
            </div>
            <p className="whitespace-pre-wrap text-[13px] leading-relaxed dark:text-slate-200 font-medium">
              {template.length > 0 ? template.replace(/\{\{(\w+)\}\}/g, (match, p1) => {
                return `[${p1.toUpperCase()}]`;
              }) : 'Message preview yahan dikhega...'}
            </p>
            <div className="flex items-center justify-end gap-1.5 mt-3">
              <span className="text-[9px] font-mono text-slate-400">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              <div className="flex -space-x-1 opacity-50">
                <div className="w-2 h-2 rounded-full border border-whatsapp-green" />
                <div className="w-2 h-2 rounded-full border border-whatsapp-green" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
