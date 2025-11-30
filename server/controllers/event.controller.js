// In server/controllers/event.controller.js
const Event = require('../models/event.model');
const User = require('../models/user.model');
const Certificate = require('../models/certificate.model');
const { nanoid } = require('nanoid');
const crypto = require('crypto');


// --- Create a new event (Admin or Faculty) ---
exports.createEvent = async (req, res) => {
    try {
        // 1. Extract 'certificateConfig' from the request body
        const { name, date, description, certificateConfig } = req.body;
        
        const newEvent = new Event({
            name,
            date,
            description,
            createdBy: req.user.id,
            certificatesIssued: false,
            // 2. SAVE THE CONFIG TO THE DATABASE
            certificateConfig: certificateConfig 
        });

        const savedEvent = await newEvent.save();
        res.status(201).json(savedEvent);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

// --- Get all events (for Admin/Faculty panel) ---
exports.getAllEvents = async (req, res) => {
    try {
        const events = await Event.find().populate('createdBy', 'name');
        res.json(events);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

// --- Get a single event by ID (for public page) ---
exports.getEventById = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }
        res.json(event);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

// --- Get event participants (Admin or Faculty) ---
exports.getEventParticipants = async (req, res) => {
    try {
        const event = await Event.findById(req.params.id);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }
        res.json(event.participants);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

// --- Register a participant for an event (Public) ---
exports.registerForEvent = async (req, res) => {
    try {
        const { name, email } = req.body;
        const event = await Event.findById(req.params.id);

        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }
        
        const normalizedEmail = email.toLowerCase(); 

        const isRegistered = event.participants.some(p => p.email === normalizedEmail);
        if (isRegistered) {
            return res.status(400).json({ message: 'Email already registered for this event' });
        }

        event.participants.push({ name, email: normalizedEmail });
        await event.save();

        res.status(201).json({ message: 'Successfully registered for the event' });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

// --- THIS IS THE FUNCTION WE'VE BEEN TRYING TO ADD ---
exports.getPublicEvents = async (req, res) => {
    try {
        const events = await Event.find({
            // You could add filters here later, e.g., { isPublic: true }
        })
        .select('name date description createdBy') // Only send public-safe data
        .populate('createdBy', 'name')
        .sort({ date: 1 }); 

        res.json(events);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

// --- Register the LOGGED-IN student for an event ---
exports.registerMeForEvent = async (req, res) => {
    try {
        const { name, email } = req.user;
        const eventId = req.params.id;

        const event = await Event.findById(eventId);
        if (!event) {
            return res.status(404).json({ message: 'Event not found' });
        }

        const isRegistered = event.participants.some(p => p.email === email);
        if (isRegistered) {
            return res.status(400).json({ message: 'You are already registered for this event' });
        }

        event.participants.push({ name, email });
        await event.save();

        res.status(201).json({ message: 'Successfully registered for the event!' });
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};