require('dotenv').config()
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const xlsx = require("xlsx");
const app = express();
const port = 3001;
const SECRET_KEY = process.env.SECRET_KEY;

app.use(cors());
app.use(express.json());

const users = [
  {
    username: "admin",
    password: bcrypt.hashSync("M3l@nci@_Adm1n2024!", 10),
  },
];

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // Pega o token sem o "Bearer "
  if (!token) return res.sendStatus(401);

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

app.post("/login", (req, res) => {
  const { username, password } = req.body;
  const user = users.find((u) => u.username === username);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(403).send("Usuário ou senha inválidos");
  }

  const token = jwt.sign({ username: user.username }, SECRET_KEY, {
    expiresIn: "1h",
  });
  res.json({ token });
});

// Função para salvar os dados atualizados no arquivo Excel
const saveDataToExcel = () => {
  const worksheet = xlsx.utils.json_to_sheet(data);
  const workbook = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(workbook, worksheet, sheet_name_list[0]);
  xlsx.writeFile(workbook, "07412046.xlsx");
};

// Carregar dados do arquivo Excel
const workbook = xlsx.readFile("07412046.xlsx");
const sheet_name_list = workbook.SheetNames;
let data = xlsx.utils.sheet_to_json(workbook.Sheets[sheet_name_list[0]]);

app.get("/", (req, res) => {
  res.json({ items: data, totalItems: data.length });
});

app.post("/", authenticateToken, (req, res) => {
  const newData = req.body;
  const newId = data.length ? Math.max(...data.map((item) => item.id)) + 1 : 1;
  newData["id"] = newId; // Define o ID como o próximo número disponível
  data.push(newData);
  saveDataToExcel(); // Salva os dados atualizados no Excel
  res.status(201).send("Registro adicionado!");
});

app.put("/:id", authenticateToken, (req, res) => {
  const id = parseInt(req.params.id);
  const updatedData = req.body;
  const index = data.findIndex((item) => item.id === id);

  if (index !== -1) {
    data[index] = { ...data[index], ...updatedData };
    saveDataToExcel(); // Salva os dados atualizados no Excel
    res.send("Registro atualizado!");
  } else {
    res.status(404).send("Registro não encontrado!");
  }
});

app.delete("/:id", authenticateToken, (req, res) => {
  const id = parseInt(req.params.id);
  const index = data.findIndex((item) => item.id === id);

  if (index !== -1) {
    data.splice(index, 1);
    saveDataToExcel(); // Salva os dados atualizados no Excel
    res.send("Registro deletado!");
  } else {
    res.status(404).send("Registro não encontrado!");
  }
});

app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});
