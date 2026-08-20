// theme/primeng-preset.ts
import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

export const CompacctHRPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '{blue.50}',
      100: '#EAF2FB',
      200: '#DCE9F8',
      300: '{blue.300}',
      400: '{blue.400}',
      500: '{blue.500}',
      600: '{blue.600}',
      700: '#14539A',
      800: '#0F3F76',
      900: '{blue.900}',
      950: '{blue.950}'
    },
    colorScheme: {
      light: {
        primary: {
          color: '#14539A',
          inverseColor: '#FFFFFF',
          hoverColor: '#0F3F76',
          activeColor: '#0A2D55'
        },
        highlight: {
          background: '#EAF2FB',
          focusBackground: '#DCE9F8',
          color: '#14539A',
          focusColor: '#0F3F76'
        },
        surface: {
          0: '#FFFFFF',
          50: '#F7F9FC',
          100: '#EDF1F7',
          200: '#E3E8EF',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#475569',
          700: '#334155',
          800: '#1F2937',
          900: '#0F172A',
          950: '#020617'
        }
      }
    }
  }
});
