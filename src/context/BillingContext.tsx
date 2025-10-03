'use client';

import { createContext, useContext, useReducer, ReactNode, useEffect, useCallback, useState } from 'react';
import { BillItem, Bill } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { textToSpeech } from '@/ai/flows/text-to-speech';

type Language = 'en-IN' | 'ta-IN';

interface AudioState {
    src: string;
    id: number;
}

interface BillingState {
  ownerName: string;
  items: BillItem[];
  history: Bill[];
  totalAmount: number;
  voiceprints: { [key: string]: boolean };
  language: Language;
  audio: AudioState | null;
  isSpeechEnabled: boolean;
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
  | { type: 'ENROLL_VOICE'; payload: string }
  | { type: 'REMOVE_VOICEPRINT'; payload: string }
  | { type: 'SET_LANGUAGE', payload: Language }
  | { type: 'SET_SPEECH_ENABLED', payload: boolean }
  | { type: 'SET_AUDIO', payload: AudioState }
  | { type: 'CLEAR_AUDIO' };

const initialState: BillingState = {
  ownerName: '',
  items: [],
  history: [],
  totalAmount: 0,
  voiceprints: {},
  language: 'en-IN',
  audio: null,
  isSpeechEnabled: true,
};

const billingReducer = (state: BillingState, action: Action): BillingState => {
  switch (action.type) {
    case 'SET_OWNER_NAME':
      return { ...state, ownerName: action.payload };
    case 'SET_LANGUAGE':
      return { ...state, language: action.payload };
    case 'SET_SPEECH_ENABLED':
      return { ...state, isSpeechEnabled: action.payload };
    case 'SET_AUDIO':
      return { ...state, audio: action.payload };
    case 'CLEAR_AUDIO':
      return { ...state, audio: null };
    case 'ENROLL_VOICE': {
        const newVoiceprints = { ...state.voiceprints, [action.payload]: true };
        return { ...state, voiceprints: newVoiceprints };
    }
    case 'REMOVE_VOICEPRINT': {
        const newVoiceprints = { ...state.voiceprints };
        delete newVoiceprints[action.payload];
        return { ...state, voiceprints: newVoiceprints };
    }
    case 'ADD_ITEM': {
      const { name, quantity, unit, unitPrice } = action.payload;
      const existingItemIndex = state.items.findIndex(
        (item) => item.name.toLowerCase() === name.toLowerCase()
      );

      let newItems;

      if (existingItemIndex !== -1) {
        // Item exists, so we replace it.
        newItems = [...state.items];
        newItems[existingItemIndex] = {
          ...newItems[existingItemIndex],
          quantity,
          unit,
          unitPrice,
          lineTotal: parseFloat((quantity * unitPrice).toFixed(2)),
        };
      } else {
        // It's a new item, add it to the list.
        const newItem: BillItem = {
          id: new Date().toISOString() + Math.random(),
          name,
          quantity,
          unit,
          unitPrice,
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
        totalAmount: typeof bill.totalAmount === 'number' ? bill.totalAmount : 0
      })) || [];
      
      return { 
        ...state, 
        ownerName: payload.ownerName || '',
        history: hydratedHistory,
        voiceprints: payload.voiceprints || {},
        language: payload.language || 'en-IN',
        isSpeechEnabled: payload.isSpeechEnabled !== false, // default to true
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
  enrollVoice: (ownerName: string) => void;
  removeVoiceprint: (ownerName: string) => void;
  setLanguage: (language: Language) => void;
  setSpeechEnabled: (enabled: boolean) => void;
  speak: (text: string) => void;
  clearAudio: () => void;
}

const BillingContext = createContext<BillingContextType | undefined>(undefined);

export const BillingProvider = ({ children }: { children: ReactNode }) => {
  const [state, dispatch] = useReducer(billingReducer, initialState);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);

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

  useEffect(() => {
    if (!isLoading) {
      try {
        const stateToStore = {
          ownerName: state.ownerName,
          history: state.history,
          voiceprints: state.voiceprints,
          language: state.language,
          isSpeechEnabled: state.isSpeechEnabled,
        };
        localStorage.setItem('billingState', JSON.stringify(stateToStore));
      } catch (error) {
        console.error('Failed to save state to localStorage', error);
      }
    }
  }, [state.ownerName, state.history, state.voiceprints, state.language, state.isSpeechEnabled, isLoading]);

  const speak = useCallback(async (text: string) => {
    if (!state.isSpeechEnabled) return;
    try {
      const { audioDataUri } = await textToSpeech(text);
      if (audioDataUri) {
        dispatch({ type: 'SET_AUDIO', payload: { src: audioDataUri, id: Date.now() } });
      }
    } catch (error) {
      console.error("Failed to synthesize speech:", error);
    }
  }, [state.isSpeechEnabled]);

  const clearAudio = () => {
    dispatch({ type: 'CLEAR_AUDIO' });
  };

  const setOwnerName = (name: string) => {
    dispatch({ type: 'SET_OWNER_NAME', payload: name });
  };
  
  const enrollVoice = (ownerName: string) => {
    if (!ownerName) return;
    dispatch({ type: 'ENROLL_VOICE', payload: ownerName });
  };

  const removeVoiceprint = (ownerName: string) => {
    dispatch({ type: 'REMOVE_VOICEPRINT', payload: ownerName });
  };

  const setLanguage = (language: Language) => {
    dispatch({ type: 'SET_LANGUAGE', payload: language });
    toast({
        title: 'Language Updated',
        description: `Voice recognition language set to ${language === 'ta-IN' ? 'Tamil' : 'English'}.`,
    });
  };

  const setSpeechEnabled = (enabled: boolean) => {
    dispatch({ type: 'SET_SPEECH_ENABLED', payload: enabled });
     toast({
        title: 'Audio Feedback Updated',
        description: `Spoken confirmations have been ${enabled ? 'enabled' : 'disabled'}.`,
    });
  };

  const addItem = (item: Omit<BillItem, 'id' | 'lineTotal'>) => {
    const existingItem = state.items.find(
      i => i.name.toLowerCase() === item.name.toLowerCase()
    );
    
    dispatch({ type: 'ADD_ITEM', payload: item });
    
    if (existingItem) {
        toast({
            title: 'Item Updated',
            description: `${item.name} has been updated to ${item.quantity}${item.unit} at Rs ${item.unitPrice.toFixed(2)} each.`,
        });
        speak(`Updated ${item.name}.`);
    } else {
        toast({
            title: 'Item Added',
            description: `${item.quantity}${item.unit} ${item.name} for Rs ${item.unitPrice.toFixed(2)} per ${item.unit}`,
        });
        speak(`Added ${item.quantity} ${item.unit} of ${item.name}.`);
    }
  };

  const removeItem = (itemName: string) => {
    if (!itemName) return;
    const itemNameLower = itemName.toLowerCase();
    const itemExists = state.items.some(i => i.name.toLowerCase() === itemNameLower);
    
    if (itemExists) {
        dispatch({ type: 'REMOVE_ITEM', payload: itemNameLower });
        toast({
            title: 'Item Removed',
            description: `${itemName} has been removed from the bill.`,
        });
        speak(`Removed ${itemName}.`);
    } else {
        toast({
            variant: 'destructive',
            title: 'Item Not Found',
            description: `Could not find "${itemName}" in the current bill.`,
        });
        speak(`Could not find ${itemName}.`);
    }
  };

  const resetBill = useCallback(() => {
    dispatch({ type: 'RESET_BILL' });
    toast({
        title: 'Bill Cleared',
        description: 'The current bill has been reset.',
    });
    speak('Bill cleared.');
  }, [toast, speak]);
  
  const saveBill = useCallback(() => {
    if (state.items.length > 0) {
        dispatch({ type: 'SAVE_BILL' });
        toast({
            title: 'Bill Saved & Reset',
            description: 'The current bill has been saved to history and a new bill has been started.',
        });
        speak('Bill saved.');
    } else {
        toast({
            variant: 'destructive',
            title: 'Cannot Save Empty Bill',
            description: 'Add items before saving.',
        });
    }
  }, [state.items.length, toast, speak]);

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
      removeVoiceprint,
      setLanguage,
      setSpeechEnabled,
      speak,
      clearAudio,
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
