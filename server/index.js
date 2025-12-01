// In server/index.js
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// --- 1. IMPORT ROUTE FILES ---
const userRoutes = require('./routes/user.routes');
const eventRoutes = require('./routes/event.routes');
const certificateRoutes = require('./routes/certificate.routes');
const adminRoutes = require('./routes/admin.routes');
const authRoutes = require('./routes/auth.routes');     // <--- THIS WAS LIKELY MISSING
const verifierRoutes = require('./routes/verifier.routes');
const quizRoutes = require('./routes/quiz.routes');

const app = express();
const PORT = process.env.PORT || 5001;

// --- 2. MIDDLEWARE ---
// Increase payload size for images (Logo/Signatures)
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(cors());

// --- 3. DATABASE CONNECTION ---
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected successfully.'))
    .catch(err => console.error('MongoDB connection error:', err));

// --- 4. TEST ROUTE (Sanity Check) ---
app.get('/', (req, res) => {
    res.send('CredentialChain API is Running!');
});

// --- 5. REGISTER ROUTES ---
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);         // <--- THIS ACTIVATES THE ROUTE
app.use('/api/verifier', verifierRoutes);
app.use('/api/quiz', quizRoutes);

// --- 6. START SERVER ---
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});