'use client';

import { useState, useMemo } from 'react';
import Header from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { groceryItems } from '@/lib/grocery-data';
import { ScrollArea } from '@/components/ui/scroll-area';

export default function ProductsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  
  const productList = useMemo(() => Array.from(groceryItems).sort(), []);

  const filteredItems = useMemo(() => {
    if (!searchTerm) return productList;
    return productList.filter(item =>
      item.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, productList]);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto p-4 sm:p-6 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Product Catalog</CardTitle>
            <CardDescription>A list of all recognizable grocery items.</CardDescription>
            <div className="pt-4">
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            {filteredItems.length > 0 ? (
                <ScrollArea className="h-96 w-full rounded-md border">
                    <div className="p-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                    {filteredItems.map(item => (
                        <div key={item} className="p-3 bg-muted/50 rounded-md text-sm capitalize">
                            {item}
                        </div>
                    ))}
                    </div>
                </ScrollArea>
            ) : (
                <div className="text-center py-10 border-2 border-dashed rounded-lg">
                    <p className="text-muted-foreground">No products found matching your search.</p>
                </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
