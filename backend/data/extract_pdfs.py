import os
import pypdf

def extract_text(pdf_path, text_path):
    print(f"Extracting {pdf_path}...")
    try:
        reader = pypdf.PdfReader(pdf_path)
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        
        with open(text_path, 'w', encoding='utf-8') as f:
            f.write(text)
        print(f"✅ Saved to {text_path}")
    except Exception as e:
        print(f"❌ Error: {e}")

books_dir = "/Users/navins/Documents/EduVoice_GCT/Books"
output_dir = "/Users/navins/Documents/EduVoice_GCT/backend/data/temp_text"

if not os.path.exists(output_dir):
    os.makedirs(output_dir)

if os.path.exists(books_dir):
    for file in os.listdir(books_dir):
        if file.endswith(".pdf") and "Class_6" in file:
            pdf_path = os.path.join(books_dir, file)
            text_path = os.path.join(output_dir, file.replace(".pdf", ".txt"))
            extract_text(pdf_path, text_path)
else:
    print(f"Books dir not found: {books_dir}")
