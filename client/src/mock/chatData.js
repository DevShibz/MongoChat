/**
 * Mock chat data shaped like MongoDB collections.
 *
 * Each top-level array maps 1:1 to a collection you can model with Mongoose:
 *   users          -> User model (already exists, extend with avatar/about/isOnline/lastSeen)
 *   conversations  -> Conversation model (one-to-one chats; ref User, ref Message)
 *   messages       -> Message model (ref Conversation, ref User)
 *
 * _id values are 24-char hex strings, same format as MongoDB ObjectId,
 * and dates are ISO strings (Mongoose `Date` / `timestamps: true`).
 */

// The logged-in user in mock-land. In the real app this is req.user._id.
export const CURRENT_USER_ID = '665f1a2b3c4d5e6f7a8b9c01';

/* ------------------------------------------------------------------ */
/* users collection                                                    */
/* ------------------------------------------------------------------ */
export const users = [
  {
    _id: '665f1a2b3c4d5e6f7a8b9c01',
    username: 'you',
    email: 'you@example.com',
    avatar: null, // String (URL) – optional
    about: 'Hey there! I am using ChatApp.',
    isOnline: true,
    lastSeen: '2026-11-17T10:45:00.000Z',
    createdAt: '2026-10-01T08:00:00.000Z',
    updatedAt: '2026-11-17T10:45:00.000Z',
  },
  {
    _id: '665f1a2b3c4d5e6f7a8b9c02',
    username: 'sarah',
    email: 'sarah@example.com',
    avatar: null,
    about: 'Coffee first ☕',
    isOnline: true,
    lastSeen: '2026-11-17T10:42:00.000Z',
    createdAt: '2026-10-02T09:12:00.000Z',
    updatedAt: '2026-11-17T10:42:00.000Z',
  },
  {
    _id: '665f1a2b3c4d5e6f7a8b9c03',
    username: 'alex',
    email: 'alex@example.com',
    avatar: null,
    about: 'Building things',
    isOnline: false,
    lastSeen: '2026-11-16T22:10:00.000Z',
    createdAt: '2026-10-03T11:30:00.000Z',
    updatedAt: '2026-11-16T22:10:00.000Z',
  },
  {
    _id: '665f1a2b3c4d5e6f7a8b9c04',
    username: 'emily',
    email: 'emily@example.com',
    avatar: null,
    about: 'Mobile dev 📱',
    isOnline: true,
    lastSeen: '2026-11-17T09:58:00.000Z',
    createdAt: '2026-10-05T14:00:00.000Z',
    updatedAt: '2026-11-17T09:58:00.000Z',
  },
  {
    _id: '665f1a2b3c4d5e6f7a8b9c05',
    username: 'david',
    email: 'david@example.com',
    avatar: null,
    about: 'Available',
    isOnline: false,
    lastSeen: '2026-11-12T18:20:00.000Z',
    createdAt: '2026-10-07T16:45:00.000Z',
    updatedAt: '2026-11-12T18:20:00.000Z',
  },
];

