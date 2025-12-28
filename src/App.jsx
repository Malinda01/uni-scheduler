import React, { useState, useEffect } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import './App.css';

// 1. DEFINE GOOGLE CALENDAR COLORS
const GOOGLE_COLORS = {
  "1": { name: "Lavender", hex: "#7986cb" },
  "2": { name: "Sage", hex: "#33b679" },
  "3": { name: "Grape", hex: "#8e24aa" },
  "4": { name: "Flamingo", hex: "#e67c73" },
  "5": { name: "Banana", hex: "#f6c026" },
  "6": { name: "Tangerine", hex: "#f5511d" },
  "7": { name: "Peacock", hex: "#039be5" },
  "8": { name: "Graphite", hex: "#616161" },
  "9": { name: "Blueberry", hex: "#3f51b5" },
  "10": { name: "Basil", hex: "#0b8043" },
  "11": { name: "Tomato", hex: "#d50000" }
};

function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [events, setEvents] = useState([]); 

  // --- NEW: CHECK LOCAL STORAGE ON STARTUP ---
  useEffect(() => {
    const storedUser = localStorage.getItem('google_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // LOGIN
  const login = useGoogleLogin({
    onSuccess: (codeResponse) => {
      setUser(codeResponse);
      // --- NEW: SAVE TO LOCAL STORAGE ---
      localStorage.setItem('google_user', JSON.stringify(codeResponse));
    },
    scope: 'https://www.googleapis.com/auth/calendar.events',
  });

  // FETCH PROFILE & EVENTS
  useEffect(() => {
    if (user) {
      // Get Profile
      axios.get(`https://www.googleapis.com/oauth2/v1/userinfo?access_token=${user.access_token}`, {
        headers: { Authorization: `Bearer ${user.access_token}`, Accept: 'application/json' }
      })
      .then((res) => setProfile(res.data))
      .catch((err) => {
        // --- NEW: AUTO LOGOUT IF TOKEN EXPIRED ---
        console.log(err);
        if (err.response && err.response.status === 401) {
          logOut(); 
        }
      });

      // Get Events
      fetchEvents();
    }
  }, [user]);

  const fetchEvents = () => {
    // If no user, stop
    if (!user) return;

    axios.get('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        headers: { Authorization: `Bearer ${user.access_token}` },
        params: {
          timeMin: new Date().toISOString(),
          maxResults: 10,
          singleEvents: true,
          orderBy: 'startTime',
        },
      })
      .then((res) => setEvents(res.data.items))
      .catch((error) => {
        console.error("Error fetching events", error);
        if (error.response && error.response.status === 401) {
          logOut(); // Log out if token is invalid
        }
      });
  };

  const logOut = () => {
    setUser(null);
    setProfile(null);
    setEvents([]);
    // --- NEW: CLEAR LOCAL STORAGE ---
    localStorage.removeItem('google_user');
  };

  return (
    <div className="app-container" style={{ padding: '20px', fontFamily: 'Arial' }}>
      {profile ? (
        <div>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '15px', alignItems: 'center' }}>
            {/* Profile Picture with name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h3>{profile.name}</h3>
              <img src={profile.picture} alt="profile" style={{ borderRadius: '50%', width: '40px' }} />
            </div>
            {/* Logout button */}
            <button onClick={logOut} style={{ background: '#ff4d4d', color: 'white', border: 'none', padding: '8px 15px', cursor: 'pointer', borderRadius: '4px' }}>Log out</button>
          </div>
          <hr />

          {/* MAIN CONTENT: Form + List */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '40px', marginTop: '20px' }}>
            
            {/* LEFT: FORM */}
            <div style={{ flex: 1, minWidth: '300px' }}>
              <ScheduleForm 
                token={user.access_token} 
                onEventAdded={(newEvent) => setEvents([...events, newEvent])} 
              />
            </div>

            {/* RIGHT: LIST */}
            <div style={{ flex: 1, minWidth: '300px' }}>
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
          <button onClick={() => login()} style={{ padding: '10px 20px', fontSize: '16px', background: '#4285F4', color: 'white', border: 'none', cursor: 'pointer' }}>
            Sign in with Google 🚀
          </button>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// FORM COMPONENT (With Visual Color Palette)
// ---------------------------------------------------------------------------
function ScheduleForm({ token, onEventAdded }) {
  const [formData, setFormData] = useState({
    lecture: '',
    lecturer: '',
    date: '',
    startTime: '',
    endTime: '',
    colorId: '1' // Default Lavender
  });

  const handleSubmit = async (e) => {
    e.preventDefault();

    const startDateTime = new Date(`${formData.date}T${formData.startTime}`);
    const endDateTime = new Date(`${formData.date}T${formData.endTime}`);

    if (endDateTime <= startDateTime) {
      alert("End Time must be after Start Time");
      return;
    }

    const eventPayload = {
      summary: formData.lecture,
      description: formData.lecturer,
      colorId: formData.colorId,
      start: { dateTime: startDateTime.toISOString() },
      end: { dateTime: endDateTime.toISOString() },
    };

    try {
      const res = await axios.post(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        eventPayload,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      onEventAdded(res.data);
      alert('Lecture added!');
      
      setFormData({ lecture: '', lecturer: '', date: '', startTime: '', endTime: '', colorId: '1' });

    } catch (error) {
      console.error(error);
      alert('Error saving event');
    }
  };

  // Shared input style
  const inputStyle = { display: 'block', width: '100%', marginBottom: '10px', padding: '8px', boxSizing: 'border-box' };

  return (
    <form onSubmit={handleSubmit} style={{ background: '#f5f5f5', padding: '20px', borderRadius: '8px' }}>
      <h3>Add a Lecture</h3>
      
      <label>Lecture (Title)</label>
      <input type="text" style={inputStyle} required 
        value={formData.lecture} onChange={e => setFormData({...formData, lecture: e.target.value})} />

      <label>Lecturer Name</label>
      <input type="text" style={inputStyle} required 
        value={formData.lecturer} onChange={e => setFormData({...formData, lecturer: e.target.value})} />

      {/* --- VISUAL COLOR PICKER --- */}
      <label>Card Color: <span style={{fontWeight:'normal', color:'#666'}}>{GOOGLE_COLORS[formData.colorId].name}</span></label>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '15px', marginTop: '5px' }}>
        {Object.keys(GOOGLE_COLORS).map(id => (
          <div 
            key={id}
            onClick={() => setFormData({...formData, colorId: id})}
            title={GOOGLE_COLORS[id].name}
            style={{
              width: '25px',
              height: '25px',
              borderRadius: '50%',
              backgroundColor: GOOGLE_COLORS[id].hex,
              cursor: 'pointer',
              border: formData.colorId === id ? '3px solid #333' : '2px solid transparent', // Highlight selected
              boxShadow: formData.colorId === id ? '0 2px 5px rgba(0,0,0,0.2)' : 'none',
              transition: 'transform 0.1s'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.2)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          />
        ))}
      </div>

      <label>Date</label>
      <input type="date" style={inputStyle} required 
        value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />

      <div style={{ display: 'flex', gap: '10px' }}>
        <div style={{ flex: 1 }}>
          <label>Start</label>
          <input type="time" style={inputStyle} required 
            value={formData.startTime} onChange={e => setFormData({...formData, startTime: e.target.value})} />
        </div>
        <div style={{ flex: 1 }}>
          <label>End</label>
          <input type="time" style={inputStyle} required 
            value={formData.endTime} onChange={e => setFormData({...formData, endTime: e.target.value})} />
        </div>
      </div>

      <button type="submit" style={{ width: '100%', padding: '10px', background: '#4285F4', color: 'white', border: 'none', cursor: 'pointer', marginTop: '10px' }}>
        Add to Calendar
      </button>
    </form>
  );
}

// ---------------------------------------------------------------------------
// EVENT CARD COMPONENT
// ---------------------------------------------------------------------------
function EventCard({ event }) {
  const startRaw = event.start?.dateTime || event.start?.date;
  const endRaw = event.end?.dateTime || event.end?.date;
  if (!startRaw) return null;

  const startDate = new Date(startRaw);
  const endDate = new Date(endRaw);
  const dateStr = startDate.toLocaleDateString();
  const timeStr = `${startDate.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} - ${endDate.toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}`;

  const colorData = GOOGLE_COLORS[event.colorId] || { hex: '#4285F4' };

  return (
    <div style={{ 
      borderLeft: `5px solid ${colorData.hex}`, 
      background: '#fff', 
      marginBottom: '10px', 
      padding: '10px', 
      borderRadius: '4px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)' 
    }}>
      <h4 style={{ margin: '0 0 5px 0', color: colorData.hex }}>{event.summary}</h4>
      {event.description && <p style={{ margin: '0', fontSize: '0.9em', color: '#666', fontStyle: 'italic' }}>{event.description}</p>}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px', fontSize: '0.85em', color: '#333' }}>
        <span>{dateStr}</span>
        <span>{timeStr}</span>
      </div>
    </div>
  );
}

export default App;