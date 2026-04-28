import React from 'react';
import { render} from '@testing-library/react';
import FileImport from '../FileImport';

test('renders input button', () => {
  const { container } = render(<FileImport />);

  // fixme: this is not recommended practice on how to find elements
  // https://testing-library.com/docs/guide-which-query#manual-queries
  const inputElement = container.querySelector("input");
  expect(inputElement).toBeInTheDocument();
});
