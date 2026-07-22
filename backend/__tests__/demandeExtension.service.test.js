jest.mock('../src/config/db', () => ({
  prisma: {
    demande_extension: { findUnique: jest.fn() },
    $transaction: jest.fn(),
  },
}));

const { prisma } = require('../src/config/db');
const demandeExtensionService = require('../src/services/demandeExtension.service');

describe('demandeExtensionService.updateStatutDemande', () => {
  let tx;

  beforeEach(() => {
    tx = {
      demande_extension: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        findUnique: jest.fn().mockResolvedValue({ statut: 'accepte' }),
      },
      utilisateur_role: { upsert: jest.fn() },
      chauffeur: { upsert: jest.fn() },
      proprietaire: { upsert: jest.fn() },
      notification: { create: jest.fn() },
    };
    prisma.$transaction.mockImplementation((callback) => callback(tx));
  });

  test.each([
    ['proprietaire', 'proprietaire'],
    ['chauffeur', 'chauffeur'],
  ])('valide le profil %s lorsque la demande est acceptee', async (extensionType, modelName) => {
    prisma.demande_extension.findUnique.mockResolvedValue({
      id_demande_extension: 'demande-1',
      id_utilisateur: 'utilisateur-1',
      extension_type: extensionType,
      statut: 'en_attente',
      utilisateur: {},
      documents: [],
    });

    await demandeExtensionService.updateStatutDemande(
      'demande-1',
      'accepte',
      undefined,
      'admin-1'
    );

    expect(tx[modelName].upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({ statut_validation: 'valide' }),
        create: expect.objectContaining({ statut_validation: 'valide' }),
      })
    );
    expect(tx.demande_extension.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ statut: 'en_attente' }),
        data: expect.objectContaining({
          statut: 'accepte',
          motif_rejet: null,
          id_admin_decision: 'admin-1',
        }),
      })
    );
  });

  test('refuse la seconde décision concurrente', async () => {
    prisma.demande_extension.findUnique.mockResolvedValue({
      id_demande_extension: 'demande-1',
      id_utilisateur: 'utilisateur-1',
      extension_type: 'chauffeur',
      statut: 'en_attente',
      utilisateur: {},
      documents: [],
    });
    tx.demande_extension.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      demandeExtensionService.updateStatutDemande(
        'demande-1',
        'accepte',
        undefined,
        'admin-1'
      )
    ).rejects.toMatchObject({ code: 'ALREADY_PROCESSED' });

    expect(tx.utilisateur_role.upsert).not.toHaveBeenCalled();
    expect(tx.notification.create).not.toHaveBeenCalled();
  });

  test('stocke le motif et les informations de décision lors d’un refus', async () => {
    prisma.demande_extension.findUnique.mockResolvedValue({
      id_demande_extension: 'demande-1',
      id_utilisateur: 'utilisateur-1',
      extension_type: 'proprietaire',
      statut: 'en_attente',
      utilisateur: {},
      documents: [],
    });

    await demandeExtensionService.updateStatutDemande(
      'demande-1',
      'refuse',
      'Documents illisibles',
      'admin-1'
    );

    expect(tx.demande_extension.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          statut: 'refuse',
          motif_rejet: 'Documents illisibles',
          id_admin_decision: 'admin-1',
        }),
      })
    );
    expect(tx.notification.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ contenu: 'Documents illisibles' }),
    });
    expect(tx.utilisateur_role.upsert).not.toHaveBeenCalled();
  });
});
