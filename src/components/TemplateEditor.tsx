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
          <div className="flex flex-wrap gap-1.5">
            {availableFields.map(field => (
              <Badge 
                key={field} 
                variant="secondary" 
                className="cursor-pointer text-[10px] px-2 py-0.5 bg-slate-100 dark:bg-slate-800 dark:text-slate-300 hover:bg-whatsapp-green hover:text-white transition-colors border-none"
                onClick={() => addPlaceholder(field)}
              >
                {field}
              </Badge>
            ))}
          </div>
        </div>
        
        <Textarea
          placeholder="Apna message yahan likhein..."
          className="min-h-[150px] font-sans text-sm leading-relaxed border-border-muted focus-visible:ring-whatsapp-green dark:bg-slate-900 dark:border-slate-800 dark:text-slate-200"
          value={template}
          onChange={(e) => setTemplate(e.target.value)}
        />
      </div>

      <div className="space-y-3">
        <h4 className="text-[10px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500">Live Preview</h4>
        <div className="bg-[#e5ddd5] dark:bg-slate-800 rounded-xl p-6 min-h-[200px] flex flex-col justify-end border border-slate-200 dark:border-slate-700">
          <div className="whatsapp-bubble max-w-[90%] bg-white dark:bg-slate-900 p-3 rounded-lg shadow-sm">
            <p className="whitespace-pre-wrap text-sm dark:text-slate-200">
              {template.length > 0 ? template.replace(/\{\{(\w+)\}\}/g, (match, p1) => {
                return `[${p1}]`;
              }) : 'Message preview yahan dikhega...'}
            </p>
            <span className="text-[10px] text-slate-400 float-right mt-1">12:00 PM</span>
          </div>
        </div>
      </div>
    </div>
  );
}
