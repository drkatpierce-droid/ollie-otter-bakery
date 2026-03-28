const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors({
  origin: ['https://drkatpierce-droid.github.io', 'https://ollie-otter-bakery.onrender.com'],
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

app.use(express.json());
app.use(express.static(path.join(__dirname)));

const ACCESS_TOKEN = process.env.SQUARE_ACCESS_TOKEN;
const LOCATION_ID  = process.env.SQUARE_LOCATION_ID;

app.get('/', (req, res) => {
  res.json({ status: 'Ollie Otter Bakery server is running!' });
});

app.post('/pay', async (req, res) => {
  try {
    const { sourceId, amount, note } = req.body;
    const idempotencyKey = 'ollie-' + Date.now() + '-' + Math.random().toString(36).slice(2);

    const response = await fetch('https://connect.squareup.com/v2/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + ACCESS_TOKEN,
        'Square-Version': '2024-01-18'
      },
      body: JSON.stringify({
        idempotency_key: idempotencyKey,
        source_id: sourceId,
        amount_money: { amount, currency: 'USD' },
        location_id: LOCATION_ID,
        note
      })
    });

    const data = await response.json();

    if (data.payment && data.payment.status === 'COMPLETED') {
      res.json({ success: true, paymentId: data.payment.id });
    } else {
      const errMsg = data.errors?.[0]?.detail || 'Payment failed';
      res.status(400).json({ success: false, error: errMsg });
    }
  } catch (e) {
    res.status(500).json({ success: false, error: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
