import { useEffect, useRef } from 'react';

export default function CarCursor() {
  const carRef = useRef(null);
  const prevPos = useRef({ x: 0, y: 0 });
  const lastSmokePos = useRef({ x: 0, y: 0 });
  const currentAngle = useRef(0);

  useEffect(() => {
    const car = carRef.current;
    if (!car) return;

    // Hide default cursor on page
    document.body.style.cursor = 'none';
    const interactiveElements = document.querySelectorAll('button, input, a, select, textarea, [role="button"]');
    interactiveElements.forEach(el => {
      el.style.cursor = 'none';
    });

    const handleMouseMove = (e) => {
      const x = e.clientX;
      const y = e.clientY;

      // Position the car cursor
      car.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${currentAngle.current}deg)`;
      car.style.display = 'block';

      // Calculate angle of movement
      const dx = x - prevPos.current.x;
      const dy = y - prevPos.current.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance > 2) {
        // Calculate new angle (in degrees)
        let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
        
        // Smooth out rotation wrap-around (e.g. from -170 to 170)
        const diff = angle - currentAngle.current;
        if (diff > 180) angle -= 360;
        if (diff < -180) angle += 360;

        // Lerp rotation for smooth turning
        currentAngle.current += (angle - currentAngle.current) * 0.25;

        // Apply updated rotation and position
        car.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${currentAngle.current}deg)`;
      }

      // Check distance for smoke emission (emit smoke every 15 pixels traveled)
      const smokeDx = x - lastSmokePos.current.x;
      const smokeDy = y - lastSmokePos.current.y;
      const smokeDistance = Math.sqrt(smokeDx * smokeDx + smokeDy * smokeDy);

      if (smokeDistance > 10) {
        createSmoke(x, y, currentAngle.current);
        lastSmokePos.current = { x, y };
      }

      prevPos.current = { x, y };
    };

    const createSmoke = (carX, carY, angleDeg) => {
      // Calculate exhaust point (rear center of the car, offset back by ~18px based on rotation angle)
      const rad = (angleDeg * Math.PI) / 180;
      const offsetX = -Math.cos(rad) * 18;
      const offsetY = -Math.sin(rad) * 18;

      const exhaustX = carX + offsetX;
      const exhaustY = carY + offsetY;

      // Spawn 2-3 smoke particles per interval for thicker smoke
      const particleCount = Math.floor(Math.random() * 2) + 2;
      for (let i = 0; i < particleCount; i++) {
        const smoke = document.createElement('div');
        smoke.className = 'smoke-particle';

        // Randomize sizes for smoke billows
        const size = Math.random() * 12 + 10; // 10px to 22px
        smoke.style.width = `${size}px`;
        smoke.style.height = `${size}px`;

        // Position at exhaust
        // Add tiny variance so it doesn't look like a solid straight line
        const varianceX = (Math.random() - 0.5) * 6;
        const varianceY = (Math.random() - 0.5) * 6;
        smoke.style.left = `${exhaustX - size / 2 + varianceX}px`;
        smoke.style.top = `${exhaustY - size / 2 + varianceY}px`;

        // Randomize expansion direction and distance (dy drift up / dx sideways)
        const dx = -Math.cos(rad) * (Math.random() * 30 + 20) + (Math.random() - 0.5) * 15;
        const dy = -Math.sin(rad) * (Math.random() * 30 + 20) - (Math.random() * 15 + 10); // Drift upwards due to heat

        smoke.style.setProperty('--dx', `${dx}px`);
        smoke.style.setProperty('--dy', `${dy}px`);

        // Randomize rotation and animation duration
        smoke.style.transform = `rotate(${Math.random() * 360}deg)`;
        smoke.style.animationDuration = `${Math.random() * 0.6 + 0.8}s`; // 0.8s to 1.4s

        document.body.appendChild(smoke);

        // Remove element after animation finishes
        smoke.addEventListener('animationend', () => {
          smoke.remove();
        });
      }
    };

    window.addEventListener('mousemove', handleMouseMove);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.body.style.cursor = 'default';
      const interactiveElements = document.querySelectorAll('button, input, a, select, textarea, [role="button"]');
      interactiveElements.forEach(el => {
        el.style.cursor = 'default';
      });
    };
  }, []);

  return (
    <div className="custom-car-cursor" ref={carRef} style={{ display: 'none' }}>
      {/* Top-down vector outline of a classic red sports car */}
      <svg width="40" height="24" viewBox="0 0 40 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        {/* Wheels */}
        <rect x="5" y="1" width="8" height="3" rx="1" fill="#1e293b" />
        <rect x="27" y="1" width="8" height="3" rx="1" fill="#1e293b" />
        <rect x="5" y="20" width="8" height="3" rx="1" fill="#1e293b" />
        <rect x="27" y="20" width="8" height="3" rx="1" fill="#1e293b" />
        
        {/* Shadow */}
        <rect x="1" y="2" width="37" height="20" rx="4" fill="rgba(0,0,0,0.25)" filter="blur(2px)" />
        
        {/* Main Body */}
        <rect x="2" y="3" width="36" height="18" rx="4" fill="#e33b3b" stroke="#7f1d1d" strokeWidth="1" />
        
        {/* Racing Stripes */}
        <rect x="2" y="8" width="36" height="2" fill="#111827" />
        <rect x="2" y="14" width="36" height="2" fill="#111827" />
        
        {/* Windshield & Roof Cabin */}
        <rect x="11" y="5" width="14" height="14" rx="2.5" fill="#0f172a" stroke="#334155" strokeWidth="1" />
        
        {/* Glass Reflection highlights */}
        <path d="M 21 6 L 24 8 L 24 16 L 21 18 Z" fill="#64748b" opacity="0.6" />
        <path d="M 12 7 L 14 9 L 14 15 L 12 17 Z" fill="#64748b" opacity="0.4" />
        
        {/* Front Grill / Hood details */}
        <rect x="27" y="8" width="5" height="8" rx="1" fill="#0f172a" />
        
        {/* Headlights */}
        <rect x="37" y="5" width="1.5" height="3" fill="#fef08a" />
        <rect x="37" y="16" width="1.5" height="3" fill="#fef08a" />
        
        {/* Taillights */}
        <rect x="2" y="5" width="1" height="3.5" fill="#ef4444" />
        <rect x="2" y="15" width="1" height="3.5" fill="#ef4444" />
      </svg>
    </div>
  );
}
