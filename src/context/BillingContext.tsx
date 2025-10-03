'use client';

import { createContext, useContext, useReducer, ReactNode, useEffect, useCallback, useState } from 'react';
import { BillItem, Bill } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface BillingState {
  ownerName: string;
  items: BillItem[];
  history: Bill[];
  totalAmount: number;
  isVoiceEnrolled: boolean;
}

type Action =
  | { type: 'SET_OWNER_NAME'; payload: string }
  | { type: 'ADD_ITEM'; payload: Omit<BillItem, 'id' | 'lineTotal'> }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'RESET_BILL' }
  | { type: 'SAVE_BILL' }
  | { type: 'DELETE_BILL'; payload: string }
  | { type: 'HYDRATE_STATE'; payload: Partial<BillingState> }
  | { type: 'CALCULATE_TOTAL' }
  | { type: 'ENROLL_VOICE' };

const initialState: BillingState = {
  ownerName: '',
  items: [],
  history: [],
  totalAmount: 0,
  isVoiceEnrolled: false,
};

const billingReducer = (state: BillingState, action: Action): BillingState => {
  switch (action.type) {
    case 'SET_OWNER_NAME':
      return { ...state, ownerName: action.payload };
    case 'ENROLL_VOICE':
      return { ...state, isVoiceEnrolled: true };
    case 'ADD_ITEM': {
      const { name, quantity, unit, unitPrice } = action.payload;
      const existingItemIndex = state.items.findIndex(
        item => item.name.toLowerCase() === name.toLowerCase()
      );

      let newItems;

      if (existingItemIndex > -1) {
        // Item exists, update it
        newItems = state.items.map((item, index) => {
          if (index === existingItemIndex) {
            const newQuantity = item.quantity + quantity;
            return {
              ...item,
              quantity: newQuantity,
              unitPrice: unitPrice, // Update to the latest price
              lineTotal: parseFloat((newQuantity * unitPrice).toFixed(2)),
            };
          }
          return item;
        });
      } else {
        // Item doesn't exist, add it
        const newItem: BillItem = {
          id: new Date().toISOString() + Math.random(),
          name: name,
          quantity: quantity,
          unit: unit,
          unitPrice: unitPrice,
          lineTotal: parseFloat((quantity * unitPrice).toFixed(2)),
        };
        newItems = [...state.items, newItem];
      }
      
      const newTotal = newItems.reduce((acc, item) => acc + (item.lineTotal || 0), 0);
      return { ...state, items: newItems, totalAmount: newTotal };
    }
    case 'REMOVE_ITEM': {
      const itemNameLower = action.payload.toLowerCase();
      const newItems = state.items.filter(item => item.name.toLowerCase() !== itemNameLower);
      const newTotal = newItems.reduce((acc, item) => acc + (item.lineTotal || 0), 0);
      return { ...state, items: newItems, totalAmount: newTotal };
    }
    case 'RESET_BILL':
      return { ...state, items: [], totalAmount: 0 };
    case 'SAVE_BILL': {
      if (state.items.length === 0) return state;
      const newBill: Bill = {
        id: new Date().toISOString(),
        ownerName: state.ownerName,
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
    case 'DELETE_BILL': {
      const updatedHistory = state.history.filter(bill => bill.id !== action.payload);
      return { ...state, history: updatedHistory };
    }
    case 'HYDRATE_STATE': {
      const payload = action.payload;
      const hydratedHistory = payload.history?.map(bill => ({
        ...bill,
        items: bill.items.map(item => ({
          ...item,
          lineTotal: parseFloat(((item.quantity || 0) * (item.unitPrice || 0)).toFixed(2))
        })),
        // Ensure totalAmount is a number
        totalAmount: typeof bill.totalAmount === 'number' ? bill.totalAmount : 0
      })) || [];
      
      return { 
        ...state, 
        ownerName: payload.ownerName || '',
        history: hydratedHistory,
        isVoiceEnrolled: payload.isVoiceEnrolled || false,
        // Don't hydrate current bill, start fresh
        items: [],
        totalAmount: 0,
      };
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
  isLoading: boolean;
  setOwnerName: (name: string) => void;
  addItem: (item: Omit<BillItem, 'id' | 'lineTotal'>) => void;
  removeItem: (itemName: string) => void;
  resetBill: () => void;
  saveBill: () => void;
  deleteBill: (billId: string) => void;
  enrollVoice: () => void;
}

const BillingContext = createContext<BillingContextType | undefined>(undefined);

export const BillingProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(billingReducer, initialState);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);

  // Effect to load state from localStorage on initial render
  useEffect(() => {
    setIsLoading(true);
    try {
      const storedState = localStorage.getItem('billingState');
      if (storedState) {
        dispatch({ type: 'HYDRATE_STATE', payload: JSON.parse(storedState) });
      }
    } catch (error) {
      console.error('Failed to load state from localStorage', error);
    } finally {
        setIsLoading(false);
    }
  }, []);

  // Effect to save state to localStorage whenever it changes
  useEffect(() => {
    // Only save when not loading to avoid writing initial state over hydrated state
    if (!isLoading) {
      try {
        const stateToStore = {
          ownerName: state.ownerName,
          history: state.history,
          isVoiceEnrolled: state.isVoiceEnrolled,
        };
        localStorage.setItem('billingState', JSON.stringify(stateToStore));
      } catch (error) {
        console.error('Failed to save state to localStorage', error);
      }
    }
  }, [state.ownerName, state.history, state.isVoiceEnrolled, isLoading]);

  const setOwnerName = (name: string) => {
    dispatch({ type: 'SET_OWNER_NAME', payload: name });
  };
  
  const enrollVoice = () => dispatch({ type: 'ENROLL_VOICE' });

  const addItem = (item: Omit<BillItem, 'id' | 'lineTotal'>) => {
    const existingItem = state.items.find(
      i => i.name.toLowerCase() === item.name.toLowerCase()
    );
    
    dispatch({ type: 'ADD_ITEM', payload: item });
    
    if (existingItem) {
        toast({
            title: 'Item Updated',
            description: `${item.name}'s quantity has been updated.`,
        });
    } else {
        toast({
            title: 'Item Added',
            description: `${item.quantity}${item.unit} ${item.name} for Rs ${item.unitPrice.toFixed(2)} per ${item.unit}`,
        });
    }
  };

  const removeItem = (itemName: string) => {
    if (!itemName) return;
    const itemNameLower = itemName.toLowerCase();
    const itemExists = state.items.some(i => i.name.toLowerCase() === itemNameLower);
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

  const deleteBill = (billId: string) => {
    dispatch({ type: 'DELETE_BILL', payload: billId });
  };

  const value = {
      ...state,
      isLoading,
      setOwnerName,
      addItem,
      removeItem,
      resetBill,
      saveBill,
      deleteBill,
      enrollVoice,
  };

  return (
    <BillingContext.Provider value={value}>
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
