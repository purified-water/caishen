import type { ChangeEvent } from 'react'

function cleanRaw(raw: string): string {
  let cleaned = raw.replace(/[^0-9.]/g, '')
  const parts = cleaned.split('.')
  if (parts.length > 2) {
    cleaned = `${parts[0]}.${parts.slice(1).join('')}`
  }
  return cleaned
}

function formatDisplay(raw: string): string {
  if (!raw) return ''
  const [intPart, decPart] = raw.split('.')
  const formattedInt = intPart ? Number(intPart).toLocaleString('en-US') : ''
  return decPart !== undefined ? `${formattedInt}.${decPart}` : formattedInt
}

type MoneyInputProps = {
  value: string
  onChange: (value: string) => void
  onBlur?: () => void
  className?: string
  placeholder?: string
}

/** Plain-number input with thousands separators, no native +/- stepper. */
export function MoneyInput({
  value,
  onChange,
  onBlur,
  className,
  placeholder,
}: MoneyInputProps) {
  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    onChange(cleanRaw(e.target.value))
  }

  return (
    <input
      type="text"
      inputMode="decimal"
      value={formatDisplay(value)}
      onChange={handleChange}
      onBlur={onBlur}
      placeholder={placeholder}
      className={className}
    />
  )
}
