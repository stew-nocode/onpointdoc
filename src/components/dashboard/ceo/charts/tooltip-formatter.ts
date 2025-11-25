type TooltipPayloadItem = {
  name?: string;
  value?: number | string;
  color?: string;
  dataKey?: string;
};

type FormatterFunction = (value: number | string, name: string) => [string, string];

type FormattedTooltipItem = {
  value: string;
  name: string;
  color?: string;
};

/**
 * Formate une valeur de tooltip selon le formatter fourni
 */
function formatTooltipValue(
  value: number | string,
  name: string,
  formatter?: FormatterFunction
): { value: string; name: string } {
  if (formatter && typeof value === 'number') {
    const [formattedValue, formattedName] = formatter(value, name);
    return { value: formattedValue, name: formattedName };
  }

  return {
    value: typeof value === 'number' ? value.toLocaleString('fr-FR') : String(value),
    name
  };
}

/**
 * Formate les données du tooltip pour l'affichage
 * 
 * @param payload - Données brutes du tooltip
 * @param formatter - Fonction de formatage optionnelle
 * @returns Données formatées ou null
 */
export function formatTooltipData(
  payload: TooltipPayloadItem[] | undefined,
  formatter?: FormatterFunction
): FormattedTooltipItem[] | null {
  if (!payload || payload.length === 0) {
    return null;
  }

  return payload.map((item) => {
    const value = item.value ?? '';
    const name = item.name || item.dataKey || 'Value';
    const formatted = formatTooltipValue(value, name, formatter);

    return {
      ...formatted,
      color: item.color
    };
  });
}

