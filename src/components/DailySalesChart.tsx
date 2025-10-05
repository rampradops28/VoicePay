'use client';

import { useMemo } from 'react';
import { useBilling } from '@/context/BillingContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, eachDayOfInterval, startOfDay, endOfDay, parseISO } from 'date-fns';
import { Card } from './ui/card';

export default function DailySalesChart() {
  const { history } = useBilling();

  const dailySales = useMemo(() => {
    if (history.length < 1) {
      return [];
    }

    const sortedHistory = [...history].sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    const startDate = startOfDay(new Date(sortedHistory[0].createdAt));
    const endDate = endOfDay(new Date()); 

    const dateInterval = eachDayOfInterval({ start: startDate, end: endDate });

    const salesByDay: { [key: string]: number } = {};
    dateInterval.forEach(day => {
      const dayKey = format(day, 'yyyy-MM-dd');
      salesByDay[dayKey] = 0;
    });

    history.forEach(bill => {
      const day = format(new Date(bill.createdAt), 'yyyy-MM-dd');
      if (salesByDay.hasOwnProperty(day)) {
        salesByDay[day] += bill.totalAmount;
      }
    });

    return Object.entries(salesByDay)
      .map(([date, sales]) => ({
        date,
        Sales: sales,
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [history]);

  if (dailySales.length < 2) {
    return (
        <div className="flex h-[350px] w-full items-center justify-center rounded-lg border-2 border-dashed">
            <p className="text-muted-foreground text-center">
              Not enough data for a sales trend.
              <br />
              <span className="text-sm">At least two days of sales are needed to show a chart.</span>
            </p>
        </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={dailySales} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis 
            dataKey="date" 
            tickFormatter={(str) => format(parseISO(str), 'MMM d')}
            axisLine={{ stroke: 'hsl(var(--border))' }}
            tickLine={{ stroke: 'hsl(var(--border))' }}
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
        />
        <YAxis 
            axisLine={{ stroke: 'hsl(var(--border))' }}
            tickLine={{ stroke: 'hsl(var(--border))' }}
            tickFormatter={(value) => `Rs ${value}`}
            stroke="hsl(var(--muted-foreground))"
            fontSize={12}
        />
        <Tooltip 
          content={({ active, payload, label }) => {
            if (active && payload && payload.length) {
              return (
                <Card className="p-3 shadow-lg">
                  <p className="font-semibold text-sm">{format(parseISO(label), 'PPP')}</p>
                  <p className="text-primary font-medium">
                    Sales: Rs {payload[0].value?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                </Card>
              );
            }
            return null;
          }}
        />
        <Legend wrapperStyle={{ color: 'hsl(var(--foreground))' }}/>
        <Line type="monotone" dataKey="Sales" strokeWidth={2} stroke="hsl(var(--primary))" dot={{ r: 4, fill: "hsl(var(--primary))" }} activeDot={{ r: 6 }} />
      </LineChart>
    </ResponsiveContainer>
  );
}
