import type { ButtonHTMLAttributes, PropsWithChildren } from 'react';
import { tokens } from '../tokens';

export type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'accent';
  size?: 'lg' | 'xl';
};

export function Button({ variant = 'primary', size = 'lg', children, ...rest }: PropsWithChildren<ButtonProps>) {
  const bg = variant === 'primary' ? tokens.color.primary : tokens.color.accent;
  const color = tokens.color['primary-contrast'];
  const padding = size === 'xl' ? 20 : 16;
  const radius = tokens.radius.lg;
  const style: React.CSSProperties = {
    backgroundColor: bg,
    color,
    borderRadius: radius,
    padding: `${padding}px ${padding * 1.25}px`,
    fontSize: 20,
    minHeight: 56,
  };
  return (
    <button style={style} {...rest}>
      {children}
    </button>
  );
} 