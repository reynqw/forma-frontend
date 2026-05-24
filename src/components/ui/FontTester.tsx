import { useState, useEffect, useRef } from 'react'
import { Type, Minus, Plus } from 'lucide-react'

interface FontTesterProps {
  fontFamily: string
  fontFileUrl: string
  fontStyle?: string
}

const SAMPLE_TEXT = 'The quick brown fox jumps over the lazy dog'
const SAMPLE_TEXT_RU = 'Съешь ещё этих мягких французских булок, да выпей чаю'

const FONT_SIZES = [14, 16, 20, 24, 32, 40, 48, 64, 72]

const FONT_WEIGHTS = [
  { value: 100, label: 'Thin' },
  { value: 300, label: 'Light' },
  { value: 400, label: 'Regular' },
  { value: 500, label: 'Medium' },
  { value: 600, label: 'SemiBold' },
  { value: 700, label: 'Bold' },
  { value: 800, label: 'ExtraBold' },
  { value: 900, label: 'Black' },
]

export default function FontTester({ fontFamily, fontFileUrl, fontStyle }: FontTesterProps) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)
  const [customText, setCustomText] = useState('')
  const [fontSize, setFontSize] = useState(32)
  const [activeTab, setActiveTab] = useState<'preview' | 'weights' | 'sizes'>('preview')
  const fontFaceRef = useRef<string>(`forma-preview-${fontFamily.replace(/\s+/g, '-')}`)

  // Load font via @font-face
  useEffect(() => {
    const familyName = fontFaceRef.current

    const fontFace = new FontFace(familyName, `url(${fontFileUrl})`, {
      style: 'normal',
      weight: '1 999', // variable font range
    })

    fontFace
      .load()
      .then((loadedFace) => {
        document.fonts.add(loadedFace)
        setLoaded(true)
        setError(false)
      })
      .catch(() => {
        setError(true)
      })

    return () => {
      // Cleanup
      document.fonts.forEach((f) => {
        if (f.family === familyName) {
          document.fonts.delete(f)
        }
      })
    }
  }, [fontFileUrl, fontFamily])

  const displayText = customText || SAMPLE_TEXT
  const familyName = fontFaceRef.current

  if (error) return null

  const tabs = [
    { id: 'preview' as const, label: 'Тестирование' },
    { id: 'weights' as const, label: 'Начертания' },
    { id: 'sizes' as const, label: 'Размеры' },
  ]

  return (
    <div className="card overflow-hidden">
      {/* Tabs */}
      <div className="flex border-b border-surface-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-5 py-3 text-sm font-medium transition-colors relative ${
              activeTab === tab.id
                ? 'text-primary-500'
                : 'text-text-muted hover:text-text-secondary'
            }`}
          >
            {tab.label}
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary-500" />
            )}
          </button>
        ))}
      </div>

      <div className="p-6">
        {!loaded ? (
          <div className="flex items-center justify-center py-8 text-text-muted">
            <div className="w-5 h-5 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin mr-3" />
            Загрузка шрифта...
          </div>
        ) : (
          <>
            {/* Tab: Preview / Testing */}
            {activeTab === 'preview' && (
              <div className="space-y-5">
                {/* Text input */}
                <div>
                  <label className="block text-xs font-medium text-text-muted mb-2 uppercase tracking-wide">
                    Протестируйте шрифт:
                  </label>
                  <input
                    type="text"
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    placeholder="Введите свой текст..."
                    className="input text-base"
                  />
                </div>

                {/* Size control */}
                <div className="flex items-center gap-3">
                  <span className="text-xs text-text-muted uppercase tracking-wide">Размер:</span>
                  <button
                    onClick={() => setFontSize((s) => Math.max(12, s - 4))}
                    className="btn-ghost p-1.5 rounded-lg"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-medium text-text-secondary w-12 text-center">
                    {fontSize}px
                  </span>
                  <button
                    onClick={() => setFontSize((s) => Math.min(96, s + 4))}
                    className="btn-ghost p-1.5 rounded-lg"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                  {/* Quick size buttons */}
                  <div className="hidden sm:flex items-center gap-1 ml-4">
                    {[16, 24, 36, 48, 64].map((s) => (
                      <button
                        key={s}
                        onClick={() => setFontSize(s)}
                        className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                          fontSize === s
                            ? 'bg-primary-100 text-primary-600 font-medium'
                            : 'text-text-muted hover:bg-surface-200'
                        }`}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Preview area */}
                <div className="bg-surface-100 rounded-xl p-6 min-h-[120px] flex items-center">
                  <p
                    style={{
                      fontFamily: `"${familyName}", system-ui, sans-serif`,
                      fontSize: `${fontSize}px`,
                      lineHeight: 1.4,
                      wordBreak: 'break-word',
                    }}
                    className="text-text-primary w-full"
                  >
                    {displayText}
                  </p>
                </div>

                {/* Cyrillic preview */}
                {!customText && (
                  <div className="bg-surface-100 rounded-xl p-6">
                    <p className="text-xs text-text-muted mb-2 uppercase tracking-wide">Кириллица:</p>
                    <p
                      style={{
                        fontFamily: `"${familyName}", system-ui, sans-serif`,
                        fontSize: `${Math.min(fontSize, 32)}px`,
                        lineHeight: 1.4,
                      }}
                      className="text-text-primary"
                    >
                      {SAMPLE_TEXT_RU}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Tab: Weights */}
            {activeTab === 'weights' && (
              <div className="space-y-1">
                {FONT_WEIGHTS.map((w) => (
                  <div
                    key={w.value}
                    className="flex items-start gap-4 py-4 border-b border-surface-100 last:border-0"
                  >
                    <div className="w-20 shrink-0">
                      <p className="text-[11px] text-text-muted uppercase tracking-wide">{w.label}</p>
                      <p className="text-[11px] text-text-muted">{w.value}</p>
                    </div>
                    <p
                      style={{
                        fontFamily: `"${familyName}", system-ui, sans-serif`,
                        fontWeight: w.value,
                        fontSize: '24px',
                        lineHeight: 1.4,
                      }}
                      className="text-text-primary"
                    >
                      {fontFamily}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Tab: Sizes */}
            {activeTab === 'sizes' && (
              <div className="space-y-1">
                {FONT_SIZES.map((s) => (
                  <div
                    key={s}
                    className="flex items-baseline gap-4 py-3 border-b border-surface-100 last:border-0"
                  >
                    <span className="text-xs text-text-muted w-12 text-right shrink-0">{s}px</span>
                    <p
                      style={{
                        fontFamily: `"${familyName}", system-ui, sans-serif`,
                        fontSize: `${s}px`,
                        lineHeight: 1.3,
                        wordBreak: 'break-word',
                      }}
                      className="text-text-primary"
                    >
                      {fontFamily}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
