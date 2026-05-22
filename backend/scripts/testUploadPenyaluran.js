const fs = require('fs');
const path = require('path');
const axios = require('axios');

async function test() {
  const url = 'http://localhost:8080/penyaluran';
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjIsImVtYWlsIjoiYWRtaW5AcGFudGkubG9jYWwiLCJyb2xlIjoicGVuZ3VydXMiLCJpZERvbmF0dXIiOm51bGwsImlkUGFudGkiOjEsImlhdCI6MTc3OTQ1MDI2NiwiZXhwIjoxNzgwMDU1MDY2fQ.rUhdW4d__bv_GEjuHf-Y-j7orz8TXLDuyjXUzaa57Pc';
  const filePath = path.join(__dirname, '..', 'test-files', 'sample.jpg');

  if (!fs.existsSync(filePath)) {
    console.error('Test image not found:', filePath);
    process.exit(1);
  }

  const form = new FormData();
  form.append('id_donasi', '1');
  form.append('id_panti', '1');
  form.append('jumlah_disalurkan', '10000');
  form.append('tanggal_salur', new Date().toISOString().slice(0,10));
  form.append('foto_bukti', fs.createReadStream(filePath));

  const headers = Object.assign({ Authorization: `Bearer ${token}` }, form.getHeaders());

  try {
    const res = await axios.post(url, form, { headers });
    console.log('Response status:', res.status);
    console.log(res.data);
  } catch (err) {
    console.error('Request failed:', err.response?.status, err.response?.data || err.message);
  }
}

test();
