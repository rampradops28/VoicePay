'use client';

import { useMemo } from 'react';
import { useBilling } from '@/context/BillingContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, Receipt, ShoppingBag, Star } from 'lucide-react';

export default function AnalyticsDashboard() {
  const { history } = useBilling();

  const analytics = useMemo(() => {
    if (history.length === 0) {
      return {
        totalRevenue: 0,
        totalBills: 0,
        averageBillValue: 0,
        topSellingProducts: [],
      };
    }

    const totalRevenue = history.reduce((acc, bill) => acc + bill.totalAmount, 0);
    const totalBills = history.length;
    const averageBillValue = totalRevenue / totalBills;

    const productSales: { [key: string]: { revenue: number; quantity: number, unit: string } } = {};

    history.forEach(bill => {
      bill.items.forEach(item => {
        const key = item.name.toLowerCase();
        
        if (!productSales[key]) {
          productSales[key] = { revenue: 0, quantity: 0, unit: item.unit };
        }
        productSales[key].revenue += item.lineTotal;
        productSales[key].quantity += item.quantity;
      });
    });
    
    const topSellingProducts = Object.entries(productSales)
      .map(([name, data]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        revenue: data.revenue,
        quantity: data.quantity,
        unit: data.unit,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return {
      totalRevenue,
      totalBills,
      averageBillValue,
      topSellingProducts,
    };
  }, [history]);

  if (history.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Today's Sales Analytics</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-10 border-2 border-dashed rounded-lg">
            <p className="text-muted-foreground">No sales data for today yet.</p>
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
                    <p className="text-xs text-muted-foreground">from {analytics.totalBills} bills today</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Bills</CardTitle>
                    <Receipt className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{analytics.totalBills}</div>
                     <p className="text-xs text-muted-foreground">bills processed today</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Avg. Bill Value</CardTitle>
                    <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">Rs {analytics.averageBillValue.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">average across all bills</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Top Product</CardTitle>
                    <Star className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">{analytics.topSellingProducts[0]?.name || 'N/A'}</div>
                    <p className="text-xs text-muted-foreground">by revenue today</p>
                </CardContent>
            </Card>
        </div>

        <Card>
            <CardHeader>
                <CardTitle>Today's Top 5 Products</CardTitle>
                <CardDescription>
                    Your best-selling items for today, ranked by revenue.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[50%]">Product</TableHead>
                            <TableHead className="text-center">Total Quantity Sold</TableHead>
                            <TableHead className="text-right">Total Revenue</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {analytics.topSellingProducts.map((product) => (
                            <TableRow key={product.name}>
                                <TableCell className="font-medium">{product.name}</TableCell>
                                <TableCell className="text-center">{product.quantity} {product.unit}</TableCell>
                                <TableCell className="text-right">Rs {product.revenue.toFixed(2)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    </div>
  );
}
