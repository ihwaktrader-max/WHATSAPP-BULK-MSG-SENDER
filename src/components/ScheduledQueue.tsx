import React, { useState, useEffect } from 'react';
import { formatDistanceToNow, isAfter, parseISO } from 'date-fns';
import { Clock, Trash2, Calendar, AlertCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScheduledCampaign } from '@/lib/whatsapp';

interface ScheduledQueueProps {
  queue: ScheduledCampaign[];
  onCancel: (id: string) => void;
}

export function ScheduledQueue({ queue, onCancel }: ScheduledQueueProps) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'upcoming': return <Badge className="bg-blue-500/10 text-blue-500 border-none uppercase text-[8px] font-black">Upcoming</Badge>;
      case 'sending': return <Badge className="bg-amber-500/10 text-amber-500 border-none uppercase text-[8px] font-black animate-pulse">Sending...</Badge>;
      case 'completed': return <Badge className="bg-whatsapp-green/10 text-whatsapp-green border-none uppercase text-[8px] font-black">Completed</Badge>;
      case 'cancelled': return <Badge className="bg-red-500/10 text-red-500 border-none uppercase text-[8px] font-black">Cancelled</Badge>;
      default: return null;
    }
  };

  if (queue.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 bg-slate-50/50 dark:bg-slate-900/50 rounded-[3rem] border border-dashed border-slate-200 dark:border-slate-800 space-y-4">
        <div className="w-16 h-16 bg-white dark:bg-slate-900 rounded-full flex items-center justify-center shadow-sm">
          <Calendar className="w-8 h-8 text-slate-200" />
        </div>
        <div className="text-center">
          <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest">No Scheduled Nodes</h4>
          <p className="text-[10px] text-slate-400 font-bold mt-1">Your transmission queue is currently empty.</p>
        </div>
      </div>
    );
  }

  return (
    <Card className="border-slate-100 dark:border-slate-800 rounded-[2rem] overflow-hidden">
      <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-whatsapp-green" />
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest leading-none">Sequence Queue</h3>
        </div>
        <Badge variant="outline" className="text-[9px] font-black uppercase text-slate-400 border-slate-200">
          {queue.filter(q => q.status === 'upcoming').length} Active
        </Badge>
      </div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader className="bg-slate-50/50 dark:bg-slate-900/30">
            <TableRow className="border-slate-100 dark:border-slate-800">
              <TableHead className="text-[9px] font-black text-slate-400 uppercase h-10 px-6">Transmission Node</TableHead>
              <TableHead className="text-[9px] font-black text-slate-400 uppercase h-10 px-6">Payload Preview</TableHead>
              <TableHead className="text-[9px] font-black text-slate-400 uppercase h-10 px-6">Sequence Countdown</TableHead>
              <TableHead className="text-[9px] font-black text-slate-400 uppercase h-10 px-6">Status</TableHead>
              <TableHead className="text-[9px] font-black text-slate-400 uppercase h-10 px-6 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {queue.map((item) => {
              const scheduledDate = parseISO(item.scheduledTime);
              const isPast = !isAfter(scheduledDate, now);
              const timeRemaining = formatDistanceToNow(scheduledDate, { addSuffix: true });

              return (
                <TableRow key={item.id} className="border-slate-50 dark:border-slate-800/50 hover:bg-slate-50/30 dark:hover:bg-slate-900/30 transition-colors group">
                  <TableCell className="px-6 py-4">
                    <div className="space-y-0.5">
                      <p className="text-[11px] font-black text-slate-800 dark:text-slate-100 uppercase">{item.name}</p>
                      <p className="text-[9px] font-bold text-slate-400 flex items-center gap-1">
                        <Users className="w-2.5 h-2.5" /> {item.contacts.length} Recipients
                      </p>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <p className="text-[10px] text-slate-500 font-medium italic line-clamp-1">
                      "{item.template}"
                    </p>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-slate-600 dark:text-slate-400 uppercase">
                        {item.status === 'upcoming' ? timeRemaining : 'Node Terminal'}
                      </span>
                      <span className="text-[8px] font-bold text-slate-400">
                        {format(scheduledDate, 'MMM d, HH:mm')} ({item.timezone})
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    {getStatusBadge(item.status)}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-right">
                    {item.status === 'upcoming' && (
                      <Button 
                        size="icon" 
                        variant="ghost" 
                        className="w-8 h-8 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 transition-all opacity-0 group-hover:opacity-100"
                        onClick={() => onCancel(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}

// Helper icons needed but might not be passed as props
import { Users } from 'lucide-react';
import { format } from 'date-fns';
