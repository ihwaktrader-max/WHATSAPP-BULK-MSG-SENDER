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
        <TableHeader className="sticky top-0 z-10 bg-white/95 dark:bg-card/95 backdrop-blur-md border-b border-border shadow-sm">
          <TableRow className="hover:bg-transparent border-none">
            <TableHead className="w-[200px] text-[10px] uppercase tracking-[0.15em] font-black text-muted-foreground py-6 pl-8">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-whatsapp-green rounded-full shadow-[0_0_8px_rgba(37,211,102,0.4)]" />
                IDENTIFIER
              </div>
            </TableHead>
            <TableHead className="text-[10px] uppercase tracking-[0.15em] font-black text-muted-foreground py-6">TELEMETRY_NODE</TableHead>
            <TableHead className="text-[10px] uppercase tracking-[0.15em] font-black text-muted-foreground py-6">RELAY_STATUS</TableHead>
            <TableHead className="text-[10px] uppercase tracking-[0.15em] font-black text-muted-foreground py-6">COLLECTIVE</TableHead>
            <TableHead className="text-right text-[10px] uppercase tracking-[0.15em] font-black text-muted-foreground py-6 pr-8">METADATA</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contacts.map((contact, index) => (
            <TableRow 
              key={contact.id} 
              data-active={index === currentIndex}
              className={`group transition-all border-b border-border/40 ${
                index === currentIndex 
                  ? 'bg-whatsapp-green/[0.04] dark:bg-whatsapp-green/[0.03]' 
                  : 'hover:bg-muted/30 dark:hover:bg-slate-800/40'
              }`}
            >
              <TableCell className="py-6 pl-8">
                <div className="flex items-center gap-4">
                  <div className={`w-1 h-10 rounded-full transition-all duration-500 ${index === currentIndex ? 'bg-whatsapp-green shadow-[0_0_12px_rgba(37,211,102,0.5)] scale-y-110' : 'bg-border/60'}`} />
                  <div>
                    <p className={`text-xs font-black transition-colors ${index === currentIndex ? 'text-whatsapp-green' : 'text-slate-900 dark:text-slate-100'}`}>
                      {contact.name.toUpperCase()}
                    </p>
                    <p className="text-[9px] font-mono font-bold text-muted-foreground/60 tracking-wider">UID_{contact.id.substring(0, 8).toUpperCase()}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell className="py-6">
                <span className="font-mono text-xs font-black text-slate-600 dark:text-slate-400 tracking-tighter">
                  {contact.phone}
                </span>
              </TableCell>
              <TableCell className="py-6">
                {contact.status === 'pending' && (
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                    <span className="text-[9px] font-black tracking-widest text-amber-600/80 dark:text-amber-500/80 uppercase">QUEUED</span>
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
                    <XCircle className="w-3.5 h-3.5 text-destructive" />
                    <span className="text-[9px] font-black tracking-widest text-destructive uppercase">ABORT</span>
                  </div>
                )}
              </TableCell>
              <TableCell className="py-6">
                {contact.group ? (
                  <Badge variant="secondary" className="text-[9px] font-black text-muted-foreground bg-muted/50 dark:bg-slate-800/50 hover:bg-muted dark:hover:bg-slate-800 transition-colors uppercase tracking-tight">
                    {contact.group}
                  </Badge>
                ) : (
                  <span className="text-[9px] font-bold text-slate-300 dark:text-slate-700 tracking-widest italic">-- NULL --</span>
                )}
              </TableCell>
              <TableCell className="text-right py-6 pr-8">
                <div className="flex items-center justify-end gap-6">
                  {contact.status === 'failed' && onRetry && (
                    <Button 
                      size="icon" 
                      variant="ghost"
                      className="w-8 h-8 rounded-lg text-amber-500 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/10 focus-visible:ring-amber-500"
                      onClick={() => onRetry(contact.id)}
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </Button>
                  )}
                  <div className="flex justify-end gap-3 pr-6 border-r border-border/60">
                    {Object.keys(contact)
                      .filter(k => !['id', 'name', 'phone', 'status', 'group'].includes(k))
                      .map(k => (
                        <div key={k} className="flex flex-col items-end">
                          <span className="text-[7px] font-black text-muted-foreground/50 uppercase leading-none mb-1">{k}</span>
                          <span className="text-[10px] font-mono font-bold text-muted-foreground leading-tight tracking-tight">{contact[k] && contact[k].toString().length > 15 ? contact[k].toString().substring(0, 15) + '...' : contact[k]}</span>
                        </div>
                      ))}
                  </div>
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="w-8 h-8 rounded-lg text-muted-foreground/30 hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all focus-visible:ring-destructive"
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
      <div className="md:hidden p-4 space-y-4">
        {contacts.map((contact, index) => (
          <div 
            key={contact.id} 
            data-active={index === currentIndex}
            className={`p-5 rounded-3xl border transition-all duration-300 shadow-sm ${
              index === currentIndex 
                ? 'bg-whatsapp-green/[0.03] border-whatsapp-green/30 ring-2 ring-whatsapp-green/5' 
                : 'bg-white dark:bg-card border-border'
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs transition-colors ${
                  index === currentIndex ? 'bg-whatsapp-green text-white shadow-lg shadow-whatsapp-green/20' : 
                  contact.status === 'sent' ? 'bg-whatsapp-green/10 text-whatsapp-green' :
                  'bg-muted dark:bg-slate-800 text-muted-foreground'
                }`}>
                  {contact.status === 'sent' ? <CheckCircle2 className="w-5 h-5" /> : index + 1}
                </div>
                <div>
                  <h4 className={`text-xs font-black uppercase tracking-tight ${contact.status === 'sent' ? 'text-whatsapp-green' : 'text-slate-900 dark:text-white'}`}>{contact.name}</h4>
                  <p className="text-[10px] font-mono font-bold text-muted-foreground tracking-tighter mt-0.5">{contact.phone}</p>
                </div>
              </div>
              <Badge className={`text-[8px] font-black border-none px-2 py-1 rounded-lg ${
                contact.status === 'sent' ? 'bg-whatsapp-green/10 text-whatsapp-green' :
                contact.status === 'failed' ? 'bg-destructive/10 text-destructive' :
                'bg-amber-500/10 text-amber-500'
              }`}>
                {contact.status.toUpperCase()}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between pt-4 border-t border-border/40">
              <div className="flex gap-2">
                {Object.keys(contact)
                  .filter(k => !['id', 'name', 'phone', 'status', 'group'].includes(k))
                  .slice(0, 2)
                  .map(k => (
                    <div key={k} className="px-3 py-1.5 bg-muted/30 dark:bg-slate-800/50 rounded-xl">
                      <span className="text-[7px] font-black text-muted-foreground/40 uppercase block leading-none mb-1">{k}</span>
                      <span className="text-[9px] font-black text-muted-foreground truncate max-w-[80px] block">{contact[k] && contact[k].toString()}</span>
                    </div>
                  ))}
              </div>
              <div className="flex items-center gap-1">
                {contact.status === 'failed' && onRetry && (
                  <Button 
                    size="sm" 
                    variant="ghost"
                    className="h-9 w-9 rounded-full text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/10"
                    onClick={() => onRetry(contact.id)}
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                )}
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="h-9 w-9 rounded-full text-muted-foreground/40 hover:text-destructive hover:bg-destructive/5"
                  onClick={() => onRemove?.(contact.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
