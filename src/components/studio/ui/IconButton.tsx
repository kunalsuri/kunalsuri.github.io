import type { ButtonHTMLAttributes } from 'preact';
import { Icon, type IconName } from './Icon.tsx';
import { Spinner } from './Spinner.tsx';

type IconButtonSize = 'sm' | 'md';
type IconButtonVariant = 'ghost' | 'secondary';

interface IconButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'size' | 'label' | 'icon'> {
  icon: IconName;
  /** Required — feeds both aria-label and the native tooltip (title). An
   * icon-only button with no accessible name is unusable by anyone on a
   * screen reader, so there's no optional/default here. */
  label: string;
  size?: IconButtonSize;
  variant?: IconButtonVariant;
  loading?: boolean;
}

const BOX_PX: Record<IconButtonSize, number> = { sm: 28, md: 34 };
const ICON_PX: Record<IconButtonSize, number> = { sm: 14, md: 16 };

export function IconButton({
  icon,
  label,
  size = 'md',
  variant = 'ghost',
  loading = false,
  disabled,
  className = '',
  type = 'button',
  ...rest
}: IconButtonProps) {
  const variantClass =
    variant === 'secondary'
      ? 'bg-[var(--studio-bg)] border border-[var(--studio-border)] hover:border-[var(--studio-border-hover)] text-[var(--studio-text-primary)]'
      : 'bg-transparent text-[var(--studio-text-muted)] hover:text-[var(--studio-text-primary)] hover:bg-[var(--studio-bg)]';

  return (
    <button
      type={type}
      aria-label={label}
      title={label}
      disabled={disabled || loading}
      className={`inline-flex shrink-0 items-center justify-center rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${variantClass} ${className}`}
      style={{ width: BOX_PX[size], height: BOX_PX[size] }}
      {...rest}
    >
      {loading ? <Spinner size={ICON_PX[size]} /> : <Icon name={icon} size={ICON_PX[size]} />}
    </button>
  );
}
