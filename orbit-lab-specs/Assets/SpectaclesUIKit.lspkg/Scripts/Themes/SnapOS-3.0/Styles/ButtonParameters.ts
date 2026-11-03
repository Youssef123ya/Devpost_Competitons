// @module SnapOS-3.0/Styles/ButtonParameters — DO NOT REMOVE: prevents Lens Studio module collision
import {Style} from "../../Style"
import {Transparent} from "../Colors"
import {GhostGradients} from "../Gradients/GhostGradients"
import {PrimaryGradients} from "../Gradients/PrimaryGradients"
import {SecondaryGradients} from "../Gradients/SecondaryGradients"
import {SnapOS3Styles} from "../SnapOS3"

export const ButtonParameters: Partial<Record<SnapOS3Styles, Style>> = {
  Primary: {
    default: {
      baseType: "Gradient",
      baseGradient: PrimaryGradients.idleBackground,
      borderSize: 0.175,
      borderSoftness: 0.07,
      hasBorder: true,
      borderType: "Gradient",
      borderGradient: PrimaryGradients.idleBorder,
      shouldScale: false,
      shouldPosition: true,
      localScale: new vec3(1, 1, 1),
      localPosition: new vec3(0, 0, 0)
    },
    hovered: {
      baseGradient: PrimaryGradients.hoverBackground,
      borderGradient: PrimaryGradients.hoverBorder,
      localScale: new vec3(1, 1, 1),
      localPosition: new vec3(0, 0, 0)
    },
    triggered: {
      baseGradient: PrimaryGradients.pressedBackground,
      borderGradient: PrimaryGradients.pressedBorder,
      localScale: new vec3(1, 1, 1),
      localPosition: new vec3(0, 0, 0)
    },
    toggledDefault: {
      baseGradient: PrimaryGradients.selectedBackground,
      borderGradient: PrimaryGradients.selectedBorder,
      localScale: new vec3(1, 1, 1),
      localPosition: new vec3(0, 0, 0)
    },
    toggledHovered: {
      baseGradient: PrimaryGradients.hoverBackground,
      borderGradient: PrimaryGradients.hoverBorder,
      localScale: new vec3(1, 1, 1),
      localPosition: new vec3(0, 0, 0)
    },
    toggledTriggered: {
      baseGradient: PrimaryGradients.pressedBackground,
      borderGradient: PrimaryGradients.pressedBorder,
      localScale: new vec3(1, 1, 1),
      localPosition: new vec3(0, 0, 0)
    },
    inactive: {
      baseGradient: PrimaryGradients.inactiveBackground,
      borderGradient: PrimaryGradients.inactiveBorder,
      localScale: new vec3(1, 1, 1),
      localPosition: new vec3(0, 0, 0)
    }
  },
  Secondary: {
    default: {
      baseType: "Color",
      baseColor: Transparent,
      borderSize: 0.175,
      borderSoftness: 0.07,
      hasBorder: true,
      borderType: "Gradient",
      borderGradient: SecondaryGradients.idleBorder,
      shouldScale: false,
      shouldPosition: true,
      localScale: new vec3(1, 1, 1),
      localPosition: new vec3(0, 0, 0)
    },
    hovered: {
      borderSize: 0.2,
      borderGradient: SecondaryGradients.hoverBorder,
      localScale: new vec3(1, 1, 1),
      localPosition: new vec3(0, 0, 0)
    },
    triggered: {
      borderGradient: SecondaryGradients.pressedBorder,
      localScale: new vec3(1, 1, 1),
      localPosition: new vec3(0, 0, 0)
    },
    toggledDefault: {
      borderGradient: SecondaryGradients.selectedBorder,
      localScale: new vec3(1, 1, 1),
      localPosition: new vec3(0, 0, 0)
    },
    toggledHovered: {
      borderSize: 0.2,
      borderGradient: SecondaryGradients.hoverBorder,
      localScale: new vec3(1, 1, 1),
      localPosition: new vec3(0, 0, 0)
    },
    toggledTriggered: {
      borderGradient: SecondaryGradients.pressedBorder,
      localScale: new vec3(1, 1, 1),
      localPosition: new vec3(0, 0, 0)
    },
    inactive: {
      borderGradient: SecondaryGradients.inactiveBorder,
      localScale: new vec3(1, 1, 1),
      localPosition: new vec3(0, 0, 0)
    }
  },
  Ghost: {
    default: {
      baseType: "Gradient",
      baseGradient: GhostGradients.idleBackground,
      hasBorder: true,
      borderSize: 0.1,
      borderType: "Gradient",
      borderGradient: GhostGradients.idleBorder,
      shouldScale: false,
      shouldPosition: true,
      localScale: new vec3(1, 1, 1),
      localPosition: new vec3(0, 0, 0)
    },
    hovered: {
      baseGradient: GhostGradients.hoverBackground,
      borderGradient: GhostGradients.hoverBorder,
      localScale: new vec3(1, 1, 1),
      localPosition: new vec3(0, 0, 0)
    },
    triggered: {
      baseGradient: GhostGradients.pressedBackground,
      borderGradient: GhostGradients.pressedBorder,
      localScale: new vec3(1, 1, 1),
      localPosition: new vec3(0, 0, 0)
    },
    toggledDefault: {
      baseGradient: GhostGradients.selectedBackground,
      borderGradient: GhostGradients.selectedBorder,
      localScale: new vec3(1, 1, 1),
      localPosition: new vec3(0, 0, 0)
    },
    toggledHovered: {
      baseGradient: GhostGradients.hoverBackground,
      borderGradient: GhostGradients.hoverBorder,
      localScale: new vec3(1, 1, 1),
      localPosition: new vec3(0, 0, 0)
    },
    toggledTriggered: {
      baseGradient: GhostGradients.pressedBackground,
      borderGradient: GhostGradients.pressedBorder,
      localScale: new vec3(1, 1, 1),
      localPosition: new vec3(0, 0, 0)
    },
    inactive: {
      baseGradient: GhostGradients.inactiveBackground,
      borderGradient: GhostGradients.inactiveBorder,
      localScale: new vec3(1, 1, 1),
      localPosition: new vec3(0, 0, 0)
    }
  }
}
