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
  formatter?: (val: number) => string;
  animationType?: 'spring' | 'timing';
}

export function AnimatedCounter({
  value,
  prefix = '',
  suffix = '',
  formatter = (v) => Math.round(v).toString(),
  animationType = 'spring',
  style,
  ...rest
}: AnimatedCounterProps) {
  const animatedValue = useSharedValue(0); // Start from 0 or perhaps initial value

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
    return {
      text: `${prefix}${formatter(animatedValue.value)}${suffix}`,
      // Workaround for some React Native versions where 'text' isn't properly forwarded on TextInput
      defaultValue: `${prefix}${formatter(animatedValue.value)}${suffix}`,
    } as any;
  });

  return (
    <AnimatedTextInput
      underlineColorAndroid="transparent"
      editable={false}
      value={`${prefix}${formatter(value)}${suffix}`}
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
;

