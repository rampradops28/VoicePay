'use client';

import { createContext, useContext, useReducer, ReactNode, useEffect, useCallback } from 'react';
import { BillItem, Bill } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface BillingState {
  shopName: string;
  items: BillItem[];
  history: Bill[];
  totalAmount: number;
}

type Action =
  | { type: 'SET_SHOP_NAME'; payload: string }
  | { type: 'ADD_ITEM'; payload: Omit<BillItem, 'id' | 'lineTotal'> }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'RESET_BILL' }
  | { type: 'SAVE_BILL' }
  | { type: 'HYDRATE_STATE'; payload: Partial<BillingState> }
  | { type: 'CALCULATE_TOTAL' };

const initialState: BillingState = {
  shopName: '',
  items: [],
  history: [],
  totalAmount: 0,
};

const billingReducer = (state: BillingState, action: Action): BillingState => {
  switch (action.type) {
    case 'SET_SHOP_NAME':
      return { ...state, shopName: action.payload };
    case 'ADD_ITEM': {
      const newItem: BillItem = {
        ...action.payload,
        id: new Date().toISOString() + Math.random(),
        lineTotal: parseFloat((action.payload.quantity * (action.payload.unitPrice || 0)).toFixed(2)),
      };
      const newItems = [...state.items, newItem];
      const newTotal = newItems.reduce((acc, item) => acc + (item.lineTotal || 0), 0);
      return { ...state, items: newItems, totalAmount: newTotal };
    }
    case 'REMOVE_ITEM': {
      const itemNameLower = action.payload.toLowerCase();
      const newItems = state.items.filter(item => item.name && item.name.toLowerCase() !== itemNameLower);
      const newTotal = newItems.reduce((acc, item) => acc + (item.lineTotal || 0), 0);
      return { ...state, items: newItems, totalAmount: newTotal };
    }
    case 'RESET_BILL':
      return { ...state, items: [], totalAmount: 0 };
    case 'SAVE_BILL': {
      if (state.items.length === 0) return state;
      const newBill: Bill = {
        id: new Date().toISOString(),
        shopName: state.shopName,
        items: [...state.items],
        totalAmount: state.totalAmount,
        createdAt: new Date().toISOString(),
      };
      return {
        ...state,
        items: [],
        totalAmount: 0,
        history: [newBill, ...state.history],
      };
    }
    case 'HYDRATE_STATE': {
      const hydratedState = { ...initialState, ...action.payload };
      // Clear items on hydration/refresh to prevent carrying over an unfinished bill
      hydratedState.items = [];
      hydratedState.totalAmount = 0;
       // Ensure hydrated history items have lineTotal calculated
      const hydratedHistory = hydratedState.history?.map(bill => ({
        ...bill,
        items: bill.items.map(item => ({
          ...item,
          lineTotal: parseFloat(((item.quantity || 0) * (item.unitPrice || 0)).toFixed(2))
        }))
      })) || [];
      return { ...state, ...hydratedState, history: hydratedHistory };
    }
    case 'CALCULATE_TOTAL': {
        const total = state.items.reduce((acc, item) => acc + (item.lineTotal || 0), 0);
        return { ...state, totalAmount: parseFloat(total.toFixed(2)) };
    }
    default:
      return state;
  }
};

interface BillingContextType extends BillingState {
  setShopName: (name: string) => void;
  addItem: (item: Omit<BillItem, 'id' | 'lineTotal'>) => void;
  removeItem: (itemName: string) => void;
  resetBill: () => void;
  saveBill: () => void;
}

const BillingContext = createContext<BillingContextType | undefined>(undefined);

export const BillingProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(billingReducer, initialState);
  const { toast } = useToast();

  useEffect(() => {
    try {
      const storedState = localStorage.getItem('billingState');
      if (storedState) {
        dispatch({ type: 'HYDRATE_STATE', payload: JSON.parse(storedState) });
      }
    } catch (error) {
      console.error('Failed to load state from localStorage', error);
    }
  }, []);

  useEffect(() => {
    try {
      // Create a state object for storage without the 'items' to avoid persisting unfinished bills
      const stateToStore = {
        shopName: state.shopName,
        history: state.history,
      };
      localStorage.setItem('billingState', JSON.stringify(stateToStore));
    } catch (error) {
      console.error('Failed to save state to localStorage', error);
    }
  }, [state.shopName, state.history]);

  const setShopName = (name: string) => dispatch({ type: 'SET_SHOP_NAME', payload: name });
  
  const addItem = (item: Omit<BillItem, 'id' | 'lineTotal'>) => {
    dispatch({ type: 'ADD_ITEM', payload: item });
    toast({
      title: 'Item Added',
      description: `${item.quantity}${item.unit} ${item.name} for ₹${item.unitPrice}`,
    });
  };

  const removeItem = (itemName: string) => {
    if (!itemName) return;
    const itemExists = state.items.some(i => i.name && i.name.toLowerCase() === itemName.toLowerCase());
    if (itemExists) {
        dispatch({ type: 'REMOVE_ITEM', payload: itemName });
        toast({
            title: 'Item Removed',
            description: `${itemName} has been removed from the bill.`,
        });
    } else {
        toast({
            variant: 'destructive',
            title: 'Item Not Found',
            description: `Could not find "${itemName}" in the current bill.`,
        });
    }
  };

  const resetBill = useCallback(() => {
    if (state.items.length > 0) {
      dispatch({ type: 'RESET_BILL' });
      toast({
          title: 'Bill Cleared',
          description: 'The current bill has been reset.',
      });
    }
  }, [toast, state.items.length]);
  
  const saveBill = useCallback(() => {
    if (state.items.length > 0) {
        dispatch({ type: 'SAVE_BILL' });
        toast({
            title: 'Bill Saved & Reset',
            description: 'The current bill has been saved to history and a new bill has been started.',
        });
    } else {
        toast({
            variant: 'destructive',
            title: 'Cannot Save Empty Bill',
            description: 'Add items before saving.',
        });
    }
  }, [state.items.length, toast]);

  return (
    <BillingContext.Provider value={{ ...state, setShopName, addItem, removeItem, resetBill, saveBill }}>
      {children}
    </BillingContext.Provider>
  );
};

export const useBilling = () => {
  const context = useContext(BillingContext);
  if (context === undefined) {
    throw new Error('useBilling must be used within a BillingProvider');
  }
  return context;
};
