import type { ButtonHTMLAttributes } from 'react';
import { tokens } from '../tokens';

export interface NumericKeypadProps {
  onNumber: (num: number) => void;
  onClear?: () => void;
  maxDigits?: number;
  className?: string;
}

export function NumericKeypad({ onNumber, onClear, maxDigits = 2, className = '' }: NumericKeypadProps) {
  const numbers = [1, 2, 3, 4, 5, 6, 7, 8, 9, 0];
  
  return (
    <div className={`grid grid-cols-3 gap-3 ${className}`}>
      {numbers.map((num) => (
        <button
          key={num}
          onClick={() => onNumber(num)}
          className="rounded-lg bg-[hsl(185_72%_35%)] text-white hover:bg-[hsl(185_72%_25%)] focus:outline-none focus:ring-2 focus:ring-blue-500"
          style={{
            minHeight: 56,
            fontSize: '24px',
            borderRadius: tokens.radius.lg,
          }}
          aria-label={`Number ${num}`}
        >
          {num}
        </button>
      ))}
      {onClear && (
        <button
          onClick={onClear}
          className="rounded-lg bg-[hsl(350_70%_40%)] text-white hover:bg-[hsl(350_70%_30%)] focus:outline-none focus:ring-2 focus:ring-red-500"
          style={{
            minHeight: 56,
            fontSize: '20px',
            borderRadius: tokens.radius.lg,
          }}
          aria-label="Clear"
        >
          C
        </button>
      )}
    </div>
  );
} 