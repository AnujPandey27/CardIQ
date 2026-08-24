export type DisplayCurrency =
  | "INR"
  | "USD"
  | "EUR"
  | "GBP"
  | "SGD"
  | "AED"
  | "CHF"
  | "JPY";

export type CurrencyOption = {
  code: DisplayCurrency;
  name: string;
  symbol: string;
};

export const DISPLAY_CURRENCY_KEY =
  "cardiq-display-currency";

export const DISPLAY_CURRENCY_EVENT =
  "cardiq-display-currency-change";

export const CURRENCY_OPTIONS: CurrencyOption[] = [
  {
    code: "INR",
    name: "Indian Rupee",
    symbol: "₹",
  },
  {
    code: "USD",
    name: "US Dollar",
    symbol: "$",
  },
  {
    code: "EUR",
    name: "Euro",
    symbol: "€",
  },
  {
    code: "GBP",
    name: "British Pound",
    symbol: "£",
  },
  {
    code: "SGD",
    name: "Singapore Dollar",
    symbol: "S$",
  },
  {
    code: "AED",
    name: "UAE Dirham",
    symbol: "د.إ",
  },
  {
    code: "CHF",
    name: "Swiss Franc",
    symbol: "CHF",
  },
  {
    code: "JPY",
    name: "Japanese Yen",
    symbol: "¥",
  },
];

const COUNTRY_FLAGS: Record<string, string> = {
  IN: "🇮🇳",
  SG: "🇸🇬",
  AE: "🇦🇪",
  GB: "🇬🇧",
  IE: "🇮🇪",
  NL: "🇳🇱",
  SE: "🇸🇪",
  FR: "🇫🇷",
  DE: "🇩🇪",
  CH: "🇨🇭",
  US: "🇺🇸",
  AU: "🇦🇺",
  JP: "🇯🇵",
  HK: "🇭🇰",
  KR: "🇰🇷",
  OM: "🇴🇲",
  SA: "🇸🇦",
  QA: "🇶🇦",
};

export function getCurrencyOption(
  code: string
): CurrencyOption {
  return (
    CURRENCY_OPTIONS.find(
      (item) => item.code === code
    ) ?? CURRENCY_OPTIONS[0]
  );
}

export function getCountryFlag(
  countryCode: string
): string {
  return (
    COUNTRY_FLAGS[countryCode] ??
    "🌐"
  );
}

export function getStoredDisplayCurrency(
  fallback: DisplayCurrency
): DisplayCurrency {
  if (
    typeof window === "undefined"
  ) {
    return fallback;
  }

  const stored =
    window.localStorage.getItem(
      DISPLAY_CURRENCY_KEY
    );

  const valid = CURRENCY_OPTIONS.some(
    (item) => item.code === stored
  );

  return valid
    ? (stored as DisplayCurrency)
    : fallback;
}

export function setStoredDisplayCurrency(
  currency: DisplayCurrency
) {
  window.localStorage.setItem(
    DISPLAY_CURRENCY_KEY,
    currency
  );

  window.dispatchEvent(
    new CustomEvent(
      DISPLAY_CURRENCY_EVENT,
      {
        detail: currency,
      }
    )
  );
}

export async function getExchangeRate(
  from: string,
  to: string
): Promise<number> {
  if (from === to) {
    return 1;
  }

  const response = await fetch(
    `https://api.frankfurter.dev/v2/rate/${encodeURIComponent(
      from
    )}/${encodeURIComponent(to)}`
  );

  if (!response.ok) {
    throw new Error(
      "Unable to fetch the latest exchange rate."
    );
  }

  const data = (await response.json()) as {
    rate: number;
  };

  if (
    !Number.isFinite(data.rate)
  ) {
    throw new Error(
      "Invalid exchange rate received."
    );
  }

  return data.rate;
}

export function formatCurrency(
  amount: number,
  currency: string
): string {
  try {
    return new Intl.NumberFormat(
      undefined,
      {
        style: "currency",
        currency,
        maximumFractionDigits:
          currency === "JPY" ? 0 : 2,
      }
    ).format(amount);
  } catch {
    return `${currency} ${amount.toFixed(
      2
    )}`;
  }
}
