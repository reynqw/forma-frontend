import { Helmet } from 'react-helmet-async'

interface Props {
  title: string
  description?: string
}

export default function PageHead({ title, description }: Props) {
  const fullTitle = title ? `${title} — FORMA` : 'FORMA — Платформа дизайн-ресурсов'

  return (
    <Helmet>
      <title>{fullTitle}</title>
      {description && <meta name="description" content={description} />}
      <meta property="og:title" content={fullTitle} />
      {description && <meta property="og:description" content={description} />}
    </Helmet>
  )
}
