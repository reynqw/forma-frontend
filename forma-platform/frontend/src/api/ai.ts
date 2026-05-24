import apiClient from './client'

const API_BASE = import.meta.env.VITE_API_URL || '/api'

export interface AiAccessInfo {
  hasAccess: boolean
  reason?: string
  publishedResources?: number
  requiredResources?: number
  sales?: number
  requiredSales?: number
  daysOnPlatform?: number
  requiredDays?: number
}

export interface GenerationResult {
  status: string
  image?: string // base64
  advice?: string // текстовые рекомендации от Ollama
}

export interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface FontGeneration {
  id: number
  styleDescription: string
  letters: string
  promptUsed?: string
  image: string // base64
  advice?: string
  createdAt: string
  isFavorite: boolean
}

export const aiApi = {
  checkAccess: () =>
    apiClient.get<AiAccessInfo>('/ai/access'),

  chat: (message: string, history?: ChatMessage[]) =>
    apiClient.post<{ response: string }>('/ai/chat', { message, history }),

  /**
   * Потоковый чат через SSE.
   * onToken вызывается для каждого нового токена.
   * onDone — когда генерация завершена.
   * onError — при ошибке.
   * Возвращает AbortController для отмены.
   */
  chatStream: (
    message: string,
    history: ChatMessage[],
    onToken: (token: string) => void,
    onDone: () => void,
    onError: (err: string) => void,
  ): AbortController => {
    const controller = new AbortController()
    const token = localStorage.getItem('accessToken')

    fetch(`${API_BASE}/ai/chat/stream`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ message, history }),
      signal: controller.signal,
    })
      .then(async (res) => {
        if (!res.ok) {
          onError('AI-сервис временно недоступен')
          return
        }

        const reader = res.body?.getReader()
        if (!reader) {
          onError('Streaming не поддерживается')
          return
        }

        const decoder = new TextDecoder()
        let buffer = ''

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          buffer += decoder.decode(value, { stream: true })
          const lines = buffer.split('\n')
          buffer = lines.pop() || '' // последняя неполная строка остаётся в буфере

          for (const line of lines) {
            if (line.startsWith('data:')) {
              // data: может иметь или не иметь пробел после двоеточия
              // Берём всё после "data:" — НЕ trim(), чтобы сохранить пробелы в токенах
              let data = line.substring(5)
              // Убираем только JSON-кавычки если Spring обернул в них
              if (data.startsWith('"') && data.endsWith('"')) {
                data = data.slice(1, -1)
              }
              // Пропускаем [DONE] маркер
              if (data.trim() === '[DONE]') {
                onDone()
                return
              }
              // Пропускаем пустые строки, но НЕ строки с пробелами
              if (data.length > 0) {
                onToken(data)
              }
            }
            // event: строки игнорируем (SSE metadata)
          }
        }

        // Если поток закончился без [DONE]
        onDone()
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          onError('Ошибка подключения к AI-сервису')
        }
      })

    return controller
  },

  generateFont: (style: string, letters?: string) =>
    apiClient.post<GenerationResult>('/ai/generate-font', { style, letters }, { timeout: 120000 }),

  generatePrompt: (style: string) =>
    apiClient.post<{ prompt: string }>('/ai/font-prompt', { style }),

  sendFeedback: (messageText: string, responseText: string, positive: boolean, comment?: string) =>
    apiClient.post('/ai/feedback', { messageText, responseText, positive, comment }),

  // История генераций шрифтов
  getGenerations: () =>
    apiClient.get<FontGeneration[]>('/ai/generations'),

  getGeneration: (id: number) =>
    apiClient.get<FontGeneration>(`/ai/generations/${id}`),

  toggleFavorite: (id: number) =>
    apiClient.post(`/ai/generations/${id}/favorite`),

  deleteGeneration: (id: number) =>
    apiClient.delete(`/ai/generations/${id}`),

  deleteAllGenerations: () =>
    apiClient.delete('/ai/generations'),

  // Сессии чатов
  getSessions: () =>
    apiClient.get<{ id: number; title: string; updatedAt: string }[]>('/ai/sessions'),

  createSession: (title?: string) =>
    apiClient.post<{ id: number; title: string }>('/ai/sessions', { title }),

  getSession: (id: number) =>
    apiClient.get<{ id: number; title: string; messages: ChatMessage[] }>(`/ai/sessions/${id}`),

  saveMessage: (sessionId: number, role: string, content: string) =>
    apiClient.post(`/ai/sessions/${sessionId}/messages`, { role, content }),

  deleteSession: (id: number) =>
    apiClient.delete(`/ai/sessions/${id}`),

  deleteAllSessions: () =>
    apiClient.delete('/ai/sessions'),
}
