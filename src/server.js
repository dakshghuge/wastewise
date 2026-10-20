require('dotenv').config();
const app = require('./app');

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => {
  console.info(`WasteWise AI listening on http://localhost:${port}`);
});
