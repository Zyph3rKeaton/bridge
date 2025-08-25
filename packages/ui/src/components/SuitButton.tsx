import type { ButtonHTMLAttributes } from 'react';
import { tokens } from '../tokens';

export type Suit = 'C' | 'D' | 'H' | 'S' | 'NT';

export interface SuitButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  suit: Suit;
  size?: 'lg' | 'xl';
}

const suitSymbols = {
  C: '♣',
  D: '♦', 
  H: '♥',
  S: '♠',
  NT: 'NT'
};

const suitColors = {
  C: 'text-black',
  D: 'text-red-600',
  H: 'text-red-600', 
  S: 'text-black',
  NT: 'text-gray-800'
};

export function SuitButton({ suit, size = 'lg', className = '', ...rest }: SuitButtonProps) {
  const padding = size === 'xl' ? 24 : 20;
  const fontSize = size === 'xl' ? 32 : 24;
  
  return (
    <button
      className={`rounded-lg border-2 border-gray-300 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 ${suitColors[suit]} ${className}`}
      style={{
        minHeight: 56,
        padding: `${padding}px`,
        fontSize: `${fontSize}px`,
        borderRadius: tokens.radius.lg,
      }}
      aria-label={`${suit} suit`}
      {...rest}
    >
      {suitSymbols[suit]}
    </button>
  );
} 