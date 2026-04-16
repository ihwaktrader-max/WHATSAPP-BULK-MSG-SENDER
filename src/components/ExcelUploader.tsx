import React, { useCallback, useState } from 'react';
import * as XLSX from 'xlsx';
import { FileSpreadsheet, AlertCircle, CheckCircle2, ChevronRight } from 'lucide-react';
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
  const [headers, setHeaders] = useState<string[]>([]);
  const [mappings, setMappings] = useState({ name: '', phone: '', group: '' });

  const processRawData = (rows: any[][], headerIdx: number, nameCol: string, phoneCol: string, groupCol?: string) => {
    const dataRows = rows.slice(headerIdx + 1);
    const nameIdx = rows[headerIdx].indexOf(nameCol);
    const phoneIdx = rows[headerIdx].indexOf(phoneCol);
    const groupIdx = groupCol ? rows[headerIdx].indexOf(groupCol) : -1;

    const contacts: Contact[] = dataRows.map((row, index) => {
      const phoneValue = String(row[phoneIdx] || '').trim();
      const nameValue = String(row[nameIdx] || 'Unknown').trim();
      const groupValue = groupIdx !== -1 ? String(row[groupIdx] || '').trim() : '';

      if (!phoneValue && nameValue === 'Unknown') return null;

      // Create a row object for variables
      const rowObj: any = {};
      rows[headerIdx].forEach((h, i) => {
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

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

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
            if (val.includes('srno') || val.includes('sno')) matches++;
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
          // Auto-process if we are confident
          processRawData(rows, bestHeaderIdx, detectedName, detectedPhone, detectedGroup);
          toast.success("Excel parsed automatically!");
        } else {
          // Show mapping dialog if unsure
          const firstValidRowIdx = rows.findIndex(r => r && r.length > 1);
          const potentialHeaders = rows[firstValidRowIdx] || [];
          setRawRows(rows);
          setHeaders(potentialHeaders.map(h => String(h || 'Column')));
          setMappings({ 
            name: potentialHeaders.find(h => String(h).toLowerCase().includes('name')) || '',
            phone: potentialHeaders.find(h => String(h).toLowerCase().includes('mobile') || String(h).toLowerCase().includes('phone')) || '',
            group: potentialHeaders.find(h => String(h).toLowerCase().includes('group') || String(h).toLowerCase().includes('lead')) || ''
          });
          setIsMappingOpen(true);
        }
      } catch (error) {
        console.error("Excel Parsing Error:", error);
        toast.error("File read karne mein galti hui.");
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = '';
  }, [onContactsLoaded]);

  return (
    <>
      <div className="p-6 border-2 border-dashed border-border-muted rounded-xl flex flex-col items-center justify-center space-y-4 bg-slate-50/50 hover:bg-slate-50 transition-all relative overflow-hidden group cursor-pointer">
        <div className="bg-whatsapp-green/10 p-3 rounded-full group-hover:scale-110 transition-transform">
          <FileSpreadsheet className="w-6 h-6 text-whatsapp-green" />
        </div>
        <div className="text-center">
          <h3 className="text-sm font-bold text-slate-700">Select Excel/CSV</h3>
          <p className="text-[10px] text-slate-400 mt-1">
            Drag & drop or click to browse
          </p>
        </div>
        <input
          type="file"
          className="absolute inset-0 opacity-0 cursor-pointer"
          accept=".xlsx, .xls, .csv"
          onChange={handleFileUpload}
        />
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
                  {headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
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
                  {headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
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
                  <SelectItem value="">None</SelectItem>
                  {headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button 
              className="bg-whatsapp-green hover:bg-whatsapp-green/90"
              onClick={() => {
                const headerIdx = rawRows.findIndex(r => r.includes(mappings.name) || r.includes(mappings.phone));
                processRawData(rawRows, headerIdx === -1 ? 0 : headerIdx, mappings.name, mappings.phone, mappings.group);
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
