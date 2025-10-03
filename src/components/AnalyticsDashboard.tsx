'use client';

import { useMemo } from 'react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { useBilling } from '@/context/BillingContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { TrendingUp, Star } from 'lucide-react';
import type { BillItem } from '@/lib/types';

interface ProductSales {
  name: string;
  total: number;
}

export default function AnalyticsDashboard() {
  const { history } = useBilling();

  const { topProducts, highestSeller } = useMemo(() => {
    if (history.length === 0) {
      return { topProducts: [], highestSeller: null };
    }

    const productSales: { [key: string]: number } = {};

    history.forEach(bill => {
      bill.items.forEach((item: BillItem) => {
        const name = item.name.trim();
        if (productSales[name]) {
          productSales[name] += item.lineTotal || 0;
        } else {
          productSales[name] = item.lineTotal || 0;
        }
      });
    });

    const sortedProducts: ProductSales[] = Object.entries(productSales)
      .map(([name, total]) => ({ name, total: parseFloat(total.toFixed(2)) }))
      .sort((a, b) => b.total - a.total);

    const highestSeller = sortedProducts.length > 0 ? sortedProducts[0] : null;

    return { topProducts: sortedProducts.slice(0, 5), highestSeller };
  }, [history]);

  if (history.length === 0) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2">
                <TrendingUp /> Sales Analytics
                </CardTitle>
                <CardDescription>Insights from your billing history.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="text-center py-10 border-2 border-dashed rounded-lg">
                    <p className="text-muted-foreground">No sales data yet.</p>
                    <p className="text-sm text-muted-foreground">Save some bills to see your sales analytics.</p>
                </div>
            </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline flex items-center gap-2">
            <TrendingUp /> Sales Analytics
        </CardTitle>
        <CardDescription>Your top-selling products based on revenue.</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topProducts} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
              <XAxis
                dataKey="name"
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `₹${value}`}
              />
              <Tooltip
                cursor={{ fill: 'hsl(var(--secondary))', radius: 8 }}
                content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                        return (
                        <div className="bg-background border rounded-lg p-2 shadow-sm">
                            <p className="font-bold">{payload[0].payload.name}</p>
                            <p className="text-primary">Total Revenue: ₹{payload[0].value}</p>
                        </div>
                        );
                    }
                    return null;
                }}
              />
              <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-col items-center justify-center bg-muted/50 p-6 rounded-lg">
            <Star className="h-10 w-10 text-yellow-400 mb-4" />
            <h3 className="text-lg font-headline font-semibold text-center">Top Seller Recommendation</h3>
            {highestSeller ? (
                <>
                    <p className="text-center text-muted-foreground text-sm mt-2">
                        Your highest-selling product is <span className="font-bold text-primary">{highestSeller.name}</span>.
                    </p>
                    <p className="text-center text-muted-foreground text-sm mt-1">Consider keeping it well-stocked!</p>
                </>
            ) : (
                <p className="text-center text-muted-foreground text-sm mt-2">
                    No sales data available to make a recommendation.
                </p>
            )}
        </div>
      </CardContent>
    </Card>
  );
}
