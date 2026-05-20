const User = require('../src/models/User')
const Mail = require('../src/models/Mail')
const { connectDb, disconnectDb } = require('./helpers/db')

describe('User model', () => {
  beforeAll(async () => {
    await connectDb()
  })

  afterAll(async () => {
    await disconnectDb()
  })

  beforeEach(async () => {
    await User.deleteMany({})
  })

  it('requires a unique email', async () => {
    await User.create({ email: 'dup@example.com', password: 'password123' })
    await expect(User.create({ email: 'dup@example.com', password: 'password123' })).rejects.toMatchObject({
      code: 11000
    })
  })

  it('stores a hashed password and still compares with the raw password', async () => {
    const raw = 'password123'
    const user = await User.create({ email: 'hash@example.com', password: raw })
    const fromDb = await User.findById(user._id).select('+password')
    expect(fromDb.password).not.toBe(raw)
    expect(await fromDb.comparePassword(raw)).toBe(true)
  })

  it('does not change the stored password hash when updating name only', async () => {
    const user = await User.create({ email: 'nameonly@example.com', password: 'password123', name: 'A' })
    const before = await User.findById(user._id).select('+password')
    const hashBefore = before.password

    before.name = 'B'
    await before.save()

    const after = await User.findById(user._id).select('+password')
    expect(after.password).toBe(hashBefore)
    expect(await after.comparePassword('password123')).toBe(true)
  })

  it('re-hashes when the password changes and login follows the new password', async () => {
    const user = await User.create({ email: 'rotate@example.com', password: 'password123' })
    const doc = await User.findById(user._id).select('+password')
    const oldHash = doc.password

    doc.password = 'newpassword99'
    await doc.save()

    const updated = await User.findById(user._id).select('+password')
    expect(updated.password).not.toBe(oldHash)
    expect(await updated.comparePassword('newpassword99')).toBe(true)
    expect(await updated.comparePassword('password123')).toBe(false)
  })

  it('created a welcome mail after user creatiom', async () => {
    const user = await User.create({ email: 'welcome@example.com', password: 'password123', name: 'Welcome' })
    const mail = await Mail.findOne({ user: user._id })
    expect(mail).toBeTruthy()
  })
})
