const express = require('express');
const path = require('path');
const crypto = require('crypto');
const mysql = require('mysql2/promise'); // gunakan versi promise

const app = express();
const port = 3000;

// middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// buat koneksi pool ke MySQL
const pool = mysql.createPool({
    host: "localhost",
    port: 3307, // sesuaikan dengan port di DBngin
    user: "root",
    password: "", // isi jika MySQL kamu pakai password
    database: "testapi", // ganti dengan nama database kamu
});

// route utama
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// generate API key & simpan ke DB
app.post('/create', async (req, res) => {
    console.log('POST /create diterima:', req.body);

    const length = req.body.length || 32;
    const label = req.body.label || null;

    try {
        const apiKey = crypto.randomBytes(length).toString('hex');
        const salt = crypto.randomBytes(16).toString('hex');
        const hash = crypto.createHmac('sha256', salt).update(apiKey).digest('hex');

        // simpan ke database
        await pool.query(
            "INSERT INTO api_keys (label, hash, salt, created_at) VALUES (?, ?, ?, NOW())",
            [label, hash, salt]
        );

        console.log('✅ API key berhasil disimpan ke DB');
        res.json({ success: true, apiKey });
    } catch (err) {
        console.error('❌ Error insert ke DB:', err);
        res.status(500).json({ success: false, message: 'Gagal menyimpan ke DB' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});