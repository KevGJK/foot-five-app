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


function t(key, params = {}) {

  let text =
    translations[
      language
    ]?.[key]

    ||

    translations.fr[key]

    ||

    key;


  Object.entries(params).forEach(
    ([param, value]) => {

      text = text
        .split(`{${param}}`)
        .join(String(value ?? ""));

    }
  );


  return text;

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