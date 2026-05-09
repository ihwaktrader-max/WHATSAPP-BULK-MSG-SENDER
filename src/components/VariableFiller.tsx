import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles } from 'lucide-react';

interface VariableFillerProps {
  isOpen: boolean;
  onClose: () => void;
  templateContent: string;
  onApply: (finalContent: string) => void;
}

export function VariableFiller({ isOpen, onClose, templateContent, onApply }: VariableFillerProps) {
  const [variables, setVariables] = useState<Record<string, string>>({});
  const [placeholders, setPlaceholders] = useState<string[]>([]);

  useEffect(() => {
    // Find all {variable} or {{variable}} patterns
    const regex = /\{?\{([^}]+)\}\}?/g;
    const matches = new Set<string>();
    let match;
    while ((match = regex.exec(templateContent)) !== null) {
      matches.add(match[1].trim());
    }
    const found = Array.from(matches);
    setPlaceholders(found);
    
    // Initialize variables object
    const initialVars: Record<string, string> = {};
    found.forEach(p => initialVars[p] = "");
    setVariables(initialVars);
  }, [templateContent, isOpen]);

  const handleApply = () => {
    let finalContent = templateContent;
    Object.entries(variables).forEach(([key, value]) => {
      const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\{?\\{${escapedKey}\\}\\}?`, 'gi');
      finalContent = finalContent.replace(regex, (value as string) || "");
    });
    onApply(finalContent);
    onClose();
  };

  if (placeholders.length === 0 && isOpen) {
    // If no variables, just apply immediately and don't show dialog
    onApply(templateContent);
    onClose();
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="dark:bg-slate-900 dark:border-slate-800 max-w-sm rounded-[2rem]">
        <DialogHeader>
          <DialogTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-whatsapp-green" /> Variable Initialization
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p className="text-[10px] font-bold text-slate-400 uppercase leading-relaxed">
            Fill the following placeholders to initialize your message template.
          </p>
          <div className="space-y-3">
            {placeholders.map(p => (
              <div key={p} className="space-y-1.5">
                <Label className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">Value for {p}</Label>
                <Input 
                  value={variables[p] || ""} 
                  onChange={e => setVariables(prev => ({ ...prev, [p]: e.target.value }))}
                  placeholder={`Enter ${p}...`}
                  className="h-9 bg-slate-50 dark:bg-black border-slate-200 dark:border-slate-800 text-xs rounded-xl"
                />
              </div>
            ))}
          </div>
        </div>
        <DialogFooter>
          <Button 
            onClick={handleApply}
            className="w-full bg-whatsapp-green hover:bg-[#1ebe5d] text-white rounded-xl font-bold text-xs h-10 shadow-lg shadow-emerald-500/20"
          >
            APPLY TO EDITOR
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
