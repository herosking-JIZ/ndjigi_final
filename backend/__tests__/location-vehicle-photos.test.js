const mockVehiculeFindMany = jest.fn()
const mockVehiculeCount = jest.fn()

jest.mock('../src/config/db', () => ({
  prisma: {
    vehicule: {
      findMany: mockVehiculeFindMany,
      count: mockVehiculeCount,
    },
  },
}))

const LocationController = require('../src/controllers/locationController')

function response() {
  const res = {}
  res.status = jest.fn(() => res)
  res.json = jest.fn(() => res)
  return res
}

describe('GET /locations/vehicules — photos', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockVehiculeCount.mockResolvedValue(1)
    mockVehiculeFindMany.mockResolvedValue([{
      id_vehicule: '11111111-1111-4111-8111-111111111111',
      marque: 'TOYOTA',
      modele: 'BERLINE',
      annee: 2019,
      couleur: 'gris',
      vehicule_location: {
        tarif_base_location: 10000,
        tarif_par_jour_location: 7000,
      },
      photos: [{ id_photo: '22222222-2222-4222-8222-222222222222' }],
    }])
  })

  test('prend la principale ou, à défaut, la première photo active ordonnée', async () => {
    const req = { query: {} }
    const res = response()

    await LocationController.rechercherVehicules(req, res)

    expect(mockVehiculeFindMany).toHaveBeenCalledWith(expect.objectContaining({
      include: expect.objectContaining({
        photos: {
          where: { deletedAt: null },
          orderBy: [
            { is_principale: 'desc' },
            { ordre: 'asc' },
            { uploadedAt: 'desc' },
          ],
          take: 1,
        },
      }),
    }))
    expect(res.status).toHaveBeenCalledWith(200)
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      success: true,
      data: [expect.objectContaining({
        photo_principale: '22222222-2222-4222-8222-222222222222',
      })],
    }))
  })
})
