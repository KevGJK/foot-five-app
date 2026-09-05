import {
  useState
} from "react";

import {
  translations
} from "./translations";

import {
  LanguageContext
} from "./LanguageContext";


export default function LanguageProvider({
  children
}) {

  const [
    language,
    setLanguage
  ] = useState(() => {

    const savedLanguage =
      localStorage.getItem(
        "foot-five-language"
      );

    if (
      savedLanguage &&
      translations[savedLanguage]
    ) {
      return savedLanguage;
    }

    const browserLanguage =
      navigator.language
        ?.split("-")[0]
        .toLowerCase();

    if (
      browserLanguage &&
      translations[browserLanguage]
    ) {
      return browserLanguage;
    }

    return "fr";

  });


  function changeLanguage(
    newLanguage
  ) {

    if (
      !translations[newLanguage]
    ) {
      return;
    }

    localStorage.setItem(
      "foot-five-language",
      newLanguage
    );

    setLanguage(newLanguage);

  }


  function t(key) {

    return (

      translations[
        language
      ]?.[key]

      ||

      translations.fr[key]

      ||

      key

    );

  }


  return (

    <LanguageContext.Provider
      value={{

        language,

        setLanguage:
          changeLanguage,

        t

      }}
    >

      {children}

    </LanguageContext.Provider>

  );

}