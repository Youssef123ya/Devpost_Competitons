/** Registers preview-only integration scenarios; excluded from the shipping scene. */
import {scenariosIndex} from 'Leaf.lspkg/Scenarios/decorator/ScenarioIndexDecorator';
import {ScenarioMetadata} from 'Leaf.lspkg/Scenarios/scenario/ScenarioMetadata';
import {OrbitLabStartScenario} from './OrbitLabStartScenario';
import {OrbitLabSolarScenario} from './OrbitLabSolarScenario';
import {OrbitLabLunarScenario} from './OrbitLabLunarScenario';
import {OrbitLabTiltReplayScenario} from './OrbitLabTiltReplayScenario';
import {OrbitLabIKScenario} from './OrbitLabIKScenario';
@component
export class OrbitLabLeafIndex extends BaseScriptComponent {
  @scenariosIndex
  static scenariosIndex:ScenarioMetadata[]=[
    {id:'orbit-start-wrong-answer',typename:OrbitLabStartScenario.getTypeName()},
    {id:'orbit-slider-solar',typename:OrbitLabSolarScenario.getTypeName()},
    {id:'orbit-lunar',typename:OrbitLabLunarScenario.getTypeName()},
    {id:'orbit-tilt-replay-reset',typename:OrbitLabTiltReplayScenario.getTypeName()},
    {id:'orbit-ik-start-reset',typename:OrbitLabIKScenario.getTypeName()},
  ];
}
