import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/tutorxpert';

mongoose.connect(MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('❌ MongoDB connection error:', err));

// Session Tools Data Schema (Whiteboard, Code Editor, Notes)
const sessionToolsSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, index: true },
  bookingId: { type: String, required: true },
  whiteboard: {
    snapshots: [{
      timestamp: Date,
      imageUrl: String,
      data: mongoose.Schema.Types.Mixed
    }],
    drawings: [{
      timestamp: Date,
      type: String,
      color: String,
      points: Array,
      userId: String
    }]
  },
  codeEditor: {
    snippets: [{
      timestamp: Date,
      language: String,
      code: String,
      userId: String
    }],
    executions: [{
      timestamp: Date,
      language: String,
      code: String,
      output: String,
      error: String
    }]
  },
  notes: [{
    timestamp: Date,
    content: String,
    userId: String,
    isPinned: { type: Boolean, default: false }
  }],
  files: [{
    name: String,
    url: String,
    type: String,
    size: Number,
    uploadedAt: Date,
    uploadedBy: String
  }],
  quizzes: [{
    quizId: String,
    title: String,
    questions: [{
      questionId: String,
      question: String,
      type: String,
      options: Array,
      correctAnswer: String,
      userAnswer: String,
      isCorrect: Boolean,
      answeredAt: Date
    }],
    score: Number,
    completedAt: Date
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

sessionToolsSchema.index({ bookingId: 1 });

// Session Activity Log Schema
const sessionActivitySchema = new mongoose.Schema({
  sessionId: { type: String, required: true, index: true },
  userId: { type: String, required: true },
  userType: { type: String, enum: ['learner', 'tutor'] },
  activity: { type: String, required: true },
  metadata: mongoose.Schema.Types.Mixed,
  timestamp: { type: Date, default: Date.now }
});

sessionActivitySchema.index({ sessionId: 1, timestamp: -1 });

// Chat Messages Schema (for session chat)
const sessionChatSchema = new mongoose.Schema({
  sessionId: { type: String, required: true, index: true },
  senderId: { type: String, required: true },
  senderName: String,
  senderRole: { type: String, enum: ['learner', 'tutor'] },
  message: { type: String, required: true },
  messageType: { 
    type: String, 
    enum: ['text', 'file', 'image', 'code', 'link'],
    default: 'text'
  },
  metadata: mongoose.Schema.Types.Mixed,
  isSystem: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now }
});

sessionChatSchema.index({ sessionId: 1, timestamp: -1 });

// Analytics Events Schema
const analyticsEventSchema = new mongoose.Schema({
  userId: { type: String, index: true },
  eventType: { type: String, required: true, index: true },
  category: { type: String, index: true },
  properties: mongoose.Schema.Types.Mixed,
  sessionId: String,
  bookingId: String,
  page: String,
  userAgent: String,
  ip: String,
  timestamp: { type: Date, default: Date.now }
});

analyticsEventSchema.index({ userId: 1, timestamp: -1 });
analyticsEventSchema.index({ eventType: 1, timestamp: -1 });

// Export Models
export const SessionTools = mongoose.model('SessionTools', sessionToolsSchema);
export const SessionActivity = mongoose.model('SessionActivity', sessionActivitySchema);
export const SessionChat = mongoose.model('SessionChat', sessionChatSchema);
export const AnalyticsEvent = mongoose.model('AnalyticsEvent', analyticsEventSchema);

export default {
  SessionTools,
  SessionActivity,
  SessionChat,
  AnalyticsEvent
};
