import React, { useEffect } from 'react';
import { StyleSheet, TextInput, TextInputProps } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';

Animated.addWhitelistedNativeProps({ text: true });

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

interface AnimatedCounterProps extends Omit<TextInputProps, 'value'> {
  value: number;
  prefix?: string;
  suffix?: string;
  animationType?: 'spring' | 'timing';
}

export function AnimatedCounter({
  value,
  prefix = '',
  suffix = '',
  animationType = 'spring',
  style,
  ...rest
}: AnimatedCounterProps) {
  const animatedValue = useSharedValue(0);

  useEffect(() => {
    if (animationType === 'spring') {
      animatedValue.value = withSpring(value, {
        mass: 1,
        damping: 15,
        stiffness: 80,
      });
    } else {
      animatedValue.value = withTiming(value, {
        duration: 1000,
        easing: Easing.out(Easing.exp),
      });
    }
  }, [value, animatedValue, animationType]);

  const animatedProps = useAnimatedProps(() => {
    const formatted = Math.round(animatedValue.value).toString();
    return {
      text: `${prefix}${formatted}${suffix}`,
      defaultValue: `${prefix}${formatted}${suffix}`,
    } as any;
  });

  return (
    <AnimatedTextInput
      underlineColorAndroid="transparent"
      editable={false}
      value={`${prefix}${Math.round(value)}${suffix}`}
      animatedProps={animatedProps}
      style={[styles.text, style]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  text: {
    padding: 0,
    margin: 0,
    includeFontPadding: false,
    color: '#fff',
  },
});

