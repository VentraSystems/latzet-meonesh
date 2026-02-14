import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

interface VentraLogoProps {
  size?: 'small' | 'medium' | 'large';
  showText?: boolean;
  textColor?: string;
  style?: any;
}

export default function VentraLogo({
  size = 'medium',
  showText = true,
  textColor = '#3498DB',
  style
}: VentraLogoProps) {

  const logoSizes = {
    small: 40,
    medium: 60,
    large: 100,
  };

  const logoSize = logoSizes[size];

  // Try to load the logo image, fallback to text if not available
  const logoSource = require('../../assets/ventra-logo.png');

  return (
    <View style={[styles.container, style]}>
      {/* Logo Image */}
      <Image
        source={logoSource}
        style={{ width: logoSize, height: logoSize }}
        resizeMode="contain"
        onError={() => {
          console.log('Logo image not found, using text fallback');
        }}
      />

      {/* Company Name */}
      {showText && (
        <View style={styles.textContainer}>
          <Text style={[styles.companyName, { color: textColor }]}>
            VENTRA
          </Text>
          <Text style={[styles.subtitle, { color: textColor, opacity: 0.7 }]}>
            SOFTWARE SYSTEMS
          </Text>
        </View>
      )}
    </View>
  );
}

// Fallback text-based logo if image not available
export function VentraTextLogo({
  size = 'medium',
  color = '#3498DB'
}: {
  size?: 'small' | 'medium' | 'large',
  color?: string
}) {
  const fontSize = {
    small: 16,
    medium: 20,
    large: 28,
  };

  return (
    <View style={styles.textLogoContainer}>
      <Text style={[styles.textLogo, { fontSize: fontSize[size], color }]}>
        V
      </Text>
      <Text style={[styles.textLogoFull, { fontSize: fontSize[size] * 0.7, color }]}>
        ENTRA
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    marginTop: 8,
    alignItems: 'center',
  },
  companyName: {
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  subtitle: {
    fontSize: 10,
    letterSpacing: 1,
    marginTop: 2,
  },
  textLogoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  textLogo: {
    fontWeight: 'bold',
  },
  textLogoFull: {
    fontWeight: '300',
  },
});
