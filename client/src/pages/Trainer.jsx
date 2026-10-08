import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { Card, CardHeader } from '../components/Card';
import { Button } from '../components/Button';
import { Badge, StatusBadge } from '../components/Badge';
import { Input } from '../components/Form';
import { INITIAL_TRAINER } from '../data/mockData';
import { Send, CheckCircle, Lock, ArrowRight, Mail, Users } from 'lucide-react';

export default function Trainer({ setActivePage }) {
  const { user, isPremium, trainerMessages, sendTrainerMessage, assignedTrainer } = useAuth();
  const { showToast } = useNotifications();

  const coach = assignedTrainer || INITIAL_TRAINER;
  const [messageText, setMessageText] = useState('');

  const handleSend = (e) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    sendTrainerMessage(messageText);
    showToast('Consultation message delivered to your coach.', 'Message Sent');
    setMessageText('');
  };

  if (!isPremium) {
    return (
      <div className="page-container" style={{ padding: '80px 20px', minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Card style={{ maxWidth: '540px', textAlign: 'center', padding: '40px', borderRadius: '24px' }}>
          <div style={{ width: '48px', height: '48px', backgroundColor: '#FDF2F6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' }}>
            <Lock size={22} color="#922756" />
          </div>
          <span className="label-micro">Premium Tier Feature</span>
          <h2 className="headline-section" style={{ fontSize: '1.8rem', marginTop: '8px', marginBottom: '12px' }}>
            Dedicated Personal Trainer
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '28px' }}>
            Personal trainer allocation is an exclusive feature of the FitCommit Premium Smart Pass. Upgrade your membership to be automatically paired with a CSCS certified strength coach for tailored form audits and direct messaging.
          </p>
          <Button block onClick={() => setActivePage('membership')}>
            Explore Premium Membership <ArrowRight size={16} />
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="page-container" style={{ padding: '40px 32px' }}>
      {/* 1. Header */}
      <div style={{ marginBottom: '36px' }}>
        <span className="label-micro">Coach Consultation</span>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.4rem', fontWeight: 600, letterSpacing: '-0.03em', marginTop: '6px' }}>
          Personal Trainer Allocation & Consultation
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '6px' }}>
          Dedicated strength & biomechanics coach pairing for routine adjustments and direct feedback.
        </p>
      </div>

      <div className="grid-2">
        {/* Trainer Profile Card */}
        <Card style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
              <div>
                <span className="label-micro">Allocated Strength Coach</span>
                <h2 className="headline-card" style={{ fontSize: '1.6rem', marginTop: '4px' }}>
                  {coach.trainer_name}
                </h2>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  {coach.specialization}
                </div>
              </div>

              <Badge variant="dark">
                <CheckCircle size={12} /> ALLOCATED
              </Badge>
            </div>

            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '24px' }}>
              {coach.bio}
            </p>

            <div className="hairline" style={{ margin: '20px 0' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Direct Email:</span>
                <span style={{ fontWeight: 600 }}>{coach.contact_email}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Coach Availability:</span>
                <span style={{ fontWeight: 600 }}>Active • Telemetry Review Mode</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Membership Tier:</span>
                <span style={{ fontWeight: 600 }}>Premium Dedicated Allocation</span>
              </div>
            </div>
          </div>

          <div style={{
            backgroundColor: 'var(--bg-canvas)',
            border: '1px solid var(--border-color)',
            padding: '16px',
            marginTop: '28px',
            fontSize: '0.8rem',
            color: 'var(--text-secondary)'
          }}>
            <strong>Coach Feedback Note:</strong> Your current dedication score of 82% has been analyzed. The upper body volume was appropriately calibrated to protect recovery.
          </div>
        </Card>

        {/* 2-Way Direct Consultation Message Board */}
        <Card style={{ display: 'flex', flexDirection: 'column', height: '620px' }}>
          <CardHeader
            subtitle="Direct Consultation Stream"
            title="Messages & Guidance"
            badge={<Badge variant="outline">Active Stream</Badge>}
          />

          {/* Messages Feed */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            paddingRight: '6px',
            marginBottom: '16px'
          }}>
            {trainerMessages.map((m, idx) => {
              const isUser = m.sender_role === 'USER';
              return (
                <div
                  key={idx}
                  style={{
                    alignSelf: isUser ? 'flex-end' : 'flex-start',
                    maxWidth: '82%',
                    backgroundColor: isUser ? '#922756' : '#F8FAFC',
                    color: isUser ? '#FFFFFF' : '#181B26',
                    border: isUser ? 'none' : '1px solid var(--border-color)',
                    padding: '12px 18px',
                    borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    fontSize: '0.88rem',
                    lineHeight: 1.5
                  }}
                >
                  <div style={{
                    fontSize: '0.68rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    marginBottom: '4px',
                    color: isUser ? '#BEBEBA' : '#666666'
                  }}>
                    {isUser ? 'You' : coach.trainer_name}
                  </div>
                  <div>{m.message_text}</div>
                </div>
              );
            })}
          </div>

          {/* Send Message Form */}
          <form onSubmit={handleSend} style={{ display: 'flex', gap: '10px' }}>
            <Input
              required
              placeholder="Ask coach for form advice or volume queries..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              style={{ flex: 1 }}
            />
            <Button type="submit" icon={Send} style={{ padding: '0 20px' }}>
              Send
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
