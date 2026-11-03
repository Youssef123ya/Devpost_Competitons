# Orbit Lab — build notes

## Design authorship and authorization
The participant asked the assistant to choose the project and build a competition entry after reporting that they did not have an idea. The assistant selected Orbit Lab and used the Devpost Learn plan-lens design structure to write `devpost/design-brief.md`. The participant did not supply the design choices in that document; they are explicitly labeled assistant-selected defaults.

## Actual environment history
- Initial editor: Lens Studio 5.24.1; MCP connected to SpecsLens correctly.
- The account login page returned “Something went wrong. Please try again.”
- The organizers' published guidance recommended Lens Studio 5.23.2 and My Lenses login.
- Participant installed 5.23.2. The assistant switched from its temporary default project to SpecsLens with explicit permission.
- At build startup, MCP was reachable and the editor authorization flag reported false. Planning proceeded because the plan-lens skill's setup checks require the project, MCP tools, and CLAD. The CLAD standalone builder explicitly permits building when the scene is reachable through MCP; individual account-bound operations may still fail.
- The builder confirmed Perspective camera, World tracking, and installed SIK/UIKit 2.0; imported four action icons and selected the Interactive Evening Room for SPECS 27 preview.
- TypeScript compilation succeeded for the pre-existing project, but preview startup failed in SIK ConfigurationValidator: “This file cannot be used in a ScriptComponent. Make sure that the file has a class, decorated with @component decorator,” followed by “Component is not yet awake.” Compatibility with the downgraded editor is a hypothesis, not a proven cause.
- The builder stopped on a reported usage limit before implementing the Orbit Lab scripts or repairing that error.
- On the next continuation the Lens Studio MCP namespace had been removed from the active tool inventory. No Lens Studio workaround was attempted; AGENTS.md requires stopping when MCP is unavailable.

## Design rationale
One concrete spatial learning moment: position the Moon, inspect the shadow, and discover why orbit tilt changes eclipse alignment. The design avoids live sensing, external services, and hardware-only inputs so the entire demonstration can be observed in the laptop preview.

## Judging alignment
Live Devpost criteria retrieved for this build: Design, Technical Implementation, Innovation/Idea, and Presentation. Each scores on a 5-point scale; official rules describe equal weighting. The aim is a complete short learning loop rather than an expansive planet viewer.

## Validation
The existing project compiled but did not run successfully. Orbit Lab lesson logic and LEAF scenarios are not implemented. No Orbit Lab acceptance criterion has passed yet. Build and test results must be recorded after actual execution.

## Submission constraints
Live requirements ask for a new SPECS Lens built with CLAD and the Lens Studio MCP, a public repository with project files and planning docs, a public YouTube demonstration under three minutes, and a truthful description. Personal survey responses must come from the participant.
