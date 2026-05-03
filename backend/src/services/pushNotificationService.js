import axios from 'axios';

const ONESIGNAL_APP_ID = process.env.ONESIGNAL_APP_ID;
const ONESIGNAL_API_KEY = process.env.ONESIGNAL_API_KEY;
const ONESIGNAL_API_URL = 'https://onesignal.com/api/v1/notifications';

// Send push notification to specific user
export const sendPushNotification = async (userId, notification) => {
  try {
    if (!ONESIGNAL_APP_ID || !ONESIGNAL_API_KEY) {
      console.log('Push notification service not configured. Notification would be sent to:', userId);
      console.log('Notification:', notification);
      return { success: true, message: 'Push service not configured (dev mode)' };
    }

    const payload = {
      app_id: ONESIGNAL_APP_ID,
      include_external_user_ids: [userId],
      headings: { en: notification.title },
      contents: { en: notification.message },
      data: notification.data || {},
      url: notification.url || process.env.FRONTEND_URL
    };

    const response = await axios.post(ONESIGNAL_API_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${ONESIGNAL_API_KEY}`
      }
    });

    console.log('Push notification sent:', response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Push notification failed:', error.response?.data || error.message);
    return { success: false, error: error.message };
  }
};

// Send push notification to multiple users
export const sendBulkPushNotification = async (userIds, notification) => {
  try {
    if (!ONESIGNAL_APP_ID || !ONESIGNAL_API_KEY) {
      console.log('Push notification service not configured. Notification would be sent to:', userIds.length, 'users');
      return { success: true, message: 'Push service not configured (dev mode)' };
    }

    const payload = {
      app_id: ONESIGNAL_APP_ID,
      include_external_user_ids: userIds,
      headings: { en: notification.title },
      contents: { en: notification.message },
      data: notification.data || {},
      url: notification.url || process.env.FRONTEND_URL
    };

    const response = await axios.post(ONESIGNAL_API_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${ONESIGNAL_API_KEY}`
      }
    });

    return { success: true, data: response.data };
  } catch (error) {
    console.error('Bulk push notification failed:', error.response?.data || error.message);
    return { success: false, error: error.message };
  }
};

// Send push notification to all users
export const sendBroadcastNotification = async (notification) => {
  try {
    if (!ONESIGNAL_APP_ID || !ONESIGNAL_API_KEY) {
      console.log('Push notification service not configured. Broadcast notification:', notification);
      return { success: true, message: 'Push service not configured (dev mode)' };
    }

    const payload = {
      app_id: ONESIGNAL_APP_ID,
      included_segments: ['All'],
      headings: { en: notification.title },
      contents: { en: notification.message },
      data: notification.data || {},
      url: notification.url || process.env.FRONTEND_URL
    };

    const response = await axios.post(ONESIGNAL_API_URL, payload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${ONESIGNAL_API_KEY}`
      }
    });

    return { success: true, data: response.data };
  } catch (error) {
    console.error('Broadcast notification failed:', error.response?.data || error.message);
    return { success: false, error: error.message };
  }
};

// Notification templates
export const notificationTemplates = {
  newBooking: (data) => ({
    title: 'New Booking Request',
    message: `${data.learnerName} wants to book a session with you`,
    data: { type: 'booking', bookingId: data.bookingId },
    url: `${process.env.FRONTEND_URL}/bookings`
  }),

  bookingConfirmed: (data) => ({
    title: 'Booking Confirmed',
    message: `Your session with ${data.tutorName} is confirmed`,
    data: { type: 'booking', bookingId: data.bookingId },
    url: `${process.env.FRONTEND_URL}/bookings`
  }),

  sessionReminder: (data) => ({
    title: 'Session Reminder',
    message: `Your session starts in ${data.minutesUntil} minutes`,
    data: { type: 'session', sessionId: data.sessionId },
    url: `${process.env.FRONTEND_URL}/sessions/${data.sessionId}`
  }),

  newMessage: (data) => ({
    title: `New message from ${data.senderName}`,
    message: data.messagePreview,
    data: { type: 'message', conversationId: data.conversationId },
    url: `${process.env.FRONTEND_URL}/messages`
  }),

  reviewReceived: (data) => ({
    title: 'New Review',
    message: `${data.reviewerName} left you a ${data.rating}-star review`,
    data: { type: 'review', reviewId: data.reviewId },
    url: `${process.env.FRONTEND_URL}/profile`
  }),

  badgeEarned: (data) => ({
    title: 'Badge Earned!',
    message: `Congratulations! You earned the "${data.badgeName}" badge`,
    data: { type: 'badge', badgeId: data.badgeId },
    url: `${process.env.FRONTEND_URL}/profile`
  })
};

export default {
  sendPushNotification,
  sendBulkPushNotification,
  sendBroadcastNotification,
  notificationTemplates
};
