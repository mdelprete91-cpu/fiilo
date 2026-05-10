'use client'

import type { ConfigStep } from '@/types/configuratore'

import { GarmentTypeStep, ClientMeasurementsStep } from './steps/SetupSteps'
import { FabricPrimaryStep, FabricContrastStep } from './steps/FabricSteps'
import {
  JacketCutStep, JacketSchoolStep, JacketBreastStep, JacketSingleButtonsStep,
  JacketDoubleConfigStep, JacketShoulderStep, JacketSleeveStep, JacketLapelTypeStep,
  JacketLapelWidthStep, JacketButtonholeStep, JacketStabStep, JacketLapelPipingStep,
  JacketHemShapeStep, JacketLengthStep, JacketSidePocketStep, JacketBreastPocketStep,
  JacketTicketPocketStep, JacketSleeveButtonCountStep, JacketSurgeonsCuffsStep,
  JacketKissingButtonsStep, JacketTurnbackCuffStep, JacketVentStep,
} from './steps/JacketSteps'
import {
  PantCutStep, PantWaistStep, PantSuspenderStep, PantPleatStep,
  PantPleatDirectionStep, PantSidePocketStep, PantBackPocketCountStep,
  PantBackPocketTypeStep, PantBackPocketButtonStep, PantBeltLoopsStep,
  PantBeltLoopCountStep, PantSideAdjustersStep, PantCuffStep, PantCuffHeightStep,
} from './steps/PantSteps'
import {
  VestBreastStep, VestLapelStep, VestButtonCountStep, VestBackMaterialStep,
  VestPocketsStep, VestBackBeltStep,
} from './steps/VestSteps'
import {
  JacketContrastEnabledStep, JacketContrastFabricStep, JacketContrastPartsStep,
  PantContrastEnabledStep, PantContrastFabricStep,
  LiningTypeStep, LiningFabricStep, FlashLiningStep,
  PipingEnabledStep, PipingColorStep,
  BackCollarContrastStep, BackCollarColorStep, EmbroideryTextStep, EmbroideryThreadStep,
  FrontButtonholeThreadStep, SleeveButtonholeThreadStep,
  JacketButtonStep, CuffButtonStep, FrontButtonStep, VestButtonStep,
  MonogramEnabledStep, MonogramTextStep, MonogramThreadStep, MonogramPositionStep,
} from './steps/ColorSteps'
import { ReviewStep } from './steps/ReviewStep'

export interface StepRendererProps {
  clientName: string
}

type Renderer = (props: StepRendererProps) => React.ReactNode

/**
 * Maps every atomic step ID to its renderer. The shell looks up the current
 * step here and renders the corresponding component. Adding a new step means
 * appending to STEPS in steps.ts and registering the component here.
 */
