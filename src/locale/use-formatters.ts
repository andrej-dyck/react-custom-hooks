import { useLocale } from './use-locale.ts'
import { useCallback, useMemo } from 'react'

/**
 * Using https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl to format
 * dates, amounts, and currency based on locale
 */
export const useFormatters = () => {
  const { locale } = useLocale()

  /* 📅 Dates */
  const formatDate = useCallback(
    (date: Date | string, options: Intl.DateTimeFormatOptions = { dateStyle: 'medium' }) =>
      new Intl.DateTimeFormat(locale, options).format(new Date(date)),
    [locale]
  )
  // app-specific formatters might be `formatDateTime` or `formatTimestamp`

  /* 🔢 Amount */
  const amountFormatter = useMemo(
    () => new Intl.NumberFormat(locale),
    [locale]
  )

  const formatAmount = useCallback(
    (amount: number) => {
      if (!Number.isSafeInteger(amount)) throw new Error('amount: not an integer')
      return amountFormatter.format(amount)
    },
    [amountFormatter]
  )

  /* 💲 Currency */
  const formatAsCurrency = useCallback(
    ({ currency, cents }: { currency: 'EUR', cents: number } /* use a money type here */) =>
      new Intl
        .NumberFormat(locale, { style: 'currency', currency, maximumFractionDigits: 2 })
        .format(cents / 100),
    [locale]
  )
  // app-specific formatters might be `formatAsNullableCurrency` or `formatEuros`

  return {
    formatDate,
    formatAmount,
    formatAsCurrency,
    /* other formatters; e.g. for relative time or plural rules */
  } as const
}
