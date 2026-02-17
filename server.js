const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const cors = require("cors");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());
app.use(express.static("public")); // 👈 serve le pagine HTML

// file utenti
const USERS_FILE = "./users.json";

if (!fs.existsSync(USERS_FILE)) {
  fs.writeFileSync(USERS_FILE, JSON.stringify([]));
}

function getUsers() {
  return JSON.parse(fs.readFileSync(USERS_FILE));
}

function saveUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

/* ===== REGISTRAZIONE ===== */
app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  let users = getUsers();

  if (users.find(u => u.username === username)) {
    return res.json({ success: false, message: "Utente già esistente" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  users.push({ username, password: hashedPassword });
  saveUsers(users);

  res.json({ success: true, message: "Registrazione completata" });
});

/* ===== LOGIN ===== */
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  let users = getUsers();

  const user = users.find(u => u.username === username);
  if (!user) {
    return res.json({ success: false, message: "Credenziali errate" });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.json({ success: false, message: "Credenziali errate" });
  }

  res.json({ success: true, message: "Login riuscito" });
});

// 👇 apre la pagina login
app.get("/", (req, res) => {
  res.sendFile(__dirname + "/public/index.html");
});

app.listen(PORT, () => {
  console.log(`Server avviato su http://localhost:${PORT}`);
});
