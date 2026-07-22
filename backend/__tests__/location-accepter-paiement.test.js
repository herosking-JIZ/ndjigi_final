const mockTxQueryRaw = jest.fn()
const mockTxLocationUpdateMany = jest.fn()
const mockTxLocationFindUnique = jest.fn()
const mockTxLocationFindFirst = jest.fn()
const mockTxVehiculeUpdate = jest.fn()
const mockTxPortefeuilleUpdateMany = jest.fn()
const mockTxPortefeuilleFindUnique = jest.fn()
const mockTxPortefeuilleUpdate = jest.fn()
const mockTxMouvementCreate = jest.fn()
const mockTxPaiementCreate = jest.fn()
const mockTxConversationCreate = jest.fn()
const mockTxParticipantCreateMany = jest.fn()
const mockTxNotificationCreate = jest.fn()

const mockTx = {
  $queryRaw: mockTxQueryRaw,
  location: {
    updateMany: mockTxLocationUpdateMany,
    findUnique: mockTxLocationFindUnique,
    findFirst: mockTxLocationFindFirst,
  },
  vehicule: { update: mockTxVehiculeUpdate },
  portefeuille: {
    updateMany: mockTxPortefeuilleUpdateMany,
    findUnique: mockTxPortefeuilleFindUnique,
    update: mockTxPortefeuilleUpdate,
  },
  mouvement_portefeuille: { create: mockTxMouvementCreate },
  paiement: { create: mockTxPaiementCreate },
  conversation: { create: mockTxConversationCreate },
  conversation_participant: { createMany: mockTxParticipantCreateMany },
  notification: { create: mockTxNotificationCreate },
}
const mockTransaction = jest.fn(async (callback) => callback(mockTx))

jest.mock('../src/config/db', () => ({
  prisma: {
    $transaction: mockTransaction,
  },
}))

const LocationController = require('../src/controllers/locationController')

const idPassager = '11111111-1111-4111-8111-111111111111'
const idProprietaire = '22222222-2222-4222-8222-222222222222'
const idLocation = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'
const idVehicule = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb'
const debut = new Date('2026-08-10T10:00:00.000Z')
const fin = new Date('2026-08-10T12:00:00.000Z')

