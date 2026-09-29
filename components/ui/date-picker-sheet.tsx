import DateTimePicker, {
  DateTimePickerAndroid,
} from "@react-native-community/datetimepicker";
import { useState } from "react";
import { Platform, StyleSheet, View } from "react-native";

import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { useAppTheme } from "@/hooks/use-app-theme";

interface DatePickerRequest {
  title: string;
  value: Date;
  onSelect: (date: Date) => void;
}

/**
 * Opens the native Android date dialog, or an inline calendar in a bottom
 * sheet on iOS. Render `datePickerSheet` once in the screen.
 */
export function useDatePicker() {
  const theme = useAppTheme();
  const [request, setRequest] = useState<DatePickerRequest | null>(null);

  const openDatePicker = (nextRequest: DatePickerRequest) => {
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        mode: "date",
        value: nextRequest.value,
        onChange: (event, date) => {
          if (event.type === "set" && date) {
            nextRequest.onSelect(date);
          }
        },
      });
      return;
    }

    setRequest(nextRequest);
  };

  const closeDatePicker = () => setRequest(null);

  const datePickerSheet = (
    <Sheet
      onClose={closeDatePicker}
      title={request?.title ?? "Select date"}
      visible={request !== null}
    >
      {request && Platform.OS === "ios" ? (
        <View style={styles.pickerContainer}>
          <DateTimePicker
            accentColor={theme.colors.primary}
            display="inline"
            mode="date"
            onChange={(_event, date) => {
              if (date) {
                request.onSelect(date);
                setRequest({ ...request, value: date });
              }
            }}
            style={styles.picker}
            themeVariant={theme.datePickerVariant}
            value={request.value}
          />
        </View>
      ) : null}
      <Button label="Done" onPress={closeDatePicker} />
    </Sheet>
  );

  return { openDatePicker, datePickerSheet };
}

const styles = StyleSheet.create({
  pickerContainer: {
    marginBottom: 12,
  },
  // The inline iOS calendar has no intrinsic size inside the sheet and collapses without one.
  picker: {
    height: 360,
    width: "100%",
  },
});
