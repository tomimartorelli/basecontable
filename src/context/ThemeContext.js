import React, { createContext } from "react";
import useDarkMode from "../hooks/useDarkMode";

export const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [modoOscuro, setModoOscuro] = useDarkMode();
  return (
    <ThemeContext.Provider value={{ modoOscuro, setModoOscuro }}>
      {children}
    </ThemeContext.Provider>
  );
}; 