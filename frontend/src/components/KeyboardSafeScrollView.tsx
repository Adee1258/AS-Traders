/**
 * KeyboardSafeScrollView
 *
 * Fixes the "keyboard hides input" problem on both iOS and Android.
 *
 * How it works:
 * - iOS:   KeyboardAvoidingView behavior="padding" + automaticallyAdjustKeyboardInsets
 * - Android: behavior="height" + keyboardShouldPersistTaps="handled"
 *
 * Just wrap your form content with this instead of manually combining
 * KeyboardAvoidingView + ScrollView everywhere.
 */

import React from 'react';
import {
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  StyleSheet,
  ViewStyle,
  ScrollViewProps,
} from 'react-native';
import { COLORS } from '../constants';

interface Props extends ScrollViewProps {
  children: React.ReactNode;
  contentStyle?: ViewStyle;
  /** Extra bottom padding so last input is never hidden. Default: 120 */
  bottomPadding?: number;
}

const KeyboardSafeScrollView: React.FC<Props> = ({
  children,
  contentStyle,
  bottomPadding = 120,
  style,
  ...scrollProps
}) => {
  return (
    <KeyboardAvoidingView
      style={[styles.flex, style]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: bottomPadding },
          contentStyle,
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        automaticallyAdjustKeyboardInsets={Platform.OS === 'ios'}
        {...scrollProps}
      >
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 16 },
});

export default KeyboardSafeScrollView;
