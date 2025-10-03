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

  // Rule: "What's the total?" or "save bill"
  if (cmd.includes('total') || cmd.includes('save bill')) {
    return { action: 'calculate', payload: null };
  }

  // Rule: "Add {qty} {item} at {price} rupees" OR "Add {item} {qty}{unit} {price} rupees"
  const addRegex = /^add\s+(.+)/i;
  const addMatch = cmd.match(addRegex);
  if (addMatch) {
    let content = addMatch[1];

    // Extract price: "at X rupees" or just "X rupees"
    const priceRegex = /(?:at\s+)?(\d+(\.\d+)?)\s*(?:rs|rupees)?$/i;
    const priceMatch = content.match(priceRegex);
    let price: number | null = null;
    if (priceMatch) {
      price = parseFloat(priceMatch[1]);
      content = content.replace(priceRegex, '').trim();
    }
    
    // Extract quantity and unit: "X kg", "X ml", etc.
    const qtyUnitRegex = /(\d+(\.\d+)?)\s*(kg|kilos?|kilograms?|g|grams?|ltr|litres?|liters?|pcs|pieces?|ml|millilitre|milliliter)\b/i;
    const qtyUnitMatch = content.match(qtyUnitRegex);
    let quantity: number | null = null;
    let unit: string = '';
    if (qtyUnitMatch) {
        quantity = parseFloat(qtyUnitMatch[1]);
        unit = normalizeUnit(qtyUnitMatch[3]);
        content = content.replace(qtyUnitRegex, '').trim();
    }

    // Check for quantity at the start (e.g., "Add 2 rice")
    if (quantity === null) {
      const leadingQtyRegex = /^(\d+(\.\d+)?)\s+/;
      const leadingQtyMatch = content.match(leadingQtyRegex);
      if (leadingQtyMatch) {
        quantity = parseFloat(leadingQtyMatch[1]);
        content = content.replace(leadingQtyRegex, '').trim();
      }
    }

    const itemName = content.replace(/at$/, '').trim();

    if (itemName && quantity !== null && price !== null) {
      return {
        action: 'add',
        payload: {
          item: itemName,
          quantity: quantity,
          unit: unit || 'pcs', // Default to 'pcs'
          price: price,
        },
      };
    }
  }

  return null;
};
