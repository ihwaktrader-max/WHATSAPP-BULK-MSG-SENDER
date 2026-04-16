import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Contact } from '@/lib/whatsapp';

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
          <h4 className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Message Content</h4>
          <div className="flex flex-wrap gap-1.5">
            {availableFields.map(field => (
              <Badge 
                key={field} 
                variant="secondary" 
                className="cursor-pointer text-[10px] px-2 py-0.5 bg-slate-100 hover:bg-whatsapp-green hover:text-white transition-colors border-none"
                onClick={() => addPlaceholder(field)}
              >
                {field}
              </Badge>
            ))}
          </div>
        </div>
        
        <Textarea
          placeholder="Apna message yahan likhein..."
          className="min-h-[150px] font-sans text-sm leading-relaxed border-border-muted focus-visible:ring-whatsapp-green"
          value={template}
          onChange={(e) => setTemplate(e.target.value)}
        />
      </div>

      <div className="space-y-3">
        <h4 className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Live Preview</h4>
        <div className="bg-[#e5ddd5] rounded-xl p-6 min-h-[200px] flex flex-col justify-end">
          <div className="whatsapp-bubble max-w-[90%]">
            <p className="whitespace-pre-wrap text-sm">
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
