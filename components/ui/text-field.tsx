import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Ref, useState } from "react";
import {
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TextStyle,
  View,
} from "react-native";

import { IconName } from "@/components/ui/button";
import { Radius } from "@/constants/theme";
import { useAppTheme } from "@/hooks/use-app-theme";

interface TextFieldProps extends Omit<TextInputProps, "style"> {
  label: string;
  error?: string;
  hint?: string;
  icon?: IconName;
  prefix?: string;
  inputStyle?: StyleProp<TextStyle>;
  ref?: Ref<TextInput>;
}

export function TextField({
  label,
  error,
  hint,
  icon,
  prefix,
  inputStyle,
  ref,
  onFocus,
  onBlur,
  ...inputProps
}: TextFieldProps) {
  const theme = useAppTheme();
  const { colors } = theme;
  const [isFocused, setIsFocused] = useState(false);
  const borderColor = error
    ? colors.danger
    : isFocused
      ? colors.primary
      : colors.border;

  return (
    <View style={styles.field}>
      <Text style={[styles.label, { color: colors.textMuted }]}>{label}</Text>
      <View
        style={[
          styles.inputRow,
          inputProps.multiline ? styles.multilineRow : undefined,
          {
            backgroundColor: colors.surfaceMuted,
            borderColor,
            borderWidth: isFocused || error ? 1.5 : StyleSheet.hairlineWidth,
          },
        ]}
      >
        {icon ? (
          <MaterialCommunityIcons
            color={isFocused ? colors.primary : colors.textSubtle}
            name={icon}
            size={20}
            style={inputProps.multiline ? styles.multilineIcon : undefined}
          />
        ) : null}
        {prefix ? (
          <Text style={[styles.prefix, { color: colors.textMuted }]}>
            {prefix}
          </Text>
        ) : null}
        <TextInput
          accessibilityHint={error ?? hint}
          accessibilityLabel={label}
          onBlur={(event) => {
            setIsFocused(false);
            onBlur?.(event);
          }}
          onFocus={(event) => {
            setIsFocused(true);
            onFocus?.(event);
          }}
          placeholderTextColor={colors.textSubtle}
          ref={ref}
          selectionColor={colors.primary}
          style={[
            styles.input,
            inputProps.multiline ? styles.multilineInput : undefined,
            { color: colors.text },
            inputStyle,
          ]}
          {...inputProps}
        />
      </View>
      {error ? (
        <View style={styles.messageRow}>
          <MaterialCommunityIcons
            color={colors.danger}
            name="alert-circle"
            size={14}
          />
          <Text style={[styles.message, { color: colors.danger }]}>
            {error}
          </Text>
        </View>
      ) : hint ? (
        <Text style={[styles.message, { color: colors.textSubtle }]}>
          {hint}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: "700",
  },
  inputRow: {
    alignItems: "center",
    borderRadius: Radius.md,
    flexDirection: "row",
    gap: 8,
    minHeight: 52,
    paddingHorizontal: 14,
  },
  multilineRow: {
    alignItems: "flex-start",
    paddingVertical: 12,
  },
  multilineIcon: {
    marginTop: 1,
  },
  prefix: {
    fontSize: 18,
    fontWeight: "700",
  },
  input: {
    flex: 1,
    fontSize: 17,
    paddingVertical: 12,
  },
  multilineInput: {
    minHeight: 72,
    paddingVertical: 0,
    textAlignVertical: "top",
  },
  messageRow: {
    alignItems: "center",
    flexDirection: "row",
    gap: 4,
  },
  message: {
    fontSize: 13,
    fontWeight: "500",
  },
});
