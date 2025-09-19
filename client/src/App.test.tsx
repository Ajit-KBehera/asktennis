import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders AskTennis app', () => {
  render(<App />);
  const titleElement = screen.getByText(/AskTennis/i);
  expect(titleElement).toBeInTheDocument();
});
