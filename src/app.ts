import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import apiRoutes from './routes/api.js';
import mcpRoutes from './routes/mcp.js';

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());

app.use('/api', apiRoutes);
app.use('/mcp', mcpRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

export default app;