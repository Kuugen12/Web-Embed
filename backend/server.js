const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
app.use(cors());
app.use(bodyParser.json());

app.post("/login", (req, res) => {
    const { username, password } = req.body;

    // Contoh validasi sederhana
    if (username === "admin" && password === "1234") {
        res.json({ success: true, message: "Login berhasil!" });
    } else {
        res.json({ success: false, message: "Username atau password salah!" });
    }
});

app.listen(5000, () => {
    console.log("Server berjalan di port 5000");
});
