import { Platform, Alert } from 'react-native';

type Button = {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
};

/**
 * Cross-platform alert. When no buttons are passed, iOS/Android show a
 * system-localized OK button (no hard-coded Hebrew/English).
 */
export function showAlert(title: string, message = '', buttons?: Button[]) {
  if (Platform.OS !== 'web') {
    Alert.alert(title, message, buttons);
    return;
  }

  const msg = [title, message].filter(Boolean).join('\n\n');

  if (!buttons || buttons.length <= 1) {
    window.alert(msg);
    buttons?.[0]?.onPress?.();
  } else {
    const cancelBtn = buttons.find((b) => b.style === 'cancel');
    const actionBtn = buttons.find((b) => b.style !== 'cancel');
    const confirmed = window.confirm(msg);
    if (confirmed) {
      actionBtn?.onPress?.();
    } else {
      cancelBtn?.onPress?.();
    }
  }
}
