import confetti from 'canvas-confetti';

export function fireCourseCompletionConfetti() {
  const duration = 3000;
  const end = Date.now() + duration;

  const colors = ['#a855f7', '#06b6d4', '#22c55e', '#f59e0b', '#ec4899'];

  const frame = () => {
    confetti({
      particleCount: 3,
      angle: 60,
      spread: 55,
      origin: { x: 0, y: 0.7 },
      colors,
    });

    confetti({
      particleCount: 3,
      angle: 120,
      spread: 55,
      origin: { x: 1, y: 0.7 },
      colors,
    });

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  };

  // Initial burst from center
  confetti({
    particleCount: 100,
    spread: 100,
    origin: { y: 0.6 },
    colors,
  });

  frame();
}

export function fireSmallCelebration() {
  confetti({
    particleCount: 50,
    spread: 60,
    origin: { y: 0.7 },
    colors: ['#a855f7', '#06b6d4', '#22c55e'],
  });
}
