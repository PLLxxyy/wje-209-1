import express from 'express';
import cors from 'cors';
import authRoutes from './auth';
import meetupRoutes from './meetups';
import userRoutes from './users';

const app = express();
const PORT = Number(process.env.PORT) || 3209;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/meetups', meetupRoutes);
app.use('/api/users', userRoutes);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`[backend] 服务启动于 http://localhost:${PORT}`);
});
