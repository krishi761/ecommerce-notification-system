import "dotenv/config";
import express, { json } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import pool from "./db.js";

const app = express();
app.use(json());

//helper functions
const findUserByEmail = async (email) => {
  const result = await pool.query("SELECT * FROM users WHERE email = $1", [
    email,
  ]);
  return result.rows[0];
};

const createUser = async (name, email, hashedPassword, preferences) => {
  const result = await pool.query(
    `INSERT INTO users (name, email, hashed_password, preferences)
        VALUES ($1, $2, $3, $4)
        RETURNING id, name, email, preferences`,
    [name, email, hashedPassword, preferences]
  );
  return result.rows[0];
};

//routes

//register
app.post("/register", async (req, res) => {
  try {
    const { name, email, password, preferences = {} } = req.body;

    if (await findUserByEmail(email)) {
      return res.status(401).json({ error: "Email already registered" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await createUser(name, email, hashedPassword, preferences);

    res.status(201).json({
      id: user.id,
      name: user.name,
      email: user.email,
      preferences: user.preferences,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

//login
app.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await findUserByEmail(email);

    if (!user || !(await bcrypt.compare(password, user.hashed_password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1hr",
    });
    res.json({ token, userId: user.id });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

//all users
app.get("/users", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, email, preferences FROM users"
    );
    res.json(result.rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//user by id
app.get("/user/:id", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, email, preferences FROM users WHERE id = $1",
      [req.params.id]
    );
    if (!result.rows[0])
      return res.status(404).json({ error: "User not found" });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//update preferences
app.put("/user/:id/preferences", async (req, res) => {
  try {
    const preferences = req.body;
    const result = await pool.query(
      `UPDATE users SET preferences = $1
      WHERE id = $2
      RETURNING id, name, email, preferences`,
      [JSON.stringify(preferences), req.params.id]
    );
    if (!result.rows[0])
      return res.status(404).json({ error: "User not found" });
    res.json(result.rows[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));
