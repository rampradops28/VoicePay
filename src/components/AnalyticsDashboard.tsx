'use client';

import { useMemo } from 'react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, LineChart, Line, CartesianGrid } from 'recharts';
import { useBilling } from '@/context/BillingContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Star, IndianRupee, ScrollText, CheckCircle } from 'lucide-react';
import type { BillItem, Bill } from '@/lib/types';
import { format, parseISO } from 'date-fns';

interface ProductSales {
  name: string;
  total: number;
}

interface DailySales {
    date: string;
    total: number;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-background border rounded-lg p-2 shadow-sm">
        <p className="font-bold">{label}</p>
        <p className="text-primary">Total Revenue: ₹{payload[0].value}</p>
      </div>
    );
  }
  return null;
};


export default function AnalyticsDashboard() {
  const { history } = useBilling();

  const { 
    totalRevenue,
    totalBills,
    averageBillValue,
    topProducts, 
    highestSeller,
    dailySales,
    topSellerTransactions
   } = useMemo(() => {
    if (history.length === 0) {
      return { totalRevenue: 0, totalBills: 0, averageBillValue: 0, topProducts: [], highestSeller: null, dailySales: [], topSellerTransactions: [] };
    }

    const totalRevenue = history.reduce((acc, bill) => acc + (bill.totalAmount || 0), 0);
    const totalBills = history.length;
    const averageBillValue = totalBills > 0 ? totalRevenue / totalBills : 0;
    
    const productSales: { [key: string]: number } = {};
    history.forEach(bill => {
      bill.items.forEach((item: BillItem) => {
        const name = item.name.trim();
        productSales[name] = (productSales[name] || 0) + (item.lineTotal || 0);
      });
    });

    const sortedProducts: ProductSales[] = Object.entries(productSales)
      .map(([name, total]) => ({ name, total: parseFloat(total.toFixed(2)) }))
      .sort((a, b) => b.total - a.total);

    const highestSeller = sortedProducts.length > 0 ? sortedProducts[0] : null;

    const salesByDay: { [key: string]: number } = {};
    history.forEach(bill => {
        const day = format(parseISO(bill.createdAt), 'yyyy-MM-dd');
        salesByDay[day] = (salesByDay[day] || 0) + (bill.totalAmount || 0);
    });

    const dailySales: DailySales[] = Object.entries(salesByDay)
        .map(([date, total]) => ({ date: format(parseISO(date), 'MMM d'), total }))
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .slice(-30); // Last 30 days

    const topSellerTransactions = highestSeller ? history.filter(bill => 
        bill.items.some(item => item.name.trim() === highestSeller.name)
      ).slice(0, 5) : [];

    return { totalRevenue, totalBills, averageBillValue, topProducts: sortedProducts.slice(0, 5), highestSeller, dailySales, topSellerTransactions };
  }, [history]);

  if (history.length === 0) {
    return (
        <Card>
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2">
                 Sales Analytics
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
    <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <IndianRupee className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{totalRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">From {totalBills} bills</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Bills</CardTitle>
              <ScrollText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalBills}</div>
               <p className="text-xs text-muted-foreground">Completed transactions</p>
            </CardContent>
          </Card>
           <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Bill Value</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">₹{averageBillValue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Average per transaction</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                  <CardTitle className="font-headline">Daily Sales Trend</CardTitle>
                  <CardDescription>Revenue from the last 30 active days.</CardDescription>
              </CardHeader>
              <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={dailySales} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} />
                          <YAxis fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value}`} />
                          <Tooltip content={<CustomTooltip />} />
                          <Line type="monotone" dataKey="total" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4, fill: "hsl(var(--primary))" }} />
                      </LineChart>
                  </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-headline">Top Selling Products</CardTitle>
                <CardDescription>Your top 5 products by revenue.</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={topProducts} layout="vertical" margin={{ top: 5, right: 20, left: 40, bottom: 5 }}>
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={80} stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip cursor={{ fill: 'hsl(var(--secondary))' }} content={<CustomTooltip />} />
                    <Bar dataKey="total" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} background={{ fill: 'hsl(var(--muted))', radius: 4 }} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
        </div>

        <Card>
            <CardHeader>
                <CardTitle className="font-headline flex items-center gap-2">
                    <Star className="text-yellow-400"/> Top Seller Recommendation
                </CardTitle>
                <CardDescription>Analysis and proof for your best-performing item.</CardDescription>
            </CardHeader>
            <CardContent>
                {highestSeller ? (
                    <div className="grid md:grid-cols-2 gap-6">
                        <div className="flex flex-col items-center justify-center bg-muted/50 p-6 rounded-lg">
                            <h3 className="text-lg font-headline font-semibold text-center">Highest Revenue From</h3>
                            <p className="text-4xl font-bold text-primary my-4">{highestSeller.name}</p>
                            <p className="text-center text-muted-foreground text-sm">
                                Generated <span className="font-bold text-foreground">₹{highestSeller.total.toFixed(2)}</span> in total revenue. Consider keeping it well-stocked and prominently displayed!
                            </p>
                        </div>
                        <div>
                            <h4 className="font-semibold mb-2">Recent Transactions (Proof):</h4>
                            <ul className="space-y-2">
                                {topSellerTransactions.length > 0 ? topSellerTransactions.map(bill => (
                                    <li key={bill.id} className="text-sm p-2 border-l-2 border-primary bg-secondary/30 rounded-r-md">
                                        Bill from <span className="font-semibold">{format(parseISO(bill.createdAt), 'MMM d, h:mm a')}</span> included {bill.items.find(i => i.name === highestSeller.name)?.quantity}{bill.items.find(i => i.name === highestSeller.name)?.unit} of {highestSeller.name} for <span className="font-semibold">₹{bill.items.find(i => i.name === highestSeller.name)?.lineTotal.toFixed(2)}</span>
                                    </li>
                                )) : <p className="text-xs text-muted-foreground">No recent transactions found for this item.</p>}
                            </ul>
                        </div>
                    </div>
                ) : (
                    <p className="text-center text-muted-foreground py-4">No sales data available to make a recommendation.</p>
                )}
            </CardContent>
        </Card>
    </div>
  );
}
