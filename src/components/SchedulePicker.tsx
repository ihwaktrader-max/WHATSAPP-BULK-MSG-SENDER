import React from 'react';
import { format } from 'date-fns';
import { DayPicker } from 'react-day-picker';
import { Calendar as CalendarIcon, Clock, Globe } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";

interface SchedulePickerProps {
  selectedDate: Date | undefined;
  onDateSelect: (date: Date | undefined) => void;
  selectedHour: string;
  onHourChange: (hour: string) => void;
  selectedMinute: string;
  onMinuteChange: (minute: string) => void;
  timezone: string;
  onTimezoneChange: (tz: string) => void;
}

export function SchedulePicker({
  selectedDate,
  onDateSelect,
  selectedHour,
  onHourChange,
  selectedMinute,
  onMinuteChange,
  timezone,
  onTimezoneChange
}: SchedulePickerProps) {
  const hours = Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, '0'));
  const minutes = Array.from({ length: 60 }, (_, i) => i.toString().padStart(2, '0'));

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Calendar Card */}
        <div className="flex-1 p-4 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm">
          <div className="flex items-center gap-2 mb-4 px-2">
            <CalendarIcon className="w-4 h-4 text-whatsapp-green" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Target Date</span>
          </div>
          <DayPicker
            mode="single"
            selected={selectedDate}
            onSelect={onDateSelect}
            className="border-none"
            classNames={{
              day_selected: "bg-whatsapp-green text-white hover:bg-whatsapp-green focus:bg-whatsapp-green",
              day: "text-slate-600 dark:text-slate-400 hover:bg-whatsapp-green/10 rounded-lg transition-colors p-2 text-sm font-bold",
              head_cell: "text-slate-400 font-black text-[10px] uppercase p-2",
              nav_button: "hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg p-1 transition-colors",
              caption: "flex justify-between items-center px-2 py-1 mb-2 font-black text-xs uppercase"
            }}
          />
        </div>

        {/* Time and Settings */}
        <div className="flex-1 space-y-4">
          <div className="p-6 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-sm space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-4 h-4 text-whatsapp-green" />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Transmission Time</span>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[9px] font-black text-slate-500 uppercase">Hour (24h)</Label>
                <Select value={selectedHour} onValueChange={onHourChange}>
                  <SelectTrigger className="h-10 bg-slate-50 dark:bg-black border-slate-100 dark:border-slate-800 rounded-xl text-sm font-bold">
                    <SelectValue placeholder="HH" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-slate-900 dark:border-slate-800">
                    {hours.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-[9px] font-black text-slate-500 uppercase">Minute</Label>
                <Select value={selectedMinute} onValueChange={onMinuteChange}>
                  <SelectTrigger className="h-10 bg-slate-50 dark:bg-black border-slate-100 dark:border-slate-800 rounded-xl text-sm font-bold">
                    <SelectValue placeholder="MM" />
                  </SelectTrigger>
                  <SelectContent className="dark:bg-slate-900 dark:border-slate-800">
                    {minutes.map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-50 dark:border-slate-800">
              <div className="flex items-center gap-2 mb-3">
                <Globe className="w-4 h-4 text-whatsapp-green" />
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Zone Synchronization</span>
              </div>
              <Select value={timezone} onValueChange={onTimezoneChange}>
                <SelectTrigger className="h-10 bg-slate-50 dark:bg-black border-slate-100 dark:border-slate-800 rounded-xl text-[11px] font-bold">
                  <SelectValue placeholder="Select Timezone" />
                </SelectTrigger>
                <SelectContent className="dark:bg-slate-900 dark:border-slate-800">
                  <SelectItem value="IST">Asia/Kolkata (IST)</SelectItem>
                  <SelectItem value="UTC">UTC (Universal)</SelectItem>
                  <SelectItem value="GMT">Greenwich (GMT)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="p-4 bg-whatsapp-green/5 border border-whatsapp-green/10 rounded-2xl">
            <p className="text-[10px] font-bold text-whatsapp-green uppercase tracking-tight text-center">
              Target sequence will initiate on {selectedDate ? format(selectedDate, 'PPP') : '...'} at {selectedHour}:{selectedMinute} {timezone}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
