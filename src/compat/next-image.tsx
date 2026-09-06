import type { CSSProperties, ImgHTMLAttributes } from 'react'

type NextImageProps = Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'width' | 'height'> & {
  src: string | { src: string }
  alt: string
  width?: number | string
  height?: number | string
  fill?: boolean
  priority?: boolean
  quality?: number
  placeholder?: string
  blurDataURL?: string
  loader?: unknown
  unoptimized?: boolean
  sizes?: string
  style?: CSSProperties
}

/** Drop-in replacement for `next/image` that renders a plain <img>. */
export default function NextImage({
  src,
  alt,
  width,
  height,
  fill,
  priority,
  quality: _quality,
  placeholder: _placeholder,
  blurDataURL: _blurDataURL,
  loader: _loader,
  unoptimized: _unoptimized,
  sizes,
  style,
  ...rest
}: NextImageProps) {
  const url = typeof src === 'string' ? src : src?.src
  const computedStyle: CSSProperties = fill
    ? { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', ...style }
    : style ?? {}
  return (
    <img
      src={url}
      alt={alt}
      sizes={sizes}
      width={fill ? undefined : (width as number | undefined)}
      height={fill ? undefined : (height as number | undefined)}
      loading={priority ? 'eager' : 'lazy'}
      style={computedStyle}
      {...rest}
    />
  )
}
