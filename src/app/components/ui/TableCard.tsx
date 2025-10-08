"use client";

import { ReactNode } from "react";

interface TableCardProps {
  headers: string[];
  children: ReactNode;
  className?: string;
}

export function TableCard({ headers, children, className = "" }: TableCardProps) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full min-w-full">
        <thead className="bg-gray-50 dark:bg-gray-700/50">
          <tr>
            {headers.map((header, index) => (
              <th
                key={index}
                className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-300 uppercase tracking-wider"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
          {children}
        </tbody>
      </table>
    </div>
  );
}

interface TableRowProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
}

export function TableRow({ children, onClick, className = "" }: TableRowProps) {
  return (
    <tr
      onClick={onClick}
      className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
        onClick ? "cursor-pointer" : ""
      } ${className}`}
    >
      {children}
    </tr>
  );
}

interface TableCellProps {
  children: ReactNode;
  className?: string;
}

export function TableCell({ children, className = "" }: TableCellProps) {
  return (
    <td className={`px-6 py-4 text-sm text-gray-900 dark:text-gray-100 ${className}`}>
      {children}
    </td>
  );
}

// Componente para versão mobile (cards)
interface MobileCardProps {
  data: Array<{ label: string; value: ReactNode }>;
  actions?: ReactNode;
  onClick?: () => void;
}

export function MobileCard({ data, actions, onClick }: MobileCardProps) {
  return (
    <div
      onClick={onClick}
      className={`p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 hover:shadow-md transition-shadow ${
        onClick ? "cursor-pointer" : ""
      }`}
    >
      <div className="space-y-2">
        {data.map((item, index) => (
          <div key={index} className="flex justify-between items-start">
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
              {item.label}:
            </span>
            <span className="text-sm text-gray-900 dark:text-gray-100 text-right">
              {item.value}
            </span>
          </div>
        ))}
      </div>
      {actions && (
        <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          {actions}
        </div>
      )}
    </div>
  );
}
