import axios from "axios";
import "dotenv/config";

const USER_SERVICE_URL =
  process.env.USER_SERVICE_URL || "http://user-service:3001";

export async function fetchAllUsers() {
  try {
    const response = await axios.get(`${USER_SERVICE_URL}/users`);
    return response.data;
  } catch (error) {
    console.error("Error fetching users:", error.message);
    return [];
  }
}

export async function fetchUserPreferences(userId) {
  try {
    const response = await axios.get(`${USER_SERVICE_URL}/user/${userId}`);
    return response.data.preferences || {};
  } catch (error) {
    console.error("Error fetching user preferences:", error.message);
    return null;
  }
}
