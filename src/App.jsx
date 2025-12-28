import React, { useState, useEffect } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
// imports

function App() {
  const [user, setUser] = useState(null);       // Stores Access Token
  const [profile, setProfile] = useState(null); // Stores User Name/Email

  // 1. LOGIN FUNCTION
  // We request the 'calendar.events' scope so we can write to their calendar
  const login = useGoogleLogin({
    onSuccess: (codeResponse) => setUser(codeResponse),
    scope: 'https://www.googleapis.com/auth/calendar.events', 
  });

  // 2. FETCH PROFILE (Once logged in)
  useEffect(() => {
    if (user) {
      axios.get(`https://www.googleapis.com/oauth2/v1/userinfo?access_token=${user.access_token}`, {
        headers: { Authorization: `Bearer ${user.access_token}`, Accept: 'application/json' }
      })
      .then((res) => {
        setProfile(res.data);
      })
      .catch((err) => console.log(err));
    }
  }, [user]);

  // 3. LOGOUT
  const logOut = () => {
    setUser(null);
    setProfile(null);
  };

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial' }}>
      {profile ? (
        // DASHBOARD VIEW
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2>Welcome, {profile.name}!</h2>
            <img src={profile.picture} alt="profile" style={{ borderRadius: '50%', width: '40px' }} />
            <button onClick={logOut}>Log out</button>
          </div>
          <hr />
          <ScheduleForm token={user.access_token} />
        </div>
      ) : (
        // LOGIN VIEW
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
          <h1>University Schedule Sync</h1>
          <p>Sync your lectures to Google Calendar in one click.</p>
          <button onClick={() => login()} style={{ padding: '10px 20px', fontSize: '16px' }}>
            Sign in with Google 🚀
          </button>
        </div>
      )}
    </div>
  );
}

// 4. THE FORM COMPONENT
function ScheduleForm({ token }) {
  const [formData, setFormData] = useState({
    lecture: '',
    date: '',
    time: '',
    duration: 60 // Default 1 hour
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Calculate End Time
    const startTime = new Date(`${formData.date}T${formData.time}`);
    const endTime = new Date(startTime.getTime() + formData.duration * 60000);

    const event = {
      summary: formData.lecture,
      start: { dateTime: startTime.toISOString() },
      end: { dateTime: endTime.toISOString() },
    };

    try {
      // POST directly to Google Calendar API
      await axios.post('https://www.googleapis.com/calendar/v3/calendars/primary/events', event, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert('Event added to your Calendar!');
    } catch (error) {
      console.error(error);
      alert('Error adding event');
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: '400px' }}>
      <h3>Add a Lecture</h3>
      
      <label>Lecture Name:</label>
      <input 
        type="text" 
        required 
        onChange={e => setFormData({...formData, lecture: e.target.value})} 
        style={{ display: 'block', width: '100%', marginBottom: '10px' }}
      />

      <label>Date:</label>
      <input 
        type="date" 
        required 
        onChange={e => setFormData({...formData, date: e.target.value})} 
        style={{ display: 'block', width: '100%', marginBottom: '10px' }}
      />

      <label>Start Time:</label>
      <input 
        type="time" 
        required 
        onChange={e => setFormData({...formData, time: e.target.value})} 
        style={{ display: 'block', width: '100%', marginBottom: '10px' }}
      />

      <label>Duration (Minutes):</label>
      <input 
        type="number" 
        value={formData.duration}
        onChange={e => setFormData({...formData, duration: e.target.value})} 
        style={{ display: 'block', width: '100%', marginBottom: '20px' }}
      />

      <button type="submit" style={{ padding: '10px', width: '100%', backgroundColor: '#4285F4', color: 'white', border: 'none' }}>
        Add to Calendar
      </button>
    </form>
  );
}

export default App;