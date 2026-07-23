import type { ButtonHTMLAttributes, ComponentChildren } from 'preact';
import { Icon, type IconName } from './Icon.tsx';
import { Spinner } from './Spinner.tsx';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
export type ButtonSize = 'sm' | 'md';

interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'size' | 'icon'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: IconName;
  loading?: boolean;
  children?: ComponentChildren;
}

const VARIANT_CLASSES: Record<ButtonVariant, string> = {
  primary: 'bg-[var(--studio-accent)] text-[var(--studio-bg)] hover:bg-[var(--studio-accent-hover)] shadow-sm',
  secondary:
    'bg-[var(--studio-bg)] text-[var(--studio-text-primary)] border border-[var(--studio-border)] hover:border-[var(--studio-border-hover)]',
  ghost: 'bg-transparent text-[var(--studio-text-secondary)] hover:text-[var(--studio-text-primary)] hover:bg-[var(--studio-bg)]',
  danger: 'bg-red-600/90 text-white hover:bg-red-500',
};

const SIZE_CLASSES: Record<ButtonSize, string> = {
  sm: 'px-2.5 py-1 text-xs gap-1.5',
  md: 'px-3.5 py-2 text-xs gap-2',
};

const ICON_PX: Record<ButtonSize, number> = { sm: 13, md: 15 };

export function Button({
  variant = 'secondary',
  size = 'md',
  icon,
  loading = false,
  disabled,
  className = '',
  children,
  type = 'button',
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center rounded-xl font-semibold whitespace-nowrap transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${VARIANT_CLASSES[variant]} ${SIZE_CLASSES[size]} ${className}`}
      {...rest}
    >
      {loading ? (
        <Spinner size={ICON_PX[size]} />
      ) : icon ? (
        <Icon name={icon} size={ICON_PX[size]} />
      ) : null}
      {children}
    </button>
  );
}
