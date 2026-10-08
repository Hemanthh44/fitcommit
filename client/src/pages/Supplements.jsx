import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNotifications } from '../context/NotificationContext';
import { api } from '../services/api';
import { Card, CardHeader } from '../components/Card';
import { Button } from '../components/Button';
import { Badge } from '../components/Badge';
import { 
  Tag, 
  Check, 
  Copy, 
  Lock, 
  ArrowRight, 
  Sparkles,
  ShoppingBag
} from 'lucide-react';

export default function Supplements({ setActivePage }) {
  const { user, isPremium, supplementOffers } = useAuth();
  const { showToast } = useNotifications();

  const offers = supplementOffers && supplementOffers.length > 0 ? supplementOffers : INITIAL_SUPPLEMENTS;
  const [copiedCodes, setCopiedCodes] = useState({});

  const handleCopyCode = async (offer) => {
    navigator.clipboard.writeText(offer.code);
    setCopiedCodes(prev => ({ ...prev, [offer.discount_id]: true }));
    showToast(`Code "${offer.code}" copied to clipboard! ${offer.discount_percentage}% discount claimed at partner checkout.`, 'Voucher Copied');
    
    try {
      await api.redeemSupplement(offer.discount_id);
    } catch {
      // offline fallback
    }
  };

  if (!isPremium) {
    return (
      <div className="container" style={{ padding: '80px 20px', minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Card style={{ maxWidth: '540px', textAlign: 'center', padding: '40px', borderRadius: '24px' }}>
          <div style={{ width: '48px', height: '48px', backgroundColor: '#FDF2F6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px auto' }}>
            <Lock size={22} color="#922756" />
          </div>
          <span className="label-micro">Premium Tier Benefit</span>
          <h2 className="headline-section" style={{ fontSize: '1.8rem', marginTop: '8px', marginBottom: '12px' }}>
            Exclusive Supplement Partner Discounts
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '28px' }}>
            FitCommit partners with clean sports nutrition brands to offer up to 30% discount codes exclusively to our Premium members. Upgrade to unlock all partner vouchers.
          </p>
          <Button variant="primary" block onClick={() => setActivePage('membership')}>
            Upgrade to Premium Pass <ArrowRight size={16} />
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container" style={{ padding: '50px 20px', maxWidth: '1100px' }}>
      {/* 1. Header */}
      <div style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <span className="label-micro">Partner Rewards</span>
            <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.4rem', fontWeight: 600, letterSpacing: '-0.03em', marginTop: '6px' }}>
              Supplement Partner Vouchers
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginTop: '6px' }}>
              Exclusive member discount codes curated for clean Scandinavian performance, hydration, and recovery.
            </p>
          </div>

          <Badge variant="dark" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
            <Sparkles size={13} style={{ marginRight: '6px' }} /> PREMIUM MEMBER BENEFIT
          </Badge>
        </div>
      </div>

      {/* 2. Offers Grid */}
      <div className="grid-2">
        {offers.map((offer) => {
          const isCopied = copiedCodes[offer.discount_id];

          return (
            <Card 
              key={offer.discount_id}
              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                  <div>
                    <span className="label-micro">{offer.brand}</span>
                    <h3 className="headline-card" style={{ fontSize: '1.35rem', marginTop: '4px' }}>
                      {offer.product_name}
                    </h3>
                  </div>

                  <Badge variant="dark" style={{ fontSize: '11px', padding: '5px 10px' }}>
                    {offer.discount_percentage}% OFF
                  </Badge>
                </div>

                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '24px' }}>
                  {offer.description}
                </p>

                {/* Code Voucher Box */}
                <div style={{
                  backgroundColor: 'var(--bg-canvas)',
                  border: '1px dashed var(--border-color)',
                  padding: '14px 18px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '24px'
                }}>
                  <div>
                    <div className="label-micro" style={{ fontSize: '0.62rem' }}>Promo Code</div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 700, letterSpacing: '0.05em' }}>
                      {offer.code}
                    </div>
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                    Expires: {offer.expiry_date}
                  </div>
                </div>
              </div>

              <Button
                variant={isCopied ? 'outline' : 'primary'}
                block
                onClick={() => handleCopyCode(offer)}
                style={{ fontSize: '0.8rem' }}
              >
                {isCopied ? (
                  <>
                    <Check size={14} /> Code Copied to Clipboard
                  </>
                ) : (
                  <>
                    <Copy size={14} /> Copy Voucher Code
                  </>
                )}
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
