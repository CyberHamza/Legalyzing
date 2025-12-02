# Legalyzing - AI-Powered Legal Document Generation

An intelligent legal document generation platform powered by AI, designed to simplify the creation of legal documents through natural language conversations and smart form filling.

## 🚀 Features

- **AI-Powered Chat Interface**: Generate legal documents through natural conversation
- **Smart Document Templates**: Pre-built templates for various legal documents
- **Intelligent Fact Extraction**: Automatically extract relevant information from conversations
- **Real-time Document Preview**: See your document as you fill it out
- **Multiple Document Types**:
  - House Rent Agreements
  - Employment Contracts
  - Non-Disclosure Agreements (NDA)
  - Partnership Deeds
  - Sale Deeds

## 🛠️ Tech Stack

### Frontend
- React.js
- Material-UI (MUI)
- Framer Motion (animations)
- Axios
- React Router

### Backend
- Node.js
- Express.js
- MongoDB (Mongoose)
- OpenAI API
- AWS S3
- Passport.js (Google OAuth)

## 📋 Prerequisites

- Node.js (v14 or higher)
- MongoDB
- OpenAI API Key
- AWS Account (for S3)
- Google OAuth Credentials (optional)

## ⚙️ Installation

### 1. Clone the repository
```bash
git clone https://github.com/CyberHamza/Legalyzing.git
cd Legalyzing
```

### 2. Backend Setup
```bash
cd backend
npm install
```

Create a `.env` file in the backend directory:
```env
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRE=30d
OPENAI_API_KEY=your_openai_api_key
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=your_aws_region
AWS_BUCKET_NAME=your_s3_bucket_name
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
FRONTEND_URL=http://localhost:3000
```

### 3. Frontend Setup
```bash
cd ../Legalyzing
npm install
```

### 4. Seed Test Users (Optional)
```bash
cd backend
node scripts/seedUsers.js
```

## 🚀 Running the Application

### Start Backend Server
```bash
cd backend
npm start
```
Backend will run on http://localhost:5000

### Start Frontend Server
```bash
cd Legalyzing
npm run dev
```
Frontend will run on http://localhost:3000

## 👤 Test Accounts

After seeding the database, you can use these test accounts:

| Email | Password |
|-------|----------|
| tester@gmail.com | Test1234 |
| admin@legalyze.com | Admin@123 |
| john.doe@legalyze.com | John@123 |

## 📖 Usage

1. **Sign Up / Sign In**: Create an account or use test credentials
2. **Chat with AI**: Describe the document you need in natural language
3. **Review Extracted Facts**: AI extracts relevant information from your conversation
4. **Fill Document Form**: Complete any missing fields
5. **Generate Document**: Get your legal document in HTML format
6. **Download**: Save or open your document

## 🔒 Security Features

- JWT-based authentication
- Password hashing with bcrypt
- Rate limiting on API endpoints
- Email verification
- Google OAuth integration
- Secure file storage with AWS S3

## 📁 Project Structure

```
Legalyze-FullStack/
├── backend/
│   ├── config/         # Configuration files
│   ├── models/         # MongoDB models
│   ├── routes/         # API routes
│   ├── services/       # Business logic
│   ├── utils/          # Utility functions
│   ├── middleware/     # Custom middleware
│   └── server.js       # Entry point
├── Legalyzing/
│   ├── src/
│   │   ├── components/ # React components
│   │   ├── pages/      # Page components
│   │   ├── context/    # React context
│   │   ├── utils/      # Utility functions
│   │   └── App.jsx     # Main app component
│   └── public/         # Static files
└── README.md
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

**Ali Hamza (CyberHamza)**
- GitHub: [@CyberHamza](https://github.com/CyberHamza)

## 🙏 Acknowledgments

- OpenAI for GPT API
- Material-UI for beautiful components
- MongoDB for database
- AWS for cloud storage
