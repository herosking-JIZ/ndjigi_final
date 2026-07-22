const mockUtilisateurFindUnique = jest.fn()
const mockTxPhotoUpdateMany = jest.fn()
const mockTxPhotoUpdate = jest.fn()
const mockTxUtilisateurUpdate = jest.fn()
const mockUploadPhoto = jest.fn()
const mockDeletePermanent = jest.fn()

jest.mock('../src/config/db', () => ({
  prisma: {
    utilisateur: { findUnique: mockUtilisateurFindUnique },
    $transaction: jest.fn(async (callback) => callback({
      photo: { updateMany: mockTxPhotoUpdateMany, update: mockTxPhotoUpdate },
      utilisateur: { update: mockTxUtilisateurUpdate },
    })),
  },
}))

jest.mock('../src/services/photoService', () => ({
  uploadPhoto: mockUploadPhoto,
  deletePhotoPermanent: mockDeletePermanent,
}))

jest.mock('../src/storage', () => ({ getStorageProvider: jest.fn() }))

const PhotoController = require('../src/controllers/photoController')

const userId = '11111111-1111-4111-8111-111111111111'
const photoId = '22222222-2222-4222-8222-222222222222'

function response() {
  const res = {}
  res.status = jest.fn(() => res)
  res.json = jest.fn(() => res)
  return res
}

function profile(photoProfil) {
  return {
    id_utilisateur: userId,
    email: 'user@ndjigi.test',
    prenom: 'Awa',
    nom: 'Traore',
    numero_telephone: '70000000',
    photo_profil: photoProfil,
    adresse: null,
    statut_compte: 'actif',
    deux_fa_activee: false,
    utilisateur_role: [{ role: 'passager' }],
  }
}

describe('photo de profil persistante', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUtilisateurFindUnique.mockResolvedValue({ photo_profil: null })
    mockUploadPhoto.mockResolvedValue({ id_photo: photoId })
    mockTxPhotoUpdate.mockResolvedValue({})
    mockTxPhotoUpdateMany.mockResolvedValue({ count: 0 })
  })

  test('enregistre le fichier puis persiste son URL sur l’utilisateur', async () => {
    const expectedUrl = `http://api.ndjigi.test/api/v1/public/profile-photos/${photoId}`
    mockTxUtilisateurUpdate.mockResolvedValue(profile(expectedUrl))
    const req = {
      user: { id_utilisateur: userId },
      file: { path: '/tmp/photo', originalname: 'profil.jpg' },
      protocol: 'http',
      get: jest.fn(() => 'api.ndjigi.test'),
    }
    const res = response()

    await PhotoController.uploadProfilePhoto(req, res)

    expect(mockUploadPhoto).toHaveBeenCalledWith(expect.objectContaining({
      file: req.file,
      userId,
      ownerType: 'utilisateur',
      ownerId: userId,
      isPrincipale: true,
    }))
    expect(mockTxUtilisateurUpdate).toHaveBeenCalledWith(expect.objectContaining({
      where: { id_utilisateur: userId },
      data: { photo_profil: expectedUrl },
    }))
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: expect.objectContaining({ photo_profil: expectedUrl, roles: ['passager'] }),
    }))
  })

  test('remplace l’ancienne photo en la désactivant dans la même transaction', async () => {
    const oldPhotoId = '33333333-3333-4333-8333-333333333333'
    mockUtilisateurFindUnique.mockResolvedValue({
      photo_profil: `https://api.ndjigi.app/api/v1/public/profile-photos/${oldPhotoId}`,
    })
    mockTxUtilisateurUpdate.mockResolvedValue(profile(`https://api.ndjigi.app/api/v1/public/profile-photos/${photoId}`))
    const req = {
      user: { id_utilisateur: userId },
      file: { path: '/tmp/photo', originalname: 'profil.jpg' },
      protocol: 'https',
      get: jest.fn(() => 'api.ndjigi.app'),
    }

    await PhotoController.uploadProfilePhoto(req, response())

    expect(mockTxPhotoUpdateMany).toHaveBeenCalledWith({
      where: { id_photo: oldPhotoId, id_utilisateur: userId, owner_type: 'utilisateur' },
      data: { deletedAt: expect.any(Date), is_principale: false },
    })
  })

  test('supprime la référence utilisateur et désactive la photo', async () => {
    mockUtilisateurFindUnique.mockResolvedValue({
      photo_profil: `http://api.ndjigi.test/api/v1/public/profile-photos/${photoId}`,
    })
    mockTxUtilisateurUpdate.mockResolvedValue(profile(null))
    const req = { user: { id_utilisateur: userId } }
    const res = response()

    await PhotoController.deleteProfilePhoto(req, res)

    expect(mockTxPhotoUpdateMany).toHaveBeenCalledWith({
      where: { id_photo: photoId, id_utilisateur: userId, owner_type: 'utilisateur' },
      data: { deletedAt: expect.any(Date), is_principale: false },
    })
    expect(mockTxUtilisateurUpdate).toHaveBeenCalledWith(expect.objectContaining({
      data: { photo_profil: null },
    }))
    expect(res.status).toHaveBeenCalledWith(200)
  })
})
