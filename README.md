# CREDENTIA
Resume Authenticator is a unified hub for career and identity validation. It integrates ATS scoring with Aadhaar, police, and certificate checks into one source of truth. By generating a global Verified ID Link, it offers recruiters an instantly verifiable, tamper-proof profile of a candidate’s professional and legal standing worldwide.




# 📌 Project Overview
The Resume Authenticator is a digital ecosystem designed to solve the "Trust Deficit" in the global hiring market. Currently, recruiters spend weeks verifying credentials. Our platform consolidates identity, legal standing, and professional achievements into a single, shareable Verified ID, making background checks instant and reliable.

# ✨ Key Features

ATS Score Optimizer: Real-time resume parsing and scoring based on industry standards.

Aadhaar Authentication: Secure, OTP-based identity validation using government-authorized APIs.

Police Verification: Integration module for background check status and legal clearance.

Academic Credentialing: Blockchain or API-based verification for university certificates.

# ⚙️ How It Works
The system follows a multi-stage verification pipeline to ensure data integrity:

Ingestion: User uploads Resume (PDF/Docx) and Identity Documents.

Analysis: The system calculates an ATS score using the formula:

# Score=( Total Required Keywords
# Keywords Matched) ×100

Verification: Backend triggers parallel API calls to Aadhaar, Police, and Educational databases.

Generation: Once all modules return a "Pass" status, a Verified ID is minted and linked to the profile.

# 🛠️ Tech Stack
Frontend: React.js / Next.js

Styling: Tailwind CSS / Framer Motion

State Management: Redux Toolkit

Security: AES-256 Encryption for document storage

Icons: Lucide-React / Remix Icons
