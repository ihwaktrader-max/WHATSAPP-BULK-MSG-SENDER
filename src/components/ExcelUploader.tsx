import React, { useCallback, useState } from 'react';
import * as XLSX from 'xlsx';
import { FileSpreadsheet, AlertCircle, CheckCircle2, ChevronRight, Download } from 'lucide-react';
import { Contact } from '@/lib/whatsapp';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ExcelUploaderProps {
  onContactsLoaded: (contacts: Contact[]) => void;
}

export function ExcelUploader({ onContactsLoaded }: ExcelUploaderProps) {
  const [isMappingOpen, setIsMappingOpen] = useState(false);
  const [rawRows, setRawRows] = useState<any[][]>([]);
  const [headers, setHeaders] = useState<{label: string, index: number}[]>([]);
  const [mappings, setMappings] = useState<{name: string, phone: string, group: string}>({ name: '', phone: '', group: '' });

  const processRawData = (rows: any[][], headerIdx: number, nameColIdx: number, phoneColIdx: number, groupColIdx?: number) => {
    const dataRows = rows.slice(headerIdx + 1);
    
    const contacts: Contact[] = dataRows.map((row, index) => {
      const phoneValue = String(row[phoneColIdx] !== undefined ? row[phoneColIdx] : '').trim();
      const nameValue = String(row[nameColIdx] !== undefined ? row[nameColIdx] : 'Unknown').trim();
      const groupValue = groupColIdx !== undefined && groupColIdx !== -1 ? String(row[groupColIdx] || '').trim() : '';

      if (!phoneValue && nameValue === 'Unknown') return null;

      // Create a row object for variables
      const rowObj: any = {};
      const headerRow = rows[headerIdx] || [];
      headerRow.forEach((h, i) => {
        if (h) rowObj[String(h)] = row[i];
      });

      return {
        id: `contact-${index}-${Date.now()}`,
        name: nameValue,
        phone: phoneValue,
        status: 'pending' as const,
        group: groupValue,
        ...rowObj
      };
    }).filter((c): c is Contact => {
      if (!c) return false;
      const cleanPhone = c.phone.replace(/\D/g, '');
      return cleanPhone.length >= 10;
    });

    onContactsLoaded(contacts);
    setIsMappingOpen(false);
  };

  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const onFileRead = (file: File) => {
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = evt.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        if (rows.length === 0) {
          toast.error("Excel file khali hai.");
          return;
        }

        // Find potential header row
        let bestHeaderIdx = -1;
        let maxMatches = 0;
        let detectedName = '';
        let detectedPhone = '';
        let detectedGroup = '';

        for (let i = 0; i < Math.min(rows.length, 20); i++) {
          const row = rows[i];
          if (!row) continue;
          
          let matches = 0;
          let currentName = '';
          let currentPhone = '';
          let currentGroup = '';

          row.forEach((cell) => {
            const val = String(cell).toLowerCase().replace(/[^a-z]/g, '');
            if (val.includes('name') || val.includes('customer')) {
              matches++;
              currentName = String(cell);
            }
            if (val.includes('phone') || val.includes('mobile') || val.includes('contact') || val.includes('number')) {
              matches++;
              currentPhone = String(cell);
            }
            if (val.includes('group') || val.includes('category') || val.includes('type') || val.includes('lead')) {
              matches++;
              currentGroup = String(cell);
            }
          });

          if (matches > maxMatches) {
            maxMatches = matches;
            bestHeaderIdx = i;
            detectedName = currentName;
            detectedPhone = currentPhone;
            detectedGroup = currentGroup;
          }
        }

        if (bestHeaderIdx !== -1 && detectedName && detectedPhone) {
          const nameIdx = rows[bestHeaderIdx].indexOf(detectedName);
          const phoneIdx = rows[bestHeaderIdx].indexOf(detectedPhone);
          const groupIdx = detectedGroup ? rows[bestHeaderIdx].indexOf(detectedGroup) : -1;
          processRawData(rows, bestHeaderIdx, nameIdx, phoneIdx, groupIdx);
          toast.success("Excel parsed automatically!");
        } else {
          const firstValidRowIdx = Math.max(0, rows.findIndex(r => r && r.length > 0));
          const potentialHeaders = rows[firstValidRowIdx] || [];
          setRawRows(rows);
          const headerOptions = potentialHeaders.map((h, i) => ({ label: h ? String(h) : `Column ${i + 1}`, index: i }));
          setHeaders(headerOptions);
          const nIdx = headerOptions.findIndex(h => h.label.toLowerCase().includes('name'));
          const pIdx = headerOptions.findIndex(h => h.label.toLowerCase().includes('mobile') || h.label.toLowerCase().includes('phone'));
          const gIdx = headerOptions.findIndex(h => h.label.toLowerCase().includes('group') || h.label.toLowerCase().includes('lead'));
          setMappings({ name: nIdx !== -1 ? nIdx.toString() : '', phone: pIdx !== -1 ? pIdx.toString() : '', group: gIdx !== -1 ? gIdx.toString() : '' });
          setIsMappingOpen(true);
        }
      } catch (error) {
        toast.error("File read error.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onFileRead(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onFileRead(file);
  };

  return (
    <>
      <div className="relative group">
        <div 
          className={`h-40 border-2 border-dashed rounded-[2rem] flex flex-col items-center justify-center gap-3 transition-all duration-500 relative overflow-hidden cursor-pointer ${
            isDragging 
              ? 'border-whatsapp-green bg-whatsapp-green/5 shadow-[0_0_20px_rgba(37,211,102,0.1)] scale-[1.02]' 
              : 'border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-black/40 shadow-sm'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          {/* Cyber accents */}
          <div className="absolute top-4 left-4 w-2 h-2 border-t-2 border-l-2 border-slate-300 dark:border-slate-700" />
          <div className="absolute top-4 right-4 w-2 h-2 border-t-2 border-r-2 border-slate-300 dark:border-slate-700" />
          <div className="absolute bottom-4 left-4 w-2 h-2 border-b-2 border-l-2 border-slate-300 dark:border-slate-700" />
          <div className="absolute bottom-4 right-4 w-2 h-4 border-b-2 border-r-2 border-slate-300 dark:border-slate-700" />

          <div className={`p-4 rounded-2xl transition-all duration-500 ${isDragging ? 'bg-whatsapp-green text-white shadow-[0_0_15px_#25D366]' : 'bg-white dark:bg-slate-900 text-slate-400 group-hover:text-whatsapp-green group-hover:scale-110 shadow-lg shadow-slate-900/5'}`}>
            <Download className="w-6 h-6" />
          </div>
          <div className="text-center px-4">
            <p className="text-[10px] font-black text-slate-900 dark:text-slate-100 uppercase tracking-[0.2em]">Data Ingress</p>
            <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">XLSX / CSV Protocol</p>
          </div>
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".xlsx, .xls, .csv"
            className="hidden" 
          />
        </div>
      </div>

      <Dialog open={isMappingOpen} onOpenChange={setIsMappingOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              Column Mapping
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <p className="text-xs text-slate-500">
              Humein columns automatic nahi mile. Kripya bataiye kaunsa column kya hai:
            </p>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-xs font-bold">Name</label>
              <Select value={mappings.name} onValueChange={(v) => setMappings(m => ({ ...m, name: v }))}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select Name Column" />
                </SelectTrigger>
                <SelectContent>
                  {headers.map(h => <SelectItem key={h.index} value={h.index.toString()}>{h.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-xs font-bold">Phone</label>
              <Select value={mappings.phone} onValueChange={(v) => setMappings(m => ({ ...m, phone: v }))}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select Phone Column" />
                </SelectTrigger>
                <SelectContent>
                  {headers.map(h => <SelectItem key={h.index} value={h.index.toString()}>{h.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right text-xs font-bold">Group (Opt)</label>
              <Select value={mappings.group} onValueChange={(v) => setMappings(m => ({ ...m, group: v }))}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select Group Column" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="-1">None</SelectItem>
                  {headers.map(h => <SelectItem key={h.index} value={h.index.toString()}>{h.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button 
              className="bg-whatsapp-green hover:bg-whatsapp-green/90"
              onClick={() => {
                const nIdx = parseInt(mappings.name);
                const pIdx = parseInt(mappings.phone);
                const gIdx = mappings.group ? parseInt(mappings.group) : -1;
                
                if (isNaN(nIdx) || isNaN(pIdx)) {
                  toast.error("Name aur Phone columns select karein.");
                  return;
                }

                // Header row is usually where we picked the headers from
                const firstValidRowIdx = Math.max(0, rawRows.findIndex(r => r && r.length > 0));
                processRawData(rawRows, firstValidRowIdx, nIdx, pIdx, gIdx);
              }}
            >
              Confirm & Load
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
