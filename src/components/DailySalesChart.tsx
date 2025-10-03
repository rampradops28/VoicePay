'use client';

import { useMemo } from 'react';
import { useBilling } from '@/context/BillingContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, eachDayOfInterval, startOfDay, endOfDay } from 'date-fns';

export default function DailySalesChart() {
  const { history } = useBilling();

  const dailySales = useMemo(() => {
    if (history.length < 2) {
      return [];
    }

    // Sort history to find the date range
    const sortedHistory = [...history].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    const startDate = startOfDay(new Date(sortedHistory[0].createdAt));
    const endDate = endOfDay(new Date(sortedHistory[sortedHistory.length - 1].createdAt));

    // Create an interval of all days between start and end
    const dateInterval = eachDayOfInterval({ start: startDate, end: endDate });

    // Initialize sales map with 0 for all days in the interval
    const salesByDay: { [key: string]: number } = {};
    dateInterval.forEach(day => {
      const dayKey = format(day, 'yyyy-MM-dd');
      salesByDay[dayKey] = 0;
    });

    // Populate sales data from history
    history.forEach(bill => {
      const day = format(new Date(bill.createdAt), 'yyyy-MM-dd');
      if (salesByDay[day] !== undefined) {
        salesByDay[day] += bill.totalAmount;
      }
    });

    return Object.entries(salesByDay)
      .map(([date, sales]) => ({
        date,
        sales,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [history]);

  if (dailySales.length === 0) {
    return (
        <div className="flex h-[350px] w-full items-center justify-center rounded-lg border-2 border-dashed">
            <p className="text-muted-foreground">Not enough data for sales trend.</p>
            <p className="text-sm text-muted-foreground ml-1">At least two days of sales are needed.</p>
        </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={dailySales}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis 
            dataKey="date" 
            tickFormatter={(str) => format(new Date(str), 'MMM d')}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            tickLine={{ stroke: 'hsl(var(--border))' }}
            stroke="hsl(var(--muted-foreground))"
        />
        <YAxis 
            axisLine={{ stroke: 'hsl(var(--border))' }}
            tickLine={{ stroke: 'hsl(var(--border))' }}
            tickFormatter={(value) => `₹${value}`}
            stroke="hsl(var(--muted-foreground))"
        />
        <Tooltip 
          contentStyle={{
            backgroundColor: 'hsl(var(--background))',
            borderColor: 'hsl(var(--border))',
          }}
          formatter={(value: number) => [`₹${value.toFixed(2)}`, 'Sales']} 
          labelFormatter={(label) => format(new Date(label), 'PPP')}
        />
        <Legend wrapperStyle={{ color: 'hsl(var(--foreground))' }}/>
        <Line type="monotone" dataKey="sales" stroke="hsl(var(--primary))" name="Total Sales" dot={false} strokeWidth={2} />
      </LineChart>
    </ResponsiveContainer>
  );
}
