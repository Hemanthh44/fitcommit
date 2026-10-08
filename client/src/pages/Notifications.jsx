import React, { useState } from 'react';
import { useNotifications } from '../context/NotificationContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { 
  Bell, 
  Check, 
  CheckCheck, 
  Cpu, 
  Apple, 
  Dumbbell, 
  Users, 
  Award 
} from 'lucide-react';

export default function Notifications({ setActivePage }) {
  const { notifications, unreadCount, markAllRead, markOneRead } = useNotifications();
  const [filterType, setFilterType] = useState('ALL');

  const getIcon = (type) => {
    switch (type) {
      case 'WORKOUT': return <Dumbbell size={16} />;
      case 'DIET': return <Apple size={16} />;
      case 'TRAINER': return <Users size={16} />;
      case 'EQUIPMENT': return <Cpu size={16} />;
      case 'SUBSCRIPTION': return <Award size={16} />;
      default: return <Bell size={16} />;
    }
  };

  const filtered = filterType === 'ALL'
    ? notifications
    : notifications.filter(n => n.type === filterType);

  return (
    <div className="container" style={{ padding: '50px 20px', maxWidth: '850px' }}>
      {/* 1. Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px', marginBottom: '36px' }}>
        <div>
          <span className="label-micro">Real-Time Activity Feed</span>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.4rem', fontWeight: 600, letterSpacing: '-0.03em', marginTop: '6px' }}>
            Notifications & Alerts
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '6px' }}>
            System reminders for workouts, nutritional milestones, coach interactions, and sensor events.
          </p>
        </div>

        {unreadCount > 0 && (
          <Button variant="secondary" size="sm" onClick={markAllRead}>
            <CheckCheck size={14} /> Mark All as Read ({unreadCount})
          </Button>
        )}
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', marginBottom: '24px' }}>
        {['ALL', 'WORKOUT', 'DIET', 'TRAINER', 'EQUIPMENT', 'SUBSCRIPTION'].map((t) => (
          <Button
            key={t}
            variant={filterType === t ? 'primary' : 'secondary'}
            size="sm"
            onClick={() => setFilterType(t)}
            style={{ fontSize: '0.72rem' }}
          >
            {t}
          </Button>
        ))}
      </div>

      {/* List */}
      <Card style={{ padding: '8px' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-secondary)' }}>
            No notifications in this category.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {filtered.map((item) => (
              <div
                key={item.notification_id}
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '16px',
                  padding: '18px 20px',
                  borderBottom: '1px solid #ECECEA',
                  backgroundColor: item.is_read ? '#FFFFFF' : 'var(--bg-canvas)'
                }}
              >
                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{
                    width: '36px',
                    height: '36px',
                    borderRadius: '50%',
                    backgroundColor: item.is_read ? '#F8FAFC' : '#FDF2F6',
                    color: item.is_read ? '#505A69' : '#922756',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {getIcon(item.type)}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span className="label-micro" style={{ fontSize: '0.65rem' }}>{item.type}</span>
                      {!item.is_read && (
                        <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#922756' }} />
                      )}
                      {item.created_at && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>• {item.created_at}</span>
                      )}
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '0.92rem' }}>{item.title}</div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px', lineHeight: 1.5 }}>
                      {item.message}
                    </div>
                  </div>
                </div>

                {!item.is_read && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => markOneRead ? markOneRead(item.notification_id) : null}
                    style={{ fontSize: '0.7rem', padding: '4px 8px', flexShrink: 0 }}
                  >
                    <Check size={12} /> Mark Read
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
