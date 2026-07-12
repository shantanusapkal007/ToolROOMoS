const jwt = require('jsonwebtoken');

const secret = 'change-me-in-production'; // from backend/.env
const payload = {
  sub: '19370532-ae3e-412d-b876-d6c8d6adc074',
  email: 'admin@toolroom.com',
  role: 'ADMIN',
  name: 'System Admin',
  employeeId: null
};

const token = jwt.sign(payload, secret, { expiresIn: '1h' });
console.log(token);
