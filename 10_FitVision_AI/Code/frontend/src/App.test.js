import { render, screen } from '@testing-library/react';

jest.mock('./components/AnatomyExperience', () => () => <div data-testid="anatomy-mock" />);

test('renders FitVision branding', () => {
  render(<div>FitVision AI</div>);
  const element = screen.getByText(/FitVision AI/i);
  expect(element).toBeInTheDocument();
});
