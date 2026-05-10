import type { Meta, StoryObj } from '@storybook/nextjs-vite'

import {
  Avatar,
  AvatarBadge,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from '@/components/ui/avatar'

const meta: Meta<typeof Avatar> = {
  title: 'Components/Avatar',
  component: Avatar,
  parameters: { layout: 'centered' },
}

export default meta
type Story = StoryObj<typeof Avatar>

export const Default: Story = {
  render: () => (
    <Avatar>
      <AvatarImage src="https://i.pravatar.cc/96?img=12" alt="Mario" />
      <AvatarFallback>MS</AvatarFallback>
    </Avatar>
  ),
}

export const Fallback: Story = {
  parameters: { layout: 'padded' },
  render: () => (
    <div className="flex items-center gap-3">
      <Avatar><AvatarFallback>MS</AvatarFallback></Avatar>
      <Avatar><AvatarFallback>GP</AvatarFallback></Avatar>
      <Avatar><AvatarFallback>LB</AvatarFallback></Avatar>
    </div>
  ),
}

export const WithBadge: Story = {
  render: () => (
    <Avatar>
      <AvatarImage src="https://i.pravatar.cc/96?img=33" alt="Giulia" />
      <AvatarFallback>GP</AvatarFallback>
      <AvatarBadge className="bg-primary" />
    </Avatar>
  ),
}

export const Group: Story = {
  parameters: { layout: 'padded' },
  render: () => (
    <AvatarGroup>
      <Avatar><AvatarImage src="https://i.pravatar.cc/96?img=12" alt="" /><AvatarFallback>MS</AvatarFallback></Avatar>
      <Avatar><AvatarImage src="https://i.pravatar.cc/96?img=33" alt="" /><AvatarFallback>GP</AvatarFallback></Avatar>
      <Avatar><AvatarImage src="https://i.pravatar.cc/96?img=44" alt="" /><AvatarFallback>LB</AvatarFallback></Avatar>
      <AvatarGroupCount>+3</AvatarGroupCount>
    </AvatarGroup>
  ),
}
