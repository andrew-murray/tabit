import React from 'react';
import { render} from '@testing-library/react';
import App from '../App';

test('renders title', () => {
  const { getByText } = render(<App />);

  const titleElement = getByText(/tabit/i);
  expect(titleElement).toBeInTheDocument();
});
