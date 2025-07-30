// web/frontend/components/ SpinWheel.jsx
import { useState, useEffect } from 'react';
import {
  Card,
  Button,
  Modal,
  Banner,
  Heading,
  TextContainer,
  Spinner,
  Badge,
} from '@shopify/polaris';

const  SpinWheel = ({ customerId, shopDomain }) => {
  const [isSpinning, setIsSpinning] = useState(false);
  const [canSpin, setCanSpin] = useState(false);
  const [spinResult, setSpinResult] = useState(null);
  const [showResultModal, setShowResultModal] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [rewards, setRewards] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetch = async (url, options = {}) => {
    return window.fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });
  };

  // Fetch spin wheel configuration
  const fetchSpinWheelConfig = async () => {
    try {
      const response = await fetch(`/api/spin/config?shop=${shopDomain}`);
      const data = await response.json();
      
      if (response.ok) {
        setRewards(data.rewards || []);
      }
    } catch (error) {
      console.error('Error fetching spin wheel config:', error);
    }
  };

  // Check if customer can spin today
  const checkSpinAvailability = async () => {
    try {
      const response = await fetch(`/api/spin/check/${customerId}?shop=${shopDomain}`);
      const data = await response.json();
      setCanSpin(data.canSpin);
    } catch (error) {
      console.error('Error checking spin availability:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (customerId && shopDomain) {
      fetchSpinWheelConfig();
      checkSpinAvailability();
    }
  }, [customerId, shopDomain]);

  // Calculate segments for wheel display
  const calculateSegments = () => {
    if (!rewards.length) return [];
    
    let currentAngle = 0;
    return rewards.map((reward, index) => {
      const segmentAngle = (reward.probability / 100) * 360;
      const segment = {
        ...reward,
        startAngle: currentAngle,
        endAngle: currentAngle + segmentAngle,
        midAngle: currentAngle + segmentAngle / 2
      };
      currentAngle += segmentAngle;
      return segment;
    });
  };

  const segments = calculateSegments();

  // Handle spin action
  const handleSpin = async () => {
    if (!canSpin || isSpinning) return;

    setIsSpinning(true);
    
    try {
      const response = await fetch('/api/spin/play', {
        method: 'POST',
        body: JSON.stringify({ customerId, shopDomain })
      });

      const data = await response.json();
      
      if (response.ok) {
        // Calculate winning segment angle
        const winningReward = data.reward;
        const winningSegment = segments.find(s => s.id === winningReward.id);
        
        if (winningSegment) {
          // Calculate final rotation to land on winning segment
          const targetAngle = winningSegment.midAngle;
          const spins = 5 + Math.random() * 3; // 5-8 full spins
          const finalRotation = (spins * 360) + (360 - targetAngle); // Subtract because wheel spins clockwise
          
          // Smooth animation using CSS transition
          const wheelElement = document.getElementById('spin-wheel');
          if (wheelElement) {
            wheelElement.style.transition = 'transform 4s cubic-bezier(0.23, 1, 0.32, 1)';
            wheelElement.style.transform = `rotate(${rotation + finalRotation}deg)`;
            setRotation(rotation + finalRotation);
          }
        }
        
        // Show result after animation completes
        setTimeout(() => {
          setIsSpinning(false);
          setSpinResult(data);
          setShowResultModal(true);
          setCanSpin(false);
        }, 4000);
      } else {
        setIsSpinning(false);
        console.error('Spin failed:', data.error);
      }

    } catch (error) {
      setIsSpinning(false);
      console.error('Error spinning wheel:', error);
    }
  };

  // Create SVG wheel
  const createWheelSVG = () => {
    const radius = 150;
    const centerX = 160;
    const centerY = 160;
    
    return (
      <svg width="320" height="320" style={{ margin: '0 auto', display: 'block' }}>
        {/* Wheel segments */}
        {segments.map((segment, index) => {
          const startAngleRad = (segment.startAngle * Math.PI) / 180;
          const endAngleRad = (segment.endAngle * Math.PI) / 180;
          
          const x1 = centerX + radius * Math.cos(startAngleRad);
          const y1 = centerY + radius * Math.sin(startAngleRad);
          const x2 = centerX + radius * Math.cos(endAngleRad);
          const y2 = centerY + radius * Math.sin(endAngleRad);
          
          const largeArcFlag = segment.endAngle - segment.startAngle > 180 ? 1 : 0;
          
          const pathData = [
            `M ${centerX} ${centerY}`,
            `L ${x1} ${y1}`,
            `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
            'z'
          ].join(' ');
          
          // Text position
          const textAngleRad = (segment.midAngle * Math.PI) / 180;
          const textRadius = radius * 0.7;
          const textX = centerX + textRadius * Math.cos(textAngleRad);
          const textY = centerY + textRadius * Math.sin(textAngleRad) + 5;
          
          return (
            <g key={segment.id}>
              <path
                d={pathData}
                fill={segment.color}
                stroke="#fff"
                strokeWidth="2"
              />
              <text
                x={textX}
                y={textY}
                textAnchor="middle"
                fill="white"
                fontSize="12"
                fontWeight="bold"
                transform={`rotate(${segment.midAngle}, ${textX}, ${textY})`}
              >
                {segment.label}
              </text>
            </g>
          );
        })}
        
        {/* Center circle */}
        <circle
          cx={centerX}
          cy={centerY}
          r="30"
          fill="#333"
          stroke="#fff"
          strokeWidth="3"
        />
        
        {/* Center text */}
        <text
          x={centerX}
          y={centerY + 5}
          textAnchor="middle"
          fill="white"
          fontSize="16"
          fontWeight="bold"
        >
          SPIN
        </text>
        
        {/* Pointer */}
        <polygon
          points={`${centerX},${centerY - radius - 20} ${centerX - 15},${centerY - radius - 5} ${centerX + 15},${centerY - radius - 5}`}
          fill="#333"
          stroke="#fff"
          strokeWidth="2"
        />
      </svg>
    );
  };

  if (loading) {
    return (
      <Card sectioned>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <Spinner size="large" />
        </div>
      </Card>
    );
  }

  return (
    <>
      <Card sectioned>
        <div style={{ textAlign: 'center' }}>
          <Heading element="h2">Daily Spin Wheel</Heading>
          <br />
          
          {/*   SVG Wheel */}
          <div 
            id="spin-wheel"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: isSpinning ? '' : 'transform 0.5s ease-out',
              transformOrigin: 'center',
              margin: '20px auto'
            }}
          >
            {createWheelSVG()}
          </div>

          <div style={{ marginTop: '30px' }}>
            <Button
              primary
              size="large"
              onClick={handleSpin}
              disabled={!canSpin || isSpinning}
              loading={isSpinning}
            >
              {isSpinning ? 'Spinning...' : canSpin ? 'Spin the Wheel!' : 'Come Back Tomorrow!'}
            </Button>
          </div>

          <br />
          
          <TextContainer>
            <p>Spin once daily for a chance to win points, discounts, or free shipping!</p>
            {!canSpin && !isSpinning && (
              <p>You've already spun today. Come back tomorrow for another chance!</p>
            )}
          </TextContainer>

          {/* Rewards Legend */}
          {segments.length > 0 && (
            <div style={{ marginTop: '20px' }}>
              <Heading element="h4">Available Rewards:</Heading>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
                gap: '10px',
                marginTop: '10px'
              }}>
                {segments.map(segment => (
                  <div key={segment.id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      backgroundColor: segment.color,
                      borderRadius: '3px'
                    }} />
                    <span style={{ fontSize: '14px' }}>
                      {segment.label} ({segment.probability}%)
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Result Modal */}
      <Modal
        open={showResultModal}
        onClose={() => setShowResultModal(false)}
        title="🎉 Spin Result!"
        primaryAction={{
          content: 'Awesome!',
          onAction: () => setShowResultModal(false)
        }}
      >
        <Modal.Section>
          {spinResult && (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '48px',
                margin: '20px 0'
              }}>
                {spinResult.reward?.type === 'points' && spinResult.reward?.value > 0 ? '🎁' :
                 spinResult.reward?.type?.includes('discount') ? '💰' :
                 spinResult.reward?.type === 'free_shipping' ? '🚚' : '😔'}
              </div>
              
              <Heading element="h2">{spinResult.reward?.label || 'Better luck next time!'}</Heading>
              <br />
              
              {spinResult.reward?.type === 'points' && spinResult.reward?.value > 0 && (
                <Banner status="success">
                  <p>Congratulations! You won {spinResult.reward.value} points! They've been added to your account.</p>
                </Banner>
              )}
              
              {spinResult.reward?.type === 'discount_percentage' && (
                <Banner status="success">
                  <p>Amazing! You won a {spinResult.reward.value}% discount!</p>
                  <p><strong>Use code:</strong> <code style={{ 
                    backgroundColor: '#f6f6f7', 
                    padding: '4px 8px', 
                    borderRadius: '4px',
                    fontFamily: 'monospace'
                  }}>{spinResult.discountCode}</code></p>
                </Banner>
              )}
              
              {spinResult.reward?.type === 'discount_fixed' && (
                <Banner status="success">
                  <p>Fantastic! You won ₹{spinResult.reward.value} off your next order!</p>
                  <p><strong>Use code:</strong> <code style={{ 
                    backgroundColor: '#f6f6f7', 
                    padding: '4px 8px', 
                    borderRadius: '4px',
                    fontFamily: 'monospace'
                  }}>{spinResult.discountCode}</code></p>
                </Banner>
              )}
              
              {spinResult.reward?.type === 'free_shipping' && (
                <Banner status="success">
                  <p>Excellent! You won free shipping on your next order!</p>
                  <p><strong>Use code:</strong> <code style={{ 
                    backgroundColor: '#f6f6f7', 
                    padding: '4px 8px', 
                    borderRadius: '4px',
                    fontFamily: 'monospace'
                  }}>{spinResult.discountCode}</code></p>
                </Banner>
              )}
              
              {(!spinResult.reward || spinResult.reward.value === 0) && (
                <Banner status="info">
                  <p>No luck this time, but don't give up! Come back tomorrow for another spin and better chances to win!</p>
                </Banner>
              )}
            </div>
          )}
        </Modal.Section>
      </Modal>
    </>
  );
};

export default SpinWheel;