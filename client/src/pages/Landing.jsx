import React from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ArrowRight, 
  Check, 
  Activity, 
  Cpu, 
  Dumbbell, 
  Apple, 
  ShieldCheck, 
  Sparkles, 
  Sliders,
  Play,
  QrCode,
  Flame,
  Scale
} from 'lucide-react';

export default function Landing({ setActivePage }) {
  const { demoLogin } = useAuth();

  const handleQuickDemo = async (role) => {
    await demoLogin(role);
    setActivePage('dashboard');
  };

  return (
    <div style={{ backgroundColor: 'var(--bg-canvas)', minHeight: '100vh', transition: 'background-color var(--transition-base)' }}>
      
      {/* 1. HERO SECTION (Exact Fernhill layout & typography) */}
      <section style={{
        padding: '72px 0 64px 0',
        backgroundColor: 'var(--bg-canvas)',
        textAlign: 'center'
      }}>
        <div className="container" style={{ maxWidth: '1060px' }}>
          
          {/* Eyebrow Pill Tag (Fernhill: "• RCVS registered · Shrewsbury · Independent since 2009") */}
          <div style={{ marginBottom: '28px' }}>
            <div className="pill-eyebrow">
              <span className="dot"></span>
              <span>FitCommit Certified · Real-Time Telemetry · Capacity Tracking</span>
            </div>
          </div>

          {/* Main Headline (Fernhill: "Your vet should tell you / what it will cost") */}
          <h1 className="headline-hero" style={{ 
            marginBottom: '24px', 
            maxWidth: '820px', 
            margin: '0 auto 24px auto' 
          }}>
            Your gym should tell you <br />
            <span style={{ color: '#922756' }}>what space is available</span>
          </h1>

          {/* Subheading / Copy */}
          <p className="text-editorial" style={{ 
            fontSize: '1.12rem', 
            maxWidth: '680px', 
            margin: '0 auto 36px auto',
            color: '#505A69',
            lineHeight: 1.65
          }}>
            An intelligent fitness facility on FitCommit Road. Real-time gym capacity tracking, with live spots published on this website and a clear answer about who is training at any hour.
          </p>

          {/* Action Buttons Row (Fernhill: Primary Berry Pill + Secondary White Pill + Demo Pill) */}
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            gap: '14px', 
            flexWrap: 'wrap',
            marginBottom: '48px'
          }}>
            {/* Primary Berry Pill Button */}
            <button 
              onClick={() => setActivePage('register')} 
              className="btn btn-primary btn-lg"
              style={{ padding: '14px 32px' }}
            >
              Register your pass <ArrowRight size={17} />
            </button>

            {/* Secondary White Pill Button */}
            <button 
              onClick={() => setActivePage('attendance')} 
              className="btn btn-secondary btn-lg"
              style={{ padding: '14px 28px' }}
            >
              See live occupancy
            </button>

            {/* Demo / Watch Video Pill */}
            <button 
              onClick={() => setActivePage('dashboard')} 
              className="btn-demo-pill"
              title="Explore live interactive demo"
            >
              <div className="demo-play-circle">
                <Play size={14} fill="#FFFFFF" color="#FFFFFF" style={{ marginLeft: '2px' }} />
              </div>
              <span>Watch Demo</span>
            </button>
          </div>

          {/* Key Statistics Strip (Fernhill 4-column metric row: £46 / 24/7 / 4,100 / 16) */}
          <div className="stats-strip">
            <div className="stats-strip-item">
              <div className="stats-strip-num">100</div>
              <div className="stats-strip-label">Capacity spots</div>
            </div>
            <div className="stats-strip-item">
              <div className="stats-strip-num">24/7</div>
              <div className="stats-strip-label">Live telemetry</div>
            </div>
            <div className="stats-strip-item">
              <div className="stats-strip-num">4,100</div>
              <div className="stats-strip-label">Registered members</div>
            </div>
            <div className="stats-strip-item">
              <div className="stats-strip-num">100%</div>
              <div className="stats-strip-label">QR check-in automated</div>
            </div>
          </div>

          {/* Large Rounded Hero Image Card (Fernhill curved hero photo) */}
          <div className="hero-image-card" style={{ marginTop: '20px' }}>
            <img 
              src="/images/andrew-kayani-4G08MoVJlig-unsplash.jpg"
              alt="FitCommit Training Floor Cable Stations"
              style={{
                width: '100%',
                maxHeight: '520px',
                objectFit: 'cover',
                display: 'block'
              }}
            />
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              backgroundColor: 'var(--bg-card)',
              flexWrap: 'wrap',
              gap: '12px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="label-micro" style={{ color: 'var(--text-primary)' }}>FITCOMMIT FLAGSHIP FACILITY</span>
                <span style={{ color: '#8E95A5', fontSize: '0.80rem' }}>• Cable stations, free weights & functional training floor</span>
              </div>
              <span className="badge" style={{ backgroundColor: '#ECFDF5', color: '#059669', borderColor: '#A7F3D0' }}>
                ● Real-Time Sensor Telemetry Online
              </span>
            </div>
          </div>



        </div>
      </section>

      {/* 2. CORE CAPABILITIES (Clean white cards with berry accents) */}
      <section style={{ padding: '80px 0', borderTop: '1px solid var(--border-color)', backgroundColor: '#FAFBFC' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 48px auto' }}>
            <div className="pill-eyebrow" style={{ marginBottom: '14px' }}>
              <span className="dot"></span>
              <span>Intelligent Health Architecture</span>
            </div>
            <h2 className="headline-section">
              Engineered for sustainable dedication.
            </h2>
            <p className="text-editorial" style={{ marginTop: '10px' }}>
              Designed around dynamic adherence modeling instead of rigid rules. Calibrated to protect against overcommitment and fatigue.
            </p>
          </div>

          <div className="grid-3">
            {/* Pillar 1 */}
            <div className="card">
              <div style={{ 
                width: '44px', 
                height: '44px', 
                backgroundColor: 'var(--primary-soft)', 
                color: 'var(--primary)',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                marginBottom: '20px', 
                borderRadius: '12px' 
              }}>
                <Sliders size={20} />
              </div>
              <div className="label-micro" style={{ marginBottom: '6px', color: 'var(--primary)' }}>Adaptive Training</div>
              <h3 className="headline-card" style={{ marginBottom: '10px' }}>Adaptive Workouts</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.65 }}>
                Workout volume scales automatically. If adherence drops below 60%, the AI recommendation engine de-escalates sets by 15% to safeguard against burnout.
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="card">
              <div style={{ 
                width: '44px', 
                height: '44px', 
                backgroundColor: 'var(--primary-soft)', 
                color: 'var(--primary)',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                marginBottom: '20px', 
                borderRadius: '12px' 
              }}>
                <Apple size={20} />
              </div>
              <div className="label-micro" style={{ marginBottom: '6px', color: 'var(--primary)' }}>Smart Nutrition</div>
              <h3 className="headline-card" style={{ marginBottom: '10px' }}>Smart Nutrition & Macros</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.65 }}>
                Scientific Mifflin-St Jeor calculation computes daily caloric expenditure, protein intake (1.8–2.2g/kg), carbohydrates, and fats tailored to your biometrics.
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="card">
              <div style={{ 
                width: '44px', 
                height: '44px', 
                backgroundColor: 'var(--primary-soft)', 
                color: 'var(--primary)',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                marginBottom: '20px', 
                borderRadius: '12px' 
              }}>
                <Cpu size={20} />
              </div>
              <div className="label-micro" style={{ marginBottom: '6px', color: 'var(--primary)' }}>Facility Telemetry</div>
              <h3 className="headline-card" style={{ marginBottom: '10px' }}>Smart Gym Equipment</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.65 }}>
                Real-time IoT sensors monitor key gym stations. If a machine is occupied, FitCommit immediately offers equivalent free-weight alternatives.
              </p>
            </div>

            {/* Pillar 4 */}
            <div className="card">
              <div style={{ 
                width: '44px', 
                height: '44px', 
                backgroundColor: 'var(--primary-soft)', 
                color: 'var(--primary)',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                marginBottom: '20px', 
                borderRadius: '12px' 
              }}>
                <Activity size={20} />
              </div>
              <div className="label-micro" style={{ marginBottom: '6px', color: 'var(--primary)' }}>Biometric Analysis</div>
              <h3 className="headline-card" style={{ marginBottom: '10px' }}>Continuous BMI Tracking</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.65 }}>
                Track height and weight changes over time with automated body composition categorizations and synchronized macro recalculation triggers.
              </p>
            </div>

            {/* Pillar 5 */}
            <div className="card">
              <div style={{ 
                width: '44px', 
                height: '44px', 
                backgroundColor: 'var(--primary-soft)', 
                color: 'var(--primary)',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                marginBottom: '20px', 
                borderRadius: '12px' 
              }}>
                <Dumbbell size={20} />
              </div>
              <div className="label-micro" style={{ marginBottom: '6px', color: 'var(--primary)' }}>Personalized Coaching</div>
              <h3 className="headline-card" style={{ marginBottom: '10px' }}>Personal Trainer Oversight</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.65 }}>
                Premium subscribers are paired with certified strength and conditioning coaches for personalized oversight, performance audits, and two-way messaging.
              </p>
            </div>

            {/* Pillar 6 */}
            <div className="card">
              <div style={{ 
                width: '44px', 
                height: '44px', 
                backgroundColor: 'var(--primary-soft)', 
                color: 'var(--primary)',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                marginBottom: '20px', 
                borderRadius: '12px' 
              }}>
                <ShieldCheck size={20} />
              </div>
              <div className="label-micro" style={{ marginBottom: '6px', color: 'var(--primary)' }}>Member Benefits</div>
              <h3 className="headline-card" style={{ marginBottom: '10px' }}>Supplements & Rewards</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.65 }}>
                Access verified partner supplement vouchers, discount codes, and seamless membership subscription upgrades.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. FACILITY SHOWCASE (Featuring Crisp Unfiltered Image 2) */}
      <section style={{ padding: '80px 0', borderTop: '1px solid var(--border-color)', backgroundColor: 'var(--bg-canvas)' }}>
        <div className="container">
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: '48px',
            alignItems: 'center'
          }}>
            {/* Left: Crystal-Clear Unfiltered Image 2 in Rounded Card */}
            <div className="hero-image-card">
              <img 
                src="/images/mirko-meister-j4T5z94b8ns-unsplash.jpg"
                alt="FitCommit Facility Weight Training Floor"
                style={{
                  width: '100%',
                  height: '440px',
                  objectFit: 'cover',
                  display: 'block'
                }}
              />
              <div style={{
                padding: '14px 20px',
                borderTop: '1px solid var(--border-color)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                backgroundColor: 'var(--bg-card)'
              }}>
                <span className="label-micro" style={{ color: 'var(--text-primary)' }}>[ FIG. 02 ] DUMBBELL RACKS & WEIGHT BAYS</span>
                <span className="badge" style={{ backgroundColor: '#ECFDF5', color: '#059669', borderColor: '#A7F3D0' }}>
                  ● SENSOR MONITORED
                </span>
              </div>
            </div>

            {/* Right: Live Telemetry Exhibit Panel */}
            <div>
              <div className="pill-eyebrow" style={{ marginBottom: '14px' }}>
                <span className="dot"></span>
                <span>Live Facility Telemetry</span>
              </div>
              <h2 className="headline-section" style={{ marginBottom: '16px' }}>
                Clean, distraction-free member experience.
              </h2>
              <p className="text-editorial" style={{ marginBottom: '28px' }}>
                Check gym occupancy before leaving home. Verify which equipment stations are currently in use, and automatically log attendance with a quick QR scan at the entrance.
              </p>

              {/* Mini KPI Ribbon */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', marginBottom: '28px' }}>
                <div className="card" style={{ padding: '16px 20px', borderRadius: '16px' }}>
                  <div className="label-micro">Current BMI</div>
                  <div className="metric-value" style={{ fontSize: '1.8rem', marginTop: '6px' }}>22.8</div>
                  <div style={{ fontSize: '0.78rem', color: '#505A69', marginTop: '2px' }}>Normal Weight</div>
                </div>
                <div className="card" style={{ padding: '16px 20px', borderRadius: '16px' }}>
                  <div className="label-micro">Target Calories</div>
                  <div className="metric-value" style={{ fontSize: '1.8rem', marginTop: '6px' }}>2,240</div>
                  <div style={{ fontSize: '0.78rem', color: '#505A69', marginTop: '2px' }}>kcal / day</div>
                </div>
                <div className="card" style={{ padding: '16px 20px', borderRadius: '16px' }}>
                  <div className="label-micro">Workouts Done</div>
                  <div className="metric-value" style={{ fontSize: '1.8rem', marginTop: '6px' }}>4 / 5</div>
                  <div style={{ fontSize: '0.78rem', color: '#505A69', marginTop: '2px' }}>Adherence on track</div>
                </div>
                <div className="card" style={{ padding: '16px 20px', borderRadius: '16px' }}>
                  <div className="label-micro">Daily Steps</div>
                  <div className="metric-value" style={{ fontSize: '1.8rem', marginTop: '6px' }}>8,421</div>
                  <div style={{ fontSize: '0.78rem', color: '#505A69', marginTop: '2px' }}>Target: 8,000 reached</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <button 
                  onClick={() => setActivePage('dashboard')} 
                  className="btn btn-primary"
                  style={{ padding: '12px 28px' }}
                >
                  Open Member Dashboard <ArrowRight size={15} />
                </button>
                <button 
                  onClick={() => setActivePage('attendance')} 
                  className="btn btn-secondary"
                  style={{ padding: '12px 24px' }}
                >
                  <QrCode size={15} /> Gym Check-In
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 4. MEMBERSHIP OPTIONS */}
      <section style={{ padding: '80px 0', borderTop: '1px solid var(--border-color)', backgroundColor: '#FAFBFC' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 48px auto' }}>
            <div className="pill-eyebrow" style={{ marginBottom: '14px' }}>
              <span className="dot"></span>
              <span>Transparent Pricing</span>
            </div>
            <h2 className="headline-section">
              Choose your dedication level.
            </h2>
            <p className="text-editorial" style={{ marginTop: '10px' }}>
              Start for free with core adaptive tracking, or upgrade to Premium for complete gym facility access.
            </p>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
            gap: '28px', 
            maxWidth: '860px', 
            margin: '0 auto' 
          }}>
            {/* Base Tier Card */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '36px 32px' }}>
              <div>
                <div className="label-micro">Base Dedication Tier</div>
                <h3 style={{ fontSize: '2.2rem', marginTop: '10px', marginBottom: '6px', fontWeight: 800 }}>Free</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.90rem', marginBottom: '24px' }}>
                  Essential adaptive workout and nutrition algorithms for independent training.
                </p>

                <div className="hairline" style={{ margin: '16px 0' }} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.90rem', marginBottom: '32px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Check size={16} color="#059669" /> AI Adaptive Workout Routines</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Check size={16} color="#059669" /> Personalized Macronutrient Targets</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Check size={16} color="#059669" /> Continuous BMI Tracking & Trends</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Check size={16} color="#059669" /> Activity & Calorie Logging</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Check size={16} color="#059669" /> Weekly Commitment Score</div>
                </div>
              </div>

              <button onClick={() => handleQuickDemo('base')} className="btn btn-secondary btn-block">
                Continue with Base
              </button>
            </div>

            {/* Premium Tier Card */}
            <div className="card" style={{ 
              border: '2px solid #922756', 
              display: 'flex', 
              flexDirection: 'column', 
              justifyContent: 'space-between', 
              position: 'relative',
              padding: '36px 32px',
              boxShadow: '0 8px 30px rgba(146, 39, 86, 0.10)'
            }}>
              <div style={{
                position: 'absolute',
                top: '-14px',
                right: '28px',
                backgroundColor: '#922756',
                color: '#FFFFFF',
                fontSize: '0.72rem',
                fontWeight: 700,
                letterSpacing: '0.04em',
                padding: '4px 14px',
                borderRadius: '9999px'
              }}>
                Recommended
              </div>

              <div>
                <div className="label-micro" style={{ color: '#922756' }}>Premium Smart Pass</div>
                <h3 style={{ fontSize: '2.2rem', marginTop: '10px', marginBottom: '6px', fontWeight: 800 }}>
                  $29 <span style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', fontWeight: 500 }}>/ month</span>
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.90rem', marginBottom: '24px' }}>
                  Full gym facility access, IoT equipment tracking, and dedicated coach pairing.
                </p>

                <div className="hairline" style={{ margin: '16px 0' }} />

                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.90rem', marginBottom: '32px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 600 }}><Check size={16} color="#922756" /> Everything in Base Membership</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontWeight: 600 }}><Check size={16} color="#922756" /> Physical Gym Facility Access (Turnstile QR)</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Check size={16} color="#922756" /> Real-Time Smart Equipment Tracking</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Check size={16} color="#922756" /> Dedicated Personal Trainer Allocation</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Check size={16} color="#922756" /> Alternative Exercise Suggestions</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}><Check size={16} color="#922756" /> Partner Supplement Discounts (up to 30%)</div>
                </div>
              </div>

              <button onClick={() => handleQuickDemo('premium')} className="btn btn-primary btn-block">
                Start Premium Trial <ArrowRight size={15} />
              </button>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
