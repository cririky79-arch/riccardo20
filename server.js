const express = require("express");
const bodyParser = require("body-parser");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

/* ================== CONFIG ================== */

let maintenanceMode = false;
const ADMIN_PASSWORD = "2012";
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

/* ============ MANUTENZIONE (FIX VERO) ============ */
/* QUESTO DEVE STARE PRIMA DI express.static */

app.use((req, res, next) => {

  // rotte SEMPRE accessibili
  if (
    req.path.startsWith("/login") ||
    req.path.startsWith("/register") ||
    req.path.startsWith("/admin")
  ) {
    return next();
  }

  // se manutenzione attiva → mostra pagina manutenzione
  if (maintenanceMode) {
    return res.sendFile(path.join(__dirname, "public", "maintenance.html"));
  }

  next();
});

/* ================= FILE STATICI ================= */

app.use(express.static("public"));

/* ================= USER ================= */

app.post("/register", async (req, res) => {
  const { username, password } = req.body;
  let users = getUsers();

  if (users.find(u => u.username === username)) {
    return res.json({ success:false, message:"Utente già registrato" });
  }

  const hash = await bcrypt.hash(password,10);
  users.push({ username, password: hash });
  saveUsers(users);

  res.json({ success:true, message:"Registrazione completata" });
});

app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  let users = getUsers();

  const user = users.find(u => u.username === username);
  if (!user)
    return res.json({ success:false, message:"Credenziali errate" });

  const ok = await bcrypt.compare(password, user.password);
  if (!ok)
    return res.json({ success:false, message:"Credenziali errate" });

  res.json({ success:true, message:"Login riuscito ✅" });
});

/* ================= ADMIN ================= */

app.post("/admin-login",(req,res)=>{
  if(req.body.password === ADMIN_PASSWORD)
    return res.json({success:true});

  res.json({success:false});
});

app.post("/admin-toggle",(req,res)=>{
  maintenanceMode = !maintenanceMode;

  console.log("MANUTENZIONE:", maintenanceMode);

  res.json({
    success:true,
    maintenance:maintenanceMode
  });
});

app.get("/admin-users",(req,res)=>{
  res.json(getUsers());
});

/* ================= HOME ================= */

app.get("/", (req,res)=>{
  res.sendFile(path.join(__dirname,"public","index.html"));
});

app.listen(PORT, ()=>{
  console.log("Server avviato su http://localhost:"+PORT);
});
