import React from 'react';
import { render} from '@testing-library/react';
import App from '../App';
import { MemoryRouter } from 'react-router-dom'

function AppWithinRouter()
{
  return (
    <MemoryRouter>
      <App/>
    </MemoryRouter>
  );
};

test('renders title', () => {
  const { getAllByText } = render(<AppWithinRouter />);

  // note, there are multiple elements that say "tabit"
  // now but this test mostly tests the App.js loads without complaint 
  const titleElement = getAllByText(/tabit/i)[0];
  expect(titleElement).toBeInTheDocument();
});
