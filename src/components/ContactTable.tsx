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
import { CheckCircle2, Clock, XCircle, Trash2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface ContactTableProps {
  contacts: Contact[];
  currentIndex: number;
  onRemove?: (id: string) => void;
  onRetry?: (id: string) => void;
  isLoading?: boolean;
}

export function ContactTable({ contacts, currentIndex, onRemove, onRetry, isLoading }: ContactTableProps) {
  const tableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (tableRef.current && currentIndex > 0) {
      const activeElement = tableRef.current.querySelector('[data-active="true"]');
      if (activeElement) {
        activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [currentIndex]);

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center space-x-4">
            <Skeleton className="h-12 w-12 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (contacts.length === 0) return null;

  return (
    <div className="h-full overflow-auto flex flex-col custom-scrollbar" ref={tableRef}>
      {/* Desktop View */}
      <Table className="hidden md:table border-collapse">
        <TableHeader className="sticky top-0 z-10 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
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
              data-active={index === currentIndex}
              className={`group transition-all border-b border-slate-100 dark:border-slate-800/50 ${
                index === currentIndex 
                  ? 'bg-whatsapp-green/[0.03] dark:bg-whatsapp-green/[0.02]' 
                  : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30'
              }`}
            >
              <TableCell className="py-6 pl-8">
                <div className="flex items-center gap-3">
                  <div className={`w-1 h-8 transition-all ${index === currentIndex ? 'bg-whatsapp-green animate-pulse' : 'bg-slate-100 dark:bg-slate-800'}`} />
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
                    <Clock className="w-3 h-3 text-amber-500/60" />
                    <span className="text-[9px] font-black tracking-widest text-amber-600/80 uppercase">QUEUED</span>
                  </div>
                )}
                {contact.status === 'sent' && (
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-3.5 h-3.5 text-whatsapp-green" />
                    <span className="text-[9px] font-black tracking-widest text-whatsapp-green uppercase">SYNCED</span>
                  </div>
                )}
                {contact.status === 'failed' && (
                  <div className="flex items-center gap-2">
                    <XCircle className="w-3.5 h-3.5 text-red-500" />
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
                <div className="flex items-center justify-end gap-4">
                  {contact.status === 'failed' && onRetry && (
                    <Button 
                      size="icon" 
                      variant="ghost"
                      className="w-8 h-8 rounded-lg text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/10"
                      onClick={() => onRetry(contact.id)}
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </Button>
                  )}
                  <div className="flex justify-end gap-2 pr-4 border-r border-slate-100 dark:border-slate-800/50">
                    {Object.keys(contact)
                      .filter(k => !['id', 'name', 'phone', 'status', 'group'].includes(k))
                      .map(k => (
                        <div key={k} className="flex flex-col items-end">
                          <span className="text-[8px] font-black text-slate-300 uppercase leading-none">{k}</span>
                          <span className="text-[10px] font-mono text-slate-500 leading-tight">{contact[k] && contact[k].toString().length > 15 ? contact[k].toString().substring(0, 15) + '...' : contact[k]}</span>
                        </div>
                      ))}
                  </div>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="w-8 h-8 rounded-lg text-slate-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 opacity-0 group-hover:opacity-100 transition-all"
                    onClick={() => onRemove?.(contact.id)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Mobile View */}
      <div className="md:hidden p-4 space-y-3">
        {contacts.map((contact, index) => (
          <div 
            key={contact.id} 
            data-active={index === currentIndex}
            className={`p-4 rounded-2xl border transition-all ${
              index === currentIndex 
                ? 'bg-whatsapp-green/5 border-whatsapp-green/20 ring-1 ring-whatsapp-green/10' 
                : 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800'
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-[10px] ${
                  index === currentIndex ? 'bg-whatsapp-green text-white' : 
                  contact.status === 'sent' ? 'bg-whatsapp-green/10 text-whatsapp-green' :
                  'bg-slate-100 dark:bg-slate-800 text-slate-400'
                }`}>
                  {contact.status === 'sent' ? <CheckCircle2 className="w-4 h-4" /> : index + 1}
                </div>
                <div>
                  <h4 className={`text-xs font-bold uppercase tracking-tight ${contact.status === 'sent' ? 'text-whatsapp-green' : 'dark:text-white'}`}>{contact.name}</h4>
                  <p className="text-[10px] font-mono text-slate-400 tracking-tighter">{contact.phone}</p>
                </div>
              </div>
              <Badge className={`text-[8px] font-black border-none px-2 py-0.5 ${
                contact.status === 'sent' ? 'bg-whatsapp-green/10 text-whatsapp-green' :
                contact.status === 'failed' ? 'bg-red-500/10 text-red-500' :
                'bg-amber-500/10 text-amber-500'
              }`}>
                {contact.status.toUpperCase()}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between pt-3 border-t border-slate-50 dark:border-slate-800/50">
              <div className="flex gap-2">
                {Object.keys(contact)
                  .filter(k => !['id', 'name', 'phone', 'status', 'group'].includes(k))
                  .slice(0, 2)
                  .map(k => (
                    <div key={k} className="px-2 py-1 bg-slate-50 dark:bg-slate-800 rounded-lg">
                      <span className="text-[7px] font-black text-slate-300 uppercase block">{k}</span>
                      <span className="text-[9px] font-bold text-slate-500 truncate max-w-[60px] block">{contact[k] && contact[k].toString()}</span>
                    </div>
                  ))}
              </div>
              <div className="flex items-center gap-1">
                {contact.status === 'failed' && onRetry && (
                  <Button 
                    size="sm" 
                    variant="ghost"
                    className="h-8 w-8 rounded-full text-amber-500"
                    onClick={() => onRetry(contact.id)}
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </Button>
                )}
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-8 w-8 rounded-full text-slate-300"
                  onClick={() => onRemove?.(contact.id)}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
