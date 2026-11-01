import { useId } from 'react';
import { useChoice, useField, useToggle } from '@/lib/planner-store';

export function TextField({
  name, label, placeholder, className = '', rows, ruled = false,
}: {
  name: string; label: string; placeholder?: string; className?: string; rows?: number; ruled?: boolean;
}) {
  const id = useId();
  const [value, setValue] = useField(name);
  return (
    <div className={`field-block ${className}`}>
      <label className="section-label" htmlFor={id}><span className="label-dot" />{label}</label>
      {rows ? (
        <textarea
          id={id}
          data-testid={`textarea-${name}`}
          className={`field-textarea ${ruled ? 'ruled-area' : ''}`}
          rows={rows}
          placeholder={placeholder}
          value={value}
          onChange={event => setValue(event.target.value)}
        />
      ) : (
        <input
          id={id}
          data-testid={`input-${name}`}
          className="field-input"
          placeholder={placeholder}
          value={value}
          onChange={event => setValue(event.target.value)}
        />
      )}
    </div>
  );
}

export function PlainTextarea({ name, label, className = 'field-textarea ruled-area', style }: {
  name: string; label: string; className?: string; style?: React.CSSProperties;
}) {
  const [value, setValue] = useField(name);
  return (
    <textarea
      className={className}
      style={style}
      aria-label={label}
      data-testid={`textarea-${name}`}
      value={value}
      onChange={event => setValue(event.target.value)}
    />
  );
}

export function CheckInput({ name, label, className = '' }: { name: string; label: string; className?: string }) {
  const [checked, setChecked] = useToggle(name);
  return (
    <input
      type="checkbox"
      data-testid={`checkbox-${name}`}
      aria-label={label}
      className={`check-input ${className}`}
      checked={checked}
      onChange={event => setChecked(event.target.checked)}
    />
  );
}

export function LineInput({ name, label, className = 'row-input' }: { name: string; label: string; className?: string }) {
  const [value, setValue] = useField(name);
  return (
    <input
      className={className}
      aria-label={label}
      data-testid={`input-${name}`}
      value={value}
      onChange={event => setValue(event.target.value)}
    />
  );
}

export function RadioChoice({ name, group, option, label }: { name: string; group: string; option: string; label: string }) {
  const [value, setValue] = useChoice(name);
  return (
    <input
      type="radio"
      className="mood-choice"
      name={group}
      aria-label={label}
      data-testid={`radio-${name}-${option}`}
      checked={value === option}
      onChange={() => setValue(option)}
      onClick={() => { if (value === option) setValue(''); }}
    />
  );
}
