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

  // Rule: "add <item> <quantity><unit> <price>rs" or "add <item> <quantity> <unit> <price>"
  const addRegex = /^add\s+(.+?)\s+(\d+(\.\d+)?)\s*(kg|kilo|kilogram|kilograms|pcs|piece|pieces|g|gram|grams|ltr|litre|liters)\s+(\d+(\.\d+)?)\s*r?s?$/i;
  const addMatch = cmd.match(addRegex);
  if (addMatch) {
    return {
      action: 'add',
      payload: {
        item: addMatch[1].trim(),
        quantity: parseFloat(addMatch[2]),
        unit: normalizeUnit(addMatch[4]),
        price: parseFloat(addMatch[5]),
      },
    };
  }

  // Legacy Rule: "add <quantity> <unit> <item> for <price>"
  const addLegacyRegex = /^add\s+(\d+(\.\d+)?)\s+(kg|kilo|kilogram|pcs|piece|pieces|g|gram|grams|ltr|litre|liter)\s+(.+?)\s+for\s+(\d+(\.\d+)?)$/i;
  const addLegacyMatch = cmd.match(addLegacyRegex);
  if (addLegacyMatch) {
    return {
      action: 'add',
      payload: {
        quantity: parseFloat(addLegacyMatch[1]),
        unit: normalizeUnit(addLegacyMatch[3]),
        item: addLegacyMatch[4].trim(),
        price: parseFloat(addLegacyMatch[5]),
      },
    };
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
  if (cmd === 'calculate total' || cmd === 'kanak') {
    return { action: 'calculate', payload: null };
  }

  // Rule: "reset bill"
  if (cmd === 'reset bill') {
    return { action: 'reset', payload: null };
  }

  return null;
};
