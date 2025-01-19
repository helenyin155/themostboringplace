import React, { useEffect, useRef } from 'react';

const BoringScoreSound = ({ boringScore }) => {
  const womp = useRef(null);
  const hooray = useRef(null);

  useEffect(() => {
    // Play sound based on boring score
    if (boringScore > 50) {
      // Womp womp effect for boring places
      const audio = new Audio('/womp-womp.mp3');
      audio.play().catch(error => console.error('Error playing womp sound:', error));
    } else if (boringScore > 29) {
      // Boing for meh places
      const audio = new Audio('/boing.mp3');
      audio.play().catch(error => console.error('Error playing boing sound:', error));
    } else {
      // Hooray effect for interesting places
      const audio = new Audio('/hooray.mp3');
      audio.play().catch(error => console.error('Error playing hooray sound:', error));
    }
  }, [boringScore]);

  return (
    <div className="sound-indicator">
      {boringScore > 30 ? (
        <div className="boring-alert text-red-500">
          {/* Womp Womp! This place is boring 😴 */}
        </div>
      ) : (
        <div className="exciting-alert text-green-500">
          {/* Hooray! This place looks fun! 🎉 */}
        </div>
      )}
    </div>
  );
};

export default BoringScoreSound;