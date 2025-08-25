import type { ReactNode } from 'react';
import { tokens } from '../tokens';

export interface ScoreDisplayProps {
  contract?: string;
  result?: string;
  score?: number;
  className?: string;
}

export function ScoreDisplay({ contract, result, score, className = '' }: ScoreDisplayProps) {
  return (
    <div className={`p-4 rounded-lg bg-[hsl(40_14%_93%)] ${className}`} style={{ borderRadius: tokens.radius.lg }}>
      {contract && (
        <div className="text-lg">
          <span className="font-semibold">Contract:</span> {contract}
        </div>
      )}
      {result && (
        <div className="text-lg mt-2">
          <span className="font-semibold">Result:</span> {result}
        </div>
      )}
      {score !== undefined && (
        <div className={`text-xl font-bold mt-2 ${score >= 0 ? 'text-[hsl(145_65%_32%)]' : 'text-[hsl(350_70%_40%)]'}`}>
          {score >= 0 ? '+' : ''}{score}
        </div>
      )}
    </div>
  );
} 