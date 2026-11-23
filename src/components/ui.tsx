import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { Edge, SafeAreaView } from 'react-native-safe-area-context';
import { CONTENT_MAX_WIDTH } from '../constants/layout';
import { useTheme } from '../constants/theme';

// Screens under the app title bar: the bar already covers the top inset.
export const HEADER_EDGES: readonly Edge[] = ['bottom', 'left', 'right'];

export function Screen({
  children,
  scroll = true,
  edges,
  maxWidth = CONTENT_MAX_WIDTH,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  edges?: readonly Edge[];
  /** Widest the content gets on a wide screen (it is centred). Has no effect on a phone. */
  maxWidth?: number;
}) {
  const t = useTheme();
  return (
    <SafeAreaView edges={edges} style={{ flex: 1, backgroundColor: t.background }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {scroll ? (
          <ScrollView contentContainerStyle={{ padding: 24 }} keyboardShouldPersistTaps="handled">
            <View style={{ width: '100%', maxWidth, alignSelf: 'center' }}>{children}</View>
          </ScrollView>
        ) : (
          children
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

export function Button({
  title,
  onPress,
  loading,
  disabled,
  variant = 'primary',
  compact,
  icon,
}: {
  title: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'outline' | 'ghost' | 'danger';
  compact?: boolean; // smaller button for dialogs
  icon?: (color: string) => React.ReactNode; // optional icon before the title
}) {
  const t = useTheme();
  const filled = variant === 'primary' || variant === 'danger';
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      style={[
        styles.button,
        compact && styles.buttonCompact,
        variant === 'primary' && { backgroundColor: t.primary },
        variant === 'danger' && { backgroundColor: t.danger },
        variant === 'outline' && { borderWidth: 1.5, borderColor: t.primary },
        (disabled || loading) && { opacity: 0.6 },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={filled ? t.onPrimary : t.primary} />
      ) : (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          {icon?.(filled ? t.onPrimary : t.primary)}
          <Text style={{ color: filled ? t.onPrimary : t.primary, fontWeight: '600', fontSize: compact ? 14 : 16 }}>{title}</Text>
        </View>
      )}
    </Pressable>
  );
}

export function TextField({ compact, ...props }: TextInputProps & { compact?: boolean }) {
  const t = useTheme();
  return (
    <TextInput
      placeholderTextColor={t.textSecondary}
      {...props}
      style={[styles.field, compact && styles.fieldCompact, { borderColor: t.outline, backgroundColor: t.surface, color: t.text }, props.style]}
    />
  );
}

/** Password input with the usual eye button to show or hide what you typed. */
export function PasswordField({ compact, ...props }: TextInputProps & { compact?: boolean }) {
  const t = useTheme();
  const [visible, setVisible] = useState(false);
  return (
    <View>
      <TextField
        {...props}
        compact={compact}
        secureTextEntry={!visible}
        autoCapitalize="none"
        autoCorrect={false}
        style={[{ paddingRight: 52 }, props.style]}
      />
      <Pressable
        onPress={() => setVisible((v) => !v)}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={visible ? 'Hide password' : 'Show password'}
        style={[styles.eye, compact && styles.eyeCompact]}
      >
        <Ionicons name={visible ? 'eye-off-outline' : 'eye-outline'} size={compact ? 20 : 22} color={t.textSecondary} />
      </Pressable>
    </View>
  );
}

export interface Option {
  value: string;
  label: string;
}

/** Dropdown replacement for the AutoCompleteTextView fields. */
export function OptionPicker({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: readonly Option[];
  onChange: (value: string) => void;
}) {
  const t = useTheme();
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);
  return (
    <>
      <Pressable
        accessibilityRole="button"
        onPress={() => setOpen(true)}
        style={[styles.field, { borderColor: t.outline, backgroundColor: t.surface, justifyContent: 'center' }]}
      >
        <Text style={{ color: selected ? t.text : t.textSecondary, fontSize: 16 }}>{selected?.label ?? label}</Text>
      </Pressable>
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <View style={[styles.sheet, { backgroundColor: t.surface }]}>
            <FlatList
              data={options}
              keyExtractor={(o) => o.value}
              renderItem={({ item }) => (
                <Pressable
                  style={styles.row}
                  onPress={() => {
                    onChange(item.value);
                    setOpen(false);
                  }}
                >
                  <Text style={{ color: item.value === value ? t.primary : t.text, fontSize: 16 }}>{item.label}</Text>
                </Pressable>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

export function Placeholder({ title, note }: { title: string; note: string }) {
  const t = useTheme();
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: t.background }}>
      <Text style={{ color: t.text, fontSize: 20, fontWeight: '700', marginBottom: 8 }}>{title}</Text>
      <Text style={{ color: t.textSecondary, textAlign: 'center' }}>{note}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  button: { height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  buttonCompact: { height: 46, borderRadius: 23 },
  fieldCompact: { height: 46, fontSize: 14, marginBottom: 10 },
  eyeCompact: { width: 46, height: 46 },
  eye: { position: 'absolute', right: 0, top: 0, width: 52, height: 52, alignItems: 'center', justifyContent: 'center' },
  field: { height: 52, borderWidth: 1, borderRadius: 12, paddingHorizontal: 16, fontSize: 16, marginBottom: 12 },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: 32 },
  sheet: { borderRadius: 16, maxHeight: '70%', paddingVertical: 8, width: '100%', maxWidth: 440, alignSelf: 'center' },
  row: { paddingHorizontal: 20, paddingVertical: 14 },
});
