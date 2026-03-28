exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const ACCESS_TOKEN = process.env.SQUARE_ACCESS_TOKEN;
  const LOCATION_ID  = process.env.SQUARE_LOCATION_ID;

  try {
    const { sourceId, amount, note } = JSON.parse(event.body);
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
      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, paymentId: data.payment.id })
      };
    } else {
      const errMsg = data.errors?.[0]?.detail || 'Payment failed';
      return {
        statusCode: 400,
        body: JSON.stringify({ success: false, error: errMsg })
      };
    }
  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, error: e.message })
    };
  }
};
