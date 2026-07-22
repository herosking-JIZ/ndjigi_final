const fs = require('fs')
const path = require('path')
const { Prisma } = require('../generated/prisma/client')

describe('Schéma Prisma du flux d’arrivée VTC', () => {
  const trajet = Prisma.dmmf.datamodel.models.find((model) => model.name === 'trajet')
  const schema = fs.readFileSync(path.join(__dirname, '../prisma/schema.prisma'), 'utf8')

  test('déclare chauffeur_arrive_a comme DateTime nullable', () => {
    expect(trajet).toBeDefined()
    expect(trajet.fields).toEqual(expect.arrayContaining([
      expect.objectContaining({
        name: 'chauffeur_arrive_a',
        type: 'DateTime',
      }),
    ]))
    expect(schema).toMatch(/chauffeur_arrive_a\s+DateTime\?\s+@db\.Timestamp\(6\)/)
  })

  test('déclare pin_tentatives comme Int requis avec une valeur par défaut à zéro', () => {
    expect(trajet).toBeDefined()
    expect(trajet.fields).toEqual(expect.arrayContaining([
      expect.objectContaining({
        name: 'pin_tentatives',
        type: 'Int',
      }),
    ]))
    expect(schema).toMatch(/pin_tentatives\s+Int\s+@default\(0\)\s+@db\.SmallInt/)
  })

  test('le client généré accepte ces champs dans les lectures et mises à jour', () => {
    const fields = new Set(trajet.fields.map((field) => field.name))
    expect(fields.has('chauffeur_arrive_a')).toBe(true)
    expect(fields.has('pin_tentatives')).toBe(true)
  })
})
