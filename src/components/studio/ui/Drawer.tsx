import type { ComponentChildren } from 'preact';
import { Modal, type ModalSize } from './Modal.tsx';

interface DrawerProps {
  open: boolean;
  onClose: () => void;
  side: 'left' | 'right';
  size?: ModalSize;
  labelledBy?: string;
  className?: string;
  children: ComponentChildren;
}

/** Call-site sugar over Modal — `<Drawer side="left">` reads better than
 * `<Modal placement="left">` at PostSidebar/MetadataDrawer, but there is no
 * independent logic here. All lifecycle/focus/backdrop behavior lives in
 * Modal.tsx exactly once. */
export function Drawer({ side, ...rest }: DrawerProps) {
  return <Modal placement={side} {...rest} />;
}
