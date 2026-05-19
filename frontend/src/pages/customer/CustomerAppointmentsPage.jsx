import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import ConfirmModal from '../../components/common/ConfirmModal';
import '../ShopPage.css'; // Reusing shop page styles for consistency

// Business hours config (9 AM = 9, 6 PM = 18)
const BUSINESS_START = 9;
const BUSINESS_END = 18;
const DAYS_AHEAD = 5;
const MIN_HOURS_ADVANCE = 24;

const generateSlots = () => {
  const slots = [];
  const now = new Date();
  const earliest = new Date(now.getTime() + MIN_HOURS_ADVANCE * 60 * 60 * 1000);

  for (let day = 0; day < DAYS_AHEAD; day++) {
    const base = new Date(earliest);
    base.setDate(base.getDate() + day);
    base.setHours(0, 0, 0, 0);

    for (let hour = BUSINESS_START; hour < BUSINESS_END; hour++) {
      const slotTime = new Date(base);
      slotTime.setHours(hour, 0, 0, 0);

      if (slotTime < earliest) continue;

      const pad = (n) => String(n).padStart(2, '0');
      const dateStr = `${slotTime.getFullYear()}-${pad(slotTime.getMonth() + 1)}-${pad(slotTime.getDate())}`;
      const hourStr = hour < 12 ? `${hour}:00 AM` : hour === 12 ? `12:00 PM` : `${hour - 12}:00 PM`;
      const dayName = slotTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

      slots.push({
        dateTime: slotTime.toISOString(),
        display: `${dayName}  •  ${hourStr}`,
        available: 5 // Default capacity
      });
    }
  }
  return slots;
};