/* ------------------------------------------------------------------ */
/* messages collection                                                 */
/* ------------------------------------------------------------------ */
// status: 'sent' | 'delivered' | 'read'
// messageType: 'text' | 'image' | 'file'
export const messages = [
  // Conversation with sarah
  {
    _id: '6660aa000000000000000101',
    conversationId: '6660bb000000000000000001',
    sender: '665f1a2b3c4d5e6f7a8b9c02',
    content: 'Hey there! How have you been?',
    messageType: 'text',
    mediaUrl: null,
    status: 'read',
    readBy: ['665f1a2b3c4d5e6f7a8b9c01'],
    createdAt: '2026-11-17T10:30:00.000Z',
    updatedAt: '2026-11-17T10:30:00.000Z',
  },
  {
    _id: '6660aa000000000000000102',
    conversationId: '6660bb000000000000000001',
    sender: '665f1a2b3c4d5e6f7a8b9c01',
    content: 'Doing great! Just finishing up some code.',
    messageType: 'text',
    mediaUrl: null,
    status: 'read',
    readBy: ['665f1a2b3c4d5e6f7a8b9c02'],
    createdAt: '2026-11-17T10:35:00.000Z',
    updatedAt: '2026-11-17T10:35:00.000Z',
  },
  {
    _id: '6660aa000000000000000103',
    conversationId: '6660bb000000000000000001',
    sender: '665f1a2b3c4d5e6f7a8b9c02',
    content: 'Nice! Want to grab coffee tomorrow?',
    messageType: 'text',
    mediaUrl: null,
    status: 'delivered',
    readBy: [],
    createdAt: '2026-11-17T10:40:00.000Z',
    updatedAt: '2026-11-17T10:40:00.000Z',
  },
  {
    _id: '6660aa000000000000000104',
    conversationId: '6660bb000000000000000001',
    sender: '665f1a2b3c4d5e6f7a8b9c02',
    content: 'Say 10am at the usual place?',
    messageType: 'text',
    mediaUrl: null,
    status: 'delivered',
    readBy: [],
    createdAt: '2026-11-17T10:42:00.000Z',
    updatedAt: '2026-11-17T10:42:00.000Z',
  },

  // Conversation with alex
  {
    _id: '6660aa000000000000000201',
    conversationId: '6660bb000000000000000002',
    sender: '665f1a2b3c4d5e6f7a8b9c03',
    content: 'Check out the new dashboard screenshot I sent',
    messageType: 'text',
    mediaUrl: null,
    status: 'read',
    readBy: ['665f1a2b3c4d5e6f7a8b9c01'],
    createdAt: '2026-11-16T21:50:00.000Z',
    updatedAt: '2026-11-16T21:50:00.000Z',
  },
  {
    _id: '6660aa000000000000000202',
    conversationId: '6660bb000000000000000002',
    sender: '665f1a2b3c4d5e6f7a8b9c01',
    content: 'The new design looks awesome! 🔥',
    messageType: 'text',
    mediaUrl: null,
    status: 'read',
    readBy: ['665f1a2b3c4d5e6f7a8b9c03'],
    createdAt: '2026-11-16T22:05:00.000Z',
    updatedAt: '2026-11-16T22:05:00.000Z',
  },

  // Conversation with emily
  {
    _id: '6660aa000000000000000301',
    conversationId: '6660bb000000000000000003',
    sender: '665f1a2b3c4d5e6f7a8b9c04',
    content: 'Hi, working on the mobile app integration now.',
    messageType: 'text',
    mediaUrl: null,
    status: 'read',
    readBy: ['665f1a2b3c4d5e6f7a8b9c01'],
    createdAt: '2026-11-17T09:50:00.000Z',
    updatedAt: '2026-11-17T09:50:00.000Z',
  },
  {
    _id: '6660aa000000000000000302',
    conversationId: '6660bb000000000000000003',
    sender: '665f1a2b3c4d5e6f7a8b9c04',
    content: 'Can you send the API documentation?',
    messageType: 'text',
    mediaUrl: null,
    status: 'delivered',
    readBy: [],
    createdAt: '2026-11-17T09:55:00.000Z',
    updatedAt: '2026-11-17T09:55:00.000Z',
  },

  // Conversation with david
  {
    _id: '6660aa000000000000000401',
    conversationId: '6660bb000000000000000004',
    sender: '665f1a2b3c4d5e6f7a8b9c01',
    content: 'Updated the auth middleware with JWT tokens.',
    messageType: 'text',
    mediaUrl: null,
    status: 'read',
    readBy: ['665f1a2b3c4d5e6f7a8b9c05'],
    createdAt: '2026-11-12T18:00:00.000Z',
    updatedAt: '2026-11-12T18:00:00.000Z',
  },
  {
    _id: '6660aa000000000000000402',
    conversationId: '6660bb000000000000000004',
    sender: '665f1a2b3c4d5e6f7a8b9c05',
    content: 'Sounds good. Let me test it.',
    messageType: 'text',
    mediaUrl: null,
    status: 'read',
    readBy: ['665f1a2b3c4d5e6f7a8b9c01'],
    createdAt: '2026-11-12T18:15:00.000Z',
    updatedAt: '2026-11-12T18:15:00.000Z',
  },
];

