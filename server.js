const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');

const app = express();
const PORT = process.env.PORT || 3000; // Render ke liye PORT dynamic rakha hai

// 1. Middleware
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// 2. MongoDB Cloud Connection (Cleaned Link)
const dbURI = "mongodb+srv://shikhar:makeup%40123@cluster0.cloieau.mongodb.net/shraddhaMakeup?retryWrites=true&w=majority";

mongoose.connect(dbURI)
    .then(() => console.log("✅ Cloud Database Connected!"))
    .catch(err => {
        console.error("❌ Cloud DB Error Details:", err.message);
    });

// 3. Schema & Model
const bookingSchema = new mongoose.Schema({
    name: String,
    email: String,
    phone: String,
    service: String,
    date: Date,
    status: { type: String, default: "Pending" },
    bookingDate: { type: Date, default: Date.now }
});

const Booking = mongoose.model('Booking', bookingSchema);

// 4. NODEMAILER CONFIGURATION
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'peppergaming001@gmail.com',
        pass: 'jboy kwwr knyw rdul' 
    }
});

// 5. Route: Nayi Booking (Improved with Email Error Handling)
app.post('/api/book', async (req, res) => {
    try {
        const { name, email, phone, service, date } = req.body;
        
        // Pehle DB mein save karo
        const newBooking = new Booking({ name, email, phone, service, date });
        await newBooking.save();

        // Email setup
        const mailOptions = {
            from: 'peppergaming001@gmail.com',
            to: 'cybersleuthofficiall@gmail.com', 
            subject: `New Booking Alert: ${name}`,
            html: `
                <div style="font-family: Arial, sans-serif; border: 1px solid #d4af37; padding: 20px; border-radius: 10px;">
                    <h2 style="color: #d4af37;">New Makeup Booking Received!</h2>
                    <p><strong>Customer Name:</strong> ${name}</p>
                    <p><strong>Service:</strong> ${service}</p>
                    <p><strong>Event Date:</strong> ${new Date(date).toDateString()}</p>
                    <p><strong>Contact:</strong> ${phone}</p>
                    <hr>
                    <p>Admin Dashboard check kar lo details ke liye.</p>
                </div>
            `
        };

        // Email bhejo par error aane par booking mat roko
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) console.log("❌ Email Error (Booking Saved Anyway):", error.message);
            else console.log("📧 Email Sent: " + info.response);
        });

        res.status(200).json({ message: "Booking Successful!" });
    } catch (err) { 
        console.error("❌ DB Save Error:", err);
        res.status(500).json({ message: "Failed to book. Server issue!" }); 
    }
});

// 6. Route: Admin Dashboard data fetch
app.get('/api/admin/bookings', async (req, res) => {
    try {
        const data = await Booking.find().sort({ date: 1 });
        res.status(200).json(data);
    } catch (err) { res.status(500).json({ message: "Error fetching bookings" }); }
});

// 7. Route: Booking CONFIRM/CANCEL logic
app.post('/api/admin/confirm/:id', async (req, res) => {
    try {
        await Booking.findByIdAndUpdate(req.params.id, { status: "Confirmed" });
        res.json({ message: "Confirmed" });
    } catch (err) { res.status(500).send(err); }
});

app.post('/api/admin/cancel/:id', async (req, res) => {
    try {
        await Booking.findByIdAndUpdate(req.params.id, { status: "Cancelled" });
        res.json({ message: "Cancelled" });
    } catch (err) { res.status(500).send(err); }
});

// 8. Route: USER STATUS CHECK
app.get('/api/status/:phone', async (req, res) => {
    try {
        const phone = req.params.phone;
        const booking = await Booking.findOne({ phone: phone }).sort({ bookingDate: -1 });
        
        if (booking) {
            res.status(200).json(booking);
        } else {
            res.status(404).json({ message: "Booking not found" });
        }
    } catch (err) {
        res.status(500).json({ message: "Error fetching status" });
    }
});

// 9. Route: Admin Page Serve
app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// 10. Start Server
app.listen(PORT, () => console.log(`🚀 Server: http://localhost:${PORT}`));
