import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Globe, Download, Star, Package, CheckCircle, AlertCircle } from 'lucide-react'
import { authorApi } from '@/api/author'
import ResourceCard from '@/components/ui/ResourceCard'
import Pagination from '@/components/ui/Pagination'
import Spinner from '@/components/ui/Spinner'

export default function AuthorPublicPage() {
  const { username } = useParams<{ username: string }>()
  const [page, setPage] = useState(0)

  const { data: profileData, isLoading: pLoading } = useQuery({
    queryKey: ['author', username],
    queryFn: () => authorApi.getPublicProfile(username!),
    enabled: !!username,
  })

  const { data: resourcesData, isLoading: rLoading } = useQuery({
    queryKey: ['author-resources', username, page],
    queryFn: () => authorApi.getPublicResources(username!, page, 12),
    enabled: !!username,
  })

  const profile = profileData?.data
  const resources = resourcesData?.data?.content ?? []
  const totalPages = resourcesData?.data?.totalPages ?? 0

  if (pLoading) {
    return <div className="flex justify-center items-center min-h-[60vh]"><Spinner size="lg" /></div>
  }

  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <AlertCircle className="w-16 h-16 text-text-muted" />
        <h2 className="text-xl font-semibold text-text-primary">Автор не найден</h2>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Author profile header */}
      <div className="card p-8 mb-10">
        <div className="flex flex-col sm:flex-row items-start gap-6">
          {/* Avatar */}
          <div className="w-24 h-24 rounded-2xl bg-primary-100 flex items-center justify-center shrink-0">
            {profile.avatarUrl ? (
              <img src={profile.avatarUrl} alt={profile.displayName} className="w-full h-full rounded-2xl object-cover" />
            ) : (
              <span className="text-4xl font-bold text-primary-600">
                {(profile.displayName || profile.username)[0].toUpperCase()}
              </span>
            )}
          </div>

          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-bold text-text-primary">
                {profile.displayName || profile.username}
              </h1>
              {profile.verificationStatus === 'VERIFIED' && (
                <CheckCircle className="w-5 h-5 text-blue-500" aria-label="Верифицированный автор" />
              )}
            </div>
            <p className="text-text-muted text-sm mb-3">@{profile.username}</p>

            {profile.bio && (
              <p className="text-text-secondary leading-relaxed mb-4 max-w-2xl">{profile.bio}</p>
            )}

            {profile.website && (
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-primary-500 hover:text-primary-600"
              >
                <Globe className="w-4 h-4" />
                {profile.website.replace(/^https?:\/\//, '')}
              </a>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-surface-200">
          {[
            { icon: Package, label: 'Ресурсов', value: profile.resourceCount },
            { icon: Download, label: 'Скачиваний', value: profile.totalDownloads },
            { icon: Star, label: 'Рейтинг', value: profile.avgRating > 0 ? profile.avgRating.toFixed(1) : '—' },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="flex items-center justify-center gap-1.5 text-text-muted mb-1">
                <stat.icon className="w-4 h-4" />
                <span className="text-xs">{stat.label}</span>
              </div>
              <p className="text-xl font-bold text-text-primary">{stat.value}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Resources */}
      <h2 className="section-title mb-6">Ресурсы автора</h2>

      {rLoading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : resources.length === 0 ? (
        <div className="text-center py-16 text-text-secondary">
          Автор пока не опубликовал ресурсы
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {resources.map((r) => (
              <ResourceCard key={r.id} resource={r} showAuthor={false} />
            ))}
          </div>
          <div className="mt-10">
            <Pagination page={page} totalPages={totalPages} onPageChange={(p) => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }) }} />
          </div>
        </>
      )}
    </div>
  )
}
