const mongoose = require('mongoose')
const User = require('./User')

const mailSchema = new mongoose.Schema(
  {
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true
    },
    status: {
      type: String,
      enum: ['welcome'],
      default: 'welcome',
      required: [true, 'Status is required']
    },
    content: {
      type: String,
      required: [true, 'Content is required']
    },
    sentAt: {
      type: Date,
      default: Date.now
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required']
    }
  },
  {
    timestamps: true
  }
)

mailSchema.pre('save', async function (next) {
  if (this.status === 'welcome') {
    try {
      const User = mongoose.model('User')
      const userData = await User.findById(this.user)
      if (!userData) {
        throw new Error('User not found for this email')
      }
      const hasName = userData.name && userData.name.trim() !== ''
      if (hasName) {
        this.subject = `Välkommen ${userData.name}! Ditt konto är skapat`
        this.content = `Hej ${userData.name}, välkommen! Ditt konto med e-postadressen ${userData.email} har skapats. Vi är glada att ha dig med oss.`
      } else {  
          this.subject = 'Välkommen! Ditt konto är skapat'
          this.content = `Hej, välkommen! Ditt konto med e-postadressen ${userData.email} har skapats. Vi är glada att ha dig med oss.`
      }
      next()
    } catch (error) {
      return next(error)
    }
  }
})

module.exports = mongoose.model('Mail', mailSchema)
