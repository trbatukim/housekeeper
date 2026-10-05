export enum Currency {
    EURO = 'euro',
    DOLLAR = 'dollar',
    TL = 'tl',
    POUND = 'pound',
}

// A TS enum can't carry the label and symbol, so the display data lives here.
// This order drives the <select> options, which keeps Euro the default pick.
export const CURRENCIES: { value: Currency, label: string, symbol: string }[] = [
    { value: Currency.EURO, label: 'Euro', symbol: '€' },
    { value: Currency.DOLLAR, label: 'Dollar', symbol: '$' },
    { value: Currency.TL, label: 'Turkish Lira', symbol: '₺' },
    { value: Currency.POUND, label: 'Pound', symbol: '£' },
]

export const CURRENCY_VALUES: string[] = CURRENCIES.map((currency) => currency.value)

export function currencySymbol(value: string) {
    return CURRENCIES.find((currency) => currency.value === value)?.symbol
}
