import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import { GoogleOAuthProvider } from '@react-oauth/google';

// REPLACE WITH YOUR ACTUAL CLIENT ID FROM GOOGLE CLOUD
const CLIENT_ID = "1053387700926-9efqe43nlv6pugfl28vcjkfj54b7sq5o.apps.googleusercontent.com";

ReactDOM.createRoot(document.getElementById('root')).render(
  <GoogleOAuthProvider clientId={CLIENT_ID}>
    <React.StrictMode>
      <App />
    </React.StrictMode>
  </GoogleOAuthProvider>,
)