const CustomerAppointmentsPage = () => {
  const [appointments, setAppointments] = useState([]);
  const [myVehicles, setMyVehicles] = useState([]);
  const [slots, setSlots] = useState(() => generateSlots());
  const [selectedDay, setSelectedDay] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    vehicleId: '',
    appointmentDate: '',
    notes: ''
  });
  const [selectedServices, setSelectedServices] = useState([]);
  const [hasActiveBooking, setHasActiveBooking] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const [message, setMessage] = useState({ text: '', type: '' });
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, idToRemove: null });

  useEffect(() => {
    fetchAppointments();
    fetchMyVehicles();
    fetchSlots();
  }, []);

  useEffect(() => {
    if (slots.length > 0 && !selectedDay) {
      const firstDay = slots[0].display.includes('  •  ')
        ? slots[0].display.split('  •  ')[0]
        : new Date(slots[0].dateTime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
      setSelectedDay(firstDay);
    }
  }, [slots]);

  const fetchSlots = async () => {
    try {
      const res = await api.getAvailableSlots();
      const slotsArray = res.data || (Array.isArray(res) ? res : []);
      if (slotsArray && slotsArray.length > 0) {
        const parsedSlots = slotsArray.map(slot => {
          const slotDate = new Date(slot.dateTime);
          const dayName = slotDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
          const hour = slotDate.getHours();
          const hourStr = hour < 12 ? `${hour}:00 AM` : hour === 12 ? `12:00 PM` : `${hour - 12}:00 PM`;
          
          return {
            ...slot,
            display: `${dayName}  •  ${hourStr}`
          };
        });
        setSlots(parsedSlots);
      }
    } catch (err) {
      console.log('Using local slots fallback (backend might need restart)');
    }
  };

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const res = await api.getMyAppointments();
      // Handle both object and array responses
      const data = res.data || (Array.isArray(res) ? res : []);
      setAppointments(data);
      
      // Check for active booking
      const hasActive = data.some(a => a.status === 'Pending' || a.status === 'Confirmed');
      setHasActiveBooking(hasActive);
    } catch (err) {
      console.error('Failed to load appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyVehicles = async () => {
    try {
      const data = await api.getMyVehicles().catch(() => []);
      setMyVehicles(data);
    } catch (err) {
      console.error('Failed to load vehicles:', err);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleRemoveAppointment = (id) => {
    setConfirmModal({ isOpen: true, idToRemove: id });
  };

  const executeRemoveAppointment = async () => {
    const id = confirmModal.idToRemove;
    setConfirmModal({ isOpen: false, idToRemove: null });
    if (!id) return;
    
    // Find the appointment date to optimistically update the UI
    const appointmentToRemove = appointments.find(a => a.id === id);
    
    try {
      await api.deleteAppointment(id);
      
      // Optimistically increment the slot availability instantly
      if (appointmentToRemove && appointmentToRemove.appointmentDate) {
        setSlots(prev => prev.map(s => 
          s.dateTime === appointmentToRemove.appointmentDate 
            ? { ...s, available: s.available + 1 }
            : s
        ));
      }

      setMessage({ text: 'Appointment removed successfully!', type: 'success' });
      setTimeout(() => setMessage({ text: '', type: '' }), 4000);
      
      fetchAppointments(); // Refresh list
      fetchSlots(); // Sync slots with server
    } catch (err) {
      console.error('Failed to remove appointment:', err);
      setMessage({ text: 'Failed to remove appointment.', type: 'error' });
      setTimeout(() => setMessage({ text: '', type: '' }), 4000);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedServices.length === 0 || !formData.appointmentDate) {
      setMessage({ text: 'Please select at least one service and a date/time.', type: 'error' });
      return;
    }

    try {
      setSubmitting(true);
      
      // Optimistic instant UI update for immediate feedback
      setSlots(prev => prev.map(s => 
        s.dateTime === formData.appointmentDate 
          ? { ...s, available: Math.max(0, s.available - 1) } 
          : s
      ));

      await api.bookAppointment({
        vehicleId: formData.vehicleId ? parseInt(formData.vehicleId) : null,
        serviceType: selectedServices.join(', '),
        appointmentDate: new Date(formData.appointmentDate).toISOString(),
        notes: formData.notes
      });
       setFormData({ vehicleId: '', appointmentDate: '', notes: '' });
      setSelectedServices([]);
      fetchAppointments(); // Refresh list
      fetchSlots(); // Refresh slots to update ticket count
      setShowModal(true); // Show success modal
      
      // Auto close after 5 seconds
      setTimeout(() => {
        setShowModal(false);
      }, 5000);
    } catch (err) {
      console.error('Failed to book appointment:', err);
      setMessage({ text: err.message || 'Failed to book appointment. Please try again.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Pending': return '#faad14';
      case 'Confirmed': return '#1890ff';
      case 'Completed': return '#52c41a';
      case 'Cancelled': return '#ff4d4f';
      default: return '#888';
    }
  };

  if (loading) {
    return (
      <div className="spinner-wrapper">
        <div className="loading-spinner"></div>
        <p style={{ marginTop: '16px' }}>Loading your appointments...</p>
      </div>
    );
  }

  const activeAppt = appointments.find(a => a.status === 'Pending' || a.status === 'Confirmed');
  const activeDate = activeAppt ? activeAppt.appointmentDate : null;

  return (
    <div>
      <style>
        {`
          .liquid-hover-btn {
            position: relative;
            overflow: hidden;
            transition: all 0.3s ease !important;
            z-index: 1;
          }
          .liquid-hover-btn::before {
            content: '';
            position: absolute;
            top: 0; left: -100%;
            width: 50%; height: 100%;
            background: linear-gradient(90deg, transparent, rgba(248, 81, 73, 0.6), rgba(255, 255, 255, 0.9), transparent);
            transition: left 0.6s cubic-bezier(0.4, 0, 0.2, 1);
            z-index: -1;
            transform: skewX(-25deg);
          }
          .liquid-hover-btn:hover::before {
            left: 200%;
          }
          .liquid-hover-btn:hover {
            box-shadow: 0 0 15px rgba(248, 81, 73, 0.5), inset 0 0 10px rgba(255, 255, 255, 0.2);
            border-color: #fff !important;
            background: rgba(248, 81, 73, 0.15) !important;
          }
        `}
      </style>
      {/* Success Modal */}
      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          backdropFilter: 'blur(5px)'
        }}>
          <div style={{
            background: '#0d1117',
            border: '1px solid #52c41a',
            borderRadius: '12px',
            padding: '30px',
            maxWidth: '400px',
            textAlign: 'center',
            boxShadow: '0 0 20px rgba(82, 196, 26, 0.3)'
          }}>
            <div style={{ fontSize: '50px', marginBottom: '15px' }}>🎉</div>
            <h2 style={{ color: '#52c41a', marginBottom: '10px' }}>Thank You!</h2>
            <p style={{ color: '#fff', marginBottom: '20px' }}>Your appointment has been booked successfully. We look forward to serving you!</p>
            <button 
              onClick={() => setShowModal(false)}
              style={{
                padding: '10px 20px',
                background: '#52c41a',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#73d13d'}
              onMouseLeave={(e) => e.currentTarget.style.background = '#52c41a'}
            >
              Close
            </button>
          </div>
        </div>
      )}

      <h1>My Service Appointments</h1>
      <p style={{ color: '#888', marginBottom: '24px' }}>Schedule a service or repair appointment with our expert mechanics.</p>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        {/* Form Section */}
        <div className="large-card">
          <h3>Book New Appointment</h3>
          
          {message.text && (
            <div style={{ 
              position: 'fixed',
              top: '30px',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 9999,
              padding: '12px 24px', 
              borderRadius: '8px', 
              background: '#161b22',
              color: message.type === 'success' ? '#3fb950' : '#f85149',
              border: `1px solid ${message.type === 'success' ? 'rgba(63, 185, 80, 0.4)' : 'rgba(248, 81, 73, 0.4)'}`,
              boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
              fontSize: '14px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}>
              <span style={{ fontSize: '16px' }}>{message.type === 'success' ? '✓' : '⚠️'}</span>
              {message.text}
            </div>
          )}

          {hasActiveBooking && (
            <div style={{ 
              padding: '12px 16px', 
              borderRadius: '4px', 
              marginBottom: '20px',
              background: '#161b22',
              color: '#8b949e',
              borderLeft: '4px solid #1890ff',
              fontSize: '13px',
              lineHeight: '1.5'
            }}>
              <strong style={{ color: '#c9d1d9', marginRight: '6px' }}>Active Booking:</strong> 
              You currently have a service appointment scheduled. Please complete or cancel your existing appointment before booking a new one.
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '10px', color: '#888' }}>Service Type *</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px' }}>
                {[
                  "General Inspection",
                  "Oil Change",
                  "Brake Service",
                  "Tire Rotation/Alignment",
                  "Part Installation",
                  "Other"
                ].map(service => {
                  const isSelected = selectedServices.includes(service);
                  return (
                    <button
                      key={service}
                      type="button"
                      className={!isSelected ? "liquid-hover-btn" : ""}
                      onClick={() => {
                        setSelectedServices(prev => 
                          prev.includes(service) 
                            ? prev.filter(s => s !== service) 
                            : [...prev, service]
                        );
                      }}
                      style={{
                        padding: '12px',
                        background: isSelected ? 'rgba(82, 196, 26, 0.15)' : '#0d1117',
                        color: isSelected ? '#52c41a' : '#fff',
                        border: `1px solid ${isSelected ? '#52c41a' : '#2f363d'}`,
                        borderRadius: '8px',
                        cursor: 'pointer',
                        textAlign: 'center',
                        fontSize: '13px',
                        boxShadow: isSelected ? '0 0 10px rgba(82, 196, 26, 0.2)' : 'none'
                      }}
                    >
                      {service}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '10px', color: '#888' }}>Select Vehicle (Optional)</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '10px' }}>
                <button
                  type="button"
                  className={formData.vehicleId !== '' ? "liquid-hover-btn" : ""}
                  onClick={() => setFormData(prev => ({ ...prev, vehicleId: '' }))}
                  style={{
                    padding: '12px',
                    background: formData.vehicleId === '' ? 'rgba(82, 196, 26, 0.15)' : '#0d1117',
                    color: formData.vehicleId === '' ? '#52c41a' : '#fff',
                    border: `1px solid ${formData.vehicleId === '' ? '#52c41a' : '#2f363d'}`,
                    borderRadius: '8px',
                    cursor: 'pointer',
                    textAlign: 'center',
                    fontSize: '13px'
                  }}
                >
                  -- No specific vehicle --
                </button>
                {myVehicles.map(v => {
                  const isSelected = formData.vehicleId === String(v.id);
                  return (
                    <button
                      key={v.id}
                      type="button"
                      className={!isSelected ? "liquid-hover-btn" : ""}
                      onClick={() => setFormData(prev => ({ ...prev, vehicleId: String(v.id) }))}
                      style={{
                        padding: '12px',
                        background: isSelected ? 'rgba(82, 196, 26, 0.15)' : '#0d1117',
                        color: isSelected ? '#52c41a' : '#fff',
                        border: `1px solid ${isSelected ? '#52c41a' : '#2f363d'}`,
                        borderRadius: '8px',
                        cursor: 'pointer',
                        textAlign: 'center',
                        fontSize: '13px'
                      }}
                    >
                      {v.displayName || `${v.make} ${v.model}`}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '10px', color: '#888' }}>Select a Date & Time *</label>
              
              {/* Day Tabs */}
              <div style={{ display: 'flex', gap: '10px', overflowX: 'auto', marginBottom: '15px', paddingBottom: '5px' }}>
                {Object.keys(slots.reduce((acc, slot) => {
                  const day = new Date(slot.dateTime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                  if (!acc[day]) acc[day] = [];
                  acc[day].push(slot);
                  return acc;
                }, {})).map(day => {
                  const isDayBooked = appointments.some(appt => {
                    if (appt.status === 'Cancelled') return false;
                    const apptDay = new Date(appt.appointmentDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                    return apptDay === day;
                  });

                  return (
                    <button
                      key={day}
                      type="button"
                      className={selectedDay !== day ? "liquid-hover-btn" : ""}
                      onClick={() => setSelectedDay(day)}
                      style={{
                        padding: '8px 16px',
                        background: selectedDay === day ? '#52c41a' : '#0d1117',
                        color: selectedDay === day ? '#fff' : (isDayBooked ? '#8b949e' : '#fff'),
                        border: `1px solid ${selectedDay === day ? '#52c41a' : '#2f363d'}`,
                        borderRadius: '20px',
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                        fontWeight: selectedDay === day ? 'bold' : 'normal',
                        opacity: isDayBooked && selectedDay !== day ? 0.7 : 1
                      }}
                    >
                      {day} {isDayBooked && '(Booked)'}
                    </button>
                  );
                })}
              </div>

              {/* Time Pills Grid */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(100px, 1fr))', 
                gap: '10px'
              }}>
                {slots
                  .filter(slot => {
                    const day = new Date(slot.dateTime).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                    return day === selectedDay;
                  })
                  .map(slot => {
                    const timeStr = new Date(slot.dateTime).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                    const isSelected = formData.appointmentDate === slot.dateTime;
                    const isBooked = activeDate === slot.dateTime;
                    const isFull = slot.available <= 0;
                    
                    const isDayBooked = appointments.some(appt => {
                      if (appt.status === 'Cancelled') return false;
                      const apptDay = new Date(appt.appointmentDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                      return apptDay === selectedDay;
                    });

                    const isDisabled = isFull || hasActiveBooking || isDayBooked;

                    return (
                      <button
                        key={slot.dateTime}
                        type="button"
                        className={!isSelected && !isDisabled ? "liquid-hover-btn" : ""}
                        onClick={() => {
                          if (isDisabled) {
                            if (isDayBooked) {
                              setMessage({ text: 'You already have an appointment scheduled for this day.', type: 'error' });
                            } else if (isFull) {
                              setMessage({ text: 'This time slot is fully booked.', type: 'error' });
                            }
                            setTimeout(() => setMessage({ text: '', type: '' }), 3000);
                            return;
                          }
                          setFormData(prev => ({ ...prev, appointmentDate: slot.dateTime }));
                        }}
                        style={{
                          padding: '10px',
                          background: isSelected || isBooked ? 'rgba(82, 196, 26, 0.15)' : '#0d1117',
                          color: isFull ? '#444' : (isSelected || isBooked) ? '#52c41a' : '#fff',
                          border: `1px solid ${(isSelected || isBooked) ? '#52c41a' : '#2f363d'}`,
                          borderRadius: '6px',
                          cursor: isDisabled ? 'not-allowed' : 'pointer',
                          textAlign: 'center',
                          fontSize: '13px',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '4px',
                          alignItems: 'center',
                          opacity: isDisabled && !isBooked && !isSelected ? 0.4 : 1
                        }}
                      >
                        <span style={{ fontWeight: isSelected ? 'bold' : 'normal' }}>{timeStr}</span>
                        <span style={{ fontSize: '11px', color: isFull ? '#f85149' : isSelected ? '#52c41a' : '#888' }}>
                          {isFull ? 'Full' : `${slot.available} left`}
                        </span>
                      </button>
                    );
                  })}
              </div>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', color: '#888' }}>Notes</label>
              <textarea 
                name="notes"
                value={formData.notes}
                onChange={handleInputChange}
                placeholder="Describe any specific issues..."
                style={{ width: '100%', padding: '10px', background: '#0d1117', border: '1px solid #2f363d', borderRadius: '6px', color: '#fff', minHeight: '100px' }}
              />
            </div>

            <button 
              type="submit" 
              disabled={submitting || hasActiveBooking}
              style={{ 
                width: '100%',
                padding: '14px',
                background: (submitting || hasActiveBooking) ? '#21262d' : 'linear-gradient(135deg, #2ea043 0%, #238636 100%)',
                color: (submitting || hasActiveBooking) ? '#8b949e' : '#ffffff',
                border: (submitting || hasActiveBooking) ? '1px solid #30363d' : '1px solid rgba(240,246,252,0.1)',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: (submitting || hasActiveBooking) ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                boxShadow: (submitting || hasActiveBooking) ? 'none' : '0 4px 12px rgba(46, 160, 67, 0.3)',
                textShadow: (submitting || hasActiveBooking) ? 'none' : '0 1px 2px rgba(0,0,0,0.2)'
              }}
              onMouseEnter={(e) => {
                if (!submitting && !hasActiveBooking) {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(46, 160, 67, 0.4)';
                  e.currentTarget.style.filter = 'brightness(1.1)';
                }
              }}
              onMouseLeave={(e) => {
                if (!submitting && !hasActiveBooking) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(46, 160, 67, 0.3)';
                  e.currentTarget.style.filter = 'brightness(1)';
                }
              }}
              onMouseDown={(e) => {
                if (!submitting && !hasActiveBooking) {
                  e.currentTarget.style.transform = 'translateY(1px)';
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(46, 160, 67, 0.3)';
                }
              }}
              onMouseUp={(e) => {
                if (!submitting && !hasActiveBooking) {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(46, 160, 67, 0.4)';
                }
              }}
            >
              {submitting ? 'Confirming Appointment...' : 'Confirm Appointment'}
            </button>
          </form>
        </div>

        {/* List Section */}
        <div className="large-card">
          <h3>My Appointments</h3>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #222' }}>
                  <th style={{ textAlign: 'left', padding: '10px', color: '#888' }}>Service</th>
                  <th style={{ textAlign: 'left', padding: '10px', color: '#888' }}>Date</th>
                  <th style={{ textAlign: 'left', padding: '10px', color: '#888' }}>Status</th>
                  <th style={{ textAlign: 'left', padding: '10px', color: '#888' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {appointments.length === 0 ? (
                  <tr>
                    <td colSpan="4" style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
                      No appointments found.
                    </td>
                  </tr>
                ) : (
                  appointments.map((a) => (
                    <tr key={a.id} style={{ borderBottom: '1px solid #1a1a1a' }}>
                      <td style={{ padding: '10px' }}>
                        <div>{a.serviceType}</div>
                        {a.vehicleName && <div style={{ fontSize: '12px', color: '#666' }}>{a.vehicleName}</div>}
                      </td>
                      <td style={{ padding: '10px', color: '#888' }}>
                        {new Date(a.appointmentDate).toLocaleString()}
                      </td>
                      <td style={{ padding: '10px' }}>
                        <span style={{ 
                          padding: '3px 8px', 
                          borderRadius: '12px', 
                          fontSize: '11px', 
                          fontWeight: 'bold',
                          color: '#fff',
                          background: getStatusColor(a.status)
                        }}>
                          {a.status}
                        </span>
                      </td>
                      <td style={{ padding: '10px' }}>
                        {a.status !== 'Completed' && (
                          <button
                            onClick={() => handleRemoveAppointment(a.id)}
                            style={{
                              padding: '5px 10px',
                              background: '#ff4d4f',
                              color: '#fff',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px',
                              fontWeight: 'bold',
                              transition: 'background 0.2s'
                            }}
                            onMouseEnter={(e) => e.currentTarget.style.background = '#ff7875'}
                            onMouseLeave={(e) => e.currentTarget.style.background = '#ff4d4f'}
                          >
                            Remove
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ConfirmModal 
        isOpen={confirmModal.isOpen}
        title="Remove Appointment"
        message="Are you sure you want to remove this appointment? This action cannot be undone."
        confirmText="Remove"
        onCancel={() => setConfirmModal({ isOpen: false, idToRemove: null })}
        onConfirm={executeRemoveAppointment}
      />
    </div>
  );
};

export default CustomerAppointmentsPage;
