# 📅 UniScheduler - University Schedule Sync

A lightweight, serverless React application that allows students to easily schedule their university lectures and sync them directly to their **Google Calendar**.

Built with **React 19**, **Vite**, and the **Google Calendar API**.

## 🚀 Features

* **One-Click Login:** Secure sign-in using your Google Account.
* **Direct Sync:** Adds events directly to your primary Google Calendar.
* **Customizable Schedule:**
    * Set Lecture Name & Lecturer Name.
    * Pick Date, Start Time, and End Time.
    * **🎨 Color Coding:** Choose from 11 distinct Google Calendar colors to organize your subjects.
* **Upcoming Dashboard:** View your upcoming scheduled classes directly within the app.
* **Persistent Login:** Stays logged in even after refreshing or closing the browser.
* **Serverless:** Runs entirely in the browser—no backend server required.

## 🛠️ Tech Stack

* [React](https://react.dev/) (v19)
* [Vite](https://vitejs.dev/)
* [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2)
* [Axios](https://axios-http.com/)

---

## 📦 Installation & Setup

Follow these steps to run the project locally.

### 1. Clone the Repository
git clone [https://github.com/YOUR_USERNAME/uni-scheduler.git](https://github.com/YOUR_USERNAME/uni-scheduler.git)
cd uni-scheduler
### 2. Install Dependencies
npm install
### 3. Configure Google Cloud (Crucial Step)
To make the login work, you need a Google Cloud Client ID.

Go to the Google Cloud Console.

Create a Project (e.g., "UniScheduler").

Enable API: Go to "APIs & Services" > "Library", search for Google Calendar API, and enable it.

OAuth Consent Screen:

Select "External" User Type.

Fill in the required contact details.

Scopes: Add .../auth/calendar.events scope.

Test Users: Add your own email address so you can log in during development.

Create Credentials:

Go to "Credentials" > "Create Credentials" > "OAuth Client ID".

Application Type: Web application.

Authorized JavaScript origins: Add http://localhost:5173 (or your local port).

Copy the Client ID.

### 4. Add Client ID to Project
Open src/main.jsx and replace the placeholder with your actual Client ID:

JavaScript

const CLIENT_ID = "YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com";
(Note: For production, it is recommended to store this in a .env file)

### 5. Run the App
Bash

npm run dev
Open your browser to http://localhost:5173.

🌍 Deployment
This project is optimized for deployment on Netlify or Vercel.

Push your code to GitHub.

Import the project into Netlify/Vercel.

Important: Go back to your Google Cloud Console > Credentials and add your new production URL (e.g., https://uni-scheduler.netlify.app) to the Authorized JavaScript origins.

🤝 Contributing
Contributions are welcome! Feel free to open an issue or submit a pull request.

📄 License
This project is open-source and available under the MIT License.