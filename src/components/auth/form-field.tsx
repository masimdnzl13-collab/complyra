interface FormFieldProps {
  label: string;
  type: string;
  name: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  disabled?: boolean;
}

export function FormField({
  label,
  type,
  name,
  value,
  onChange,
  autoComplete,
  disabled,
}: FormFieldProps) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-navy-900">{label}</span>
      <input
        type={type}
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        required
        disabled={disabled}
        className="w-full rounded-md border border-navy-100 px-3 py-2 text-sm text-navy-900 placeholder:text-navy-300 focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent disabled:opacity-50"
      />
    </label>
  );
}
