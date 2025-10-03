export interface BillItem {
  id: string;
  name: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  lineTotal: number;
}

export interface Bill {
  id: string;
  ownerName: string;
  items: BillItem[];
  totalAmount: number;
  createdAt: string;
}
