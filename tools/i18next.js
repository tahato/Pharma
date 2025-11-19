import i18next from "i18next";

import en from "./en.json";
import fr from "./fr.json";
import { initReactI18next } from "react-i18next";

export const languageResources = {
    en: {translation: en}, 
    fr: {translation: fr}
}
i18next.use(initReactI18next).init({
    compatibilityJSON: "v3" ,
     lng:'fr',
    fallbacklng: "fr",
    resources: languageResources
});

export default i18next;