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
    <div className="bg-white h-full" ref={tableRef}>
      <Table>
        <TableHeader>
          <TableRow className="bg-slate-50 border-b-2 border-border-muted hover:bg-slate-50">
            <TableHead className="w-[180px] text-[10px] uppercase tracking-wider font-bold text-slate-400 py-4">Customer Name</TableHead>
            <TableHead className="text-[10px] uppercase tracking-wider font-bold text-slate-400 py-4">Phone Number</TableHead>
            <TableHead className="text-[10px] uppercase tracking-wider font-bold text-slate-400 py-4">Status</TableHead>
            <TableHead className="text-[10px] uppercase tracking-wider font-bold text-slate-400 py-4">Group</TableHead>
            <TableHead className="text-right text-[10px] uppercase tracking-wider font-bold text-slate-400 py-4">Variables</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contacts.map((contact, index) => (
            <TableRow 
              key={contact.id} 
              className={`border-b border-border-muted transition-colors ${
                index === currentIndex 
                  ? 'bg-whatsapp-green/5 ring-1 ring-inset ring-whatsapp-green/20' 
                  : 'hover:bg-slate-50/50'
              }`}
            >
              <TableCell className="font-semibold text-slate-700 py-4">
                <div className="flex items-center gap-2">
                  {index === currentIndex && (
                    <div className="w-1.5 h-1.5 rounded-full bg-whatsapp-green animate-pulse" />
                  )}
                  {contact.name}
                </div>
              </TableCell>
              <TableCell className="text-slate-600 py-4 font-mono text-xs">{contact.phone}</TableCell>
              <TableCell className="py-4">
                {contact.status === 'pending' && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#fff3cd] text-[#856404] dark:bg-amber-900/30 dark:text-amber-400">
                    <Clock className="w-3 h-3 mr-1" /> PENDING
                  </span>
                )}
                {contact.status === 'sent' && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#dcf8c6] text-[#128c7e] dark:bg-emerald-900/30 dark:text-emerald-400">
                    <CheckCircle2 className="w-3 h-3 mr-1" /> SENT
                  </span>
                )}
                {contact.status === 'failed' && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                    <XCircle className="w-3 h-3 mr-1" /> FAILED
                  </span>
                )}
              </TableCell>
              <TableCell className="py-4">
                {contact.group ? (
                  <Badge variant="outline" className="text-[9px] font-bold border-slate-200 dark:border-slate-700">
                    {contact.group.toUpperCase()}
                  </Badge>
                ) : (
                  <span className="text-[10px] text-slate-300">NONE</span>
                )}
              </TableCell>
              <TableCell className="text-right py-4">
                <div className="flex flex-wrap justify-end gap-1">
                  {Object.keys(contact)
                    .filter(k => !['id', 'name', 'phone', 'status'].includes(k))
                    .map(k => (
                      <span key={k} className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">
                        {k}: {contact[k]}
                      </span>
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
