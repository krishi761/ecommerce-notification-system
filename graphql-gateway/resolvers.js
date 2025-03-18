import axios from "axios";
import "dotenv/config";

const USER_SERVICE_URL = process.env.USER_SERVICE_URL;
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL;
const RECOMMENDATION_SERVICE_URL = process.env.RECOMMENDATION_SERVICE_URL;
const ORDER_SERVICE_URL = process.env.ORDER_SERVICE_URL;

export const resolvers = {
  Query: {
    me: async (_, __, { userId }) => {
      if (!userId) throw new Error("Not authenticated");
      const response = await axios.get(`${USER_SERVICE_URL}/user/${userId}`);
      return response.data;
    },
    userNotifications: async (_, __, { userId }) => {
      if (!userId) return [];
      const response = await axios.get(
        `${NOTIFICATION_SERVICE_URL}/notifications/unread/${userId}`
      );
      return response.data;
    },
    recommendations: async (_, __, { userId }) => {
      if (!userId) return [];
      const response = await axios.get(
        `${RECOMMENDATION_SERVICE_URL}/recommendations/${userId}`
      );
      return response.data;
    },
    orders: async (_, __, { userId }) => {
      if (!userId) return [];
      const response = await axios.get(`${ORDER_SERVICE_URL}/orders/${userId}`);
      return response.data;
    },
  },
  Mutation: {
    register: async (_, { userInput }) => {
      const response = await axios.post(
        `${USER_SERVICE_URL}/register`,
        userInput
      );
      return response.data;
    },
    login: async (_, { loginInput }) => {
      const response = await axios.post(
        `${USER_SERVICE_URL}/login`,
        loginInput
      );
      return response.data;
    },
    updatePreferences: async (_, { prefsInput }, { userId }) => {
      if (!userId) throw new Error("Not authenticated");
      const response = await axios.put(
        `${USER_SERVICE_URL}/user/${userId}/preferences`,
        prefsInput
      );
      console.log("User Service Response:", response.data);

      return response.data;
    },
    placeOrder: async (_, { orderInput }) => {
      const response = await axios.post(
        `${ORDER_SERVICE_URL}/order`,
        orderInput
      );
      return response.data;
    },
    markNotificationRead: async (_, { notificationId }, { userId }) => {
      if (!userId) throw new Error("Not authenticated");
      const response = await axios.post(
        `${NOTIFICATION_SERVICE_URL}/notifications/mark-read/${notificationId}`
      );
      return response.status === 200;
    },
  },
};
