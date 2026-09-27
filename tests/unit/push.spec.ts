import { describe, expect, it } from 'vitest'
import { urlBase64ToUint8Array } from '@/lib/push'

// Test unitario del helper que convierte la clave VAPID pública (base64url) al
// Uint8Array que pushManager.subscribe necesita como applicationServerKey.
// Es la pieza pura y crítica del registro de push (HU-009): si la conversión
// falla, el navegador no puede suscribirse.

describe('urlBase64ToUint8Array (VAPID)', () => {
  it('decodifica base64url estándar a los bytes correctos', () => {
    // "AQID" (base64) → bytes 1, 2, 3
    expect(Array.from(urlBase64ToUint8Array('AQID'))).toEqual([1, 2, 3])
  })

  it('maneja el padding faltante', () => {
    // "AQI" sin "=" → debe completarse a "AQI=" → bytes 1, 2
    expect(Array.from(urlBase64ToUint8Array('AQI'))).toEqual([1, 2])
  })

  it('traduce los caracteres url-safe (- y _)', () => {
    // "-_8" → "+/8=" en base64 estándar → bytes 251, 255
    expect(Array.from(urlBase64ToUint8Array('-_8'))).toEqual([251, 255])
  })

  it('la clave VAPID real decodifica a un punto EC P-256 válido (65 bytes, prefijo 0x04)', () => {
    const vapid =
      'BGwlNZoOh5NhPlO8MAWja06C1Dzy8BF9z-_Woz3K-7Vb2a0ROefh2rR8Z5tNWrgIPL_xGGjHPlosnZdDuZc-Hs8'
    const bytes = urlBase64ToUint8Array(vapid)
    expect(bytes.length).toBe(65)
    expect(bytes[0]).toBe(0x04) // punto EC sin comprimir
  })
})