/* ------------------------------------------------------------------ */
/* conversations collection (one-to-one chats)                         */
/* ------------------------------------------------------------------ */
// unreadCounts is a Map<userId, Number> in Mongoose.
export const conversations = [
  {
    _id: '6660bb000000000000000001',
    participants: ['665f1a2b3c4d5e6f7a8b9c01', '665f1a2b3c4d5e6f7a8b9c02'],
    lastMessage: '6660aa000000000000000104',
    unreadCounts: { '665f1a2b3c4d5e6f7a8b9c01': 2, '665f1a2b3c4d5e6f7a8b9c02': 0 },
    createdAt: '2026-11-01T08:00:00.000Z',
    updatedAt: '2026-11-17T10:42:00.000Z',
  },
  {
    _id: '6660bb000000000000000002',
    participants: ['665f1a2b3c4d5e6f7a8b9c01', '665f1a2b3c4d5e6f7a8b9c03'],
    lastMessage: '6660aa000000000000000202',
    unreadCounts: { '665f1a2b3c4d5e6f7a8b9c01': 0, '665f1a2b3c4d5e6f7a8b9c03': 0 },
    createdAt: '2026-11-03T12:00:00.000Z',
    updatedAt: '2026-11-16T22:05:00.000Z',
  },
  {
    _id: '6660bb000000000000000003',
    participants: ['665f1a2b3c4d5e6f7a8b9c01', '665f1a2b3c4d5e6f7a8b9c04'],
    lastMessage: '6660aa000000000000000302',
    unreadCounts: { '665f1a2b3c4d5e6f7a8b9c01': 1, '665f1a2b3c4d5e6f7a8b9c04': 0 },
    createdAt: '2026-11-05T15:30:00.000Z',
    updatedAt: '2026-11-17T09:55:00.000Z',
  },
  {
    _id: '6660bb000000000000000004',
    participants: ['665f1a2b3c4d5e6f7a8b9c01', '665f1a2b3c4d5e6f7a8b9c05'],
    lastMessage: '6660aa000000000000000402',
    unreadCounts: { '665f1a2b3c4d5e6f7a8b9c01': 0, '665f1a2b3c4d5e6f7a8b9c05': 0 },
    createdAt: '2026-11-10T10:00:00.000Z',
    updatedAt: '2026-11-12T18:15:00.000Z',
  },
];

