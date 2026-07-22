const mockProprietaireFindUnique = jest.fn()
const mockTxProprietaireUpsert = jest.fn()
const mockTxVehiculeCreate = jest.fn()
const mockTxVehiculeLocationCreate = jest.fn()
const mockTxVehiculeFindUnique = jest.fn()

const mockTransaction = jest.fn(async (callback) => callback({
  proprietaire: { upsert: mockTxProprietaireUpsert },
  vehicule: { create: mockTxVehiculeCreate, findUnique: mockTxVehiculeFindUnique },
  vehicule_location: { create: mockTxVehiculeLocationCreate },
}))

jest.mock('../src/config/db', () => ({
  prisma: {
    proprietaire: { findUnique: mockProprietaireFindUnique },
    $transaction: mockTransaction,
  },
}))

jest.mock('../src/services/tracking.service', () => ({ enregistrerPosition: jest.fn() }))

const VehiculeController = require('../src/controllers/vehiculeController')

const idProprietaire = '11111111-1111-4111-8111-111111111111'

function buildBody(overrides = {}) {
  return {
    type: 'location',
    immatriculation: 'BF-1234-AA',
    marque: 'Toyota',
    modele: 'Corolla',
    annee: 2020,
    id_categorie: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    nb_places: 5,
    tarif_base_location: 5000,
    tarif_par_jour_location: 15000,
    ...overrides,
  }
}

function response() {
  const res = {}
  res.status = jest.fn(() => res)
  res.json = jest.fn(() => res)
  return res
}

describe('POST /vehicules — création d’un véhicule de location', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockTxProprietaireUpsert.mockResolvedValue({})
    mockTxVehiculeCreate.mockResolvedValue({ id_vehicule: 'veh-1' })
    mockTxVehiculeLocationCreate.mockResolvedValue({})
    mockTxVehiculeFindUnique.mockResolvedValue({ id_vehicule: 'veh-1', vehicule_location: {} })
  })

  test('refuse la création si le propriétaire n’a pas de profil (403 PROPRIETAIRE_NON_VALIDE)', async () => {
    mockProprietaireFindUnique.mockResolvedValue(null)
    const req = {
      body: buildBody(),
      user: { id_utilisateur: idProprietaire, utilisateur_role: [{ role: 'proprietaire' }] },
    }
    const res = response()

    await VehiculeController.creer(req, res)

    expect(mockTransaction).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      errors: { code: 'PROPRIETAIRE_NON_VALIDE' },
    }))
  })

  test('refuse la création si le propriétaire n’est pas encore validé (403 PROPRIETAIRE_NON_VALIDE)', async () => {
    mockProprietaireFindUnique.mockResolvedValue({ statut_validation: 'en_attente' })
    const req = {
      body: buildBody(),
      user: { id_utilisateur: idProprietaire, utilisateur_role: [{ role: 'proprietaire' }] },
    }
    const res = response()

    await VehiculeController.creer(req, res)

    expect(mockTransaction).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      errors: { code: 'PROPRIETAIRE_NON_VALIDE' },
    }))
  })

  test('autorise la création si le propriétaire est validé (201)', async () => {
    mockProprietaireFindUnique.mockResolvedValue({ statut_validation: 'valide' })
    const req = {
      body: buildBody(),
      user: { id_utilisateur: idProprietaire, utilisateur_role: [{ role: 'proprietaire' }] },
    }
    const res = response()

    await VehiculeController.creer(req, res)

    expect(mockTransaction).toHaveBeenCalled()
    expect(mockTxVehiculeLocationCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ id_vehicule: 'veh-1', tarif_base_location: 5000 }),
    }))
    expect(res.status).toHaveBeenCalledWith(201)
  })

  test('l’admin contourne la vérification de validation du propriétaire', async () => {
    const req = {
      body: buildBody(),
      user: { id_utilisateur: idProprietaire, utilisateur_role: [{ role: 'admin' }] },
    }
    const res = response()

    await VehiculeController.creer(req, res)

    expect(mockProprietaireFindUnique).not.toHaveBeenCalled()
    expect(mockTransaction).toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(201)
  })
})
