import { cn } from '../../utils/cn';

export default function Table({ columns, data, keyField = '_id', onRowClick, renderMobileCard }) {
  return (
    <div className="w-full">
      {/* Desktop / tablet table */}
      <div className="hidden overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-card md:block dark:border-slate-800 dark:bg-slate-900">
        <table className="w-full min-w-full divide-y divide-slate-100 text-sm dark:divide-slate-800">
          <thead>
            <tr className="bg-slate-50/80 dark:bg-slate-800/60">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400',
                    col.headerClassName
                  )}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
            {data.map((row) => (
              <tr
                key={row[keyField]}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={cn('transition-colors', onRowClick && 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60')}
              >
                {columns.map((col) => (
                  <td key={col.key} className={cn('px-4 py-3.5 align-middle text-slate-700 dark:text-slate-300', col.className)}>
                    {col.render ? col.render(row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile stacked cards */}
      <div className="flex flex-col gap-3 md:hidden">
        {data.map((row) =>
          renderMobileCard ? (
            <div key={row[keyField]} onClick={onRowClick ? () => onRowClick(row) : undefined}>
              {renderMobileCard(row)}
            </div>
          ) : (
            <div
              key={row[keyField]}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              className={cn(
                'rounded-xl border border-slate-200 bg-white p-4 shadow-card dark:border-slate-800 dark:bg-slate-900',
                onRowClick && 'cursor-pointer active:bg-slate-50 dark:active:bg-slate-800/60'
              )}
            >
              {columns
                .filter((col) => !col.hideOnMobile)
                .map((col) => (
                  <div key={col.key} className="flex items-center justify-between gap-3 py-1.5 first:pt-0 last:pb-0">
                    <span className="text-xs font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">{col.header}</span>
                    <span className="text-right text-sm text-slate-700 dark:text-slate-300">{col.render ? col.render(row) : row[col.key]}</span>
                  </div>
                ))}
            </div>
          )
        )}
      </div>
    </div>
  );
}
