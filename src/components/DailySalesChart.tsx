'use client';

import { useMemo } from 'react';
import { useBilling } from '@/context/BillingContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

export default function DailySalesChart() {
  const { history } = useBilling();

  const dailySales = useMemo(() => {
    const salesByDay: { [key: string]: number } = {};

    history.forEach(bill => {
      const day = format(new Date(bill.createdAt), 'yyyy-MM-dd');
      if (!salesByDay[day]) {
        salesByDay[day] = 0;
      }
      salesByDay[day] += bill.totalAmount;
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
        <div className="flex h-[350px] w-full items-center justify-center">
            <p className="text-muted-foreground">Not enough data for sales trend.</p>
        </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={350}>
      <LineChart data={dailySales}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis 
            dataKey="date" 
            tickFormatter={(str) => format(new Date(str), 'MMM d')}
        />
        <YAxis />
        <Tooltip formatter={(value: number) => `₹${value.toFixed(2)}`} />
        <Legend />
        <Line type="monotone" dataKey="sales" stroke="var(--color-primary)" name="Total Sales" />
      </LineChart>
    </ResponsiveContainer>
  );
}
