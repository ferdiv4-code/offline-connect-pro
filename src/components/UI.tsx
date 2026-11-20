import React from 'react';
import { Pressable, StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useApp } from '@/state/AppContext';

export function Heading({ title, subtitle }: { title: string; subtitle?: string }) {
  const { colors } = useApp();
  return <View style={{ gap: 5 }}>
    <Text style={{ color: colors.text, fontSize: 27, fontWeight: '800', letterSpacing: -0.6 }}>{title}</Text>
    {!!subtitle && <Text style={{ color: colors.muted, fontSize: 14 }}>{subtitle}</Text>}
  </View>;
}
export function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  const { colors } = useApp();
  return <View style={[{ backgroundColor: colors.surface, borderColor: colors.border, borderWidth: 1, borderRadius: 20, padding: 16, gap: 12 }, style]}>{children}</View>;
}
export function ActionButton({ title, icon, onPress, secondary=false }: { title: string; icon: keyof typeof Ionicons.glyphMap; onPress: () => void; secondary?: boolean }) {
  const { colors } = useApp();
  return <Pressable onPress={onPress} style={({pressed}) => ({
    backgroundColor: secondary ? colors.surface2 : colors.primary,
    borderRadius: 15, paddingVertical: 14, paddingHorizontal: 16, flexDirection: 'row',
    alignItems: 'center', justifyContent: 'center', gap: 9, opacity: pressed ? 0.8 : 1,
  })}>
    <Ionicons name={icon} size={18} color={secondary ? colors.text : '#04150C'} />
    <Text style={{ color: secondary ? colors.text : '#04150C', fontWeight: '800', fontSize: 14 }}>{title}</Text>
  </Pressable>;
}
export function Field(props: TextInputProps & { label: string }) {
  const { colors } = useApp();
  return <View style={{ gap: 7 }}>
    <Text style={{ color: colors.muted, fontWeight: '700', fontSize: 12 }}>{props.label}</Text>
    <TextInput {...props} placeholderTextColor={colors.muted} style={[{
      backgroundColor: colors.surface2, borderColor: colors.border, borderWidth: 1,
      borderRadius: 13, paddingHorizontal: 14, paddingVertical: 13, color: colors.text, fontSize: 15
    }, props.style]} />
  </View>;
}
export function SectionTitle({ children }: { children: string }) {
  const { colors } = useApp();
  return <Text style={{ color: colors.text, fontWeight: '800', fontSize: 17 }}>{children}</Text>;
}
export function EmptyState({ icon, title, body }: { icon: keyof typeof Ionicons.glyphMap; title: string; body: string }) {
  const { colors } = useApp();
  return <View style={{ alignItems: 'center', paddingVertical: 28, gap: 9 }}>
    <View style={{ backgroundColor: colors.surface2, width: 66, height: 66, borderRadius: 22, alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name={icon} size={29} color={colors.primary}/>
    </View>
    <Text style={{ color: colors.text, fontSize: 16, fontWeight: '800' }}>{title}</Text>
    <Text style={{ color: colors.muted, fontSize: 13, textAlign: 'center', lineHeight: 19 }}>{body}</Text>
  </View>;
}