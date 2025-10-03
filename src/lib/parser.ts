export type ParsedCommand =
  | { action: 'add'; payload: { item: string; quantity: number; unit: string; price: number } }
  | { action: 'remove'; payload: { item: string } }
  | { action: 'calculate' | 'reset'; payload: null };

const unitMap: { [key: string]: string } = {
  kilo: 'kg',
  kilogram: 'kg',
  kilograms: 'kg',
  piece: 'pcs',
  pieces: 'pcs',
  litre: 'ltr',
  liter: 'ltr',
  liters: 'ltr',
  gram: 'g',
  grams: 'g',
};

const normalizeUnit = (unit: string): string => {
  if (!unit) return '';
  const lowerUnit = unit.toLowerCase();
  return unitMap[lowerUnit] || lowerUnit;
};

export const parseCommand = (command: string): ParsedCommand | null => {
  const cmd = command.toLowerCase().trim();

  // Rule: "remove <item>"
  const removeRegex = /^(?:remove|delete|cancel)\s+(.+)$/i;
  const removeMatch = cmd.match(removeRegex);
  if (removeMatch) {
    return {
      action: 'remove',
      payload: {
        item: removeMatch[1].trim(),
      },
    };
  }

  // Rule: "calculate total" or "kanak" or "total"
  if (cmd === 'calculate total' || cmd === 'kanak' || cmd === 'total' || cmd === 'calculate') {
    return { action: 'calculate', payload: null };
  }

  // Rule: "reset bill" or "reset"
  if (cmd === 'reset bill' || cmd === 'reset') {
    return { action: 'reset', payload: null };
  }

  // Flexible "add" command parsing
  const addRegex = /^(?:add|ad)\s+(.+)/i;
  const addMatch = cmd.match(addRegex);

  if (addMatch) {
    let content = addMatch[1];
    
    // 1. Extract price
    const priceRegex = /(\d+(\.\d+)?)\s*(?:rs|rupees)\b/i;
    const priceMatch = content.match(priceRegex);
    let price: number | null = null;
    if (priceMatch) {
      price = parseFloat(priceMatch[1]);
      content = content.replace(priceMatch[0], '').trim();
    }

    // 2. Extract quantity and unit
    const qtyUnitRegex = /(\d+(\.\d+)?)\s*(kg|kilos?|kilograms?|g|grams?|ltr|litres?|liters?|pcs|pieces?)\b/i;
    const qtyUnitMatch = content.match(qtyUnitRegex);
    let quantity: number | null = null;
    let unit: string = '';
    if (qtyUnitMatch) {
        quantity = parseFloat(qtyUnitMatch[1]);
        unit = normalizeUnit(qtyUnitMatch[3]);
        content = content.replace(qtyUnitMatch[0], '').trim();
    }

    // 3. The rest is the item name. Handle numbers that might be quantity or part of the item name.
    const parts = content.split(/\s+/).filter(Boolean);
    const itemParts: string[] = [];

    for (const part of parts) {
        // If quantity is still missing, and we haven't found a price yet, a standalone number is likely the quantity
        if (quantity === null && /^\d+(\.\d+)?$/.test(part) && price === null) {
            quantity = parseFloat(part);
        } 
        // If price is missing, a standalone number is likely the price
        else if (price === null && /^\d+(\.\d+)?$/.test(part)) {
            price = parseFloat(part);
        }
        else {
            itemParts.push(part);
        }
    }

    const itemName = itemParts.join(' ').trim();

    if (itemName && quantity !== null && price !== null) {
      return {
        action: 'add',
        payload: {
          item: itemName,
          quantity: quantity,
          unit: unit || 'pcs', // Default to 'pcs' if no unit is specified
          price: price,
        },
      };
    }
  }

  return null;
};
