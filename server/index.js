// In server/index.js

const requiredEnv = [
    'MONGO_URI', 
    'JWT_SECRET', 
    'GEMINI_API_KEY', 
    'EMAIL_HOST_USER', 
    'EMAIL_HOST_PASSWORD',
    'CONTRACT_ADDRESS',
    'BLOCKCHAIN_RPC_URL'
];

const missing = requiredEnv.filter(key => !process.env[key]);

if (missing.length > 0) {
    console.error("❌ CRITICAL ERROR: Missing Environment Variables:");
    console.error(missing.join(", "));
    console.error("Server cannot start. Please check your .env file or deployment settings.");
    process.exit(1);
}



// In server/index.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const quizRoutes = require('./routes/quiz.routes.js'); // <-- Check this

// Import routes
const userRoutes = require('./routes/user.routes');
const eventRoutes = require('./routes/event.routes.js');
const certificateRoutes = require('./routes/certificate.routes.js');
const adminRoutes = require('./routes/admin.routes.js'); 
const authRoutes = require('./routes/auth.routes.js');
const verifierRoutes = require('./routes/verifier.routes.js');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
// Increase payload size to allow image uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use('/api/quiz', quizRoutes); // <-- Check this

// --- Connect to MongoDB ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected successfully.'))
    .catch(err => console.error('MongoDB connection error:', err));
// ---

// --- API Routes ---
app.get('/', (req, res) => {
    res.send('Hello from the Credentialing System Backend!');
});

// Use the user routes
app.use('/api/users', userRoutes); // All user routes will be prefixed with /api/users

app.use('/api/events', eventRoutes);

app.use('/api/certificates', certificateRoutes);

app.use('/api/admin', adminRoutes);

app.use('/api/auth', authRoutes);

app.use('/api/verifier', verifierRoutes);



// ---

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});