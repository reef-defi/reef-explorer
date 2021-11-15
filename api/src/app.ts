import express from "express";
import morgan from 'morgan';
import verificationRouter from "./routes/contract-verification";

const cors = require('cors');

const app = express();

// Parse incoming requests with JSON payloads
app.use(express.urlencoded({extended: true}));
app.use(express.json());
app.use(cors());
app.use(morgan('dev'));

app.use('/api/verificator', verificationRouter);

export default app;