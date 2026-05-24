import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Heart, Trash2, Star, Download, ShoppingCart } from 'lucide-react'
import { favoritesApi } from '@/api/favorites'
import { useCartStore } from '@/store/cartStore'
import { useAuthStore } from '@/store/authStore'
import Spinner from '@/components/ui/Spinner'
import toast from 'react-hot-toast'

export default function FavoritesPage() {
  const [page, setPage] = useState(0)
  const qc = useQueryClient()
  const { addItem } = useCartStore()
  const { isAuthenticated } = useAuthStore()

  const { data, isLoading } = useQuery({
    queryKey: ['favorites', page],
    queryFn: () => favoritesApi.getFavorites(page, 12),
    refetchOnMount: 'always',
  })

  const items = data?.data?.content ?? []
  const totalElements = data?.data?.totalElements ?? 0

  const removeMutation = useMutation({
    mutationFn: (resourceId: number) => favoritesApi.removeFavorite(resourceId),
    onSuccess: () => {
      toast.success('Удалено из избранного')
      qc.invalidateQueries({ queryKey: ['favorites'] })
    },
  })

  const handleAddToCart = async (resourceId: number) => {
    if (!isAuthenticated) { toast.error('Войдите'); return }
    try {
      await addItem(resourceId)
      qc.invalidateQueries({ queryKey: ['cart'] })
      toast.success('Добавлено в корзину')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? 'Ошибка')
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-text-primary mb-1">Моё Избранное</h1>
        <p className="text-text-secondary">
          {totalElements > 0
            ? `Сохранённые шрифты и ресурсы для будущих проектов`
            : 'Добавляйте ресурсы в избранное, нажав на иконку сердца'}
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Spinner size="lg" /></div>
      ) : items.length === 0 ? (
        <div className="text-center py-20">
          <Heart className="w-16 h-16 text-surface-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-text-primary mb-2">Избранное пусто</h2>
          <p className="text-text-secondary mb-6">Добавляйте ресурсы в избранное, нажав на иконку сердца</p>
          <Link to="/catalog" className="btn-primary">Перейти в каталог</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {items.map((item) => {
            const r = item.resource
            const preview = r.previewUrls?.[0]
            return (
              <div key={item.id} className="card overflow-hidden group relative">
                <Link to={`/resources/${r.slug}`}>
                  <div className="relative aspect-[4/3] overflow-hidden bg-surface-200">
                    {preview ? (
                      <img
                        src={preview}
                        alt={r.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-text-muted text-4xl font-bold">
                        {r.name[0]?.toUpperCase()}
                      </div>
                    )}

                    {/* Heart badge (filled) */}
                    <button
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); removeMutation.mutate(r.id) }}
                      className="absolute top-3 right-3 w-8 h-8 rounded-lg bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-red-50 transition-colors shadow-sm z-10"
                      aria-label="Удалить из избранного"
                    >
                      <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                    </button>

                    {/* Type badge */}
                    <div className="absolute bottom-3 left-3">
                      <span className="badge bg-white/90 backdrop-blur-sm text-text-secondary shadow-sm text-xs">
                        {r.type?.name}
                      </span>
                    </div>
                  </div>
                </Link>

                <div className="p-4">
                  <Link to={`/resources/${r.slug}`}>
                    <h3 className="font-semibold text-text-primary text-sm leading-tight mb-1 line-clamp-2 group-hover:text-primary-500 transition-colors">
                      {r.name}
                    </h3>
                  </Link>
                  <p className="text-xs text-text-muted mb-3">
                    от {r.author?.fullName ?? r.author?.username}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="font-bold text-text-primary">
                      {r.price === 0 ? 'Бесплатно' : `${r.price} ₽`}
                    </span>

                    <div className="flex items-center gap-2">
                      {r.avgRating > 0 && (
                        <span className="flex items-center gap-0.5 text-xs text-text-muted">
                          <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                          {r.avgRating.toFixed(1)}
                        </span>
                      )}
                      <button
                        onClick={() => handleAddToCart(r.id)}
                        className="btn-primary text-xs px-3 py-1.5"
                      >
                        В корзину
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
