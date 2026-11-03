import {Style} from "../Style"
import {Theme} from "../Theme"
import {BeveledPrismButtonParameters} from "./Styles/BeveledPrismButtonParameters"
import {ButtonParameters} from "./Styles/ButtonParameters"
import {CapsuleButtonParameters} from "./Styles/CapsuleButtonParameters"
import {CheckboxComponentData, CheckboxParameters} from "./Styles/CheckboxParameters"
import {ColorSliderComponentData, ColorSliderParameters} from "./Styles/ColorSliderParameters"
import {ConfirmationSliderComponentData, ConfirmationSliderParameters} from "./Styles/ConfirmationSliderParameters"
import {FrameParameters} from "./Styles/FrameParameters"
import {ProgressBarComponentData, ProgressBarParameters} from "./Styles/ProgressBarParameters"
import {RadioButtonParameters} from "./Styles/RadioButtonParameters"
import {RoundButtonParameters} from "./Styles/RoundButtonParameters"
import {SliderComponentData, SliderParameters} from "./Styles/SliderParameters"
import {SwitchKnobPrismParameters} from "./Styles/SwitchKnobPrismParameters"
import {SwitchComponentData, SwitchKnobComponentData, SwitchParameters} from "./Styles/SwitchParameters"
import {TextInputFieldParameters} from "./Styles/TextInputFieldParameters"
import {TooltipComponentData} from "./Styles/TooltipParameters"

export enum SnapOS3Styles {
  "Prism" = "Prism",
  "PrismGhost" = "PrismGhost",
  "Primary" = "Primary",
  "Secondary" = "Secondary",
  "Ghost" = "Ghost"
}

export const SnapOS3: Theme = {
  get name(): string {
    return "SnapOS3"
  },
  get defaultStyleName(): string {
    return "Primary"
  },
  get defaultShapeName(): string {
    return "Rectangle"
  },
  get styles(): Record<string, Record<string, Style>> {
    return {
      Button: {...ButtonParameters, ...BeveledPrismButtonParameters},
      RoundButton: RoundButtonParameters,
      RectangleButton: ButtonParameters,
      CapsuleButton: CapsuleButtonParameters,
      SliderTrack: SliderParameters.track,
      SliderKnob: SliderParameters.knob,
      SliderFill: SliderParameters.fill,
      SwitchTrack: SwitchParameters.track,
      SwitchKnob: {...SwitchParameters.knob, ...SwitchKnobPrismParameters},
      SwitchFill: SwitchParameters.fill,
      RadioButton: RadioButtonParameters.base,
      RadioButtonToggled: RadioButtonParameters.toggled,
      Checkbox: CheckboxParameters.base,
      CheckboxToggled: CheckboxParameters.toggled,
      CheckboxMark: CheckboxParameters.mark,
      TextInputField: TextInputFieldParameters.style,
      ConfirmationSliderTrack: ConfirmationSliderParameters.track,
      ConfirmationSliderKnob: ConfirmationSliderParameters.knob,
      ColorSliderTrack: ColorSliderParameters.track,
      ColorSliderKnob: ColorSliderParameters.knob,
      ProgressBarTrack: ProgressBarParameters.track,
      ProgressBarFill: ProgressBarParameters.fill
    }
  },
  get componentData(): Record<string, unknown> {
    return {
      Frame: FrameParameters,
      Slider: SliderComponentData,
      SliderKnob: SliderComponentData.knob,
      ConfirmationSlider: ConfirmationSliderComponentData,
      ConfirmationSliderKnob: ConfirmationSliderComponentData.knob,
      ProgressBar: ProgressBarComponentData,
      Switch: SwitchComponentData,
      SwitchKnob: SwitchKnobComponentData,
      Tooltip: TooltipComponentData,
      Checkbox: CheckboxComponentData,
      ColorSlider: ColorSliderComponentData,
      ColorSliderKnob: ColorSliderComponentData.knob
    }
  }
}
