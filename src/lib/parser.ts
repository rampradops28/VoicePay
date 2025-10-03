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
  ml: 'ml',
  millilitre: 'ml',
  milliliter: 'ml',
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

  // Rule: "clear bill" or "reset bill"
  if (cmd.includes('clear bill') || cmd.includes('reset bill')) {
    return { action: 'reset', payload: null };
  }

  // Rule: "What's the total?" or "save bill" or "kanak"
  if (cmd.includes('total') || cmd.includes('save bill') || cmd.includes('kanak')) {
    return { action: 'calculate', payload: null };
  }

  // Flexible Add command regex: "add <item> <quantity/price> <price/quantity>"
  const addRegex = /^add\s+(.+)/i;
  const addMatch = cmd.match(addRegex);

  if (addMatch) {
    let content = addMatch[1];
    let price: number | null = null;
    let quantity: number | null = null;
    let unit: string = '';

    // Regex for price: (rs 50) or (50 rs) or (50rs) or (50 rupees)
    const priceRegex = /(?:rs|rupees)\s*(\d+(\.\d+)?)|(\d+(\.\d+)?)\s*(?:rs|rupees)/i;
    const priceMatch = content.match(priceRegex);

    if (priceMatch) {
      price = parseFloat(priceMatch[1] || priceMatch[3]);
      content = content.replace(priceRegex, '').trim();
    }

    // Regex for quantity and unit: (2 kg) or (2kg)
    const qtyUnitRegex = /(\d+(\.\d+)?)\s*(kg|kilos?|kilograms?|g|grams?|ltr|litres?|liters?|pcs|pieces?|ml|millilitre|milliliter)\b/i;
    const qtyUnitMatch = content.match(qtyUnitRegex);
    
    if (qtyUnitMatch) {
      quantity = parseFloat(qtyUnitMatch[1]);
      unit = normalizeUnit(qtyUnitMatch[3]);
      content = content.replace(qtyUnitRegex, '').trim();
    }

    // If quantity is still null, look for a standalone number that could be quantity
    if (quantity === null) {
      const standaloneQtyRegex = /\b(\d+(\.\d+)?)\b(?!s*rs|s*rupees)/i;
      const standaloneQtyMatch = content.match(standaloneQtyRegex);
      if (standaloneQtyMatch) {
        quantity = parseFloat(standaloneQtyMatch[1]);
        content = content.replace(standaloneQtyRegex, '').trim();
      }
    }
    
    // If price is still null, look for a standalone number that could be price
    if (price === null) {
      const standalonePriceRegex = /(\d+(\.\d+)?)/;
      const standalonePriceMatch = content.match(standalonePriceRegex);
      if(standalonePriceMatch){
        price = parseFloat(standalonePriceMatch[1]);
        content = content.replace(standalonePriceRegex, '').trim();
      }
    }
    
    const itemName = content.replace(/\s+/g, ' ').trim();

    if (itemName && quantity !== null && price !== null) {
      return {
        action: 'add',
        payload: {
          item: itemName,
          quantity: quantity,
          unit: unit || 'pcs', // Default to 'pcs' if no unit was parsed
          price: price / quantity, // Calculate unit price from total price
        },
      };
    }
  }

  return null;
};
