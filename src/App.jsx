import React, { useState, useEffect } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [events, setEvents] = useState([]); 

  // 1. LOGIN
  const login = useGoogleLogin({
    onSuccess: (codeResponse) => setUser(codeResponse),
    scope: 'https://www.googleapis.com/auth/calendar.events',
  });

  // 2. FETCH PROFILE & EVENTS
  useEffect(() => {
    if (user) {
      // A. Get User Profile
      axios
        .get(`https://www.googleapis.com/oauth2/v1/userinfo?access_token=${user.access_token}`, {
          headers: { Authorization: `Bearer ${user.access_token}`, Accept: 'application/json' },
        })
        .then((res) => setProfile(res.data))
        .catch((err) => console.error(err));

      // B. Get Upcoming Events
      fetchEvents();
    }
  }, [user]);

  // Helper: Fetch Events from Google
  const fetchEvents = () => {
    axios
      .get('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        headers: { Authorization: `Bearer ${user.access_token}` },
        params: {
          timeMin: new Date().toISOString(), 
          maxResults: 10,
          singleEvents: true,
          orderBy: 'startTime',
        },
      })
      .then((res) => {
        setEvents(res.data.items);
      })
      .catch((error) => console.error("Error fetching events", error));
  };

  const logOut = () => {
    setUser(null);
    setProfile(null);
    setEvents([]);
  };

  return (
    <div className="app-container">
      {profile ? (
        <div>
          {/* Header & Logout */}
          <button className="logout-btn" onClick={logOut}>Log out</button>
          <div className="dashboard-header">
            <h2>Welcome, {profile.name}!</h2>
            <img src={profile.picture} alt="profile" className="profile-pic" />
          </div>
          <hr />

          {/* MAIN CONTENT GRID */}
          <div className="main-grid">
            {/* LEFT: Form */}
            <ScheduleForm 
              token={user.access_token} 
              onEventAdded={(newEvent) => setEvents([...events, newEvent])} 
            />

            {/* RIGHT: Event List */}
            <div className="event-list">
              <h3>Your Upcoming Schedule</h3>
              {events.length === 0 && <p>No upcoming lectures found.</p>}
              
              {events.map((event) => (
                <EventCard key={event.id} event={event} />
              ))}
            </div>
          </div>
        </div>
      ) : (
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

// ---------------------------------------------------------------------------
// FORM COMPONENT (Start Time & End Time)
// ---------------------------------------------------------------------------
function ScheduleForm({ token, onEventAdded }) {
  const [formData, setFormData] = useState({
    lecture: '',
    lecturer: '',
    date: '',
    startTime: '',
    endTime: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 1. Construct Date Objects
    const startDateTime = new Date(`${formData.date}T${formData.startTime}`);
    const endDateTime = new Date(`${formData.date}T${formData.endTime}`);

    // Basic Validation
    if (endDateTime <= startDateTime) {
      alert("End Time must be after Start Time");
      return;
    }

    const eventPayload = {
      summary: formData.lecture,       // Title
      description: formData.lecturer,  // Description
      start: { dateTime: startDateTime.toISOString() },
      end: { dateTime: endDateTime.toISOString() },
    };

    try {
      // CREATE New Event (POST)
      const res = await axios.post(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        eventPayload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      onEventAdded(res.data);
      alert('Lecture added!');

      // Reset Form
      setFormData({ 
        lecture: '', 
        lecturer: '', 
        date: '', 
        startTime: '', 
        endTime: '' 
      });
    } catch (error) {
      console.error(error);
      alert('Error saving event');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="schedule-form">
      <h3>Add a Lecture</h3>
      
      <label>Lecture (Title)</label>
      <input 
        type="text" 
        value={formData.lecture}
        required 
        placeholder="e.g. Object Oriented Programming"
        onChange={e => setFormData({...formData, lecture: e.target.value})} 
      />

      <label>Lecturer Name (Description)</label>
      <input 
        type="text" 
        value={formData.lecturer}
        required 
        placeholder="e.g. Dr. Smith"
        onChange={e => setFormData({...formData, lecturer: e.target.value})} 
      />

      <label>Date</label>
      <input 
        type="date" 
        value={formData.date}
        required 
        onChange={e => setFormData({...formData, date: e.target.value})} 
      />

      <div style={{display: 'flex', gap: '10px'}}>
        <div style={{flex: 1}}>
          <label>Start Time</label>
          <input 
            type="time" 
            value={formData.startTime}
            required 
            onChange={e => setFormData({...formData, startTime: e.target.value})} 
          />
        </div>
        <div style={{flex: 1}}>
          <label>End Time</label>
          <input 
            type="time" 
            value={formData.endTime}
            required 
            onChange={e => setFormData({...formData, endTime: e.target.value})} 
          />
        </div>
      </div>

      <button type="submit" className="btn-add">
        Add to Calendar
      </button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// EVENT CARD COMPONENT (Safe View)
// ---------------------------------------------------------------------------
function EventCard({ event }) {
  // Safety check: sometimes start.dateTime is undefined for all-day events
  const startRaw = event.start?.dateTime || event.start?.date;
  const endRaw = event.end?.dateTime || event.end?.date;
  
  if (!startRaw) return null; // Skip invalid events

  const startDate = new Date(startRaw);
  const endDate = new Date(endRaw);

  const dateString = startDate.toLocaleDateString();
  const startTimeString = startDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  const endTimeString = endDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});

  return (
    <div className="event-card">
      <div className="event-info">
        <h4>{event.summary}</h4>
        {/* Show Lecturer (Description) if it exists */}
        {event.description && <p style={{fontStyle: 'italic', color: '#888'}}>{event.description}</p>}
        <p>{dateString}</p>
        <p style={{color: '#4285F4'}}>{startTimeString} - {endTimeString}</p>
      </div>
    </div>
  )
}

export default App;