/* ------------------------------------------------------------------ */
/* groups (same conversations collection, isGroup: true)               */
/* ------------------------------------------------------------------ */
export const groups = [
  {
    _id: '6660bb000000000000000101',
    isGroup: true,
    name: 'Dev Team Core',
    description: 'Frontend & backend discussions and sprint updates',
    avatar: null,
    participants: [
      '665f1a2b3c4d5e6f7a8b9c01',
      '665f1a2b3c4d5e6f7a8b9c02',
      '665f1a2b3c4d5e6f7a8b9c03',
      '665f1a2b3c4d5e6f7a8b9c05',
    ],
    admins: ['665f1a2b3c4d5e6f7a8b9c01'],
    createdBy: '665f1a2b3c4d5e6f7a8b9c01',
    lastMessage: '6660aa000000000000001104',
    unreadCounts: {
      '665f1a2b3c4d5e6f7a8b9c01': 1,
      '665f1a2b3c4d5e6f7a8b9c02': 0,
      '665f1a2b3c4d5e6f7a8b9c03': 0,
      '665f1a2b3c4d5e6f7a8b9c05': 1,
    },
    createdAt: '2026-11-15T09:00:00.000Z',
    updatedAt: '2026-11-17T11:15:00.000Z',
  },
  {
    _id: '6660bb000000000000000102',
    isGroup: true,
    name: 'UI/UX Explorers',
    description: 'Design systems, mobile responsiveness, and prototypes',
    avatar: null,
    participants: [
      '665f1a2b3c4d5e6f7a8b9c01',
      '665f1a2b3c4d5e6f7a8b9c04',
      '665f1a2b3c4d5e6f7a8b9c05',
    ],
    admins: ['665f1a2b3c4d5e6f7a8b9c04'],
    createdBy: '665f1a2b3c4d5e6f7a8b9c04',
    lastMessage: '6660aa000000000000001203',
    unreadCounts: {
      '665f1a2b3c4d5e6f7a8b9c01': 0,
      '665f1a2b3c4d5e6f7a8b9c04': 0,
      '665f1a2b3c4d5e6f7a8b9c05': 0,
    },
    createdAt: '2026-11-14T10:00:00.000Z',
    updatedAt: '2026-11-16T16:20:00.000Z',
  },
  {
    _id: '6660bb000000000000000103',
    isGroup: true,
    name: 'Weekend Hangouts',
    description: 'Casual chats, meetups, and weekend plans',
    avatar: null,
    participants: [
      '665f1a2b3c4d5e6f7a8b9c01',
      '665f1a2b3c4d5e6f7a8b9c02',
      '665f1a2b3c4d5e6f7a8b9c04',
    ],
    admins: ['665f1a2b3c4d5e6f7a8b9c02'],
    createdBy: '665f1a2b3c4d5e6f7a8b9c02',
    lastMessage: '6660aa000000000000001302',
    unreadCounts: {
      '665f1a2b3c4d5e6f7a8b9c01': 0,
      '665f1a2b3c4d5e6f7a8b9c02': 0,
      '665f1a2b3c4d5e6f7a8b9c04': 0,
    },
    createdAt: '2026-11-13T18:00:00.000Z',
    updatedAt: '2026-11-14T19:30:00.000Z',
  },
];

