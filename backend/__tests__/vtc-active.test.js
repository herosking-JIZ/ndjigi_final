const mockFindFirst = jest.fn()

jest.mock('../src/config/db', () => ({
  prisma: {
    trajet: { findFirst: mockFindFirst },
  },
}))

jest.mock('../src/socket/ioRegistry', () => ({ getIO: jest.fn() }))

const TrajetController = require('../src/controllers/trajetController')

function utilisateur(roles) {
  return {
    id_utilisateur: '11111111-1111-4111-8111-111111111111',
    utilisateur_role: roles.map((role) => ({ role })),
  }
}

function response() {
  const res = {}
  res.status = jest.fn(() => res)
  res.json = jest.fn(() => res)
  return res
}

describe('GET /trajets/actif', () => {
  beforeEach(() => jest.clearAllMocks())

  test('limite la reprise passager aux trajets auxquels il participe', async () => {
    mockFindFirst.mockResolvedValue(null)
    const req = { query: { role: 'passager' }, user: utilisateur(['passager']) }
    const res = response()

    await TrajetController.actif(req, res)

    expect(mockFindFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        statut: { in: ['en_attente', 'chauffeur_trouve', 'confirme', 'en_cours'] },
        passagers_du_trajet: {
          some: { id_passager: req.user.id_utilisateur },
        },
      },
    }))
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ data: null }))
  })

  test('ne considère pas une simple proposition comme course active chauffeur', async () => {
    mockFindFirst.mockResolvedValue(null)
    const req = { query: { role: 'chauffeur' }, user: utilisateur(['chauffeur']) }
    const res = response()

    await TrajetController.actif(req, res)

    expect(mockFindFirst).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        statut: { in: ['chauffeur_trouve', 'confirme', 'en_cours'] },
        affectation_vehicule: { id_chauffeur: req.user.id_utilisateur },
      },
    }))
    expect(res.status).toHaveBeenCalledWith(200)
  })

  test('refuse la reprise avec un rôle non attribué', async () => {
    const req = { query: { role: 'chauffeur' }, user: utilisateur(['passager']) }
    const res = response()

    await TrajetController.actif(req, res)

    expect(mockFindFirst).not.toHaveBeenCalled()
    expect(res.status).toHaveBeenCalledWith(403)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      errors: { code: 'ROLE_FORBIDDEN' },
    }))
  })
})
