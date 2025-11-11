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
// endpoint validasi API key
app.post('/validate', async (req, res) => {
    console.log('POST /validate diterima:', req.body);

    const { apiKey } = req.body;
    if (!apiKey) {
        return res.status(400).json({ success: false, message: 'API key tidak boleh kosong' });
    }

    try {
        // ambil semua hash & salt dari database
        const [rows] = await pool.query("SELECT hash, salt FROM api_keys");

        for (const row of rows) {
            const testHash = crypto.createHmac('sha256', row.salt).update(apiKey).digest('hex');
            if (testHash === row.hash) {
                console.log('✅ API key valid');
                return res.json({ success: true, message: 'API key valid' });
            }
        }

        console.log('❌ API key tidak valid');
        res.json({ success: false, message: 'API key tidak valid' });
    } catch (err) {
        console.error('❌ Error validasi ke DB:', err);
        res.status(500).json({ success: false, message: 'Gagal memeriksa API key' });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});