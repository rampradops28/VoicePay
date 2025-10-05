
'use client';

import { useState, useMemo } from 'react';
import Header from '@/components/Header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { groceryCategories } from '@/lib/grocery-data';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

export default function ProductsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredCategories = useMemo(() => {
    if (!searchTerm) {
      // Sort items within each category
      const sortedCategories: { [key: string]: string[] } = {};
      for (const category in groceryCategories) {
        sortedCategories[category] = [...groceryCategories[category]].sort();
      }
      return sortedCategories;
    }

    const filtered: { [key: string]: string[] } = {};
    for (const category in groceryCategories) {
      const items = groceryCategories[category].filter(item =>
        item.toLowerCase().includes(searchTerm.toLowerCase())
      );
      if (items.length > 0) {
        filtered[category] = items.sort();
      }
    }
    return filtered;
  }, [searchTerm]);

  const categoryKeys = Object.keys(filteredCategories);

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow container mx-auto p-4 sm:p-6 md:p-8">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Product Catalog</CardTitle>
            <CardDescription>A categorized list of all recognizable grocery items.</CardDescription>
            <div className="pt-4">
              <Input
                placeholder="Search all products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </CardHeader>
          <CardContent>
            {categoryKeys.length > 0 ? (
                <ScrollArea className="h-[60vh] w-full rounded-md border">
                    <div className="p-4">
                        <Accordion type="multiple" defaultValue={categoryKeys} className="w-full">
                            {categoryKeys.map(category => (
                                <AccordionItem value={category} key={category}>
                                    <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                                        {category}
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 pt-2">
                                            {filteredCategories[category].map(item => (
                                                <div key={item} className="p-3 bg-muted/50 rounded-md text-sm capitalize text-center border">
                                                    {item}
                                                </div>
                                            ))}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
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
