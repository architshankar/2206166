
const express = require('express');
const axios = require('axios');

const app = express();
const port = 9876;
const windowSize = 10;

const Url = 'http://20.244.56.144/evaluation-service';
let numberStore = [];

// Get the access token from your credentials
const accessToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiZXhwIjoxNzQzNjAzNjMyLCJpYXQiOjE3NDM2MDMzMzIsImlzcyI6IkFmZm9yZG1lZCIsImp0aSI6ImE4OTNkYzk2LWYzNzMtNDgwNS05MDk3LWIwY2JiNzY5NGJkOCIsInN1YiI6ImFzaGFua2FyNjM3QGdtYWlsLmNvbSJ9LCJlbWFpbCI6ImFzaGFua2FyNjM3QGdtYWlsLmNvbSIsIm5hbWUiOiJhcmNoaXRzaGFua2FyIiwicm9sbE5vIjoiMjIwNjE2NiIsImFjY2Vzc0NvZGUiOiJud3B3cloiLCJjbGllbnRJRCI6ImE4OTNkYzk2LWYzNzMtNDgwNS05MDk3LWIwY2JiNzY5NGJkOCIsImNsaWVudFNlY3JldCI6IkNqY1pmaGh6WWhqV2RCTUoifQ.Ri7WWCfhh92b3UPyrt-Pd03LKysjKX4vRyUtf04LRnc";

app.get('/numbers/:numberid', async (req, res) => {
  const { numberid } = req.params;
  const validIds = ['p', 'f', 'e', 'r'];
  
  if (!validIds.includes(numberid)) {
    return res.status(400).json({ error: 'Invalid number ID' });
  }

  const apiEndpoint = {
    'p': 'primes',
    'f': 'fibo',
    'e': 'even',
    'r': 'rand'
  }[numberid];

  try {
    const windowPrevState = [...numberStore];
    
    // Include the Bearer token in the request header
    const response = await axios.get(`${Url}/${apiEndpoint}`, { 
      timeout: 500,
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });
    
    const newNumbers = response.data.numbers;

    newNumbers.forEach(num => {
      if (!numberStore.includes(num)) {
        if (numberStore.length >= windowSize) {
          numberStore.shift();
        }
        numberStore.push(num);
      }
    });

    const avg = numberStore.length > 0 
      ? (numberStore.reduce((sum, num) => sum + num, 0) / Math.min(numberStore.length, windowSize)).toFixed(2)
      : null;

    res.json({
      windowPrevState,
      windowCurrState: numberStore,
      numbers: newNumbers,
      avg: avg ? parseFloat(avg) : null
    });
  } catch (error) {
    console.error('Error details:', error.message);
    if (error.code === 'ECONNABORTED') {
      res.status(504).json({ error: 'Request timeout' });
    } else {
      res.status(500).json({ 
        error: 'Internal server error',
        message: error.message
      });
    }
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
