 🎬 SFLIX – Movie Streaming Platform

SFLIX is a **full-stack movie streaming platform** built with **React.js**, **Node.js**, **Firebase**, and **Cloudflare**.  
It allows users to watch movie trailers for free and subscribe for full-length streaming.  
Admins can upload and manage movies, subscriptions, and users through a dedicated admin panel.

---

 🚀 Features

 👤 User Features
- 🔐 **User Authentication** – Sign up and log in using Firebase Authentication.
- 🎥 **Movie Library** – Browse and watch trailers for free.
- 💳 **Stripe Subscriptions** – Subscribe to weekly, monthly, yearly, or festival-based plans.
- 📝 **Profile Management** – Edit profile, view watch history, and manage subscription.
- 🚪 **Secure Logout** – End sessions safely.

 🛠️ Admin Features
- 📊 **Admin Dashboard** – View platform statistics such as total users, active users, and streaming analytics.
- 🎬 **Content Management** – Upload movies to Cloudflare and store metadata in Firestore.
- 👥 **User & Subscriber Management** – View and manage user details and subscription data.
- 💡 **Dynamic Subscription Plans** – Add or edit plans directly from the admin interface.

---

 🏗️ Tech Stack

| Layer          | Technologies |
|-----------------|-------------|
| **Frontend**    | React.js, Tailwind CSS |
| **Backend**     | Node.js, Express.js |
| **Database**    | Firebase Firestore |
| **Storage**     | Firebase Storage / Cloudflare |
| **Payments**    | Stripe |


---

 📂 Project Structure

SFLIX
├── frontend # React.js frontend
├── backend # Node.js & Express backend with Firebase Admin SDK
├── .gitignore
├── .gitattributes
└── README.md

markdown
Copy code

---

 ⚡ Getting Started

 1️⃣ Prerequisites
- **Node.js** (v18 or later)
- **npm** or **yarn**
- A **Firebase project** (for Authentication, Firestore, and Storage)
- A **Stripe account** (for subscriptions)

 2️⃣ Clone the Repository
```bash
git clone https://github.com/krishnadevks/SFLIX-Streaming-App.git
 3️⃣ Install Dependencies

For frontend:
bash
Copy code
cd frontend
npm install

For backend:
bash
Copy code
cd ../backend
npm install

 4️⃣ Environment Variables
Create .env files in both frontend and backend directories with the following keys:

Frontend .env
ini
Copy code
REACT_APP_FIREBASE_API_KEY=your_firebase_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_STRIPE_PUBLIC_KEY=your_stripe_public_key

Backend .env
ini
Copy code
FIREBASE_ADMIN_SDK_KEY=your_admin_sdk_json
STRIPE_SECRET_KEY=your_stripe_secret_key


 5️⃣ Run the App

Run frontend:
bash
Copy code
cd frontend
npm start

Run backend:
bash
Copy code
cd ../backend
npm run dev

Access the app at:
👉 http://localhost:3000

🧩 Key Modules
Authentication – Firebase Authentication with role-based access (users & admins).
Video Management – Movie metadata stored in Firestore; videos hosted on Cloudflare/Firebase Storage.
Subscriptions – Stripe Checkout integrated with Firebase to store subscription metadata.

🗂️ Database Collections
Users: user details, roles, and subscription status.
Videos: movie titles, descriptions, thumbnails, and streaming URLs.
Subscriptions: plan details and user subscription metadata.

🧑‍💻 Contributors
Krishnadev K.S – Developer & Maintainer

