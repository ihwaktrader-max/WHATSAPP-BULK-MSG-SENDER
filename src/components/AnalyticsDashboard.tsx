import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { 
  MessageSquare, CheckCircle2, XCircle, Clock, 
  Calendar, TrendingUp, ArrowUpRight, ArrowDownRight 
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

// Mock Data for Charts
const lineData = [
  { name: '03 May', sent: 400, failed: 24 },
  { name: '04 May', sent: 300, failed: 13 },
  { name: '05 May', sent: 200, failed: 98 },
  { name: '06 May', sent: 278, failed: 39 },
  { name: '07 May', sent: 189, failed: 48 },
  { name: '08 May', sent: 239, failed: 38 },
  { name: '09 May', sent: 349, failed: 43 },
];

const pieData = [
  { name: 'Successful', value: 75, color: '#25D366' },
  { name: 'Failed', value: 15, color: '#EF4444' },
  { name: 'Pending', value: 10, color: '#F59E0B' },
];

const recentActivity = [
  { id: 1, phone: '+91 98765 43210', message: 'Hello! Check our...', status: 'sent', time: '2 mins ago' },
  { id: 2, phone: '+91 99988 77766', message: 'Your appointment is...', status: 'failed', time: '15 mins ago' },
  { id: 3, phone: '+91 77766 55544', message: 'Happy Diwali! Your...', status: 'pending', time: '1 hour ago' },
  { id: 4, phone: '+91 88877 66655', message: 'Exclusive offer for...', status: 'sent', time: '3 hours ago' },
  { id: 5, phone: '+91 66655 44433', message: 'Verification code...', status: 'sent', time: '5 hours ago' },
];

export function AnalyticsDashboard() {
  const [dateRange, setDateRange] = useState('7d');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate data loading
    const timer = setTimeout(() => setIsLoading(false), 1200);
    return () => clearTimeout(timer);
  }, [dateRange]);

  if (isLoading) {
    return (
      <div className="space-y-8 p-4">
        <div className="flex justify-between items-center">
          <Skeleton className="h-10 w-[200px]" />
          <Skeleton className="h-10 w-[150px]" />
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-32 rounded-3xl" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="lg:col-span-2 h-[400px] rounded-3xl" />
          <Skeleton className="h-[400px] rounded-3xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header & Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-slate-800 dark:text-slate-100 tracking-tight">Campaign Intelligence</h2>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Real-time performance analytics</p>
        </div>
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-slate-400" />
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[180px] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold">
              <SelectValue placeholder="Select Range" />
            </SelectTrigger>
            <SelectContent className="dark:bg-slate-900 dark:border-slate-800">
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Sent', value: '1,284', icon: MessageSquare, color: 'text-whatsapp-green', bg: 'bg-whatsapp-green/10', trend: '+12%', up: true },
          { label: 'Successful', value: '1,102', icon: CheckCircle2, color: 'text-whatsapp-green', bg: 'bg-whatsapp-green/10', trend: '+8%', up: true },
          { label: 'Failed', value: '142', icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10', trend: '-2%', up: false },
          { label: 'Pending', value: '40', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10', trend: 'N/A', up: null },
        ].map((stat, i) => (
          <Card key={i} className="p-4 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/50 rounded-3xl shadow-sm hover:shadow-md transition-all">
            <div className={`w-10 h-10 ${stat.bg} ${stat.color} rounded-2xl flex items-center justify-center mb-3`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{stat.label}</p>
            <div className="flex items-end justify-between mt-2">
              <h3 className="text-2xl font-black text-slate-800 dark:text-slate-100 leading-none">{stat.value}</h3>
              {stat.up !== null && (
                <div className={`flex items-center text-[10px] font-black ${stat.up ? 'text-whatsapp-green' : 'text-red-500'}`}>
                  {stat.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                  {stat.trend}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Line Chart */}
        <Card className="lg:col-span-2 p-6 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/50 rounded-3xl overflow-hidden">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-whatsapp-green" /> Delivery Trends
            </h3>
          </div>
          <div style={{ height: '300px' }} className="w-full">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={lineData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="text-slate-200 dark:text-slate-800" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94A3B8' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fontWeight: 700, fill: '#94A3B8' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', 
                    fontSize: '12px', 
                    fontWeight: 'bold',
                    backgroundColor: 'white',
                  }}
                  itemStyle={{ color: '#000' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="sent" 
                  stroke="#25D366" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#25D366', strokeWidth: 2, stroke: '#fff' }}
                  activeDot={{ r: 6 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="failed" 
                  stroke="#EF4444" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#EF4444', strokeWidth: 2, stroke: '#fff' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Pie Chart */}
        <Card className="p-6 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/50 rounded-3xl flex flex-col">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Status Breakdown</h3>
          <div style={{ height: '250px' }} className="w-full flex-1">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend 
                  verticalAlign="bottom" 
                  height={36} 
                  formatter={(value) => <span className="text-[10px] font-black uppercase text-slate-500">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
            <div className="flex justify-between items-center text-xs font-bold text-slate-400">
              <p>Success Rate</p>
              <p className="text-whatsapp-green font-black">75% HIGH</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Activity Table */}
      <Card className="border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900/50 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Recent Activity</h3>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-slate-50/50 dark:bg-slate-900/80">
              <TableRow className="border-slate-100 dark:border-slate-800">
                <TableHead className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase h-10 px-6">Phone Number</TableHead>
                <TableHead className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase h-10 px-6">Message Preview</TableHead>
                <TableHead className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase h-10 px-6">Status</TableHead>
                <TableHead className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase h-10 px-6 text-right">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentActivity.map((item) => (
                <TableRow key={item.id} className="border-slate-100 dark:border-slate-800/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group">
                  <TableCell className="px-6 py-4 font-mono text-[11px] font-bold text-slate-700 dark:text-slate-300">
                    {item.phone}
                  </TableCell>
                  <TableCell className="px-6 py-4 text-xs text-slate-500 font-medium italic">
                    "{item.message}"
                  </TableCell>
                  <TableCell className="px-6 py-4">
                    <Badge 
                      className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-lg border-none ${
                        item.status === 'sent' ? 'bg-whatsapp-green/10 text-whatsapp-green' :
                        item.status === 'failed' ? 'bg-red-500/10 text-red-500' :
                        'bg-amber-500/10 text-amber-500'
                      }`}
                    >
                      {item.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-6 py-4 text-right text-[10px] font-bold text-slate-400 uppercase">
                    {item.time}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
