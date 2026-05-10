import type { Preview } from '@storybook/nextjs-vite'
import { DM_Sans, Geist_Mono } from 'next/font/google'
import React from 'react'

import '../src/app/globals.css'

const dmSans = DM_Sans({
  variable: '--font-sans',
  subsets: ['latin'],
  weight: ['300', '400', '500'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
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
        { name: 'app', value: 'oklch(0.984 0.002 80)' },
        { name: 'card', value: '#ffffff' },
        { name: 'dark', value: 'oklch(0.13 0.01 255)' },
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
        dmSans.variable,
        geistMono.variable,
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
