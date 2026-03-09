import { Platform, Alert } from 'react-native';

type Button = {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
};

/**
 * Cross-platform alert — works on web where Alert.alert is a no-op in RNW.
 */
export function showAlert(title: string, message = '', buttons: Button[] = [{ text: 'אישור' }]) {
  if (Platform.OS !== 'web') {
    Alert.alert(title, message, buttons);
    return;
  }

  const msg = [title, message].filter(Boolean).join('\n\n');

  if (buttons.length <= 1) {
    window.alert(msg);
    buttons[0]?.onPress?.();
  } else {
    // Separate cancel vs action buttons
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
