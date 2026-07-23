interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  className?: string;
}

/** A generic on/off switch — deliberately colored with the neutral accent
 * (not e.g. draft=amber/published=emerald), since the semantic meaning of
 * "on" belongs to whoever's using it, not to this primitive. The previous
 * MetadataDrawer toggle was a bare unlabeled <button>; `role="switch"` +
 * `aria-checked` here is the actual justification for extracting this,
 * more than the single current call site. */
export function Switch({ checked, onChange, label, className = '' }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors ${
        checked ? 'bg-[var(--studio-accent)]' : 'bg-[var(--studio-border)]'
      } ${className}`}
    >
      <span
        className={`inline-block h-4 w-4 transform rounded-full bg-[var(--studio-bg)] transition-transform ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}
