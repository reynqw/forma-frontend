import { useState, useRef, useEffect, useCallback } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { aiApi, AiAccessInfo, ChatMessage, FontGeneration } from '@/api/ai'
import { Bot, Send, Sparkles, Lock, Loader2, Download, RefreshCw, Wand2, MessageSquare, ThumbsUp, ThumbsDown, Plus, Trash2, Square, MessageCircle, Star, X, Clock, Image, ChevronLeft, ZoomIn } from 'lucide-react'
import Spinner from '@/components/ui/Spinner'
import toast from 'react-hot-toast'

export default function AiStudioPage() {
  const { data: accessData, isLoading: accessLoading } = useQuery({
    queryKey: ['ai-access'],
    queryFn: () => aiApi.checkAccess(),
  })

  const access: AiAccessInfo | undefined = accessData?.data

  if (accessLoading) {
    return <div className="flex justify-center items-center min-h-[60vh]"><Spinner size="lg" /></div>
  }

  if (!access?.hasAccess) {
    return <AccessDenied access={access} />
  }

  return <AiStudioContent />
}

// ────────────────────────────────────────────────────────────────
// Компонент: Доступ запрещён
// ────────────────────────────────────────────────────────────────

function AccessDenied({ access }: { access?: AiAccessInfo }) {
  return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <div className="w-20 h-20 rounded-full bg-surface-100 flex items-center justify-center mx-auto mb-6">
        <Lock className="w-10 h-10 text-surface-400" />
      </div>
      <h1 className="text-2xl font-bold text-text-primary mb-3">AI Studio</h1>
      <p className="text-text-secondary mb-8">
        {access?.reason || 'AI Studio доступна только продвинутым авторам платформы'}
      </p>

      {access && !access.hasAccess && access.requiredResources !== undefined && (
        <div className="bg-surface-50 rounded-xl p-6 text-left max-w-md mx-auto">
          <h3 className="font-semibold text-text-primary mb-4">Требования для доступа:</h3>
          <div className="space-y-3">
            <ProgressItem
              label="Опубликованных ресурсов"
              current={access.publishedResources ?? 0}
              required={access.requiredResources ?? 5}
            />
            <ProgressItem
              label="Продаж"
              current={access.sales ?? 0}
              required={access.requiredSales ?? 10}
            />
            <ProgressItem
              label="Дней на платформе"
              current={access.daysOnPlatform ?? 0}
              required={access.requiredDays ?? 90}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function ProgressItem({ label, current, required }: { label: string; current: number; required: number }) {
  const met = current >= required
  const pct = Math.min(100, Math.round((current / required) * 100))
  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className={met ? 'text-green-600 font-medium' : 'text-text-secondary'}>{label}</span>
        <span className={met ? 'text-green-600 font-medium' : 'text-text-muted'}>
          {current} / {required} {met ? '✓' : ''}
        </span>
      </div>
      <div className="w-full h-2 bg-surface-200 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${met ? 'bg-green-500' : 'bg-primary-500'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────
// Компонент: AI Studio (основной)
// ────────────────────────────────────────────────────────────────

function AiStudioContent() {
  const [activeTab, setActiveTab] = useState<'chat' | 'generate'>('chat')

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-text-primary">AI Studio</h1>
          <p className="text-sm text-text-secondary">Консультант и генератор шрифтов</p>
        </div>
      </div>

      {/* Табы */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setActiveTab('chat')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'chat'
              ? 'bg-primary-500 text-white shadow-md'
              : 'bg-surface-100 text-text-secondary hover:bg-surface-200'
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          AI-Консультант
        </button>
        <button
          onClick={() => setActiveTab('generate')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
            activeTab === 'generate'
              ? 'bg-primary-500 text-white shadow-md'
              : 'bg-surface-100 text-text-secondary hover:bg-surface-200'
          }`}
        >
          <Wand2 className="w-4 h-4" />
          Генератор шрифтов
        </button>
      </div>

      {activeTab === 'chat' ? <ChatTab /> : <GenerateTab />}
    </div>
  )
}

// ────────────────────────────────────────────────────────────────
// Утилита: форматирование markdown в сообщениях AI
// ────────────────────────────────────────────────────────────────

function formatAiMessage(text: string): string {
  return text
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/^### (.+)$/gm, '<strong class="text-sm">$1</strong>')
    .replace(/^## (.+)$/gm, '<strong class="text-sm">$1</strong>')
    .replace(/^# (.+)$/gm, '<strong class="text-base">$1</strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code class="bg-surface-200 px-1 py-0.5 rounded text-xs">$1</code>')
}

// ────────────────────────────────────────────────────────────────
// Таб: AI-Консультант (чат)
// ────────────────────────────────────────────────────────────────

interface SessionInfo { id: number; title: string; updatedAt: string }

function ChatTab() {
  const queryClient = useQueryClient()
  const [sessions, setSessions] = useState<SessionInfo[]>([])
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null)
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [streamingText, setStreamingText] = useState('')
  const [feedbackGiven, setFeedbackGiven] = useState<Record<number, 'up' | 'down'>>({})
  const abortRef = useRef<AbortController | null>(null)

  // Загружаем список сессий при монтировании
  useEffect(() => {
    loadSessions()
  }, [])

  const loadSessions = async () => {
    try {
      const res = await aiApi.getSessions()
      setSessions(res.data)
    } catch { /* ignore */ }
  }

  const loadSession = async (id: number) => {
    try {
      const res = await aiApi.getSession(id)
      setActiveSessionId(id)
      setMessages(res.data.messages || [])
      setFeedbackGiven({})
      setStreamingText('')
    } catch {
      toast.error('Не удалось загрузить чат')
    }
  }

  const createNewChat = async () => {
    if (loading) return
    try {
      const res = await aiApi.createSession()
      setActiveSessionId(res.data.id)
      setMessages([])
      setFeedbackGiven({})
      setStreamingText('')
      await loadSessions()
    } catch {
      toast.error('Не удалось создать чат')
    }
  }

  const deleteChat = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await aiApi.deleteSession(id)
      if (activeSessionId === id) {
        setActiveSessionId(null)
        setMessages([])
      }
      await loadSessions()
    } catch {
      toast.error('Не удалось удалить чат')
    }
  }

  const deleteAllChats = async () => {
    if (!sessions.length) return
    try {
      await aiApi.deleteAllSessions()
      setActiveSessionId(null)
      setMessages([])
      setSessions([])
      toast.success('Все чаты удалены')
    } catch {
      toast.error('Ошибка при удалении')
    }
  }

  const handleFeedback = async (msgIndex: number, isPositive: boolean) => {
    const assistantMsg = messages[msgIndex]
    let userMsg = ''
    for (let i = msgIndex - 1; i >= 0; i--) {
      if (messages[i].role === 'user') { userMsg = messages[i].content; break }
    }
    try {
      await aiApi.sendFeedback(userMsg, assistantMsg.content, isPositive)
      setFeedbackGiven(prev => ({ ...prev, [msgIndex]: isPositive ? 'up' : 'down' }))
      toast.success(isPositive ? 'Спасибо за отзыв!' : 'Спасибо, учтём!')
    } catch { toast.error('Не удалось отправить отзыв') }
  }

  const stopGeneration = () => {
    if (abortRef.current) {
      abortRef.current.abort()
      abortRef.current = null
      if (streamingText) {
        setMessages(prev => [...prev, { role: 'assistant', content: streamingText }])
      }
      setStreamingText('')
      setLoading(false)
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || loading) return
    const userMsg = input.trim()
    setInput('')

    // Если нет активной сессии — создаём
    let sessionId = activeSessionId
    if (!sessionId) {
      try {
        const res = await aiApi.createSession(userMsg.length > 40 ? userMsg.substring(0, 40) + '...' : userMsg)
        sessionId = res.data.id
        setActiveSessionId(sessionId)
        await loadSessions()
      } catch {
        toast.error('Не удалось создать чат')
        return
      }
    }

    // Сохраняем сообщение пользователя в БД
    try { await aiApi.saveMessage(sessionId, 'user', userMsg) } catch { /* ignore */ }

    const historyToSend = [...messages]
    setMessages(prev => [...prev, { role: 'user', content: userMsg }])
    setLoading(true)
    setStreamingText('')

    abortRef.current = aiApi.chatStream(
      userMsg,
      historyToSend,
      (token) => { setStreamingText(prev => prev + token) },
      () => {
        setStreamingText(prev => {
          if (prev) {
            setMessages(msgs => [...msgs, { role: 'assistant', content: prev }])
            // Сохраняем ответ AI в БД
            if (sessionId) {
              aiApi.saveMessage(sessionId, 'assistant', prev).catch(() => {})
            }
          }
          return ''
        })
        setLoading(false)
        abortRef.current = null
        loadSessions() // обновляем список (title мог измениться)
      },
      (err) => {
        toast.error(err)
        const errMsg = 'Извините, произошла ошибка. Попробуйте ещё раз.'
        setMessages(prev => [...prev, { role: 'assistant', content: errMsg }])
        setStreamingText('')
        setLoading(false)
        abortRef.current = null
      },
    )
  }

  const WELCOME = 'Привет! Я — FORMA AI, ваш консультант по типографике и дизайну.\n\nЧем могу помочь:\n• **Подбор шрифтов** для логотипов, сайтов, полиграфии\n• **Шрифтовые пары** — какие шрифты сочетаются\n• **Советы по типографике** — кернинг, интерлиньяж\n• **Рекомендации из каталога** FORMA\n\nЗадайте мне вопрос!'

  return (
    <div className="flex gap-4" style={{ height: 'calc(100vh - 280px)' }}>
      {/* Сайдбар сессий */}
      <div className="w-64 shrink-0 card flex flex-col overflow-hidden">
        <div className="p-3 border-b border-surface-200">
          <button onClick={createNewChat} className="w-full btn-primary text-sm py-2 flex items-center justify-center gap-2">
            <Plus className="w-4 h-4" /> Новый чат
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {sessions.length === 0 ? (
            <div className="p-4 text-center text-text-muted text-xs">
              Нет чатов. Создайте новый!
            </div>
          ) : (
            sessions.map(s => (
              <div
                key={s.id}
                onClick={() => loadSession(s.id)}
                className={`flex items-center gap-2 px-3 py-2.5 cursor-pointer border-b border-surface-100 group transition-colors ${
                  activeSessionId === s.id ? 'bg-primary-50 border-l-2 border-l-primary-500' : 'hover:bg-surface-50'
                }`}
              >
                <MessageCircle className="w-4 h-4 text-text-muted shrink-0" />
                <span className="flex-1 text-sm text-text-primary truncate">{s.title}</span>
                <button
                  onClick={(e) => deleteChat(s.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 text-text-muted hover:text-red-500 transition-all"
                  title="Удалить чат"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>
        {sessions.length > 0 && (
          <div className="p-2 border-t border-surface-200">
            <button onClick={deleteAllChats} className="w-full text-xs text-text-muted hover:text-red-500 py-1.5 transition-colors">
              Удалить все чаты
            </button>
          </div>
        )}
      </div>

      {/* Основной чат */}
      <div className="flex-1 card overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Приветствие если нет сообщений */}
          {messages.length === 0 && !loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="max-w-[75%] bg-surface-100 rounded-2xl px-4 py-3 text-sm leading-relaxed text-text-primary">
                <div className="whitespace-pre-wrap ai-message" dangerouslySetInnerHTML={{ __html: formatAiMessage(WELCOME) }} />
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div key={i}>
              <div className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}
                <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user' ? 'bg-primary-500 text-white' : 'bg-surface-100 text-text-primary'
                }`}>
                  <div className="whitespace-pre-wrap ai-message" dangerouslySetInnerHTML={{ __html: formatAiMessage(msg.content) }} />
                </div>
              </div>
              {msg.role === 'assistant' && (
                <div className="flex gap-1 ml-11 mt-1">
                  <button onClick={() => handleFeedback(i, true)} disabled={!!feedbackGiven[i]}
                    className={`p-1 rounded transition-colors ${feedbackGiven[i] === 'up' ? 'text-green-500' : feedbackGiven[i] ? 'text-text-muted/30 cursor-not-allowed' : 'text-text-muted hover:text-green-500 hover:bg-green-50'}`} title="Полезный ответ">
                    <ThumbsUp className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => handleFeedback(i, false)} disabled={!!feedbackGiven[i]}
                    className={`p-1 rounded transition-colors ${feedbackGiven[i] === 'down' ? 'text-red-500' : feedbackGiven[i] ? 'text-text-muted/30 cursor-not-allowed' : 'text-text-muted hover:text-red-500 hover:bg-red-50'}`} title="Не помогло">
                    <ThumbsDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="max-w-[75%] bg-surface-100 rounded-2xl px-4 py-3 text-sm leading-relaxed text-text-primary">
                {streamingText ? (
                  <div className="whitespace-pre-wrap ai-message" dangerouslySetInnerHTML={{ __html: formatAiMessage(streamingText) }} />
                ) : (
                  <div className="flex items-center gap-2 text-text-muted">
                    <Loader2 className="w-4 h-4 animate-spin text-primary-500" />
                    <span className="text-xs">Думаю...</span>
                  </div>
                )}
                {streamingText && <span className="inline-block w-2 h-4 bg-primary-500 animate-pulse ml-0.5 align-text-bottom rounded-sm" />}
              </div>
            </div>
          )}
        </div>

        {/* Ввод */}
        <div className="shrink-0 border-t border-surface-200 p-4">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendMessage()}
              placeholder="Спросите о шрифтах, типографике, дизайне..."
              className="flex-1 min-w-0 rounded-xl border border-surface-300 bg-white px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              disabled={loading}
            />
            {loading ? (
              <button onClick={stopGeneration}
                className="shrink-0 w-10 h-10 rounded-xl bg-red-500 text-white flex items-center justify-center hover:bg-red-600 transition-colors"
                title="Остановить генерацию">
                <Square className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={sendMessage} disabled={!input.trim()}
                className="shrink-0 w-10 h-10 rounded-xl bg-primary-500 text-white flex items-center justify-center hover:bg-primary-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────
// Таб: Генератор шрифтов
// ────────────────────────────────────────────────────────────────

function GenerateTab() {
  const [style, setStyle] = useState('')
  const [letters, setLetters] = useState('А Б В Г Д Е')
  const [loading, setLoading] = useState(false)
  const [generationStep, setGenerationStep] = useState(0) // 0=idle, 1=prompt, 2=image, 3=advice
  const [generatedImage, setGeneratedImage] = useState('')
  const [advice, setAdvice] = useState('')
  const [generations, setGenerations] = useState<FontGeneration[]>([])
  const [selectedGen, setSelectedGen] = useState<FontGeneration | null>(null)
  const [viewMode, setViewMode] = useState<'create' | 'gallery'>('create')
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null)

  // Загружаем историю при монтировании
  useEffect(() => {
    loadGenerations()
  }, [])

  const loadGenerations = async () => {
    try {
      const res = await aiApi.getGenerations()
      setGenerations(res.data)
    } catch { /* ignore */ }
  }

  const handleGenerate = async () => {
    if (!style.trim()) {
      toast.error('Опишите стиль шрифта')
      return
    }
    setLoading(true)
    setGeneratedImage('')
    setAdvice('')
    setSelectedGen(null)
    setGenerationStep(1)

    try {
      // Этап 1-2: промпт + генерация изображения (на бэкенде за один вызов)
      setTimeout(() => setGenerationStep(2), 2000)
      const res = await aiApi.generateFont(style, letters)
      setGenerationStep(3)
      if (res.data.image) {
        setGeneratedImage(`data:image/jpeg;base64,${res.data.image}`)
      }
      if (res.data.advice) {
        setAdvice(res.data.advice)
      }
      toast.success('Эскиз сгенерирован!')
      await loadGenerations()
    } catch {
      toast.error('Ошибка при генерации. Попробуйте ещё раз.')
    } finally {
      setLoading(false)
      setGenerationStep(0)
    }
  }

  const downloadImage = (imgSrc?: string) => {
    const src = imgSrc || generatedImage
    if (!src) return
    const a = document.createElement('a')
    a.href = src.startsWith('data:') ? src : `data:image/jpeg;base64,${src}`
    a.download = `forma-sketch-${Date.now()}.jpg`
    a.click()
  }

  const toggleFav = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await aiApi.toggleFavorite(id)
      await loadGenerations()
      if (selectedGen?.id === id) {
        setSelectedGen(prev => prev ? { ...prev, isFavorite: !prev.isFavorite } : null)
      }
    } catch { toast.error('Ошибка') }
  }

  const deleteGen = async (id: number, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await aiApi.deleteGeneration(id)
      if (selectedGen?.id === id) setSelectedGen(null)
      await loadGenerations()
      toast.success('Удалено')
    } catch { toast.error('Ошибка при удалении') }
  }

  const openGeneration = (gen: FontGeneration) => {
    setSelectedGen(gen)
    setGeneratedImage(`data:image/jpeg;base64,${gen.image}`)
    setAdvice(gen.advice || '')
    setStyle(gen.styleDescription)
    setLetters(gen.letters)
    setViewMode('create')
  }

  const letterPresets = [
    { label: 'Кириллица (6)', value: 'А Б В Г Д Е' },
    { label: 'Кириллица (10)', value: 'А Б В Г Д Е Ж З И К' },
    { label: 'Латиница (6)', value: 'A B C D E F' },
    { label: 'Латиница (10)', value: 'A B C D E F G H I J' },
    { label: 'Смешанные', value: 'A B C А Б В' },
  ]

  const STEPS = [
    { label: 'Формирование промпта', icon: '📝' },
    { label: 'Генерация изображения', icon: '🎨' },
    { label: 'Анализ и рекомендации', icon: '💡' },
  ]

  return (
    <div>
      {/* Переключатель: Создать / Галерея */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          <button onClick={() => setViewMode('create')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              viewMode === 'create' ? 'bg-white shadow-sm border border-surface-200 text-text-primary' : 'text-text-secondary hover:text-text-primary'
            }`}>
            <Wand2 className="w-4 h-4" /> Создать
          </button>
          <button onClick={() => setViewMode('gallery')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              viewMode === 'gallery' ? 'bg-white shadow-sm border border-surface-200 text-text-primary' : 'text-text-secondary hover:text-text-primary'
            }`}>
            <Image className="w-4 h-4" /> Галерея
            {generations.length > 0 && (
              <span className="bg-primary-100 text-primary-600 text-xs px-1.5 py-0.5 rounded-full">{generations.length}</span>
            )}
          </button>
        </div>
      </div>

      {viewMode === 'gallery' ? (
        /* ── Галерея ── */
        <div>
          {generations.length === 0 ? (
            <div className="card p-12 text-center">
              <Image className="w-16 h-16 text-surface-300 mx-auto mb-4" />
              <p className="text-text-secondary mb-2">История генераций пуста</p>
              <p className="text-xs text-text-muted mb-4">Сгенерируйте первый эскиз шрифта</p>
              <button onClick={() => setViewMode('create')} className="btn-primary">
                <Wand2 className="w-4 h-4" /> Создать эскиз
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {generations.map(gen => (
                <div key={gen.id} onClick={() => openGeneration(gen)}
                  className="card overflow-hidden cursor-pointer group hover:shadow-lg transition-all hover:-translate-y-0.5">
                  <div className="relative aspect-square bg-surface-50">
                    <img src={`data:image/jpeg;base64,${gen.image}`} alt={gen.styleDescription}
                      className="w-full h-full object-cover" />
                    {/* Overlay на hover */}
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                      <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    {/* Избранное */}
                    <button onClick={(e) => toggleFav(gen.id, e)}
                      className={`absolute top-2 right-2 p-1.5 rounded-full transition-all ${
                        gen.isFavorite ? 'bg-yellow-400 text-white' : 'bg-white/80 text-surface-400 opacity-0 group-hover:opacity-100'
                      }`}>
                      <Star className={`w-3.5 h-3.5 ${gen.isFavorite ? 'fill-current' : ''}`} />
                    </button>
                    {/* Удалить */}
                    <button onClick={(e) => deleteGen(gen.id, e)}
                      className="absolute top-2 left-2 p-1.5 rounded-full bg-white/80 text-surface-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="p-3">
                    <p className="text-xs font-medium text-text-primary truncate">{gen.styleDescription}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] text-text-muted">{gen.letters}</span>
                      <span className="text-[10px] text-text-muted ml-auto flex items-center gap-0.5">
                        <Clock className="w-3 h-3" />
                        {new Date(gen.createdAt).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* ── Создание ── */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Левая панель — ввод */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-text-primary mb-4 flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-primary-500" />
              Описание стиля
            </h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Опишите стиль шрифта
                </label>
                <textarea
                  value={style}
                  onChange={e => setStyle(e.target.value)}
                  placeholder="Например: Элегантный каллиграфический шрифт с тонкими штрихами, в стиле свадебных приглашений, изящный и утончённый..."
                  className="input w-full h-32 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-text-secondary mb-1.5">
                  Буквы для генерации
                </label>
                <input
                  type="text"
                  value={letters}
                  onChange={e => setLetters(e.target.value)}
                  placeholder="А Б В или A B C (через пробел)"
                  className="input w-full"
                />
                <p className="text-xs text-text-muted mt-1">Введите буквы через пробел.</p>
                {letters.match(/[А-Яа-яЁё]/) && (
                  <div className="mt-2 flex items-start gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-lg">
                    <span className="text-amber-500 text-sm mt-0.5 shrink-0">⚠</span>
                    <p className="text-xs text-amber-700">
                      <span className="font-medium">Кириллица:</span> нейросеть лучше работает с латинскими буквами. Кириллические символы будут автоматически транслитерированы для генерации. Для наилучшего результата используйте латиницу (A B C).
                    </p>
                  </div>
                )}
                <div className="flex flex-wrap gap-2 mt-2">
                  {letterPresets.map(p => (
                    <button key={p.label} onClick={() => setLetters(p.value)}
                      className={`text-xs px-3 py-1 rounded-full transition-colors ${
                        letters === p.value ? 'bg-primary-500 text-white' : 'bg-surface-100 text-text-secondary hover:bg-primary-50'
                      }`}>
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={handleGenerate} disabled={loading || !style.trim()} className="btn-primary w-full">
                {loading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Генерация...</>
                ) : (
                  <><Sparkles className="w-4 h-4" /> Сгенерировать эскиз</>
                )}
              </button>

              {/* Быстрые стили */}
              <div>
                <p className="text-xs text-text-muted mb-2">Быстрые стили:</p>
                <div className="flex flex-wrap gap-2">
                  {[
                    'Геометрический минимализм, Баухаус',
                    'Каллиграфия, свадебный стиль',
                    'Граффити, уличный арт',
                    'Ретро 70-х, диско',
                    'Готический, средневековый',
                    'Футуристический, sci-fi',
                    'Рукописный, детский',
                    'Брусковый, плакатный',
                  ].map(s => (
                    <button key={s} onClick={() => setStyle(s)}
                      className="text-xs px-3 py-1.5 rounded-full bg-surface-100 text-text-secondary hover:bg-primary-50 hover:text-primary-600 transition-colors">
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Правая панель — результат */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-text-primary">Результат</h3>
              {selectedGen && (
                <button onClick={() => toggleFav(selectedGen.id, {} as React.MouseEvent)}
                  className={`p-1.5 rounded-lg transition-colors ${selectedGen.isFavorite ? 'text-yellow-500 bg-yellow-50' : 'text-text-muted hover:text-yellow-500 hover:bg-yellow-50'}`}
                  title={selectedGen.isFavorite ? 'Убрать из избранного' : 'В избранное'}>
                  <Star className={`w-4 h-4 ${selectedGen.isFavorite ? 'fill-current' : ''}`} />
                </button>
              )}
            </div>

            {loading ? (
              /* Прогресс генерации */
              <div className="flex flex-col items-center justify-center h-80">
                <div className="w-full max-w-xs mb-8">
                  {STEPS.map((step, i) => {
                    const stepNum = i + 1
                    const isActive = generationStep === stepNum
                    const isDone = generationStep > stepNum
                    return (
                      <div key={i} className="flex items-center gap-3 mb-4">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm shrink-0 transition-all ${
                          isDone ? 'bg-green-100 text-green-600' :
                          isActive ? 'bg-primary-100 text-primary-600 ring-2 ring-primary-300 ring-offset-1' :
                          'bg-surface-100 text-text-muted'
                        }`}>
                          {isDone ? '✓' : step.icon}
                        </div>
                        <div className="flex-1">
                          <p className={`text-sm ${isActive ? 'text-text-primary font-medium' : isDone ? 'text-green-600' : 'text-text-muted'}`}>
                            {step.label}
                          </p>
                          {isActive && (
                            <div className="mt-1.5 h-1.5 w-full bg-surface-200 rounded-full overflow-hidden">
                              <div className="h-full bg-primary-500 rounded-full animate-pulse" style={{ width: '60%' }} />
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
                <p className="text-xs text-text-muted">Обычно занимает 15-40 секунд</p>
              </div>
            ) : generatedImage ? (
              <div className="space-y-4">
                <div className="rounded-xl overflow-hidden border border-surface-200 cursor-pointer relative group"
                  onClick={() => setFullscreenImage(generatedImage)}>
                  <img src={generatedImage} alt="Эскиз шрифта" className="w-full" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                    <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => downloadImage()} className="btn-primary flex-1">
                    <Download className="w-4 h-4" /> Скачать
                  </button>
                  <button onClick={handleGenerate} className="btn-secondary flex-1" disabled={loading}>
                    <RefreshCw className="w-4 h-4" /> Ещё вариант
                  </button>
                </div>

                {/* Рекомендации от AI */}
                {advice && (
                  <div className="p-4 bg-surface-50 rounded-xl border border-surface-200">
                    <p className="text-sm font-semibold text-text-primary mb-2 flex items-center gap-2">
                      <Bot className="w-4 h-4 text-primary-500" />
                      Рекомендации AI
                    </p>
                    <div className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap ai-message"
                      dangerouslySetInnerHTML={{ __html: formatAiMessage(advice) }} />
                  </div>
                )}

                <p className="text-xs text-text-muted text-center">
                  Эскиз сохранён в галерею. Доработайте в редакторе и загрузите на платформу.
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-80 text-center">
                <Wand2 className="w-16 h-16 text-surface-300 mb-4" />
                <p className="text-text-secondary">Опишите стиль шрифта и нажмите &laquo;Сгенерировать эскиз&raquo;</p>
                <p className="text-xs text-text-muted mt-2 max-w-sm">
                  Нейросеть создаст визуальный набросок букв в выбранном стиле.
                  Используйте его как основу для создания собственного шрифта.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Полноэкранный просмотр */}
      {fullscreenImage && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-8"
          onClick={() => setFullscreenImage(null)}>
          <button className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            onClick={() => setFullscreenImage(null)}>
            <X className="w-6 h-6" />
          </button>
          <button className="absolute bottom-6 right-6 p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center gap-2"
            onClick={(e) => { e.stopPropagation(); downloadImage(fullscreenImage) }}>
            <Download className="w-5 h-5" /> Скачать
          </button>
          <img src={fullscreenImage} alt="Эскиз" className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
            onClick={e => e.stopPropagation()} />
        </div>
      )}
    </div>
  )
}
