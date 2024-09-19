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
            main: prefersDarkMode ? '#29006B' : '#6200FF',
          },
          secondary: {
            main: '#00c853',
          },
          background: {
            default: prefersDarkMode ? '#242424' : "#F6F6F6",
            paper: prefersDarkMode ? '#303030' : '#f0f0f0'
          }
        },
      }),
    [prefersDarkMode]
  ) );
  return theme;
};


export default CreateTheme;