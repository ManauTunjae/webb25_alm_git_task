const request = require('supertest')
const app = require('../src/app')
const User = require('../src/models/User')
const Mail = require('../src/models/Mail')
const { connectDb, disconnectDb } = require('./helpers/db')


describe('Auth API', () => {
  beforeAll(async () => {
    await connectDb()
  })

  afterAll(async () => {
    await disconnectDb()
  })

  beforeEach(async () => {
    await User.deleteMany({ email: 'auth-api@example.com' })
    await Mail.deleteMany({ user: { $in: (await User.find({ email: 'auth-api@example.com' })).map(u => u._id) } })
  })

  it('registers and returns a token without exposing the password', async () => {
    const res = await request(app).post('/auth/register').send({
      email: 'auth-api@example.com',
      password: 'password123',
      name: 'Auth API'
    })
    expect(res.status).toBe(201)
    expect(res.body.token).toBeTruthy()
    expect(res.body.user.email).toBe('auth-api@example.com')
    expect(res.body.user.password).toBeUndefined()

    const userId = res.body.user.id;

    const mail = await Mail.findOne({ user: userId })

    expect(mail).toBeTruthy()
    expect(mail.status).toBe('welcome')
  })

  it('returns a predictable error for duplicate registration', async () => {
    await request(app).post('/auth/register').send({
      email: 'auth-api@example.com',
      password: 'password123'
    })
    const dup = await request(app).post('/auth/register').send({
      email: 'auth-api@example.com',
      password: 'otherpassword12'
    })
    expect(dup.status).toBe(400)
    expect(dup.body.message).toBe('Email already registered')
  })

  it('returns 401 for protected routes without a token', async () => {
    const res = await request(app).get('/auth/me')
    expect(res.status).toBe(401)
  })

  it('logs in with valid credentials', async () => {
    await request(app).post('/auth/register').send({
      email: 'auth-api@example.com',
      password: 'password123'
    })
    const res = await request(app).post('/auth/login').send({
      email: 'auth-api@example.com',
      password: 'password123'
    })
    expect(res.status).toBe(200)
    expect(res.body.token).toBeTruthy()
  })
})
