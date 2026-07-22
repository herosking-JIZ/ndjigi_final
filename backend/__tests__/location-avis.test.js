const mockLocationFindUnique = jest.fn()
const mockAvisFindFirst = jest.fn()
const mockTxAvisCreate = jest.fn()
const mockTxAvisAggregate = jest.fn()
const mockTxUtilisateurUpdate = jest.fn()
const mockTxChauffeurFindUnique = jest.fn()
const mockTxPassagerFindUnique = jest.fn()
const mockTxProprietaireFindUnique = jest.fn()
const mockTxProprietaireUpdate = jest.fn()

const mockTransaction = jest.fn(async (callback) => callback({
  avis: { create: mockTxAvisCreate, aggregate: mockTxAvisAggregate },
  utilisateur: { update: mockTxUtilisateurUpdate },
  chauffeur: { findUnique: mockTxChauffeurFindUnique },
  passager: { findUnique: mockTxPassagerFindUnique },
  proprietaire: { findUnique: mockTxProprietaireFindUnique, update: mockTxProprietaireUpdate },
}))

jest.mock('../src/config/db', () => ({
  prisma: {
    location: { findUnique: mockLocationFindUnique },
    avis: { findFirst: mockAvisFindFirst },
    $transaction: mockTransaction,
  },
}))

const AvisController = require('../src/controllers/avisController')

const idPassager = '11111111-1111-4111-8111-111111111111'
const idProprietaire = '22222222-2222-4222-8222-222222222222'
const idLocation = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'

function buildLocation(overrides = {}) {
  return {
    statut: 'terminee',
    passager: { id_passager: idPassager },
    vehicule: { vehicule: { id_proprietaire: idProprietaire } },
    ...overrides,
  }
}

function response() {
  const res = {}
  res.status = jest.fn(() => res)
  res.json = jest.fn(() => res)
  return res
}

describe('POST /avis — notation d’une location', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockAvisFindFirst.mockResolvedValue(null)
    mockTxAvisCreate.mockResolvedValue({ id_avis: 'nouvel-avis' })
    mockTxAvisAggregate.mockResolvedValue({ _avg: { note: 4.5 } })
    mockTxUtilisateurUpdate.mockResolvedValue({})
    mockTxChauffeurFindUnique.mockResolvedValue(null)
    mockTxPassagerFindUnique.mockResolvedValue(null)
    mockTxProprietaireFindUnique.mockResolvedValue({ id_proprietaire: idProprietaire })
    mockTxProprietaireUpdate.mockResolvedValue({})
  })

  test('refuse la notation si la location n’est pas terminée (409)', async () => {
    mockLocationFindUnique.mockResolvedValue(buildLocation({ statut: 'active' }))
    const req = {
      body: { id_evalue: idProprietaire, id_location: idLocation, note: 5 },
      user: { id_utilisateur: idPassager },
    }
    const res = response()

    await AvisController.creer(req, res)

    expect(mockTransaction).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(409)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      errors: { code: 'LOCATION_NON_TERMINEE' },
    }))
  })

  test('refuse si l’évaluateur/évalué ne sont pas les participants de cette location (403)', async () => {
    mockLocationFindUnique.mockResolvedValue(buildLocation())
    const req = {
      body: { id_evalue: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc', id_location: idLocation, note: 5 },
      user: { id_utilisateur: idPassager },
    }
    const res = response()

    await AvisController.creer(req, res)

    expect(mockTransaction).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      errors: { code: 'AVIS_FORBIDDEN' },
    }))
  })

  test('refuse un second avis pour la même location (409)', async () => {
    mockLocationFindUnique.mockResolvedValue(buildLocation())
    mockAvisFindFirst.mockResolvedValue({ id_avis: 'avis-existant' })
    const req = {
      body: { id_evalue: idProprietaire, id_location: idLocation, note: 4 },
      user: { id_utilisateur: idPassager },
    }
    const res = response()

    await AvisController.creer(req, res)

    expect(mockTransaction).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(409)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      errors: { code: 'AVIS_DEJA_ENVOYE' },
    }))
  })

  test('accepte l’avis et met à jour la note moyenne du propriétaire évalué', async () => {
    mockLocationFindUnique.mockResolvedValue(buildLocation())
    const req = {
      body: { id_evalue: idProprietaire, id_location: idLocation, note: 4, commentaire: 'Très bien' },
      user: { id_utilisateur: idPassager },
    }
    const res = response()

    await AvisController.creer(req, res)

    expect(mockTxAvisCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        id_evaluateur: idPassager,
        id_evalue: idProprietaire,
        id_location: idLocation,
        note: 4,
      }),
    }))
    expect(mockTxProprietaireUpdate).toHaveBeenCalledWith({
      where: { id_proprietaire: idProprietaire },
      data: { note_proprietaire: 4.5 },
    })
    expect(res.status).toHaveBeenCalledWith(201)
  })
})
