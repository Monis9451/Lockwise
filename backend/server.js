const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const connectDB = require('./config/db');
const authRouter = require('./routes/authRouter');
const passwordRouter = require('./routes/passwordRouter');
const faceDataRoutes = require('./routes/FaceDataRoutes');
const morgan = require("morgan");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));

app.use((req, res, next) => {
  const allowedOrigins = ['http://localhost:5173', 'http://localhost:8080'];
  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  }
  
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

connectDB();
app.get("/", (req, res) => {
    res.send("Lock Wise is running...");
});
app.use('/auth', authRouter);

app.use('/passwords', passwordRouter);

app.use('/face-data', faceDataRoutes);

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});