const mongoose = require('mongoose');

const { ObjectId } = mongoose.Schema.Types;

// One collection for both 1:1 chats (isGroup: false) and groups (isGroup: true),
// so messages, unread counts and realtime delivery work the same for both.
const conversationSchema = new mongoose.Schema(
  {
    participants: {
      type: [{ type: ObjectId, ref: 'User', required: true }],
      validate: {
        validator(arr) {
          if (!Array.isArray(arr)) return false;
          return this.isGroup ? arr.length >= 1 : arr.length === 2;
        },
        message: 'A chat needs exactly 2 participants; a group needs at least 1',
      },
    },
    isGroup: {
      type: Boolean,
      default: false,
    },
    lastMessage: {
      type: ObjectId,
      ref: 'Message',
      default: null,
    },
    // { "<userId>": <number of unread messages for that user> }
    unreadCounts: {
      type: Map,
      of: Number,
      default: {},
    },

    /* ---- group-only fields ---- */
    name: {
      type: String,
      trim: true,
      maxlength: [50, 'Group name cannot exceed 50 characters'],
      required: [
        function () {
          return this.isGroup;
        },
        'Group name is required',
      ],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [200, 'Description cannot exceed 200 characters'],
      default: '',
    },
    avatar: {
      type: String,
      default: null,
    },
    admins: [{ type: ObjectId, ref: 'User' }],
    createdBy: {
      type: ObjectId,
      ref: 'User',
      default: null,
    },
  },
  { timestamps: true }
);

// "My chats / my groups, newest first"
conversationSchema.index({ participants: 1, isGroup: 1, updatedAt: -1 });

module.exports = mongoose.model('Conversation', conversationSchema);
