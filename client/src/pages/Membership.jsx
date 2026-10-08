import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { Card, CardHeader } from '../components/Card';
import { Button } from '../components/Button';
import { Badge, StatusBadge } from '../components/Badge';
import { Modal } from '../components/Modal';
import { FormField, Input } from '../components/Form';
import { 
  Check, 
  CreditCard, 
  ArrowRight, 
  Lock, 
  Building,
  ShieldCheck,
  Zap,
  Tag
} from 'lucide-react';

export default function Membership({ setActivePage }) {
  const { user, isPremium, upgradeToPremium } = useAuth();
  const { showToast } = useNotifications();

  const [checkoutModalOpen, setCheckoutModalOpen] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Simulated Checkout Form (Zero sensitive storage per PCI-DSS)
  const [cardData, setCardData] = useState({
    cardNumber: '4242 •••• •••• 4242',
    nameOnCard: user?.name || 'Hemanth S.',
    expiry: '12/28',
    cvv: '888'
  });

  const handleSimulatePayment = (e) => {
    e.preventDefault();
    setProcessing(true);

    setTimeout(() => {
      upgradeToPremium();
      setProcessing(false);
      setCheckoutModalOpen(false);
      showToast('Premium Smart Pass activated! Facility access & coach allocation unlocked.', 'Subscription Activated');
    }, 700);
  };

  return (
    <div className="container" style={{ padding: '50px 20px', maxWidth: '1100px' }}>
      {/* 1. Header */}
      <div style={{ textAlign: 'center', maxWidth: '680px', margin: '0 auto 40px auto' }}>
        <span className="label-micro">Membership Options & Privileges</span>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.5rem', fontWeight: 600, letterSpacing: '-0.03em', marginTop: '8px' }}>
          FitCommit Membership Tiers
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '8px', lineHeight: 1.6 }}>
          Transparent Scandinavian pricing with zero hidden cancellation fees. Upgrade or downgrade seamlessly as your fitness commitment evolves.
        </p>
      </div>

      {/* Active Subscription Status Banner */}
      <Card style={{ marginBottom: '40px', padding: '24px 30px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
          <div>
            <div className="label-micro">Active Subscription Status</div>
            <div style={{ fontSize: '1.3rem', fontWeight: 700, marginTop: '4px' }}>
              {isPremium ? 'Premium Smart Pass' : 'Base Commitment Tier'}
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
              Status: <StatusBadge status="VALID" /> • Facility Pass: <span style={{ fontWeight: 600, color: '#111111' }}>{isPremium ? 'Granted (Turnstile Active)' : 'Inactive'}</span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {isPremium ? (
              <Badge variant="dark" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
                <Building size={14} style={{ marginRight: '6px' }} /> PHYSICAL FACILITY ACTIVE
              </Badge>
            ) : (
              <Badge variant="outline" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
                DIGITAL-ONLY SUITE
              </Badge>
            )}
          </div>
        </div>
      </Card>

      {/* 2. Side-by-Side Comparison */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px', maxWidth: '940px', margin: '0 auto 50px auto' }}>
        {/* BASE CARD */}
        <Card style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div className="label-micro">Self-Guided Dedication</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', marginTop: '8px', marginBottom: '6px' }}>
              Base Tier
            </h2>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '16px' }}>
              $0 <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 400 }}>/ forever</span>
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '24px' }}>
              Full access to AI-driven adaptive workout generation and Mifflin-St Jeor macronutrient tracking.
            </p>

            <div className="hairline" style={{ margin: '16px 0' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem', marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Check size={16} /> AI Adaptive Workout Split</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Check size={16} /> Personalized Diet & Macronutrient Targets</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Check size={16} /> Continuous BMI Tracking & Trends</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Check size={16} /> Daily Caloric Burn & Steps Logger</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Check size={16} /> Adherence & Commitment Meter</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#999999' }}>✕ Physical Smart Gym Access</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#999999' }}>✕ Dedicated Trainer Direct Chat</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#999999' }}>✕ Supplement Partner Vouchers</div>
            </div>
          </div>

          <Button 
            variant="outline" 
            block 
            disabled={!isPremium}
            onClick={() => showToast('You are on the Base Tier.', 'Current Tier')}
          >
            {!isPremium ? 'Current Active Tier' : 'Downgrade to Base'}
          </Button>
        </Card>

        {/* PREMIUM CARD */}
        <Card style={{
          border: '2px solid #922756',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          position: 'relative',
          borderRadius: '24px',
          boxShadow: '0 8px 30px rgba(146, 39, 86, 0.10)'
        }}>
          <div style={{
            position: 'absolute',
            top: '-14px',
            right: '24px',
            backgroundColor: '#922756',
            color: '#FFFFFF',
            fontSize: '0.70rem',
            fontWeight: 700,
            letterSpacing: '0.04em',
            borderRadius: '9999px',
            padding: '4px 12px'
          }}>
            Featured Tier
          </div>

          <div>
            <div className="label-micro" style={{ color: '#922756' }}>Smart Gym & Dedicated Coaching</div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', marginTop: '8px', marginBottom: '6px' }}>
              Premium Pass
            </h2>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '16px' }}>
              $29 <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: 400 }}>/ month</span>
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '24px' }}>
              Physical facility access, IoT machine occupancy sensors, dedicated coach allocation, and supplement vouchers.
            </p>

            <div className="hairline" style={{ margin: '16px 0' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.85rem', marginBottom: '32px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 600 }}><Check size={16} color="#922756" /> Everything in Base Tier</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 600 }}><Check size={16} color="#922756" /> Physical Gym Facility Access</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 600 }}><Check size={16} color="#922756" /> Dedicated Coach Allocation</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 600 }}><Check size={16} color="#922756" /> Direct 2-Way Trainer Messaging</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 600 }}><Check size={16} color="#922756" /> Smart Gym Equipment Telemetry</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 600 }}><Check size={16} color="#922756" /> Alternative Exercise Engine</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 600 }}><Check size={16} color="#922756" /> Supplement Discounts up to 30%</div>
            </div>
          </div>

          {isPremium ? (
            <div style={{
              width: '100%',
              padding: '12px',
              backgroundColor: '#922756',
              color: '#FFFFFF',
              borderRadius: '9999px',
              textAlign: 'center',
              fontWeight: 600,
              fontSize: '0.82rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px'
            }}>
              <Check size={16} /> Active Premium Member
            </div>
          ) : (
            <Button
              variant="primary"
              block
              onClick={() => setCheckoutModalOpen(true)}
            >
              Upgrade to Premium Pass <ArrowRight size={16} />
            </Button>
          )}
        </Card>
      </div>

      {/* 3. Simulated PCI-DSS Compliant Checkout Modal */}
      <Modal
        isOpen={checkoutModalOpen}
        onClose={() => setCheckoutModalOpen(false)}
        title="Subscribe to Premium Pass"
        subtitle="Secure 256-Bit SSL Tokenized Checkout"
      >
        <form onSubmit={handleSimulatePayment}>
          <div style={{
            backgroundColor: 'var(--bg-canvas)',
            border: '1px solid var(--border-color)',
            padding: '16px',
            marginBottom: '20px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem', marginBottom: '6px' }}>
              <span>FitCommit Premium Monthly</span>
              <strong>$29.00 / mo</strong>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              <span>Includes Gym Turnstile + Dedicated Coach</span>
              <span>Included</span>
            </div>
          </div>

          <FormField label="Cardholder Name">
            <Input
              type="text"
              required
              value={cardData.nameOnCard}
              onChange={(e) => setCardData({ ...cardData, nameOnCard: e.target.value })}
            />
          </FormField>

          <FormField label="Simulated Card Number (Tokenized)">
            <Input
              type="text"
              required
              value={cardData.cardNumber}
              onChange={(e) => setCardData({ ...cardData, cardNumber: e.target.value })}
            />
          </FormField>

          <div className="grid-2">
            <FormField label="Expiry Date (MM/YY)">
              <Input
                type="text"
                required
                value={cardData.expiry}
                onChange={(e) => setCardData({ ...cardData, expiry: e.target.value })}
              />
            </FormField>
            <FormField label="Security CVV">
              <Input
                type="text"
                required
                value={cardData.cvv}
                onChange={(e) => setCardData({ ...cardData, cvv: e.target.value })}
              />
            </FormField>
          </div>

          <Button
            type="submit"
            variant="primary"
            block
            disabled={processing}
            style={{ marginTop: '16px', padding: '14px' }}
          >
            {processing ? 'Authorizing Token...' : 'Confirm $29.00 Payment'}
          </Button>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '16px' }}>
            <Lock size={12} /> Encrypted simulated gateway session • PCI-DSS compliant secure protocol
          </div>
        </form>
      </Modal>
    </div>
  );
}
