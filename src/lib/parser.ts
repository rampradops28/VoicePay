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
  const lowerUnit = unit.toLowerCase();
  return unitMap[lowerUnit] || lowerUnit;
};

export const parseCommand = (command: string): ParsedCommand | null => {
  const cmd = command.toLowerCase().trim();

  // Flexible Rule: "add <item> <quantity><unit> <price>rs" OR "add <quantity><unit> <item> <price>rs"
  const addRegex = /^add\s+(?:(.+?)\s+(\d+(\.\d+)?)\s*(kg|kilo|kilogram|kilograms|pcs|piece|pieces|g|gram|grams|ltr|litre|liters)\s+(\d+(\.\d+)?)\s*r?s?|(\d+(\.\d+)?)\s*(kg|kilo|kilogram|kilograms|pcs|piece|pieces|g|gram|grams|ltr|litre|liters)\s+(.+?)\s+(\d+(\.\d+)?)\s*r?s?)$/i;
  const addMatch = cmd.match(addRegex);
  if (addMatch) {
    // Check which capture group matched for item/quantity order
    if (addMatch[1] !== undefined) {
      // Order: item, quantity, unit, price
      return {
        action: 'add',
        payload: {
          item: addMatch[1].trim(),
          quantity: parseFloat(addMatch[2]),
          unit: normalizeUnit(addMatch[4]),
          price: parseFloat(addMatch[5]),
        },
      };
    } else {
      // Order: quantity, unit, item, price
      return {
        action: 'add',
        payload: {
          item: addMatch[9].trim(),
          quantity: parseFloat(addMatch[6]),
          unit: normalizeUnit(addMatch[8]),
          price: parseFloat(addMatch[10]),
        },
      };
    }
  }
  
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

  // Rule: "calculate total" or "kanak"
  if (cmd === 'calculate total' || cmd === 'kanak' || cmd === 'total') {
    return { action: 'calculate', payload: null };
  }

  // Rule: "reset bill"
  if (cmd === 'reset bill' || cmd === 'reset') {
    return { action: 'reset', payload: null };
  }

  return null;
};
