const mongoose = require('mongoose');

const { ObjectId } = mongoose.Schema.Types;

// 'system' = server-generated group notices ("alex added emily"); clients can't send it.
const MESSAGE_TYPES = ['text', 'image', 'file', 'system'];
const MESSAGE_STATUSES = ['sent', 'delivered', 'read'];

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: ObjectId,
      ref: 'Conversation',
      required: true,
    },
    sender: {
      type: ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      trim: true,
      maxlength: [5000, 'Message cannot exceed 5000 characters'],
      required: [
        function () {
          return this.messageType === 'text' || this.messageType === 'system';
        },
        'Message content is required',
      ],
    },
    messageType: {
      type: String,
      enum: MESSAGE_TYPES,
      default: 'text',
    },
    mediaUrl: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: MESSAGE_STATUSES,
      default: 'sent',
    },
    readBy: [{ type: ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

// Paginate a conversation's messages by time
messageSchema.index({ conversationId: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);
module.exports.MESSAGE_TYPES = MESSAGE_TYPES;
module.exports.MESSAGE_STATUSES = MESSAGE_STATUSES;
