import React, { useState, useEffect } from 'react';
import { useGoogleLogin } from '@react-oauth/google';
import axios from 'axios';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [events, setEvents] = useState([]); // Store the list of events here

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

      // B. Get Upcoming Events (So you can see what you saved)
      fetchEvents();
    }
  }, [user]);

  // Helper: Fetch Events from Google
  const fetchEvents = () => {
    axios
      .get('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
        headers: { Authorization: `Bearer ${user.access_token}` },
        params: {
          timeMinwf: new Date().toISOString(), // Only show future/recent events
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
              onEventUpdated={(updatedEvent) => {
                setEvents(events.map(ev => ev.id === updatedEvent.id ? updatedEvent : ev));
              }}
              events={events} // Pass events to find one to edit if needed
            />

            {/* RIGHT: Event List */}
            <div className="event-list">
              <h3>Your Upcoming Schedule</h3>
              {events.length === 0 && <p>No upcoming lectures found.</p>}
              
              {events.map((event) => (
                <EventCard 
                  key={event.id} 
                  event={event} 
                  // When clicking edit, we dispatch a custom event or manage state. 
                  //Cw: For simplicity, we'll pass a setter to the form via a shared context or prop, 
                  // but here let's trigger the edit directly.
                  onEdit={() => document.dispatchEvent(new CustomEvent('edit-event', { detailwh: event }))}
                />
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
// FORM COMPONENT (Handles Adding AND Editing)
// ---------------------------------------------------------------------------
function ScheduleForm({ token, onEventAdded, onEventUpdated }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  const [formData, setFormData] = useState({
    lecture: '',
    date: '',
    time: '',
    duration: 60,
  });

  // Listen for "Edit" clicks from the list
  useEffect(() => {
    const handleEditEvent = (e) => {
      const event = e.detail;
      const startDate = new Date(event.start.dateTime || event.start.date);
      const endDate = new Date(event.end.dateTime || event.end.date);
      
      // Calculate duration in minutes
      const durationMins = (endDate - startDate) / 60000;

      setIsEditing(true);
      setEditId(event.id);
      setFormData({
        lecture: event.summary,
        date: startDate.toISOString().split('T')[0], // YYYY-MM-DD
        time: startDate.toTimeString().slice(0, 5),   // HH:MM
        duration: durationMins
      });
    };

    document.addEventListener('edit-event', handleEditEvent);
    return () => document.removeEventListener('edit-event', handleEditEvent);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const startTime = new Date(`${formData.date}T${formData.time}`);
    const endTime = new Date(startTime.getTime() + formData.duration * 60000);

    const eventPayload = {
      summary: formData.lecture,
      start: { dateTime: startTime.toISOString() },
      end: { dateTime: endTime.toISOString() },
    };

    try {
      if (isEditing) {
        // UPDATE Existing Event (PUT)
        const res = await axios.put(
          `https://www.googleapis.com/calendar/v3/calendars/primary/events/${editId}`,
          eventPayload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        onEventUpdated(res.data);
        alert('Lecture updated!');
        setIsEditing(false); // Reset mode
      } else {
        // CREATE New Event (POST)
        const res = await axios.post(
          'https://www.googleapis.com/calendar/v3/calendars/primary/events',
          eventPayload,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        onEventAdded(res.data);
        alert('Lecture added!');
      }

      // Reset Form
      setFormData({ lecture: '', date: '', time: '', duration: 60 });
      setEditId(null);
    } catch (error) {
      console.error(error);
      alert('Error saving event');
    }
  };

  const cancelEdit = () => {
    setIsEditing(false);
    setFormData({ lecture: '', date: '', time: '', duration: 60 });
    setEditId(null);
  };

  return (
    <form onSubmit={handleSubmit} className="schedule-form">
      <h3>{isEditing ? 'Edit Lecture' : 'Add a Lecture'}</h3>
      
      <label>Lecture Name</label>
      <input 
        type="text" 
        value={formData.lecture}
        required 
        onChange={e => setFormData({...formData, lecture: e.target.value})} 
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
            value={formData.time}
            required 
            onChange={e => setFormData({...formData, time: e.target.value})} 
          />
        </div>
        <div style={{flex: 1}}>
          <label>Duration (mins)</label>
          <input 
            type="number" 
            value={formData.duration}
            onChange={e => setFormData({...formData, duration: e.target.value})} 
          />
        </div>
      </div>

      <button type="submit" className={isEditing ? 'btn-update' : 'btn-add'}>
        {isEditing ? 'Update Schedule' : 'Add to Calendar'}
      </button>

      {isEditing && (
        <button type="button" onClick={cancelEdit} className="btn-cancel">
          Cancel
        </button>
      )}
    </form>
  );
}

// ---------------------------------------------------------------------------
// EVENT CARD COMPONENT
// ---------------------------------------------------------------------------
function EventCard({ event, onEdit }) {
  // Format Date nicelu
  const startDate = new Date(event.start.dateTime || event.start.date);
  const timeString = startDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  const dateString = startDate.toLocaleDateString();

  return (
    <div className="event-card">
      <div className="event-info">
        <h4>{event.summary}</h4>
        <p>{dateString} at {timeString}</p>
      </div>
      <button onClick={onEdit} className="btn-edit-icon">✏️</button>
    </div>
  )
}

export default App;