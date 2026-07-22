jest.mock('../src/config/db', () => ({ prisma: {} }))
jest.mock('../src/storage', () => ({ getStorageProvider: jest.fn() }))
jest.mock('uuid', () => ({ v4: jest.fn(() => 'photo-id') }))
jest.mock('file-type', () => ({ fileTypeFromFile: jest.fn() }))

const { areCompatibleImageMimeTypes } = require('../src/services/photoService')

describe('validation MIME des photos mobiles', () => {
  test('accepte une image déclarée PNG mais réellement recompressée en JPEG', () => {
    expect(areCompatibleImageMimeTypes('image/png', 'image/jpeg')).toBe(true)
  })

  test('accepte un type image identique', () => {
    expect(areCompatibleImageMimeTypes('image/jpeg', 'image/jpeg')).toBe(true)
  })

  test('rejette un type déclaré qui n’est pas une image autorisée', () => {
    expect(areCompatibleImageMimeTypes('application/octet-stream', 'image/jpeg')).toBe(false)
  })

  test('rejette un contenu détecté qui n’est pas une image autorisée', () => {
    expect(areCompatibleImageMimeTypes('image/png', 'application/pdf')).toBe(false)
  })
})
