import React from 'react';

export function Table({ children, className = '', ...props }) {
  return (
    <div className="w-full overflow-x-auto">
      <table className={`w-full text-left text-xs ${className}`} {...props}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ children, className = '', ...props }) {
  return (
    <thead
      className={`border-b border-[#E8E6DF] dark:border-[#232B3E] text-[10px] uppercase font-bold text-[#858D9D] dark:text-[#64748B] tracking-wider ${className}`}
      {...props}
    >
      {children}
    </thead>
  );
}

export function TableBody({ children, className = '', ...props }) {
  return (
    <tbody
      className={`divide-y divide-[#E8E6DF] dark:divide-[#232B3E] text-[#1F2430] dark:text-[#F1F5F9] ${className}`}
      {...props}
    >
      {children}
    </tbody>
  );
}

export function TableRow({ children, className = '', hover = true, ...props }) {
  return (
    <tr
      className={`${hover ? 'hover:bg-slate-50 dark:hover:bg-[#1A2333] transition cursor-pointer' : ''} ${className}`}
      {...props}
    >
      {children}
    </tr>
  );
}

export function TableHead({ children, className = '', ...props }) {
  return (
    <th className={`py-3 px-3.5 font-bold ${className}`} {...props}>
      {children}
    </th>
  );
}

export function TableCell({ children, className = '', ...props }) {
  return (
    <td className={`py-3 px-3.5 ${className}`} {...props}>
      {children}
    </td>
  );
}

export default Table;
