import { useState, useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { SlidersHorizontal, X, Search, Check } from 'lucide-react'
import { resourcesApi, type ResourceFilter } from '@/api/resources'
import ResourceCard from '@/components/ui/ResourceCard'
import Pagination from '@/components/ui/Pagination'
import { ResourceGridSkeleton } from '@/components/ui/Skeleton'
import apiClient from '@/api/client'
import EmptyState from '@/components/ui/EmptyState'
import PageHead from '@/components/ui/PageHead'
import Breadcrumbs from '@/components/ui/Breadcrumbs'
import PriceRangeSlider from '@/components/ui/PriceRangeSlider'
import ErrorState from '@/components/ui/ErrorState'

interface TypeItem { id: number; name: string; slug: string }

const PRICE_MIN = 0
const PRICE_MAX = 10000

const SORT_OPTIONS = [
  { value: 'createdAt_desc', label: 'По новизне' },
  { value: 'downloadCount_desc', label: 'По популярности' },
  { value: 'avgRating_desc', label: 'По рейтингу' },
  { value: 'price_asc', label: 'Цена: по возрастанию' },
  { value: 'price_desc', label: 'Цена: по убыванию' },
]

// ── Parse "1,3,5" → Set<number> ──
function parseTypeIds(raw: string | null): Set<number> {
  if (!raw) return new Set()
  return new Set(
    raw.split(',').map(Number).filter((n) => !isNaN(n) && n > 0),
  )
}

export default function CatalogPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [searchInput, setSearchInput] = useState(searchParams.get('q') ?? '')

  // ── Read params ──
  const page = Number(searchParams.get('page') ?? 0)
  const selectedTypeIds = useMemo(
    () => parseTypeIds(searchParams.get('typeIds')),
    [searchParams],
  )
  const minPrice = searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined
  const maxPrice = searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined
  const q = searchParams.get('q') ?? undefined
  const sortRaw = searchParams.get('sort') ?? 'createdAt_desc'
  const [sortBy, sortDir] = sortRaw.split('_') as [string, 'asc' | 'desc']

  // ── Types list ──
  const { data: typesData } = useQuery({
    queryKey: ['types'],
    queryFn: () => apiClient.get<TypeItem[]>('/types'),
    staleTime: Infinity,
  })
  const allTypes = typesData?.data ?? []

  // ── Build filter for API ──
  const filters: ResourceFilter = useMemo(() => {
    const base: ResourceFilter = {
      minPrice, maxPrice, page, size: 12, sortBy, sortDir,
    }
    if (selectedTypeIds.size === 1) {
      // Single type → use old param for backward compat
      base.typeId = [...selectedTypeIds][0]
    } else if (selectedTypeIds.size > 1) {
      base.typeIds = [...selectedTypeIds]
    }
    return base
  }, [selectedTypeIds, minPrice, maxPrice, page, sortBy, sortDir])

  // ── Catalog data ──
  const { data, isLoading, isFetching, isError, refetch } = useQuery({
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

  // ── Param helpers ──
  const setParam = useCallback(
    (key: string, value: string | undefined) => {
      setSearchParams(prev => {
        const p = new URLSearchParams(prev)
        if (value !== undefined && value !== '') p.set(key, value)
        else p.delete(key)
        p.delete('page')
        return p
      })
    },
    [setSearchParams],
  )

  const setParams = useCallback(
    (updates: Record<string, string | undefined>) => {
      setSearchParams(prev => {
        const p = new URLSearchParams(prev)
        for (const [key, value] of Object.entries(updates)) {
          if (value !== undefined && value !== '') p.set(key, value)
          else p.delete(key)
        }
        p.delete('page')
        return p
      })
    },
    [setSearchParams],
  )

  // ── Type toggle (multi-select) ──
  const toggleType = useCallback(
    (id: number) => {
      const next = new Set(selectedTypeIds)
      if (next.has(id)) next.delete(id)
      else next.add(id)

      setSearchParams(prev => {
        const p = new URLSearchParams(prev)
        // Clean up old single-type param
        p.delete('typeId')
        if (next.size === 0) {
          p.delete('typeIds')
        } else {
          p.set('typeIds', [...next].join(','))
        }
        p.delete('page')
        return p
      })
    },
    [selectedTypeIds, setSearchParams],
  )

  const selectAllTypes = useCallback(() => {
    setSearchParams(prev => {
      const p = new URLSearchParams(prev)
      p.delete('typeId')
      p.delete('typeIds')
      p.delete('page')
      return p
    })
  }, [setSearchParams])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setParam('q', searchInput.trim() || undefined)
  }

  const clearFilters = () => {
    setSearchParams(new URLSearchParams())
    setSearchInput('')
  }

  const hasActiveFilters = selectedTypeIds.size > 0 || minPrice !== undefined || maxPrice !== undefined || q

  const handlePriceChange = useCallback(
    (newMin: number, newMax: number) => {
      setParams({
        minPrice: newMin > PRICE_MIN ? String(newMin) : undefined,
        maxPrice: newMax < PRICE_MAX ? String(newMax) : undefined,
      })
    },
    [setParams],
  )

  // ── Checkbox component ──
  function FilterCheckbox({
    checked,
    label,
    onClick,
  }: {
    checked: boolean
    label: string
    onClick: () => void
  }) {
    return (
      <button
        type="button"
        onClick={onClick}
        className="w-full flex items-center gap-3 px-1 py-1.5 rounded-lg text-sm transition-colors hover:bg-surface-100 group"
      >
        <span
          className={`w-[18px] h-[18px] shrink-0 rounded flex items-center justify-center border-2 transition-all duration-200 ${
            checked
              ? 'bg-primary-500 border-primary-500'
              : 'border-surface-400 group-hover:border-primary-400'
          }`}
        >
          {checked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
        </span>
        <span
          className={`flex-1 text-left transition-colors ${
            checked ? 'text-text-primary font-medium' : 'text-text-secondary'
          }`}
        >
          {label}
        </span>
      </button>
    )
  }

  // ── Sidebar content ──
  const isAllSelected = selectedTypeIds.size === 0
  const sidebarContent = (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-base font-bold text-text-primary">Фильтры</h2>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="text-xs text-red-500 hover:text-red-600 flex items-center gap-1 transition-colors"
          >
            <X className="w-3 h-3" />
            Сбросить
          </button>
        )}
      </div>

      {/* ── Type filter (multi-select) ── */}
      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-2">Тип ресурса</h3>
        <div className="space-y-0.5">
          <FilterCheckbox
            checked={isAllSelected}
            label="Все"
            onClick={selectAllTypes}
          />
          {allTypes.map((t) => (
            <FilterCheckbox
              key={t.id}
              checked={selectedTypeIds.has(t.id)}
              label={t.name}
              onClick={() => toggleType(t.id)}
            />
          ))}
        </div>
      </div>

      <div className="border-t border-surface-200" />

      {/* ── Price filter ── */}
      <div>
        <h3 className="text-sm font-semibold text-text-primary mb-3">Цена (₽)</h3>
        <PriceRangeSlider
          min={PRICE_MIN}
          max={PRICE_MAX}
          valueMin={minPrice ?? PRICE_MIN}
          valueMax={maxPrice ?? PRICE_MAX}
          onChange={handlePriceChange}
          step={100}
        />
        <div className="flex flex-wrap gap-1.5 mt-3">
          <button
            onClick={() => setParams({ minPrice: undefined, maxPrice: '0' })}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              maxPrice === 0
                ? 'bg-primary-500 text-white'
                : 'bg-surface-100 text-text-secondary hover:bg-surface-200'
            }`}
          >
            Бесплатно
          </button>
          <button
            onClick={() => setParams({ minPrice: undefined, maxPrice: '500' })}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              maxPrice === 500 && !minPrice
                ? 'bg-primary-500 text-white'
                : 'bg-surface-100 text-text-secondary hover:bg-surface-200'
            }`}
          >
            до 500 ₽
          </button>
          <button
            onClick={() => setParams({ minPrice: undefined, maxPrice: '2000' })}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              maxPrice === 2000 && !minPrice
                ? 'bg-primary-500 text-white'
                : 'bg-surface-100 text-text-secondary hover:bg-surface-200'
            }`}
          >
            до 2 000 ₽
          </button>
          <button
            onClick={() => setParams({ minPrice: '1', maxPrice: undefined })}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
              minPrice === 1 && maxPrice === undefined
                ? 'bg-primary-500 text-white'
                : 'bg-surface-100 text-text-secondary hover:bg-surface-200'
            }`}
          >
            Платные
          </button>
        </div>
      </div>

      <div className="border-t border-surface-200" />

      {/* Mobile apply */}
      <button
        onClick={() => setFiltersOpen(false)}
        className="w-full btn-primary py-2.5 text-sm lg:hidden"
      >
        Применить
      </button>
    </div>
  )

  // ── Names of selected types for chips ──
  const selectedTypeNames = useMemo(() => {
    if (selectedTypeIds.size === 0) return []
    return allTypes
      .filter((t) => selectedTypeIds.has(t.id))
      .map((t) => ({ id: t.id, name: t.name }))
  }, [selectedTypeIds, allTypes])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHead title="Каталог" description="Каталог дизайн-ресурсов: шрифты, иконки, иллюстрации, шаблоны." />
      <Breadcrumbs items={[{ label: 'Каталог' }]} />

      {/* Page header */}
      <div className="mb-8 animate-fade-in-up">
        <h1 className="text-3xl font-bold text-text-primary mb-1">Каталог</h1>
        <p className="text-text-secondary">
          {totalElements > 0
            ? `Найдено ${totalElements} ресурсов`
            : 'Дизайн-ресурсы для вашего проекта'}
        </p>
      </div>

      <div className="flex gap-8">
        {/* ═══ Desktop sidebar ═══ */}
        <aside className="hidden lg:block w-64 shrink-0">
          <div className="card p-5 sticky top-24">
            {sidebarContent}
          </div>
        </aside>

        {/* ═══ Mobile sidebar overlay ═══ */}
        {filtersOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setFiltersOpen(false)}
            />
            <aside className="absolute left-0 top-0 bottom-0 w-80 max-w-[85vw] bg-white shadow-xl overflow-y-auto">
              <div className="p-5">
                <div className="flex items-center justify-between mb-5">
                  <h2 className="font-bold text-text-primary text-lg">Фильтры</h2>
                  <button
                    onClick={() => setFiltersOpen(false)}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-100 transition-colors"
                  >
                    <X className="w-5 h-5 text-text-secondary" />
                  </button>
                </div>
                {sidebarContent}
              </div>
            </aside>
          </div>
        )}

        {/* ═══ Main content ═══ */}
        <div className="flex-1 min-w-0">
          {/* Toolbar */}
          <div className="flex flex-wrap gap-3 items-center mb-6">
            <form onSubmit={handleSearch} className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Поиск ресурсов..."
                  className="input pl-10 pr-4 py-2.5 text-sm"
                />
              </div>
            </form>

            <select
              value={sortRaw}
              onChange={(e) => setParam('sort', e.target.value)}
              className="input py-2.5 text-sm w-auto min-w-[180px] cursor-pointer"
            >
              {SORT_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>

            <button
              onClick={() => setFiltersOpen(true)}
              className="btn-outline py-2.5 px-4 text-sm lg:hidden flex items-center gap-2"
            >
              <SlidersHorizontal className="w-4 h-4" />
              Фильтры
              {hasActiveFilters && (
                <span className="w-2 h-2 rounded-full bg-primary-500" />
              )}
            </button>
          </div>

          {/* Active filter chips */}
          {hasActiveFilters && (
            <div className="flex flex-wrap gap-2 mb-5">
              {q && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 text-primary-600 rounded-full text-xs font-medium">
                  Поиск: «{q}»
                  <button
                    onClick={() => { setParam('q', undefined); setSearchInput('') }}
                    className="hover:text-primary-800 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {selectedTypeNames.map((t) => (
                <span
                  key={t.id}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 text-primary-600 rounded-full text-xs font-medium"
                >
                  {t.name}
                  <button
                    onClick={() => toggleType(t.id)}
                    className="hover:text-primary-800 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              {(minPrice !== undefined || maxPrice !== undefined) && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 text-primary-600 rounded-full text-xs font-medium">
                  {maxPrice === 0
                    ? 'Бесплатно'
                    : minPrice !== undefined && maxPrice !== undefined
                      ? `${minPrice} — ${maxPrice} ₽`
                      : minPrice !== undefined
                        ? `от ${minPrice} ₽`
                        : `до ${maxPrice} ₽`}
                  <button
                    onClick={() => setParams({ minPrice: undefined, maxPrice: undefined })}
                    className="hover:text-primary-800 transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          )}

          {/* Grid */}
          {isError ? (
            <ErrorState onRetry={() => refetch()} />
          ) : isLoading || isFetching ? (
            <ResourceGridSkeleton count={12} cols={3} />
          ) : resources.length === 0 ? (
            <EmptyState
              icon={Search}
              title="Ничего не найдено"
              description="Попробуйте изменить фильтры или поисковый запрос."
            >
              <button onClick={clearFilters} className="btn-outline mt-2 px-6 py-2.5 text-sm">
                Сбросить фильтры
              </button>
            </EmptyState>
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
