const bcrypt = require('bcryptjs')
const mongoose = require('mongoose')
const Mail = require('./Mail')

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false
    },
    name: {
      type: String,
      trim: true,
      default: ''
    }
  },
  { timestamps: true }
)

userSchema.pre('save', async function hashPassword(next) {
  if (this.isModified('password')) {
    const salt = await bcrypt.genSalt(10)
    this.password = await bcrypt.hash(this.password, salt)
  }

  return next()
})

/**
 * @param {string} candidate
 * @returns {Promise<boolean>}
 */
userSchema.methods.comparePassword = async function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password)
}

userSchema.pre('save', function (next) {
  this._wasNew = this.isNew
  next()
})

userSchema.post('save', async function (doc, next) {
  if (this._wasNew) {
    try {
      await Mail.create({
        user: doc._id,
        status: 'welcome'
      })
      console.log(`✅ Welcome mail created for new user: ${doc.email}`)
    } catch (error) {
      console.log(`❌ Could not create welcome mail for user: ${doc.email}`)
    }
  }
  next()
})

module.exports = mongoose.model('User', userSchema)
