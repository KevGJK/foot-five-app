import {
  createContext,
  useEffect,
  useState
} from "react";

const ThemeContext = createContext();

export { ThemeContext };

const THEMES = [
  "foot-five",
  "ocean",
  "energy",
  "violet",
];

export function ThemeProvider({ children }) {

  const [theme, setThemeState] = useState(() => {

    const savedTheme =
      localStorage.getItem("foot-five-theme");

    if (THEMES.includes(savedTheme)) {
      return savedTheme;
    }

    return "foot-five";
  });

  useEffect(() => {

    document.documentElement.setAttribute(
      "data-theme",
      theme
    );

    localStorage.setItem(
      "foot-five-theme",
      theme
    );

  }, [theme]);

  function setTheme(newTheme) {

    if (!THEMES.includes(newTheme)) {
      return;
    }

    setThemeState(newTheme);
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        themes: THEMES
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}