require('dotenv').config(); // Should pick up .env in the current directory
const mongoose = require('mongoose');

const test = async () => {
    try {
        if (!process.env.MONGODB_URI) {
            console.error('❌ MONGODB_URI is not defined in .env');
            process.exit(1);
        }
        console.log('Testing connection to ' + process.env.MONGODB_URI.substring(0, 30) + '...');
        await mongoose.connect(process.env.MONGODB_URI, { dbName: 'eduvoice' });
        console.log('✅ Connection Successful!');
        await mongoose.disconnect();
        process.exit(0);
    } catch (err) {
        console.error('❌ Connection Failed:', err.message);
        process.exit(1);
    }
};

test();
