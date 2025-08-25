import { render, screen, fireEvent } from '@testing-library/react';
import { Button, SuitButton, NumericKeypad, ScoreDisplay } from '@bridge/ui';

describe('Button', () => {
  it('renders with default props', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('renders with accent variant', () => {
    render(<Button variant="accent">Accent Button</Button>);
    const button = screen.getByRole('button', { name: 'Accent Button' });
    expect(button).toBeInTheDocument();
  });
});

describe('SuitButton', () => {
  it('renders suit symbols correctly', () => {
    render(<SuitButton suit="H" />);
    expect(screen.getByRole('button', { name: 'H suit' })).toHaveTextContent('♥');
  });

  it('has correct aria-label', () => {
    render(<SuitButton suit="NT" />);
    expect(screen.getByRole('button', { name: 'NT suit' })).toBeInTheDocument();
  });
});

describe('NumericKeypad', () => {
  it('renders all numbers', () => {
    const onNumber = jest.fn();
    render(<NumericKeypad onNumber={onNumber} />);
    
    for (let i = 0; i <= 9; i++) {
      expect(screen.getByRole('button', { name: `Number ${i}` })).toBeInTheDocument();
    }
  });

  it('calls onNumber when clicked', () => {
    const onNumber = jest.fn();
    render(<NumericKeypad onNumber={onNumber} />);
    
    fireEvent.click(screen.getByRole('button', { name: 'Number 5' }));
    expect(onNumber).toHaveBeenCalledWith(5);
  });
});

describe('ScoreDisplay', () => {
  it('renders contract and result', () => {
    render(<ScoreDisplay contract="3NT" result="9 tricks" score={600} />);
    
    expect(screen.getByText('Contract: 3NT')).toBeInTheDocument();
    expect(screen.getByText('Result: 9 tricks')).toBeInTheDocument();
    expect(screen.getByText('+600')).toBeInTheDocument();
  });

  it('shows negative score in red', () => {
    render(<ScoreDisplay score={-100} />);
    const scoreElement = screen.getByText('-100');
    expect(scoreElement).toHaveClass('text-[hsl(350_70%_40%)]');
  });
}); 