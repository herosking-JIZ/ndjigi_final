const mockTrajetFindUnique = jest.fn()
const mockDetailFindMany = jest.fn()
const mockTxTrajetUpdateMany = jest.fn()
const mockTxAffectationFindUnique = jest.fn()
const mockTxChauffeurUpdateMany = jest.fn()
const mockTxConversationFindUnique = jest.fn()
const mockTxConversationCreate = jest.fn()
const mockTxParticipantCreateMany = jest.fn()
const mockTransaction = jest.fn(async (callback) => callback({
  trajet: { updateMany: mockTxTrajetUpdateMany, findUnique: mockTrajetFindUnique },
  affectation_vehicule: { findUnique: mockTxAffectationFindUnique },
  chauffeur: { updateMany: mockTxChauffeurUpdateMany },
  conversation: { findUnique: mockTxConversationFindUnique, create: mockTxConversationCreate },
  detail_trajet_passager: { findMany: mockDetailFindMany },
  conversation_participant: { createMany: mockTxParticipantCreateMany },
}))

jest.mock('../src/config/db', () => ({
  prisma: {
    trajet: { findUnique: mockTrajetFindUnique },
    detail_trajet_passager: { findMany: mockDetailFindMany },
    $transaction: mockTransaction,
  },
}))
jest.mock('../src/socket/ioRegistry', () => ({ getIO: jest.fn() }))

const TrajetController = require('../src/controllers/trajetController')

function response() {
  const res = {}
  res.status = jest.fn(() => res)
  res.json = jest.fn(() => res)
  return res
}

describe('verrou d’acceptation VTC', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockTrajetFindUnique.mockResolvedValue({
      id_trajet: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      id_affectation: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      statut: 'en_attente',
      matching_expire_a: new Date(Date.now() + 30_000),
    })
    mockTxTrajetUpdateMany.mockResolvedValue({ count: 1 })
    mockTxAffectationFindUnique.mockResolvedValue({
      id_affectation: 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
      id_chauffeur: 'cccccccc-cccc-4ccc-8ccc-cccccccccccc',
    })
  })

  test('refuse une seconde acceptation lorsque le chauffeur n’est plus en ligne', async () => {
    mockTxChauffeurUpdateMany.mockResolvedValue({ count: 0 })
    const req = { params: { id: 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa' } }
    const res = response()

    await TrajetController.accepter(req, res)

    expect(mockTxChauffeurUpdateMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ statut_disponibilite: 'en_ligne' }),
      data: { statut_disponibilite: 'en_course' },
    }))
    expect(res.status).toHaveBeenCalledWith(409)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      errors: { code: 'CHAUFFEUR_DEJA_OCCUPE' },
    }))
    expect(mockTxConversationCreate).not.toHaveBeenCalled()
  })
})