// Group messages live in the same messages collection.
// For groups, status becomes 'read' once every other member has read it.
export const groupMessages = [
  // Dev Team Core
  {
    _id: '6660aa000000000000001101',
    conversationId: '6660bb000000000000000101',
    sender: '665f1a2b3c4d5e6f7a8b9c01',
    content: 'you created group "Dev Team Core"',
    messageType: 'system',
    mediaUrl: null,
    status: 'read',
    readBy: [],
    createdAt: '2026-11-15T09:00:00.000Z',
    updatedAt: '2026-11-15T09:00:00.000Z',
  },
  {
    _id: '6660aa000000000000001102',
    conversationId: '6660bb000000000000000101',
    sender: '665f1a2b3c4d5e6f7a8b9c02',
    content: 'Welcome everyone to the sprint chat!',
    messageType: 'text',
    mediaUrl: null,
    status: 'read',
    readBy: ['665f1a2b3c4d5e6f7a8b9c01', '665f1a2b3c4d5e6f7a8b9c03', '665f1a2b3c4d5e6f7a8b9c05'],
    createdAt: '2026-11-17T09:00:00.000Z',
    updatedAt: '2026-11-17T09:00:00.000Z',
  },
  {
    _id: '6660aa000000000000001103',
    conversationId: '6660bb000000000000000101',
    sender: '665f1a2b3c4d5e6f7a8b9c01',
    content: 'Node + MongoDB auth is fully functional now.',
    messageType: 'text',
    mediaUrl: null,
    status: 'delivered',
    readBy: ['665f1a2b3c4d5e6f7a8b9c02', '665f1a2b3c4d5e6f7a8b9c03'],
    createdAt: '2026-11-17T10:00:00.000Z',
    updatedAt: '2026-11-17T10:00:00.000Z',
  },
  {
    _id: '6660aa000000000000001104',
    conversationId: '6660bb000000000000000101',
    sender: '665f1a2b3c4d5e6f7a8b9c03',
    content: 'Pushed the latest commit to main branch',
    messageType: 'text',
    mediaUrl: null,
    status: 'delivered',
    readBy: ['665f1a2b3c4d5e6f7a8b9c02'],
    createdAt: '2026-11-17T11:15:00.000Z',
    updatedAt: '2026-11-17T11:15:00.000Z',
  },

  // UI/UX Explorers
  {
    _id: '6660aa000000000000001201',
    conversationId: '6660bb000000000000000102',
    sender: '665f1a2b3c4d5e6f7a8b9c04',
    content: 'emily created group "UI/UX Explorers"',
    messageType: 'system',
    mediaUrl: null,
    status: 'read',
    readBy: [],
    createdAt: '2026-11-14T10:00:00.000Z',
    updatedAt: '2026-11-14T10:00:00.000Z',
  },
  {
    _id: '6660aa000000000000001202',
    conversationId: '6660bb000000000000000102',
    sender: '665f1a2b3c4d5e6f7a8b9c05',
    content: 'Check Figma for mobile wireframes',
    messageType: 'text',
    mediaUrl: null,
    status: 'read',
    readBy: ['665f1a2b3c4d5e6f7a8b9c01', '665f1a2b3c4d5e6f7a8b9c04'],
    createdAt: '2026-11-16T16:00:00.000Z',
    updatedAt: '2026-11-16T16:00:00.000Z',
  },
  {
    _id: '6660aa000000000000001203',
    conversationId: '6660bb000000000000000102',
    sender: '665f1a2b3c4d5e6f7a8b9c04',
    content: 'New mobile bottom navigation concept shared',
    messageType: 'text',
    mediaUrl: null,
    status: 'read',
    readBy: ['665f1a2b3c4d5e6f7a8b9c01', '665f1a2b3c4d5e6f7a8b9c05'],
    createdAt: '2026-11-16T16:20:00.000Z',
    updatedAt: '2026-11-16T16:20:00.000Z',
  },

  // Weekend Hangouts
  {
    _id: '6660aa000000000000001301',
    conversationId: '6660bb000000000000000103',
    sender: '665f1a2b3c4d5e6f7a8b9c02',
    content: 'sarah created group "Weekend Hangouts"',
    messageType: 'system',
    mediaUrl: null,
    status: 'read',
    readBy: [],
    createdAt: '2026-11-13T18:00:00.000Z',
    updatedAt: '2026-11-13T18:00:00.000Z',
  },
  {
    _id: '6660aa000000000000001302',
    conversationId: '6660bb000000000000000103',
    sender: '665f1a2b3c4d5e6f7a8b9c02',
    content: 'Who is up for brunch this Sunday?',
    messageType: 'text',
    mediaUrl: null,
    status: 'read',
    readBy: ['665f1a2b3c4d5e6f7a8b9c01', '665f1a2b3c4d5e6f7a8b9c04'],
    createdAt: '2026-11-14T19:30:00.000Z',
    updatedAt: '2026-11-14T19:30:00.000Z',
  },
];

/* ------------------------------------------------------------------ */
/* "populate" helpers – mimic what the API will return                 */
/* ------------------------------------------------------------------ */
const userById = (id) => users.find((u) => u._id === id);

// Like: Conversation.find({ participants: userId })
//         .populate('participants', '-password')
//         .populate('lastMessage')
//         .sort({ updatedAt: -1 })
export function getConversationsForUser(userId = CURRENT_USER_ID) {
  return conversations
    .filter((c) => c.participants.includes(userId))
    .map((c) => ({
      ...c,
      participants: c.participants.map(userById),
      otherUser: userById(c.participants.find((p) => p !== userId)),
      lastMessage: messages.find((m) => m._id === c.lastMessage) || null,
      unread: c.unreadCounts[userId] || 0,
    }))
    .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
}

// Like: Message.find({ conversationId }).sort({ createdAt: 1 })
export function getMessagesForConversation(conversationId) {
  return messages
    .filter((m) => m.conversationId === conversationId)
    .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}
