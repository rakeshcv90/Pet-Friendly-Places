import React, { useState, useMemo } from 'react';
import { Animated } from 'react-native';

export const Reveal = React.memo(function Reveal({ children, scrollY, viewportH, bodyTop }) {
  const [y, setY] = useState(null);
  const absY = y === null ? null : bodyTop + y;
  // blocks already on screen at first paint stay static
  const animated = absY !== null && viewportH > 0 && absY > viewportH - 20;
  const start = animated ? absY - viewportH + 20 : 0;

  const anim = useMemo(() => {
    if (!animated) {
      return null;
    }
    const inputRange = [start, start + 140];
    return {
      opacity: scrollY.interpolate({ inputRange, outputRange: [0, 1], extrapolate: 'clamp' }),
      translateY: scrollY.interpolate({
        inputRange,
        outputRange: [28, 0],
        extrapolate: 'clamp',
      }),
      rotateX: scrollY.interpolate({
        inputRange,
        outputRange: ['7deg', '0deg'],
        extrapolate: 'clamp',
      }),
    };
  }, [animated, start, scrollY]);

  return (
    <Animated.View
      onLayout={e => {
        const next = e.nativeEvent.layout.y;
        setY(prev => (prev !== null && Math.abs(prev - next) < 2 ? prev : next));
      }}
      style={
        anim
          ? {
              opacity: anim.opacity,
              transform: [
                { perspective: 900 },
                { translateY: anim.translateY },
                { rotateX: anim.rotateX },
              ],
            }
          : null
      }>
      {children}
    </Animated.View>
  );
});
