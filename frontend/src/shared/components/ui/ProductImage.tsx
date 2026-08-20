const FALLBACK = 'https://placehold.co/400x400/f5f5f5/aaaaaa?text=No+Image'

interface Props extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string
  alt: string
}

export function ProductImage({ src, alt, ...rest }: Props) {
  return (
    <img
      src={src}
      alt={alt}
      onError={(e) => {
        const img = e.currentTarget
        if (img.src !== FALLBACK) img.src = FALLBACK
      }}
      {...rest}
    />
  )
}
