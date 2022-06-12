import React from 'react';
import {render, waitFor} from '@testing-library/react';
import {ExampleSongView} from '../LazySongViews';
import { MemoryRouter } from 'react-router-dom'
import CreateTheme from "../Theme"
import { ThemeProvider } from '@mui/material/styles';

function AppWithinRouter()
{
  const location = "";
  return (
    <ThemeProvider theme={CreateTheme()}>
      <MemoryRouter>
        <ExampleSongView
          location={location}
        />
      </MemoryRouter>
    </ThemeProvider>
  );
};

test('ExampleSongView loads and renders title', async () => {
  const component = render(<AppWithinRouter />);

  // note, there are multiple elements that say "tabit"
  // now but this test mostly tests the App.js loads without complaint
  const progressElement = component.getAllByText(/Loading song/i)[0];
  expect(progressElement).toBeInTheDocument();
  const assertOnTitleComponent = () => {
    const renderedTitleElements = component.getAllByText(/KUVA/i)
    if(renderedTitleElements.length === 0)
    {
      return false;
    }
    else
    {
      return expect(renderedTitleElements[0]).toBeInTheDocument();
    }
  };
  await waitFor(assertOnTitleComponent);
});
