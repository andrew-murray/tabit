import React from 'react';
import { render} from '@testing-library/react';
import App from '../App';

test('renders title', () => {
  const { getAllByText } = render(<App />);

  // note, there are multiple elements that say "tabit"
  // now but this test mostly tests the App.js loads without complaint 
  const titleElement = getAllByText(/tabit/i)[0];
  expect(titleElement).toBeInTheDocument();
});
