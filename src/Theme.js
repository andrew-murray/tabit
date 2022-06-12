import React from "react";
import { createTheme, responsiveFontSizes } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

const CreateTheme = () => {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const theme = responsiveFontSizes( React.useMemo(
    () =>
      createTheme({
        palette: {
          type: prefersDarkMode ? 'dark' : 'light',
          primary: {
            main: prefersDarkMode ? '#006110' : '#00BF70'
          },
          secondary: {
            main: prefersDarkMode ? '#940422' : '#00acc1'
          }
        },
      }),
    [prefersDarkMode]
  ) );
  return theme;
};


export default CreateTheme;