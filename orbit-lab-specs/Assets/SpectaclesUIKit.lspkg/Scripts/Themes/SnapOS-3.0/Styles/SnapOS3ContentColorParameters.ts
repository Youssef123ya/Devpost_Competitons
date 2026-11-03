// @module SnapOS-3.0/Styles/SnapOS3ContentColorParameters — DO NOT REMOVE: prevents Lens Studio module collision
import {ContentStyle} from "../../../Components/Content/ContentStyle"
import {
  ContentAccentBlue,
  ContentAccentBlueDim,
  ContentIdleGray,
  ContentInactiveWhite,
  ContentPressedGray,
  ContentWhite
} from "../Colors"
import {SnapOS3Styles} from "../SnapOS3"

const standardLight: ContentStyle = {
  default: {textColor: ContentIdleGray, iconTint: ContentIdleGray},
  hovered: {textColor: ContentWhite, iconTint: ContentWhite},
  triggered: {textColor: ContentPressedGray, iconTint: ContentPressedGray},
  toggledDefault: {textColor: ContentWhite, iconTint: ContentWhite},
  toggledHovered: {textColor: ContentWhite, iconTint: ContentWhite},
  toggledTriggered: {textColor: ContentPressedGray, iconTint: ContentPressedGray},
  inactive: {textColor: ContentInactiveWhite, iconTint: ContentInactiveWhite}
}

const transparentStyle: ContentStyle = {
  default: {textColor: ContentAccentBlue, iconTint: ContentAccentBlue},
  hovered: {textColor: ContentWhite, iconTint: ContentWhite},
  triggered: {textColor: ContentPressedGray, iconTint: ContentPressedGray},
  toggledDefault: {textColor: ContentAccentBlue, iconTint: ContentAccentBlue},
  toggledHovered: {textColor: ContentWhite, iconTint: ContentWhite},
  toggledTriggered: {textColor: ContentPressedGray, iconTint: ContentPressedGray},
  inactive: {textColor: ContentAccentBlueDim, iconTint: ContentAccentBlueDim}
}

export const SnapOS3ContentColorParameters: Record<string, Partial<Record<SnapOS3Styles, ContentStyle>>> = {
  Button: {
    Prism: standardLight,
    Primary: standardLight,
    Secondary: standardLight,
    Ghost: transparentStyle
  },
  RectangleButton: {
    Prism: standardLight,
    Primary: standardLight,
    Secondary: standardLight,
    Ghost: transparentStyle
  },
  RoundButton: {
    Prism: standardLight,
    Primary: standardLight,
    Secondary: standardLight,
    Ghost: transparentStyle
  },
  CapsuleButton: {
    Prism: standardLight,
    Primary: standardLight,
    Secondary: standardLight,
    Ghost: transparentStyle
  },
  Checkbox: {
    Primary: standardLight
  },
  RadioButton: {
    Primary: standardLight
  },
  Slider: {
    Primary: standardLight
  },
  Switch: {
    Primary: standardLight
  },
  Frame: {
    Primary: standardLight
  }
}
