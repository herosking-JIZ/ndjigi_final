/**
 * SERVICES/ADDRESSSERVICE.JS
 * Address management service for user saved locations
 */

const { prisma } = require('../config/db');

/**
 * Create a new address for user
 *
 * @param {string} userId - User ID
 * @param {object} data - { label, address, latitude, longitude, isfavorite }
 * @returns {Promise<object>} Created address
 * @throws {Error} if validation fails
 */
async function createAddress(userId, data) {
  const { label, address, latitude, longitude, isfavorite = false } = data;

  const newAddress = await prisma.address.create({
    data: {
      id_user: userId,
      label: label.trim(),
      address: address.trim(),
      latitude: parseDecimal(latitude),
      longitude: parseDecimal(longitude),
      isfavorite
    }
  });

  return newAddress;
}

/**
 * Get all addresses for user (with optional filters)
 *
 * @param {string} userId - User ID
 * @param {object} filters - { favorite?, label?, search?, page?, limit? }
 * @returns {Promise<{addresses: [], total: number, pages: number}>}
 */
async function listAddresses(userId, filters = {}) {
  const {
    favorite = null,
    label = null,
    search = null,
    page = 1,
    limit = 20
  } = filters;

  const where = {
    id_user: userId
  };

  // Filter by favorite if specified
  if (favorite !== null) {
    where.isfavorite = Boolean(favorite);
  }

  // Filter by label (exact match)
  if (label) {
    where.label = { equals: label.trim(), mode: 'insensitive' };
  }

  // Search in address field (LIKE)
  if (search) {
    where.address = { contains: search.trim(), mode: 'insensitive' };
  }

  const [addresses, total] = await Promise.all([
    prisma.address.findMany({
      where,
      orderBy: [{ isfavorite: 'desc' }, { createdAt: 'desc' }],
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.address.count({ where })
  ]);

  return {
    addresses,
    total,
    pages: Math.ceil(total / limit)
  };
}

/**
 * Get single address by ID
 *
 * @param {string} addressId - Address ID
 * @param {string} userId - User ID (for ownership check)
 * @returns {Promise<object>} Address
 * @throws {Error} if not found or not owner
 */
async function getAddressById(addressId, userId) {
  const address = await prisma.address.findUnique({
    where: { id_address: addressId }
  });

  if (!address) {
    throw new Error('Address not found.');
  }

  if (address.id_user !== userId) {
    throw new Error('Permission denied.');
  }

  return address;
}

/**
 * Update address metadata
 *
 * @param {string} addressId - Address ID
 * @param {string} userId - User ID (for ownership check)
 * @param {object} data - { label?, address?, latitude?, longitude?, isfavorite? }
 * @returns {Promise<object>} Updated address
 * @throws {Error} if not found or not owner
 */
async function updateAddress(addressId, userId, data) {
  const address = await getAddressById(addressId, userId);

  const updateData = {};

  if (data.label !== undefined) {
    updateData.label = data.label.trim();
  }
  if (data.address !== undefined) {
    updateData.address = data.address.trim();
  }
  if (data.latitude !== undefined) {
    updateData.latitude = parseDecimal(data.latitude);
  }
  if (data.longitude !== undefined) {
    updateData.longitude = parseDecimal(data.longitude);
  }
  if (data.isfavorite !== undefined) {
    updateData.isfavorite = Boolean(data.isfavorite);
  }

  const updated = await prisma.address.update({
    where: { id_address: addressId },
    data: updateData
  });

  return updated;
}

/**
 * Delete address
 *
 * @param {string} addressId - Address ID
 * @param {string} userId - User ID (for ownership check)
 * @returns {Promise<object>} Deleted address
 * @throws {Error} if not found or not owner
 */
async function deleteAddress(addressId, userId) {
  const address = await getAddressById(addressId, userId);

  const deleted = await prisma.address.delete({
    where: { id_address: addressId }
  });

  return deleted;
}

/**
 * Toggle favorite status
 *
 * @param {string} addressId - Address ID
 * @param {string} userId - User ID (for ownership check)
 * @returns {Promise<object>} Updated address
 * @throws {Error} if not found or not owner
 */
async function toggleFavorite(addressId, userId) {
  const address = await getAddressById(addressId, userId);

  const updated = await prisma.address.update({
    where: { id_address: addressId },
    data: { isfavorite: !address.isfavorite }
  });

  return updated;
}

/**
 * Get user favorite addresses
 *
 * @param {string} userId - User ID
 * @param {number} limit - Max number of favorites to return
 * @returns {Promise<object[]>} Favorite addresses
 */
async function getFavorites(userId, limit = 10) {
  return prisma.address.findMany({
    where: {
      id_user: userId,
      isfavorite: true
    },
    orderBy: { createdAt: 'desc' },
    take: limit
  });
}

/**
 * Validate geolocation coordinates
 *
 * @param {number} latitude - Latitude
 * @param {number} longitude - Longitude
 * @returns {boolean} Valid coordinates
 */
function isValidGeolocation(latitude, longitude) {
  const lat = parseFloat(latitude);
  const lon = parseFloat(longitude);

  return (
    !isNaN(lat) &&
    !isNaN(lon) &&
    lat >= -90 &&
    lat <= 90 &&
    lon >= -180 &&
    lon <= 180
  );
}

/**
 * Parse decimal number (handle both string and number)
 *
 * @private
 */
function parseDecimal(value) {
  if (typeof value === 'string') {
    return parseFloat(value);
  }
  return value;
}

module.exports = {
  createAddress,
  listAddresses,
  getAddressById,
  updateAddress,
  deleteAddress,
  toggleFavorite,
  getFavorites,
  isValidGeolocation
};
