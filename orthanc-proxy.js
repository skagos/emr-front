const express = require('express');
const cors = require('cors');

// --------------- CONFIG ---------------
const PROXY_PORT = 5001; // ο proxy σου
const ORTHANC_URL = 'http://localhost:8042/instances'; // στόχος Orthanc
// --------------------------------------

const app = express();

/**
 * 1) CORS middleware για ΟΛΑ τα requests.
 *    Αυτό θα βάλει τα Access-Control-Allow-* headers.
 */
app.use(cors({
  origin: '*', // dev: επέτρεψε από παντού. Prod: βάλε το domain του frontend σου
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With'],
  credentials: false,
}));

/**
 * 2) Preflight για /instances
 *    Ο browser πριν το POST στέλνει OPTIONS. Εμείς ΠΡΕΠΕΙ να απαντήσουμε 200
 *    και να αφήσουμε το cors() middleware να δώσει τα headers.
 */
app.options('/instances', (req, res) => {
  res.sendStatus(200);
});

/**
 * 3) POST /instances
 *    - Παίρνουμε raw binary από τον browser (DICOM αρχείο).
 *    - Το προωθούμε αυτούσιο στον Orthanc.
 *    - Του γυρνάμε την απάντηση + ξαναβάζουμε CORS headers για σιγουριά.
 */
app.post('/instances', async (req, res) => {
  const chunks = [];
  req.on('data', chunk => chunks.push(chunk));
  req.on('end', async () => {
    const dicomBuffer = Buffer.concat(chunks);

    try {
      // Χρησιμοποιούμε το built-in fetch του Node 18
      const orthancResponse = await fetch(ORTHANC_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/dicom',
          // αν ενεργοποιήσεις πάλι auth στον Orthanc βάζεις:
          // 'Authorization': 'Basic ' + Buffer.from('orthanc:orthanc').toString('base64'),
        },
        body: dicomBuffer,
      });

      const text = await orthancResponse.text();

      res.status(orthancResponse.status);
      // Βάλε ξανά CORS headers για το browser
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept, Origin, X-Requested-With');
      res.send(text);
    } catch (err) {
      console.error('Proxy error -> Orthanc:', err);
      res.status(500);
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.json({ error: 'Failed to reach Orthanc', details: err.message });
    }
  });
});

/**
 * 4) Healthcheck / debug
 */
app.get('/ping', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json({ ok: true, msg: 'proxy running' });
});

app.listen(PROXY_PORT, () => {
  console.log(`Orthanc proxy listening on http://localhost:${PROXY_PORT}`);
});
