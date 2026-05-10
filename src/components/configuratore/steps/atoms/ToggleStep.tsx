'use client'

import { ChoiceStep } from './ChoiceStep'

interface ToggleStepProps {
  question: string
  description?: string
  value: boolean | null
  onChoice: (value: boolean) => void
  yesLabel?: string
  noLabel?: string
  yesDescription?: string
  noDescription?: string
}

/**
 * Yes/no atomic step. Auto-advances on selection.
 *
 * Implemented as a thin wrapper over ChoiceStep so the visual treatment is
 * identical to other single-choice questions.
 */
export function ToggleStep({
  question,
  description,
  value,
  onChoice,
  yesLabel = 'Sì',
  noLabel = 'No',
  yesDescription,
  noDescription,
}: ToggleStepProps) {
  return (
    <ChoiceStep<'yes' | 'no'>
      question={question}
      description={description}
      value={value === null ? null : value ? 'yes' : 'no'}
      onChoice={(v) => onChoice(v === 'yes')}
      options={[
        { value: 'yes', label: yesLabel, description: yesDescription },
        { value: 'no', label: noLabel, description: noDescription },
      ]}
      layout="list"
    />
  )
}
