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

  // Flexible Add command regex
  // add rice 2kg 120rs
  const addRegex = /^add\s+(.+)/i;
  const addMatch = cmd.match(addRegex);

  if (addMatch) {
    let content = addMatch[1];

    const priceRegex = /(\d+(\.\d+)?)\s*(?:rs|rupees)\s*$/i;
    const priceMatch = content.match(priceRegex);
    let price: number | null = null;

    if (priceMatch) {
        price = parseFloat(priceMatch[1]);
        content = content.replace(priceRegex, '').trim();
    }

    const qtyUnitRegex = /(\d+(\.\d+)?)\s*(kg|kilos?|kilograms?|g|grams?|ltr|litres?|liters?|pcs|pieces?|ml|millilitre|milliliter)\b/i;
    const qtyUnitMatch = content.match(qtyUnitRegex);
    let quantity: number | null = null;
    let unit: string = '';

    if (qtyUnitMatch) {
        quantity = parseFloat(qtyUnitMatch[1]);
        unit = normalizeUnit(qtyUnitMatch[3]);
        content = content.replace(qtyUnitRegex, '').trim();
    }
    
    // If quantity is still not found, check for a number without a unit
    if (quantity === null) {
      const qtyRegex = /\s(\d+(\.\d+)?)$/i;
      const qtyMatch = content.match(qtyRegex);
      if (qtyMatch) {
        quantity = parseFloat(qtyMatch[1]);
        content = content.replace(qtyRegex, '').trim();
      }
    }


    const itemName = content.trim();

    if (itemName && quantity !== null && price !== null) {
        return {
            action: 'add',
            payload: {
                item: itemName,
                quantity: quantity,
                unit: unit || 'pcs',
                price: price
            }
        };
    }
  }


  return null;
};
