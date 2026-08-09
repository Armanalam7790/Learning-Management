export default function DetailList({ items }) {
  return (
    <dl className="divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-200 dark:divide-slate-800 dark:border-slate-800">
      {items
        .filter(Boolean)
        .map(({ label, value }) => (
          <div key={label} className="flex items-center justify-between gap-4 bg-white px-4 py-3 dark:bg-slate-900">
            <dt className="text-sm text-slate-500 dark:text-slate-400">{label}</dt>
            <dd className="text-right text-sm font-medium text-slate-800 dark:text-slate-200">{value ?? '—'}</dd>
          </div>
        ))}
    </dl>
  );
}
