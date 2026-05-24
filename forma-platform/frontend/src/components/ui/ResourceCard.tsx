import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Heart, ShoppingCart, Star, Download, Type } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import type { Resource } from '@/api/resources'
import { useCartStore } from '@/store/cartStore'
import { favoritesApi } from '@/api/favorites'
import { useAuthStore } from '@/store/authStore'
import toast from 'react-hot-toast'

interface ResourceCardProps {
  resource: Resource
  showAuthor?: boolean
}

export default function ResourceCard({ resource, showAuthor = true }: ResourceCardProps) {
  const { isAuthenticated } = useAuthStore()
  const { addItem } = useCartStore()
  const qc = useQueryClient()
  const [isFav, setIsFav] = useState(false)
  const [addingToCart, setAddingToCart] = useState(false)

  const preview = resource.previewUrls?.[0] ?? resource.previewUrl ?? ''
  const [imgError, setImgError] = useState(!preview)

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!isAuthenticated) {
      toast.error('Войдите, чтобы добавить в корзину')
      return
    }
    setAddingToCart(true)
    try {
      await addItem(resource.id)
      toast.success('Добавлено в корзину')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message
      toast.error(msg ?? 'Ошибка при добавлении')
    } finally {
      setAddingToCart(false)
    }
  }

  const handleToggleFav = async (e: React.MouseEvent) => {
    e.preventDefault()
    if (!isAuthenticated) {
      toast.error('Войдите, чтобы добавить в избранное')
      return
    }
    try {
      if (isFav) {
        await favoritesApi.removeFavorite(resource.id)
        setIsFav(false)
      } else {
        await favoritesApi.addFavorite(resource.id)
        setIsFav(true)
      }
      qc.invalidateQueries({ queryKey: ['favorites'] })
    } catch {
      toast.error('Ошибка')
    }
  }

  return (
    <Link to={`/resources/${resource.slug}`} className="resource-card block group">
      {/* Preview image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-surface-200">
        {imgError ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-surface-100 to-surface-200">
            <Type className="w-12 h-12 text-surface-400 mb-2" />
            <span className="text-xs text-surface-400 font-medium">{resource.type?.name ?? 'Ресурс'}</span>
          </div>
        ) : (
          <img
            src={preview}
            alt={resource.name}
            className="w-full h-full object-cover transition-transform duration-500 ease-apple group-hover:scale-[1.05]"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        )}

        {/* Actions overlay */}
        <div className="absolute top-3 right-3 flex flex-col gap-2 translate-y-2 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300 ease-apple">
          <button
            onClick={handleToggleFav}
            className="w-8 h-8 rounded-lg bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white hover:scale-110 transition-all duration-200 shadow-sm"
            aria-label="Добавить в избранное"
          >
            <Heart className={`w-4 h-4 transition-colors duration-200 ${isFav ? 'fill-red-500 text-red-500' : 'text-text-secondary'}`} />
          </button>
          <button
            onClick={handleAddToCart}
            disabled={addingToCart}
            className="w-8 h-8 rounded-lg bg-white/90 backdrop-blur-sm flex items-center justify-center hover:bg-white hover:scale-110 transition-all duration-200 shadow-sm disabled:opacity-50"
            aria-label="Добавить в корзину"
          >
            <ShoppingCart className="w-4 h-4 text-text-secondary" />
          </button>
        </div>

        {/* Type badge */}
        <div className="absolute bottom-3 left-3">
          <span className="badge bg-white/90 backdrop-blur-sm text-text-secondary shadow-sm">
            {resource.type?.name}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold text-text-primary text-sm leading-tight mb-1 line-clamp-2 group-hover:text-primary-500 transition-colors duration-300">
          {resource.name}
        </h3>

        {showAuthor && (
          <p className="text-xs text-text-muted mb-3">
            {resource.author?.fullName}
          </p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {resource.price === 0 ? (
              <span className="font-bold text-green-500">Бесплатно</span>
            ) : resource.discount && resource.discount > 0 ? (
              <>
                <span className="font-bold text-text-primary">{resource.effectivePrice} ₽</span>
                <span className="text-xs text-text-muted line-through">{resource.price} ₽</span>
              </>
            ) : (
              <span className="font-bold text-text-primary">{resource.price} ₽</span>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-text-muted">
            {resource.avgRating > 0 && (
              <span className="flex items-center gap-1">
                <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                {resource.avgRating.toFixed(1)}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Download className="w-3 h-3" />
              {resource.downloadCount}
            </span>
          </div>
        </div>
      </div>
    </Link>
  )
}
