/**
 * SERVICES/CONTACTSERVICE.JS
 * Emergency contact management service
 */

const { prisma } = require('../config/db');

const MAX_CONTACTS_PER_USER = 20;

/**
 * Create a new emergency contact
 *
 * @param {string} userId - User ID
 * @param {object} data - { nom, prenom, country_code, phone, relation }
 * @returns {Promise<object>} Created contact
 * @throws {Error} if validation fails or limit reached
 */
async function createContact(userId, data) {
  const { nom, prenom, country_code, phone, relation } = data;

  // Check contact limit
  const contactCount = await prisma.contact_de_confiance.count({
    where: {
      id_user: userId,
      deletedAt: null
    }
  });

  if (contactCount >= MAX_CONTACTS_PER_USER) {
    throw new Error(
      `Maximum ${MAX_CONTACTS_PER_USER} contacts per user. Please delete some before adding new ones.`
    );
  }

  const newContact = await prisma.contact_de_confiance.create({
    data: {
      id_user: userId,
      nom: nom.trim(),
      prenom: prenom.trim(),
      country_code: country_code.trim(),
      phone: phone.trim().replace(/\s/g, ''), // Remove spaces
      relation
    }
  });

  return newContact;
}

/**
 * List contacts for user (with optional filters)
 *
 * @param {string} userId - User ID
 * @param {object} filters - { relation?, search?, page?, limit? }
 * @returns {Promise<{contacts: [], total: number, pages: number}>}
 */
async function listContacts(userId, filters = {}) {
  const {
    relation = null,
    search = null,
    page = 1,
    limit = 20
  } = filters;

  const where = {
    id_user: userId,
    deletedAt: null
  };

  // Filter by relation if specified
  if (relation) {
    where.relation = relation;
  }

  // Search in nom, prenom, or phone
  if (search) {
    const searchTerm = search.trim();
    where.OR = [
      { nom: { contains: searchTerm, mode: 'insensitive' } },
      { prenom: { contains: searchTerm, mode: 'insensitive' } },
      { phone: { contains: searchTerm } }
    ];
  }

  const [contacts, total] = await Promise.all([
    prisma.contact_de_confiance.findMany({
      where,
      orderBy: [{ relation: 'asc' }, { createdAt: 'desc' }],
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.contact_de_confiance.count({ where })
  ]);

  return {
    contacts,
    total,
    pages: Math.ceil(total / limit)
  };
}

/**
 * Get single contact by ID
 *
 * @param {string} contactId - Contact ID
 * @param {string} userId - User ID (for ownership check)
 * @returns {Promise<object>} Contact
 * @throws {Error} if not found or not owner
 */
async function getContactById(contactId, userId) {
  const contact = await prisma.contact_de_confiance.findUnique({
    where: { id_contact: contactId }
  });

  if (!contact || contact.deletedAt) {
    throw new Error('Contact not found.');
  }

  if (contact.id_user !== userId) {
    throw new Error('Permission denied.');
  }

  return contact;
}

/**
 * Update contact metadata
 *
 * @param {string} contactId - Contact ID
 * @param {string} userId - User ID (for ownership check)
 * @param {object} data - { nom?, prenom?, country_code?, phone?, relation? }
 * @returns {Promise<object>} Updated contact
 * @throws {Error} if not found or not owner
 */
async function updateContact(contactId, userId, data) {
  const contact = await getContactById(contactId, userId);

  const updateData = {};

  if (data.nom !== undefined) {
    updateData.nom = data.nom.trim();
  }
  if (data.prenom !== undefined) {
    updateData.prenom = data.prenom.trim();
  }
  if (data.country_code !== undefined) {
    updateData.country_code = data.country_code.trim();
  }
  if (data.phone !== undefined) {
    updateData.phone = data.phone.trim().replace(/\s/g, '');
  }
  if (data.relation !== undefined) {
    updateData.relation = data.relation;
  }

  const updated = await prisma.contact_de_confiance.update({
    where: { id_contact: contactId },
    data: updateData
  });

  return updated;
}

/**
 * Soft delete contact (set deletedAt)
 *
 * @param {string} contactId - Contact ID
 * @param {string} userId - User ID (for ownership check)
 * @returns {Promise<object>} Soft-deleted contact
 * @throws {Error} if not found or not owner
 */
async function deleteContact(contactId, userId) {
  const contact = await getContactById(contactId, userId);

  const deleted = await prisma.contact_de_confiance.update({
    where: { id_contact: contactId },
    data: { deletedAt: new Date() }
  });

  return deleted;
}

/**
 * Get contacts by relation type
 *
 * @param {string} userId - User ID
 * @param {string} relation - Relation type
 * @param {number} limit - Max results
 * @returns {Promise<object[]>} Contacts of specified relation
 */
async function getContactsByRelation(userId, relation, limit = 10) {
  return prisma.contact_de_confiance.findMany({
    where: {
      id_user: userId,
      relation,
      deletedAt: null
    },
    orderBy: { createdAt: 'desc' },
    take: limit
  });
}

/**
 * Count contacts by relation type
 *
 * @param {string} userId - User ID
 * @returns {Promise<object>} Count grouped by relation
 */
async function countByRelation(userId) {
  const relations = [
    'parent',
    'enfant',
    'conjoint',
    'frere',
    'soeur',
    'cousin',
    'copain',
    'copine',
    'autre'
  ];

  const counts = {};

  for (const relation of relations) {
    counts[relation] = await prisma.contact_de_confiance.count({
      where: {
        id_user: userId,
        relation,
        deletedAt: null
      }
    });
  }

  return counts;
}

/**
 * Get total active contacts count
 *
 * @param {string} userId - User ID
 * @returns {Promise<number>} Total active contacts
 */
async function getTotalCount(userId) {
  return prisma.contact_de_confiance.count({
    where: {
      id_user: userId,
      deletedAt: null
    }
  });
}

module.exports = {
  createContact,
  listContacts,
  getContactById,
  updateContact,
  deleteContact,
  getContactsByRelation,
  countByRelation,
  getTotalCount,
  MAX_CONTACTS_PER_USER
};
