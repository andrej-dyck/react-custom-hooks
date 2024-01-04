export type Locale = 'de-DE'

export const useLocale = () => ({ locale: 'de-DE' satisfies Locale } as const)

// When using i18 for translations, it can be used to determine the current locale like this:
// import { useTranslation } from 'react-i18next'
// export const useLocale = () => {
//   const { i18n } = useTranslation()
//   return {
//     locale: i18n.language,
//   }
// }
