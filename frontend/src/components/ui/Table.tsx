/* PhysioCare — Semantic data table primitives. Expected result: readable patient/session rows with responsive overflow and keyboard-visible row actions. */

import type { HTMLAttributes, ReactNode, TdHTMLAttributes, ThHTMLAttributes } from 'react';

export interface TableProps extends HTMLAttributes<HTMLTableElement> {
  children: ReactNode;
}

/**
 * Render an accessible table inside a horizontal overflow container.
 *
 * @param props - Table content and native table attributes.
 * @returns A responsive table wrapper.
 */
export function Table({ children, className = '', ...props }: TableProps): React.JSX.Element {
  return (
    <div className="w-full overflow-x-auto">
      <table {...props} className={`w-full border-collapse text-left ${className}`}>
        {children}
      </table>
    </div>
  );
}

export interface TableHeadProps extends ThHTMLAttributes<HTMLTableCellElement> {
  children: ReactNode;
}

/**
 * Render a column heading with a semantic scope.
 *
 * @param props - Heading text and native table-cell attributes.
 * @returns A scoped table header cell.
 */
export function TableHead({ children, className = '', ...props }: TableHeadProps): React.JSX.Element {
  return (
    <th
      {...props}
      scope="col"
      className={`border-b border-line px-4 py-3 text-pc-12 font-semibold text-ink-muted ${className}`}
    >
      {children}
    </th>
  );
}

export interface TableCellProps extends TdHTMLAttributes<HTMLTableCellElement> {
  children: ReactNode;
}

/**
 * Render a data cell with comfortable row spacing.
 *
 * @param props - Cell content and native table-cell attributes.
 * @returns A table data cell.
 */
export function TableCell({ children, className = '', ...props }: TableCellProps): React.JSX.Element {
  return (
    <td
      {...props}
      className={`border-b border-neutral-200 px-4 py-4 text-pc-14 text-ink ${className}`}
    >
      {children}
    </td>
  );
}
