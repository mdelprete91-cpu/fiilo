import type { Preview } from '@storybook/nextjs-vite'
import { Inter, JetBrains_Mono } from 'next/font/google'
import React from 'react'

import '../src/app/globals.css'

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
})

const jetbrainsMono = JetBrains_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
  weight: ['400', '500', '600'],
})

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: 'app',
      values: [
        { name: 'app', value: '#FDFBF7' },
        { name: 'card', value: '#F7F4EB' },
        { name: 'dark', value: '#0F0F0F' },
      ],
    },
    layout: 'centered',
    a11y: { test: 'todo' },
  },
  globalTypes: {
    theme: {
      name: 'Theme',
      description: 'Light / dark mode',
      defaultValue: 'light',
      toolbar: {
        icon: 'paintbrush',
        items: [
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
        ],
        dynamicTitle: true,
      },
    },
  },
  decorators: [
    (Story, context) => {
      const isDark = context.globals.theme === 'dark'
      const className = [
        inter.variable,
        jetbrainsMono.variable,
        'min-h-[200px]',
        'bg-background',
        'text-foreground',
        'p-6',
        'font-sans',
        isDark ? 'dark' : '',
      ]
        .filter(Boolean)
        .join(' ')

      return React.createElement(
        'div',
        { className, 'data-theme': isDark ? 'dark' : 'light' },
        React.createElement(Story, null),
      )
    },
  ],
}

export default preview
