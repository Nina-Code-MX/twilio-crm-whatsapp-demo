import i18next from 'i18next';
import * as enCommon from './locales/en/common.json';
import * as esCommon from './locales/es/common.json';

export const defaultNS = 'common';

i18next.init({
    ns: ['common'],
    defaultNS: 'common',
    initImmediate: false,
    lng: 'es',
    fallbackLng: 'es',
    debug: false,
    compatibilityJSON: 'v4',
});
i18next.addResourceBundle('en', defaultNS, enCommon, true, true);
i18next.addResourceBundle('es', defaultNS, esCommon, true, true);

export default i18next;