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
  const removeRegex = /^remove\s+(.+)$/i;
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
  if (cmd === 'calculate total' || cmd === 'kanak' || cmd === 'total') {
    return { action: 'calculate', payload: null };
  }

  // Rule: "reset bill" or "reset"
  if (cmd === 'reset bill' || cmd === 'reset') {
    return { action: 'reset', payload: null };
  }

  // Flexible "add" command parsing
  const addRegex = /add\s+(.+)/i;
  const addMatch = cmd.match(addRegex);

  if (addMatch) {
    let content = addMatch[1];
    let quantity: number | null = null;
    let unit: string = '';
    let price: number | null = null;
    const itemParts: string[] = [];

    // Regex to find quantity and unit (e.g., "2kg", "500g", "2 pcs")
    const qtyUnitRegex = /(\d+(\.\d+)?)\s*(kg|kilos?|kilograms?|g|grams?|ltr|litres?|liters?|pcs|pieces?)\b/i;
    const qtyUnitMatch = content.match(qtyUnitRegex);

    if (qtyUnitMatch) {
      quantity = parseFloat(qtyUnitMatch[1]);
      unit = normalizeUnit(qtyUnitMatch[3]);
      content = content.replace(qtyUnitMatch[0], '').trim();
    }
    
    // Regex to find price (e.g., "50rs", "50 rs", "rs 50", "50")
    const priceRegex = /(?:rs\s*)?(\d+(\.\d+)?)(?:\s*rs)?\b/i;
    const parts = content.split(/\s+/);
    let priceFound = false;

    // Iterate backwards to find price first
    for (let i = parts.length - 1; i >= 0; i--) {
        const priceMatch = parts[i].match(priceRegex);
        if (priceMatch && priceMatch[0] === parts[i] && !priceFound) {
            price = parseFloat(priceMatch[1]);
            parts.splice(i, 1);
            priceFound = true;
            break;
        }
    }
    
    // The rest is the item name and maybe a quantity if not found with unit
    const remainingContent = parts.join(' ');
    const words = remainingContent.split(/\s+/).filter(Boolean);

    for (const word of words) {
        // If quantity is still not found, check for a standalone number
        if (quantity === null && /^\d+(\.\d+)?$/.test(word)) {
            quantity = parseFloat(word);
        } else {
            itemParts.push(word);
        }
    }

    const itemName = itemParts.join(' ');

    if (itemName && quantity !== null && price !== null) {
      return {
        action: 'add',
        payload: {
          item: itemName,
          quantity: quantity,
          unit: unit,
          price: price,
        },
      };
    }
  }


  return null;
};
