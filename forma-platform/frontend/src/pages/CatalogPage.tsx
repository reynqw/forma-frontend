import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { SlidersHorizontal, X, Search } from 'lucide-react'
import { resourcesApi, type ResourceFilter } from '@/api/resources'
import ResourceCard from '@/components/ui/ResourceCard'
import Pagination from '@/components/ui/Pagination'
import Spinner from '@/components/ui/Spinner'
import apiClient from '@/api/client'

interface TypeItem { id: number; name: string; slug: string }

const SORT_OPTIONS = [
  { value: 'createdAt_desc', label: 'Новинки' },
  { value: 'downloadCount_desc', label: 'Популярные' },
  { value: 'avgRating_desc', label: 'По рейтингу' },
  { value: 'price_asc', label: 'Цена ↑' },
  { value: 'price_desc', label: 'Цена ↓' },
]

export default function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [searchInput, setSearchInput] = useState(searchParams.get('q') ?? '')

  const page = Number(searchParams.get('page') ?? 0)
  const typeId = searchParams.get('typeId') ? Number(searchParams.get('typeId')) : undefined
  const minPrice = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined
  const maxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined
  const q = searchParams.get('q') ?? undefined
  const sortRaw = searchParams.get('sort') ?? 'createdAt_desc'
  const [sortBy, sortDir] = sortRaw.split('_') as [string, 'asc' | 'desc']

  const { data: typesData } = useQuery({
    queryKey: ['types'],
    queryFn: () => apiClient.get<TypeItem[]>('/types'),
    staleTime: Infinity,
  })

  const filters: ResourceFilter = {
    typeId, minPrice, maxPrice,
    page, size: 12, sortBy, sortDir,
  }

  const { data, isLoading, isFetching } = useQuery({
    queryKey: q
      ? ['resources', 'search', q, page]
      : ['resources', 'catalog', filters],
    queryFn: () =>
      q
        ? resourcesApi.search(q, page, 12)
        : resourcesApi.getCatalog(filters),
  })

  const resources = data?.data?.content ?? []
  const totalPages = data?.data?.totalPages ?? 0
  const totalElements = data?.data?.totalElements ?? 0

  const setParam = (key: string, value: string | undefined) => {
    setSearchParams(prev => {
      const p = new URLSearchParams(prev)
      if (value !== undefined && value !== '') {
        p.set(key, value)
      } else {
        p.delete(key)
      }
      p.delete('page')
      return p
    })
  }

  const setParams = (updates: Record<string, string | undefined>) => {
    setSearchParams(prev => {
      const p = new URLSearchParams(prev)
      for (const [key, value] of Object.entries(updates)) {
        if (value !== undefined && value !== '') {
          p.set(key, value)
        } else {
          p.delete(key)
        }
      }
      p.delete('page')
      return p
    })
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setParam('q', searchInput.trim() || undefined)
  }

  const clearFilters = () => {
    setSearchParams(new URLSearchParams())
    setSearchInput('')
  }

  const hasActiveFilters = typeId || minPrice !== undefined || maxPrice !== undefined || q

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8 animate-fade-in-up">
        <h1 className="text-3xl font-bold text-text-primary mb-1">Каталог</h1>
        <p className="text-text-secondary">
          {totalElements > 0 ? `${totalElements} ресурсов` : 'Дизайн-ресурсы для вашего проекта'}
        </p>
      </div>

      <div className="flex gap-8">
        {/* Sidebar filters */}
        <aside
          className={`${
            filtersOpen ? 'fixed inset-0 z-40 flex' : 'hidden'
          } lg:flex lg:static lg:z-auto lg:flex-col w-72 shrink-0`}
        >
          {/* Mobile overlay */}
          {filtersOpen && (
            <div
              className="fixed inset-0 bg-black/30 lg:hidden"
              onClick={() => setFiltersOpen(false)}
            />
          )}

          <div className="relative z-10 w-72 bg-white lg:bg-transparent rounded-2xl p-6 lg:p-0 space-y-6 overflow-y-auto max-h-screen lg:max-h-none shadow-card-lg lg:shadow-none">
            <div className="flex items-center justify-between lg:hidden">
              <h2 className="font-semibold text-text-primary">Фильтры</h2>
              <button onClick={() => setFiltersOpen(false)}>
                <X className="w-5 h-5 text-text-secondary" />
              </button>
            </div>

            {hasActiveFilters && (
              <button onClick={clearFilters} className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1">
                <X className="w-3 h-3" /> Сбросить фильтры
              </button>
            )}

            {/* Type */}
            <div className="card p-5 lg:p-5">
              <h3 className="text-sm font-semibold text-text-primary mb-3">Тип ресурса</h3>
              <div className="space-y-1">
                <button
                  onClick={() => setParam('typeId', undefined)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    !typeId ? 'bg-primary-50 text-primary-500 font-medium' : 'text-text-secondary hover:text-primary-500 hover:bg-primary-50'
                  }`}
                >
                  Все типы
                </button>
                {typesData?.data?.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setParam('typeId', String(t.id))}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                      typeId === t.id ? 'bg-primary-50 text-primary-500 font-medium' : 'text-text-secondary hover:text-primary-500 hover:bg-primary-50'
                    }`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Price */}
            <div className="card p-5 lg:p-5">
              <h3 className="text-sm font-semibold text-text-primary mb-3">Цена</h3>
              <div className="space-y-1">
                <button
                  onClick={() => setParams({ minPrice: undefined, maxPrice: undefined })}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    minPrice === undefined && maxPrice === undefined ? 'bg-primary-50 text-primary-500 font-medium' : 'text-text-secondary hover:text-primary-500 hover:bg-primary-50'
                  }`}
                >
                  Любая цена
                </button>
                <button
                  onClick={() => setParams({ minPrice: undefined, maxPrice: '0' })}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    maxPrice === 0 ? 'bg-primary-50 text-primary-500 font-medium' : 'text-text-secondary hover:text-primary-500 hover:bg-primary-50'
                  }`}
                >
                  Бесплатно
                </button>
                <button
                  onClick={() => setParams({ minPrice: '1', maxPrice: undefined })}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    minPrice === 1 && maxPrice === undefined ? 'bg-primary-50 text-primary-500 font-medium' : 'text-text-secondary hover:text-primary-500 hover:bg-primary-50'
                  }`}
                >
                  Платные
                </button>
              </div>
            </div>

          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Toolbar */}
          <div className="flex flex-wrap gap-3 items-center mb-6">
            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1 min-w-[200px] flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Поиск..."
                  className="input pl-9 py-2.5 text-sm"
                />
              </div>
            </form>

            {/* Sort */}
            <select
              value={sortRaw}
              onChange={(e) => setParam('sort', e.target.value)}
              className="input py-2.5 text-sm w-auto min-w-[150px]"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>

            {/* Mobile filter toggle */}
            <button
              onClick={() => setFiltersOpen(true)}
              className="btn-outline py-2.5 px-4 text-sm lg:hidden flex items-center gap-2"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Фильтры
            </button>
          </div>

          {/* Active filters chips */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 mb-4">
              {q && (
                <span className="tag">
                  Поиск: «{q}»
                  <button onClick={() => { setParam('q', undefined); setSearchInput('') }} className="ml-1">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {typeId && typesData?.data && (
                <span className="tag">
                  {typesData.data.find((t) => t.id === typeId)?.name}
                  <button onClick={() => setParam('typeId', undefined)} className="ml-1">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {maxPrice === 0 && <span className="tag">Бесплатно <button onClick={() => setParam('maxPrice', undefined)} className="ml-1"><X className="w-3 h-3" /></button></span>}
            </div>
          )}

          {/* Grid */}
          {isLoading || isFetching ? (
            <div className="flex justify-center py-20">
              <Spinner size="lg" />
            </div>
          ) : resources.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-text-secondary text-lg mb-2">Ничего не найдено</p>
              <p className="text-text-muted text-sm">Попробуйте изменить фильтры или поисковый запрос</p>
              <button onClick={clearFilters} className="btn-outline mt-6">
                Сбросить фильтры
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {resources.map((r) => (
                  <ResourceCard key={r.id} resource={r} />
                ))}
              </div>
              <div className="mt-10">
                <Pagination
                  page={page}
                  totalPages={totalPages}
                  onPageChange={(p) => {
                    const sp = new URLSearchParams(searchParams)
                    if (p === 0) sp.delete('page')
                    else sp.set('page', String(p))
                    setSearchParams(sp)
                    window.scrollTo({ top: 0, behavior: 'smooth' })
                  }}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
