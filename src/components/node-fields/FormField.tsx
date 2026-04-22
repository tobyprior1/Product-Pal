import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface FormFieldProps {
  label: string
  id: string
  value: string | number
  onChange: (value: string) => void
  type?: "text" | "number" | "date"
  placeholder?: string
  className?: string
  min?: string
}

export function FormField({ label, id, value, onChange, type = "text", placeholder, className, min }: FormFieldProps) {
  return (
    <div className={`space-y-2 ${className || ""}`}>
      <Label htmlFor={id} className="text-xs">
        {label}
      </Label>
      <Input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        min={min}
      />
    </div>
  )
}

interface TextareaFieldProps {
  label: string
  id: string
  value: string
  onChange: (value: string) => void
  rows?: number
  placeholder?: string
}

export function TextareaField({ label, id, value, onChange, rows = 3, placeholder }: TextareaFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        placeholder={placeholder}
      />
    </div>
  )
}

interface SelectFieldProps {
  label: string
  id: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
  placeholder?: string
}

export function SelectField({ label, id, value, onChange, options, placeholder }: SelectFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

interface DateRangeFieldProps {
  startLabel?: string
  endLabel?: string
  startValue: string
  endValue: string
  onStartChange: (value: string) => void
  onEndChange: (value: string) => void
  showEnd?: boolean
}

export function DateRangeField({
  startLabel = "Start Date",
  endLabel = "End Date",
  startValue,
  endValue,
  onStartChange,
  onEndChange,
  showEnd = true,
}: DateRangeFieldProps) {
  return (
    <div className="grid grid-cols-2 gap-3">
      <FormField label={startLabel} id="startDate" value={startValue} onChange={onStartChange} type="date" />
      {showEnd && (
        <FormField
          label={endLabel}
          id="endDate"
          value={endValue}
          onChange={onEndChange}
          type="date"
          min={startValue || undefined}
        />
      )}
    </div>
  )
}
