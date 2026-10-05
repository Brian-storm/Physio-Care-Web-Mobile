/* PhysioCare — Role-aware navigation link. Expected result: consistent route navigation with a clear current-page state and keyboard focus. */

import Link from 'next/link';
import type { AnchorHTMLAttributes, ReactNode } from 'react';

export interface NavLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  href: string;
  current?: boolean;
  children: ReactNode;
}

/**
 * Render a Next.js navigation link with an accessible active state.
 *
 * @param props - Route href, current-page state, content, and anchor attributes.
 * @returns A styled Next.js link.
 */
export function NavLink({
  href,
  current = false,
  children,
  className = '',
  ...props
}: NavLinkProps): React.JSX.Element {
  return (
    <Link
      {...props}
      href={href}
      aria-current={current ? 'page' : undefined}
      className={`block border-l-2 px-4 py-3 text-pc-14 font-medium transition-colors duration-quick ease-brand focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-info-500 ${current ? 'border-primary-700 bg-primary-50 text-primary-800' : 'border-transparent text-neutral-700 hover:bg-neutral-100'} ${className}`}
    >
      {children}
    </Link>
  );
}
