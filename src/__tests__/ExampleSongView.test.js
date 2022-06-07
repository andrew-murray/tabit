import React from 'react';
import { render} from '@testing-library/react';
import {ExampleSongView} from '../LazySongViews';
import { MemoryRouter } from 'react-router-dom'

function AppWithinRouter()
{
  const location = "";
  return (
    <MemoryRouter>
      <ExampleSongView
        location={location}
      />
    </MemoryRouter>
  );
};

test('ExampleSongView loads and renders title', () => {
  const { getAllByText } = render(<AppWithinRouter />);

  // note, there are multiple elements that say "tabit"
  // now but this test mostly tests the App.js loads without complaint
  const titleElement = getAllByText(/kuva/i)[0];
  expect(titleElement).toBeInTheDocument();
});
