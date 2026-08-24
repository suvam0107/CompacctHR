// theme/primeng-preset.ts
// Maps PrimeNG Aura semantic tokens to the Enterprise Modern palette.
// Primary: Sapphire Blue #0F52BA | Secondary: Steel Blue #206393
import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

export const CompacctHRPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50:  '#EEF4FF',
      100: '#D9E2FF',
      200: '#B0C6FF',
      300: '#7EA5FF',
      400: '#4D82F0',
      500: '#2563D4',
      600: '#1A4DB8',
      700: '#0F52BA', // ← Sapphire Blue — canonical primary
      800: '#003C90', // ← Deep Navy — hover
      900: '#002366',
      950: '#001945'  // ← pressed / active
    },
    colorScheme: {
      light: {
        primary: {
          color:        '#0F52BA',
          inverseColor: '#FFFFFF',
          hoverColor:   '#003C90',
          activeColor:  '#001945'
        },
        highlight: {
          background:      '#D9E2FF', // primary-container / primary-tint
          focusBackground: '#B0C6FF', // primary-fixed-dim
          color:           '#001945',
          focusColor:      '#001945'
        },
        surface: {
          0:   '#FFFFFF',           // surface-container-lowest (cards)
          50:  '#F7F9FB',           // surface / page background
          100: '#F2F4F6',           // surface-container-low
          200: '#ECEEF0',           // surface-container
          300: '#E6E8EA',           // surface-container-high
          400: '#E0E3E5',           // surface-container-highest
          500: '#C3C6D5',           // outline-variant / border
          600: '#737784',           // outline / muted text
          700: '#434653',           // on-surface-variant
          800: '#191C1E',           // on-surface (text)
          900: '#111316',
          950: '#020617'
        }
      }
    },
    // Input overrides — 2px Sapphire Blue border + soft outer glow on focus
    inputStyle: 'outlined',
    formField: {
      focus: {
        ring: {
          width:  '3px',
          style:  'solid',
          color:  'rgba(15, 82, 186, 0.15)',
          offset: '0'
        }
      }
    }
  }
});

