'use client';

export function PreferenceChipGrid({
  labels,
  selected,
  onToggle,
}: {
  labels: string[];
  selected: string[];
  onToggle: (label: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {labels.map((label) => (
        <button
          key={label}
          type="button"
          onClick={() => onToggle(label)}
          className={`px-4 py-2 rounded-full border-2 text-sm font-medium transition ${
            selected.includes(label)
              ? 'border-brand-600 bg-brand-100 text-brand-700'
              : 'border-gray-200 text-gray-600 hover:border-brand-200'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
