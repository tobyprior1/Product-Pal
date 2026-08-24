import { useEffect, useRef, useState } from "react"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

/**
 * Shared "draft" editing behaviour for all free-text style fields.
 *
 * While the field is focused, the user's keystrokes live in local state so an
 * async store round-trip can never overwrite what is being typed. The value is
 * committed to the store on blur (or Enter for single-line inputs), and Escape
 * reverts to the last saved value.
 */
export function useDraftField(value: string, onCommit: (value: string) => void) {
  const [draft, setDraft] = useState(value)
  const isEditing = useRef(false)

  useEffect(() => {
    if (!isEditing.current) setDraft(value)
  }, [value])

  const commit = () => {
    isEditing.current = false
    if (draft !== value) onCommit(draft)
  }

  const reset = () => {
    isEditing.current = false
    setDraft(value)
  }

  return {
    draft,
    setDraft,
    commit,
    reset,
    onFocus: () => {
      isEditing.current = true
    },
  }
}

interface TextFieldProps {
  label?: string
  id: string
  value: string | undefined
  onCommit: (value: string) => void
  placeholder?: string
  type?: "text" | "date"
  min?: string
  className?: string
  labelClassName?: string
}

export function TextField({
  label,
  id,
  value,
  onCommit,
  placeholder,
  type = "text",
  min,
  className,
  labelClassName,
}: TextFieldProps) {
  const field = useDraftField(value ?? "", onCommit)

  return (
    <div className={`space-y-2 ${className || ""}`}>
      {label && (
        <Label htmlFor={id} className={labelClassName}>
          {label}
        </Label>
      )}
      <Input
        id={id}
        type={type}
        min={min}
        placeholder={placeholder}
        value={field.draft}
        onFocus={field.onFocus}
        onChange={(e) => field.setDraft(e.target.value)}
        onBlur={field.commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur()
          if (e.key === "Escape") {
            field.reset()
            e.currentTarget.blur()
          }
        }}
      />
    </div>
  )
}

interface TextAreaFieldProps {
  label?: string
  id: string
  value: string | undefined
  onCommit: (value: string) => void
  placeholder?: string
  rows?: number
  className?: string
}

export function TextAreaField({
  label,
  id,
  value,
  onCommit,
  placeholder,
  rows = 3,
  className,
}: TextAreaFieldProps) {
  const field = useDraftField(value ?? "", onCommit)

  return (
    <div className={`space-y-2 ${className || ""}`}>
      {label && <Label htmlFor={id}>{label}</Label>}
      <Textarea
        id={id}
        rows={rows}
        placeholder={placeholder}
        value={field.draft}
        onFocus={field.onFocus}
        onChange={(e) => field.setDraft(e.target.value)}
        onBlur={field.commit}
        onKeyDown={(e) => {
          if (e.key === "Escape") {
            field.reset()
            e.currentTarget.blur()
          }
        }}
      />
    </div>
  )
}

function formatNumber(value: number | undefined) {
  return value === undefined || value === null ? "" : String(value)
}

interface NumberFieldProps {
  label?: string
  id: string
  value: number | undefined
  onCommit: (value: number | undefined) => void
  placeholder?: string
  className?: string
}

export function NumberField({ label, id, value, onCommit, placeholder, className }: NumberFieldProps) {
  const [draft, setDraft] = useState(() => formatNumber(value))
  const isEditing = useRef(false)

  useEffect(() => {
    if (!isEditing.current) setDraft(formatNumber(value))
  }, [value])

  const reset = () => {
    setDraft(formatNumber(value))
    isEditing.current = false
  }

  const commit = () => {
    isEditing.current = false
    const trimmed = draft.trim()

    if (trimmed === "") {
      setDraft("")
      if (value !== undefined) onCommit(undefined)
      return
    }

    const parsed = Number(trimmed)
    if (!Number.isFinite(parsed)) {
      setDraft(formatNumber(value))
      return
    }

    setDraft(String(parsed))
    if (parsed !== value) onCommit(parsed)
  }

  return (
    <div className={`space-y-2 ${className || ""}`}>
      {label && <Label htmlFor={id}>{label}</Label>}
      <Input
        id={id}
        type="text"
        inputMode="decimal"
        placeholder={placeholder}
        value={draft}
        onFocus={() => {
          isEditing.current = true
        }}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === "Enter") e.currentTarget.blur()
          if (e.key === "Escape") {
            reset()
            e.currentTarget.blur()
          }
        }}
      />
    </div>
  )
}
