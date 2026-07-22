const mockChauffeurFindUnique = jest.fn()
const mockChauffeurUpdate = jest.fn()
const mockTrajetFindFirst = jest.fn()

jest.mock('../src/config/db', () => ({
  prisma: {
    chauffeur: { findUnique: mockChauffeurFindUnique, update: mockChauffeurUpdate },
    trajet: { findFirst: mockTrajetFindFirst },
  },
}))
jest.mock('../src/services/tracking.service', () => ({ enregistrerPosition: jest.fn() }))

const ChauffeurController = require('../src/controllers/chauffeurController')

function response() {
  const res = {}
  res.status = jest.fn(() => res)
  res.json = jest.fn(() => res)
  return res
}

const reqBase = {
  user: { id_utilisateur: '11111111-1111-4111-8111-111111111111' },
}

describe('disponibilité chauffeur VTC', () => {
  beforeEach(() => jest.clearAllMocks())

  test('interdit au client de se déclarer lui-même en course', async () => {
    const res = response()
    await ChauffeurController.changerDisponibilite(
      { ...reqBase, body: { statut_disponibilite: 'en_course' } },
      res,
    )
    expect(res.status).toHaveBeenCalledWith(400)
    expect(mockChauffeurUpdate).not.toHaveBeenCalled()
  })

  test('refuse la mise en ligne sans affectation active', async () => {
    mockChauffeurFindUnique.mockResolvedValue({
      statut_validation: 'valide',
      date_expiration_permis: null,
      utilisateur: { statut_compte: 'actif', supprime_le: null },
      affectation_vehicule: [],
    })
    mockTrajetFindFirst.mockResolvedValue(null)
    const res = response()

    await ChauffeurController.changerDisponibilite(
      { ...reqBase, body: { statut_disponibilite: 'en_ligne' } },
      res,
    )

    expect(res.status).toHaveBeenCalledWith(409)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      errors: { code: 'NO_ACTIVE_VEHICLE' },
    }))
  })
})
