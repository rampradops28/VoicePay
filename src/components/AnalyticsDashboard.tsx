'use client';

import { useMemo } from 'react';
import { useBilling } from '@/context/BillingContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { DollarSign, Receipt, ShoppingBag, Star, TrendingUp } from 'lucide-react';
import DailySalesChart from './DailySalesChart';
import { isToday } from 'date-fns';

export default function AnalyticsDashboard() {
  const { history } = useBilling();

  const analytics = useMemo(() => {
    const todaysHistory = history.filter(bill => isToday(new Date(bill.createdAt)));

    if (todaysHistory.length === 0) {
      return {
        totalRevenue: 0,
        totalBills: 0,
        averageBillValue: 0,
        topSellingProducts: [],
        hasHistory: history.length > 0
      };
    }

    const totalRevenue = todaysHistory.reduce((acc, bill) => acc + bill.totalAmount, 0);
    const totalBills = todaysHistory.length;
    const averageBillValue = totalRevenue / totalBills;

    const productSales: { [key: string]: { revenue: number; quantity: number, unit: string } } = {};

    todaysHistory.forEach(bill => {
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
      hasHistory: history.length > 0,
    };
  }, [history]);

  if (analytics.totalBills === 0 && !analytics.hasHistory) {
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
                    <CardTitle className="text-sm font-medium">Today's Revenue</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">Rs {analytics.totalRevenue.toFixed(2)}</div>
                    <p className="text-xs text-muted-foreground">from {analytics.totalBills} bills today</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Today's Bills</CardTitle>
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
                    <p className="text-xs text-muted-foreground">average for today's bills</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Today's Top Product</CardTitle>
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
              <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  <CardTitle>Daily Sales Trend</CardTitle>
              </div>
              <CardDescription>A chart of your total sales revenue over time.</CardDescription>
          </CardHeader>
          <CardContent>
              <DailySalesChart />
          </CardContent>
        </Card>

        {analytics.topSellingProducts.length > 0 && (
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
        )}
    </div>
  );
}