export const STEP_REGISTRY: Record<ConfigStep, Renderer> = {
  // setup
  'setup.type': () => <GarmentTypeStep />,
  'setup.measurements': () => <ClientMeasurementsStep />,
  // fabric
  'fabric.primary': () => <FabricPrimaryStep />,
  'fabric.contrast': () => <FabricContrastStep />,
  // jacket
  'jacket.cut': () => <JacketCutStep />,
  'jacket.school': () => <JacketSchoolStep />,
  'jacket.breast': () => <JacketBreastStep />,
  'jacket.single_buttons': () => <JacketSingleButtonsStep />,
  'jacket.double_config': () => <JacketDoubleConfigStep />,
  'jacket.shoulder': () => <JacketShoulderStep />,
  'jacket.sleeve': () => <JacketSleeveStep />,
  'jacket.lapel_type': () => <JacketLapelTypeStep />,
  'jacket.lapel_width': () => <JacketLapelWidthStep />,
  'jacket.lapel_buttonhole': () => <JacketButtonholeStep />,
  'jacket.stab_stitching': () => <JacketStabStep />,
  'jacket.lapel_piping': () => <JacketLapelPipingStep />,
  'jacket.hem_shape': () => <JacketHemShapeStep />,
  'jacket.length_offset': () => <JacketLengthStep />,
  'jacket.side_pocket': () => <JacketSidePocketStep />,
  'jacket.breast_pocket': () => <JacketBreastPocketStep />,
  'jacket.ticket_pocket': () => <JacketTicketPocketStep />,
  'jacket.sleeve_button_count': () => <JacketSleeveButtonCountStep />,
  'jacket.surgeons_cuffs': () => <JacketSurgeonsCuffsStep />,
  'jacket.kissing_buttons': () => <JacketKissingButtonsStep />,
  'jacket.turnback_cuff': () => <JacketTurnbackCuffStep />,
  'jacket.vent': () => <JacketVentStep />,
  // pant
  'pant.cut': () => <PantCutStep />,
  'pant.waist': () => <PantWaistStep />,
  'pant.suspender_buttons': () => <PantSuspenderStep />,
  'pant.pleat': () => <PantPleatStep />,
  'pant.pleat_direction': () => <PantPleatDirectionStep />,
  'pant.side_pocket': () => <PantSidePocketStep />,
  'pant.back_pocket_count': () => <PantBackPocketCountStep />,
  'pant.back_pocket_type': () => <PantBackPocketTypeStep />,
  'pant.back_pocket_button': () => <PantBackPocketButtonStep />,
  'pant.belt_loops': () => <PantBeltLoopsStep />,
  'pant.belt_loop_count': () => <PantBeltLoopCountStep />,
  'pant.side_adjusters': () => <PantSideAdjustersStep />,
  'pant.cuff': () => <PantCuffStep />,
  'pant.cuff_height': () => <PantCuffHeightStep />,
  // vest
  'vest.breast': () => <VestBreastStep />,
  'vest.lapel': () => <VestLapelStep />,
  'vest.button_count': () => <VestButtonCountStep />,
  'vest.back_material': () => <VestBackMaterialStep />,
  'vest.pockets': () => <VestPocketsStep />,
  'vest.back_belt': () => <VestBackBeltStep />,
  // color & details
  'color.jacket_contrast_enabled': () => <JacketContrastEnabledStep />,
  'color.jacket_contrast_fabric': () => <JacketContrastFabricStep />,
  'color.jacket_contrast_parts': () => <JacketContrastPartsStep />,
  'color.pant_contrast_enabled': () => <PantContrastEnabledStep />,
  'color.pant_contrast_fabric': () => <PantContrastFabricStep />,
  'color.lining_type': () => <LiningTypeStep />,
  'color.lining_fabric': () => <LiningFabricStep />,
  'color.flash_lining': () => <FlashLiningStep />,
  'color.piping_enabled': () => <PipingEnabledStep />,
  'color.piping_color': () => <PipingColorStep />,
  'color.back_collar_contrast': () => <BackCollarContrastStep />,
  'color.back_collar_color': () => <BackCollarColorStep />,
  'color.embroidery_text': () => <EmbroideryTextStep />,
  'color.embroidery_thread': () => <EmbroideryThreadStep />,
  'color.front_buttonhole_thread': () => <FrontButtonholeThreadStep />,
  'color.sleeve_buttonhole_thread': () => <SleeveButtonholeThreadStep />,
  'color.jacket_button': () => <JacketButtonStep />,
  'color.cuff_button': () => <CuffButtonStep />,
  'color.front_button': () => <FrontButtonStep />,
  'color.vest_button': () => <VestButtonStep />,
  'color.monogram_enabled': () => <MonogramEnabledStep />,
  'color.monogram_text': () => <MonogramTextStep />,
  'color.monogram_thread': () => <MonogramThreadStep />,
  'color.monogram_position': () => <MonogramPositionStep />,
  // final
  review: ({ clientName }) => <ReviewStep clientName={clientName} />,
}
