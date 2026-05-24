import { useState, useCallback, useRef, useEffect } from 'react'

interface PriceRangeSliderProps {
  min: number
  max: number
  valueMin: number
  valueMax: number
  onChange: (min: number, max: number) => void
  step?: number
}

export default function PriceRangeSlider({
  min,
  max,
  valueMin,
  valueMax,
  onChange,
  step = 100,
}: PriceRangeSliderProps) {
  const [localMin, setLocalMin] = useState(valueMin)
  const [localMax, setLocalMax] = useState(valueMax)
  const [dragging, setDragging] = useState<'min' | 'max' | null>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const commitTimeout = useRef<ReturnType<typeof setTimeout>>()

  // Sync from parent
  useEffect(() => {
    if (!dragging) {
      setLocalMin(valueMin)
      setLocalMax(valueMax)
    }
  }, [valueMin, valueMax, dragging])

  const range = max - min || 1
  const leftPercent = ((localMin - min) / range) * 100
  const rightPercent = ((localMax - min) / range) * 100

  const scheduleCommit = useCallback(
    (newMin: number, newMax: number) => {
      if (commitTimeout.current) clearTimeout(commitTimeout.current)
      commitTimeout.current = setTimeout(() => {
        onChange(newMin, newMax)
      }, 400)
    },
    [onChange],
  )

  const handleMinChange = (val: number) => {
    const clamped = Math.max(min, Math.min(val, localMax - step))
    setLocalMin(clamped)
    scheduleCommit(clamped, localMax)
  }

  const handleMaxChange = (val: number) => {
    const clamped = Math.min(max, Math.max(val, localMin + step))
    setLocalMax(clamped)
    scheduleCommit(localMin, clamped)
  }

  const handleTrackClick = (e: React.MouseEvent) => {
    if (!trackRef.current || dragging) return
    const rect = trackRef.current.getBoundingClientRect()
    const percent = (e.clientX - rect.left) / rect.width
    const value = Math.round((min + percent * range) / step) * step

    const distToMin = Math.abs(value - localMin)
    const distToMax = Math.abs(value - localMax)

    if (distToMin <= distToMax) {
      handleMinChange(value)
    } else {
      handleMaxChange(value)
    }
  }

  const handleInputMin = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d]/g, '')
    if (raw === '') {
      setLocalMin(min)
      scheduleCommit(min, localMax)
      return
    }
    const val = Number(raw)
    setLocalMin(val)
    if (val >= min && val <= localMax - step) {
      scheduleCommit(val, localMax)
    }
  }

  const handleInputMax = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^\d]/g, '')
    if (raw === '') {
      setLocalMax(max)
      scheduleCommit(localMin, max)
      return
    }
    const val = Number(raw)
    setLocalMax(val)
    if (val <= max && val >= localMin + step) {
      scheduleCommit(localMin, val)
    }
  }

  const handleInputBlurMin = () => {
    const clamped = Math.max(min, Math.min(localMin, localMax - step))
    setLocalMin(clamped)
    if (commitTimeout.current) clearTimeout(commitTimeout.current)
    onChange(clamped, localMax)
  }

  const handleInputBlurMax = () => {
    const clamped = Math.min(max, Math.max(localMax, localMin + step))
    setLocalMax(clamped)
    if (commitTimeout.current) clearTimeout(commitTimeout.current)
    onChange(localMin, clamped)
  }

  return (
    <div className="space-y-4">
      {/* Slider track */}
      <div className="px-2 pt-2 pb-1">
        <div
          ref={trackRef}
          className="relative h-1.5 bg-surface-200 rounded-full cursor-pointer"
          onClick={handleTrackClick}
        >
          {/* Active range highlight */}
          <div
            className="absolute h-full bg-primary-500 rounded-full"
            style={{
              left: `${leftPercent}%`,
              width: `${rightPercent - leftPercent}%`,
            }}
          />

          {/* Min thumb */}
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={localMin}
            onChange={(e) => handleMinChange(Number(e.target.value))}
            onMouseDown={() => setDragging('min')}
            onMouseUp={() => setDragging(null)}
            onTouchStart={() => setDragging('min')}
            onTouchEnd={() => setDragging(null)}
            className="range-thumb absolute inset-0 w-full pointer-events-none appearance-none bg-transparent"
            style={{ zIndex: localMin > max - step * 2 ? 5 : 3 }}
            aria-label="Минимальная цена"
          />

          {/* Max thumb */}
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={localMax}
            onChange={(e) => handleMaxChange(Number(e.target.value))}
            onMouseDown={() => setDragging('max')}
            onMouseUp={() => setDragging(null)}
            onTouchStart={() => setDragging('max')}
            onTouchEnd={() => setDragging(null)}
            className="range-thumb absolute inset-0 w-full pointer-events-none appearance-none bg-transparent"
            style={{ zIndex: 4 }}
            aria-label="Максимальная цена"
          />
        </div>
      </div>

      {/* Number inputs */}
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <input
            type="text"
            inputMode="numeric"
            value={localMin}
            onChange={handleInputMin}
            onBlur={handleInputBlurMin}
            className="w-full px-3 py-2 text-sm bg-surface-100 border border-surface-300 rounded-lg text-center text-text-primary focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
            aria-label="Цена от"
          />
        </div>
        <span className="text-text-muted text-xs">—</span>
        <div className="flex-1 relative">
          <input
            type="text"
            inputMode="numeric"
            value={localMax}
            onChange={handleInputMax}
            onBlur={handleInputBlurMax}
            className="w-full px-3 py-2 text-sm bg-surface-100 border border-surface-300 rounded-lg text-center text-text-primary focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-colors"
            aria-label="Цена до"
          />
        </div>
      </div>
    </div>
  )
}
