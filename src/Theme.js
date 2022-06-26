import React from "react";
import { createTheme, responsiveFontSizes } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

const CreateTheme = () => {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const theme = responsiveFontSizes( React.useMemo(
    () =>
      createTheme({
        palette: {
          mode: prefersDarkMode ? 'dark' : 'light',
          primary: {
            main: prefersDarkMode ? '#002d6b' : '#0d559a',
          },
          secondary: {
            main: '#00c853',
          },
          background: {
            default: prefersDarkMode ? '#303030' : "#ffffff",
            paper: prefersDarkMode ? '#3b3b3b' : '#fefefe'
          }
        },
      }),
    [prefersDarkMode]
  ) );
  return theme;
};


export default CreateTheme;