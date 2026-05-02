import { useRef, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Contact } from "@/lib/whatsapp";
import { CheckCircle2, Clock, XCircle } from "lucide-react";

interface ContactTableProps {
  contacts: Contact[];
  currentIndex: number;
}

export function ContactTable({ contacts, currentIndex }: ContactTableProps) {
  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (tableRef.current && currentIndex > 0) {
      const rowHeight = 57; // Approximate height of a row
      tableRef.current.scrollTo({
        top: (currentIndex - 2) * rowHeight,
        behavior: 'smooth'
      });
    }
  }, [currentIndex]);

  if (contacts.length === 0) return null;

  return (
    <div className="h-full overflow-hidden flex flex-col" ref={tableRef}>
      <Table className="border-collapse">
        <TableHeader className="sticky top-0 z-10 glass-panel border-b border-slate-200 dark:border-slate-800">
          <TableRow className="hover:bg-transparent border-none">
            <TableHead className="w-[200px] text-[10px] uppercase tracking-[0.15em] font-black text-slate-400 py-6 pl-8">
              <div className="flex items-center gap-2">
                <div className="w-1 h-1 bg-whatsapp-green" />
                IDENTIFIER
              </div>
            </TableHead>
            <TableHead className="text-[10px] uppercase tracking-[0.15em] font-black text-slate-400 py-6">TELEMETRY_NODE</TableHead>
            <TableHead className="text-[10px] uppercase tracking-[0.15em] font-black text-slate-400 py-6">RELAY_STATUS</TableHead>
            <TableHead className="text-[10px] uppercase tracking-[0.15em] font-black text-slate-400 py-6">COLLECTIVE</TableHead>
            <TableHead className="text-right text-[10px] uppercase tracking-[0.15em] font-black text-slate-400 py-6 pr-8">METADATA</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contacts.map((contact, index) => (
            <TableRow 
              key={contact.id} 
              className={`group transition-all border-b border-slate-100 dark:border-slate-800/50 ${
                index === currentIndex 
                  ? 'bg-whatsapp-green/[0.03] dark:bg-whatsapp-green/[0.02]' 
                  : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30'
              }`}
            >
              <TableCell className="py-6 pl-8">
                <div className="flex items-center gap-3">
                  <div className={`w-1 h-8 transition-all ${index === currentIndex ? 'bg-whatsapp-green' : 'bg-slate-100 dark:bg-slate-800'}`} />
                  <div>
                    <p className={`text-xs font-bold transition-colors ${index === currentIndex ? 'text-whatsapp-green' : 'text-slate-900 dark:text-slate-100'}`}>
                      {contact.name.toUpperCase()}
                    </p>
                    <p className="text-[9px] font-mono text-slate-400">UID_{contact.id.substring(0, 8)}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="py-6">
                <span className="font-mono text-[11px] text-slate-600 dark:text-slate-400 tracking-tighter">
                  {contact.phone}
                </span>
              </TableCell>
              <TableCell className="py-6">
                {contact.status === 'pending' && (
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500/20 flex items-center justify-center">
                      <div className="w-1 h-1 rounded-full bg-amber-500" />
                    </div>
                    <span className="text-[9px] font-black tracking-widest text-amber-600/80 uppercase">STBY</span>
                  </div>
                )}
                {contact.status === 'sent' && (
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-whatsapp-green/20 flex items-center justify-center">
                      <div className="w-1 h-1 rounded-full bg-whatsapp-green shadow-[0_0_8px_rgba(37,211,102,0.8)]" />
                    </div>
                    <span className="text-[9px] font-black tracking-widest text-whatsapp-green uppercase">SYNCED</span>
                  </div>
                )}
                {contact.status === 'failed' && (
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500/20 flex items-center justify-center">
                      <div className="w-1 h-1 rounded-full bg-red-500" />
                    </div>
                    <span className="text-[9px] font-black tracking-widest text-red-500 uppercase">ABORT</span>
                  </div>
                )}
              </TableCell>
              <TableCell className="py-6">
                {contact.group ? (
                  <span className="text-[9px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded tracking-tighter">
                    {contact.group.toUpperCase()}
                  </span>
                ) : (
                  <span className="text-[9px] text-slate-300">-- NULL --</span>
                )}
              </TableCell>
              <TableCell className="text-right py-6 pr-8">
                <div className="flex justify-end gap-2">
                  {Object.keys(contact)
                    .filter(k => !['id', 'name', 'phone', 'status', 'group'].includes(k))
                    .map(k => (
                      <div key={k} className="flex flex-col items-end">
                        <span className="text-[8px] font-black text-slate-300 uppercase leading-none">{k}</span>
                        <span className="text-[10px] font-mono text-slate-500 leading-tight">{contact[k]}</span>
                      </div>
                    ))}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
