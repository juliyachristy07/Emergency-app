import express from 'express';
import cors from 'cors';
import photosRouter from './routes/photos.js';
import consentRouter from './routes/consent.js';
import requestsRouter from './routes/requests.js';
import auditRouter from './routes/audit.js';
import { initializeStore } from './models/Store.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Mount API routes
app.use('/api/photos', photosRouter);
app.use('/api/consent', consentRouter);
app.use('/api/requests', requestsRouter);
app.use('/api/audit', auditRouter);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'Hospital Coordination Module - Consent & Photo-Sharing API' });
});

// Reset demo store endpoint
app.post('/api/reset', (req, res) => {
  initializeStore();
  res.json({ success: true, message: 'Store reset to initial seed state.' });
});

app.listen(PORT, () => {
  console.log(`🏥 Emergency Handoff Consent Server running on http://localhost:${PORT}`);
});
