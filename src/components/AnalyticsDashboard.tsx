'use client';

import { useMemo } from 'react';
import { useBilling } from '@/context/BillingContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { DollarSign, Receipt, ShoppingBag, Star } from 'lucide-react';
import DailySalesChart from './DailySalesChart';

export default function AnalyticsDashboard() {
  const { history } = useBilling();

  const analytics = useMemo(() => {
    if (history.length === 0) {
      return {
        totalRevenue: 0,
        totalBills: 0,
        averageBillValue: 0,
        topSellingProducts: [],
        topProductWithProof: null,
      };
    }

    const totalRevenue = history.reduce((acc, bill) => acc + bill.totalAmount, 0);
    const totalBills = history.length;
    const averageBillValue = totalRevenue / totalBills;

    const productSales: { [key: string]: { revenue: number; quantity: number, transactions: any[] } } = {};

    history.forEach(bill => {
      bill.items.forEach(item => {
        // Normalize item name by taking the first word. This groups "sugar" and "sugar packet".
        const normalizedName = item.name.split(' ')[0];
        const key = normalizedName.toLowerCase();
        
        if (!productSales[key]) {
          productSales[key] = { revenue: 0, quantity: 0, transactions: [] };
        }
        productSales[key].revenue += item.lineTotal;
        productSales[key].quantity += item.quantity;
        productSales[key].transactions.push({
            date: bill.createdAt,
            quantity: item.quantity,
            unit: item.unit,
            total: item.lineTotal,
        });
      });
    });
    
    const topSellingProducts = Object.entries(productSales)
      .map(([name, data]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        revenue: data.revenue,
        quantity: data.quantity,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    let topProductWithProof = null;
    if (topSellingProducts.length > 0) {
        const topProduct = topSellingProducts[0];
        topProductWithProof = {
            ...topProduct,
            transactions: productSales[topProduct.name.toLowerCase()].transactions.slice(0, 5),
        }
    }


    return {
      totalRevenue,
      totalBills,
      averageBillValue,
      topSellingProducts,
      topProductWithProof,
    };
  }, [history]);

  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sales Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-10 border-2 border-dashed rounded-lg">
            <p className="text-muted-foreground">No sales data yet.</p>
            <p className="text-sm text-muted-foreground">Complete some bills to see your analytics.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">Rs {analytics.totalRevenue.toFixed(2)}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Bills</CardTitle>
                    <Receipt className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{analytics.totalBills}</div>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg. Bill Value</CardTitle>
                    <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">Rs {analytics.averageBillValue.toFixed(2)}</div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Top Product</CardTitle>
                    <Star className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{analytics.topSellingProducts[0]?.name || 'N/A'}</div>
                </CardContent>
            </Card>
        </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader>
            <CardTitle>Top 5 Selling Products (by Revenue)</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={analytics.topSellingProducts}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} interval={0} />
                <YAxis />
                <Tooltip formatter={(value: number) => `Rs ${value.toFixed(2)}`} />
                <Legend />
                <Bar dataKey="revenue" fill="hsl(var(--primary))" name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
        <Card className="lg:col-span-3">
           <CardHeader>
            <CardTitle>Daily Sales Trend</CardTitle>
          </CardHeader>
           <CardContent>
            <DailySalesChart />
           </CardContent>
        </Card>
      </div>
      
      {analytics.topProductWithProof && (
        <Card>
            <CardHeader>
                <CardTitle>Proof for Top Seller: {analytics.topProductWithProof.name}</CardTitle>
                <CardDescription>
                    This product has generated Rs {analytics.topProductWithProof.revenue.toFixed(2)} from {analytics.topProductWithProof.quantity} units sold. Here are some recent transactions.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead className="text-right">Quantity</TableHead>
                            <TableHead className="text-right">Total Sale</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {analytics.topProductWithProof.transactions.map((t: any, i: number) => (
                            <TableRow key={i}>
                                <TableCell>{new Date(t.date).toLocaleDateString()}</TableCell>
                                <TableCell className="text-right">{t.quantity} {t.unit}</TableCell>
                                <TableCell className="text-right">Rs {t.total.toFixed(2)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
      )}

    </div>
  );
}
