export const queries = {
  createNotification: `
      INSERT INTO notifications (user_id, type, content)
      VALUES ($1, $2, $3)
      RETURNING *
    `,
  getUnreadNotifications: `
      SELECT id, 
      user_id AS "userId", 
      type, 
      content, 
      sent_at AS "sentAt",  
      read
      FROM notifications
      WHERE user_id = $1 AND read = FALSE
    `,
  markAsRead: `
      UPDATE notifications
      SET read = TRUE
      WHERE id = $1
      RETURNING *
    `,
  newRecommendation: `
      INSERT INTO notifications (user_id, type, content)
      VALUES ($1, $2, $3)
      RETURNING *
    `,
  orderStatusUpdate: `
      INSERT INTO notifications (user_id, type, content)
      VALUES ($1, $2, $3)
      RETURNING *
    `,
};
