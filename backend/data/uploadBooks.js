require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

// Define a simple schema for Book Files in GridFS context
const BookFileSchema = new mongoose.Schema({
  filename: String,
  contentType: String,
  length: Number,
  uploadDate: { type: Date, default: Date.now },
  class: String,
  subject: String,
  gridFsId: mongoose.Schema.Types.ObjectId,
  extractedTextPreview: String
});

// Avoid duplicate model definition error
const BookFile = mongoose.models.BookFile || mongoose.model('BookFile', BookFileSchema);

const uploadBooks = async () => {
  try {
    console.log('🔗 Connecting to MongoDB (High Timeout)...');
    await mongoose.connect(process.env.MONGODB_URI, { 
      dbName: 'eduvoice',
      connectTimeoutMS: 300000, // 5 mins
      socketTimeoutMS: 300000   // 5 mins
    });
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    const bucket = new mongoose.mongo.GridFSBucket(db, { bucketName: 'textbooks' });

    const booksDir = path.join(__dirname, '../../Books');
    if (!fs.existsSync(booksDir)) {
      throw new Error(`Books directory not found at ${booksDir}`);
    }
    const files = fs.readdirSync(booksDir).filter(f => f.endsWith('.pdf'));

    console.log(`📂 Found ${files.length} PDFs. Starting resilient upload...`);

    for (const filename of files) {
      let retryCount = 0;
      const MaxRetries = 3;
      let success = false;

      while (!success && retryCount < MaxRetries) {
        try {
          console.log(`\n📄 [Try ${retryCount + 1}] Processing: ${filename}...`);
          
          const filePath = path.join(booksDir, filename);
          const stats = fs.statSync(filePath);
          
          // Determine subject from filename
          let subject = 'unknown';
          if (filename.toLowerCase().includes('english') && !filename.toLowerCase().includes('science') && !filename.toLowerCase().includes('mathematics') && !filename.toLowerCase().includes('social')) subject = 'english';
          if (filename.toLowerCase().includes('science') && !filename.toLowerCase().includes('social')) subject = 'science';
          if (filename.toLowerCase().includes('social')) subject = 'social';
          if (filename.toLowerCase().includes('mathematics')) subject = 'maths';

          // Check if already uploaded (Only on try 1)
          if (retryCount === 0) {
            const existing = await BookFile.findOne({ filename });
            if (existing) {
              console.log(`⏭️  ${filename} already exists. Skipping.`);
              success = true;
              break;
            }
          }

          // 1. Upload to GridFS
          console.log(`⬆️  Uploading ${Math.round(stats.size/1024/1024)}MB binary to GridFS...`);
          const uploadStream = bucket.openUploadStream(filename, {
            contentType: 'application/pdf',
            metadata: { class: '6', subject: subject, uploadTry: retryCount + 1 }
          });

          const fileBuffer = fs.readFileSync(filePath);
          
          await new Promise((resolve, reject) => {
            uploadStream.on('error', (err) => {
              console.error(`❌ UploadStream error:`, err.message);
              reject(err);
            });
            uploadStream.on('finish', resolve);
            uploadStream.end(fileBuffer);
          });

          const gridFsId = uploadStream.id;
          console.log(`✅ Binary uploaded successfully.`);

          let extractedText = '';
          try {
            console.log(`🔍 Reading extracted text from temp_text...`);
            const txtFileName = filename.replace('.pdf', '.txt');
            const txtPath = path.join(__dirname, 'temp_text', txtFileName);
            if (fs.existsSync(txtPath)) {
              extractedText = fs.readFileSync(txtPath, 'utf-8');
              console.log(`📄 Added ${extractedText.length} characters of text preview.`);
            } else {
              console.log(`⚠️  .txt file not found for ${filename}. Extracting manually...`);
              const data = await pdf(fileBuffer);
              extractedText = data.text.substring(0, 200000); 
            }
          } catch (e) {
            console.log(`⚠️  Text extraction skipped for this file. Error:`, e.message);
          }

          // 3. Save Metadata
          await BookFile.create({
            filename,
            contentType: 'application/pdf',
            length: stats.size,
            class: '6',
            subject: subject,
            gridFsId: gridFsId,
            extractedTextPreview: extractedText
          });

          console.log(`✨ Successfully indexed: ${filename}`);
          success = true;
        } catch (fileErr) {
          retryCount++;
          console.error(`❌ Attempt ${retryCount} failed:`, fileErr.message);
          if (retryCount < MaxRetries) {
            console.log(`🔄 Waiting 5s before retry...`);
            await new Promise(r => setTimeout(r, 5000));
          } else {
            console.error(`🛑 Giving up on ${filename} after ${MaxRetries} tries.`);
          }
        }
      }
    }

    console.log('\n🏁 UPLOAD PROCESS FINISHED 🏁');
    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error('💥 Fatal error:', err.message);
    process.exit(1);
  }
};

uploadBooks();