function buildReqLocation(overrides = {}) {
  return {
    id_location: idLocation,
    id_vehicule: idVehicule,
    statut: 'en_attente',
    montant_total: 50000,
    date_debut: debut,
    date_fin: fin,
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

describe('PATCH /locations/:id/accepter — paiement', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockTxQueryRaw.mockResolvedValue([{ id_vehicule: idVehicule, id_proprietaire: idProprietaire }])
    mockTxLocationUpdateMany.mockResolvedValue({ count: 1 })
    mockTxLocationFindUnique.mockResolvedValue({
      id_location: idLocation,
      id_vehicule: idVehicule,
      id_passager: idPassager,
      statut: 'en_attente',
      montant_total: 50000,
      date_debut: debut,
      date_fin: fin,
    })
    mockTxLocationFindFirst.mockResolvedValue(null)
    mockTxVehiculeUpdate.mockResolvedValue({})
    mockTxPortefeuilleUpdateMany.mockResolvedValue({ count: 1 })
    mockTxPortefeuilleFindUnique.mockImplementation(({ select }) => select
      ? { id_portefeuille: 'pf-passager', solde: 50000 }
      : { statut: 'actif', solde: 100000 })
    mockTxPortefeuilleUpdate.mockResolvedValue({ id_portefeuille: 'pf-proprietaire', solde: 42500 })
    mockTxMouvementCreate.mockResolvedValue({})
    mockTxPaiementCreate.mockResolvedValue({})
    mockTxConversationCreate.mockResolvedValue({ id_conversation: 'conv-1' })
    mockTxParticipantCreateMany.mockResolvedValue({})
    mockTxNotificationCreate.mockResolvedValue({})
  })

  test('débite le locataire et crédite le propriétaire net de la commission', async () => {
    const req = { params: { id: idLocation }, location: buildReqLocation() }
    const res = response()

    await LocationController.accepter(req, res)

    expect(mockTxQueryRaw).toHaveBeenCalledTimes(1)
    expect(mockTxLocationFindFirst).toHaveBeenCalledWith({
      where: {
        id_vehicule: idVehicule,
        id_location: { not: idLocation },
        statut: { in: ['active'] },
        date_debut: { lt: fin },
        date_fin: { gt: debut },
      },
      select: { id_location: true },
    })
    expect(mockTxPortefeuilleUpdateMany).toHaveBeenCalledWith({
      where: { id_utilisateur: idPassager, statut: 'actif', solde: { gte: 50000 } },
      data: { solde: { decrement: 50000 } },
    })
    expect(mockTxPortefeuilleUpdate).toHaveBeenCalledWith(expect.objectContaining({
      where: { id_utilisateur: idProprietaire },
      data: { solde: { increment: 42500 } },
    }))
    expect(mockTxPaiementCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        id_utilisateur: idPassager,
        montant: 50000,
        methode: 'PORTEFEUILLE',
        statut: 'complete',
        type: 'LOCATION_VEHICULE',
        id_objet_lie: idLocation,
      }),
    }))
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: expect.objectContaining({ commission: 7500, montant_net: 42500 }),
    }))
  })

  test('refuse l’acceptation si le solde du locataire est insuffisant (402)', async () => {
    mockTxPortefeuilleFindUnique.mockResolvedValue({ statut: 'actif', solde: 1000 })
    const req = { params: { id: idLocation }, location: buildReqLocation() }
    const res = response()

    await LocationController.accepter(req, res)

    expect(mockTxQueryRaw).toHaveBeenCalledTimes(1)
    expect(mockTxLocationFindFirst).toHaveBeenCalledTimes(1)
    expect(mockTxPortefeuilleUpdateMany).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(402)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      errors: { code: 'SOLDE_INSUFFISANT' },
    }))
  })

  test('refuse une double acceptation concurrente (409, verrou)', async () => {
    mockTxLocationFindUnique.mockResolvedValue({
      id_location: idLocation,
      id_vehicule: idVehicule,
      id_passager: idPassager,
      statut: 'active',
      montant_total: 50000,
      date_debut: debut,
      date_fin: fin,
    })
    const req = { params: { id: idLocation }, location: buildReqLocation() }
    const res = response()

    await LocationController.accepter(req, res)

    expect(mockTxPortefeuilleUpdateMany).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(409)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      errors: { code: 'LOCATION_STATUT_CONFLIT' },
    }))
  })

  test('rejette un chevauchement actif avant tout débit ou mouvement financier', async () => {
    mockTxLocationFindFirst.mockResolvedValue({ id_location: 'location-active-concurrente' })
    const req = { params: { id: idLocation }, location: buildReqLocation() }
    const res = response()

    await LocationController.accepter(req, res)

    expect(mockTxLocationUpdateMany).not.toHaveBeenCalled()
    expect(mockTxPortefeuilleUpdateMany).not.toHaveBeenCalled()
    expect(mockTxMouvementCreate).not.toHaveBeenCalled()
    expect(mockTxPaiementCreate).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(409)
    expect(res.json).toHaveBeenCalledWith({
      success: false,
      message: 'Ce véhicule est déjà réservé sur cette période.',
      data: null,
      errors: { code: 'LOCATION_PERIODE_CONFLIT' },
    })
  })

  test('autorise deux périodes adjacentes avec la règle de chevauchement stricte', async () => {
    const req = { params: { id: idLocation }, location: buildReqLocation() }
    const res = response()

    await LocationController.accepter(req, res)

    const filtre = mockTxLocationFindFirst.mock.calls[0][0].where
    expect(filtre.date_debut).toEqual({ lt: fin })
    expect(filtre.date_fin).toEqual({ gt: debut })
    expect(res.status).toHaveBeenCalledWith(200)
    expect(mockTxPortefeuilleUpdateMany).toHaveBeenCalledTimes(1)
  })

  test('deux acceptations concurrentes du même véhicule ne débitent qu’un passager', async () => {
    const secondeLocationId = 'cccccccc-cccc-4ccc-8ccc-cccccccccccc'
    const secondPassagerId = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd'
    const locations = new Map([
      [idLocation, {
        id_location: idLocation,
        id_vehicule: idVehicule,
        id_passager: idPassager,
        statut: 'en_attente',
        montant_total: 50000,
        date_debut: debut,
        date_fin: fin,
      }],
      [secondeLocationId, {
        id_location: secondeLocationId,
        id_vehicule: idVehicule,
        id_passager: secondPassagerId,
        statut: 'en_attente',
        montant_total: 50000,
        date_debut: new Date('2026-08-10T11:00:00.000Z'),
        date_fin: new Date('2026-08-10T13:00:00.000Z'),
      }],
    ])
    let transactionPrecedente = Promise.resolve()
    mockTransaction.mockImplementation(async (callback) => {
      const attenteVerrou = transactionPrecedente
      let libererVerrou
      transactionPrecedente = new Promise((resolve) => { libererVerrou = resolve })
      await attenteVerrou
      try {
        return await callback(mockTx)
      } finally {
        libererVerrou()
      }
    })
    mockTxLocationFindUnique.mockImplementation(({ where }) => locations.get(where.id_location))
    mockTxLocationFindFirst.mockImplementation(({ where }) => {
      return [...locations.values()].find((location) => (
        location.id_location !== where.id_location.not
        && location.id_vehicule === where.id_vehicule
        && location.statut === 'active'
        && location.date_debut < where.date_debut.lt
        && location.date_fin > where.date_fin.gt
      )) ?? null
    })
    mockTxLocationUpdateMany.mockImplementation(({ where, data }) => {
      const location = locations.get(where.id_location)
      if (!location || location.statut !== where.statut) return { count: 0 }
      location.statut = data.statut
      return { count: 1 }
    })

    const premiereReq = { params: { id: idLocation }, location: buildReqLocation() }
    const secondeReq = {
      params: { id: secondeLocationId },
      location: buildReqLocation({
        id_location: secondeLocationId,
        passager: { id_passager: secondPassagerId },
      }),
    }
    const premiereRes = response()
    const secondeRes = response()

    await Promise.all([
      LocationController.accepter(premiereReq, premiereRes),
      LocationController.accepter(secondeReq, secondeRes),
    ])

    expect(mockTxQueryRaw).toHaveBeenCalledTimes(2)
    expect(mockTxPortefeuilleUpdateMany).toHaveBeenCalledTimes(1)
    expect(mockTxMouvementCreate).toHaveBeenCalledTimes(2)
    expect(mockTxPaiementCreate).toHaveBeenCalledTimes(1)
    expect(premiereRes.status).toHaveBeenCalledWith(200)
    expect(secondeRes.status).toHaveBeenCalledWith(409)
  })
})
