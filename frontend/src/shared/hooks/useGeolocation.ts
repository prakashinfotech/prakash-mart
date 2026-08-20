import { useState } from 'react'

interface LocationResult {
  pincode: string
  city: string
  state: string
}

export function useGeolocation() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const detect = (onResult: (r: LocationResult) => void) => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported by your browser.')
      return
    }
    setLoading(true)
    setError('')
    navigator.geolocation.getCurrentPosition(
      async ({ coords }) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${coords.latitude}&lon=${coords.longitude}&format=json`,
            { headers: { 'Accept-Language': 'en' } }
          )
          const data = await res.json()
          const addr = data.address ?? {}
          onResult({
            pincode: addr.postcode ?? '',
            city: addr.city ?? addr.town ?? addr.village ?? addr.county ?? '',
            state: addr.state ?? '',
          })
        } catch {
          setError('Failed to detect location. Please enter manually.')
        } finally {
          setLoading(false)
        }
      },
      () => {
        setError('Location access denied. Please enter manually.')
        setLoading(false)
      },
      { timeout: 10000 }
    )
  }

  return { detect, loading, error }
}
