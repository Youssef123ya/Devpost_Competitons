/** Covers slider movement, precision orbit control and solar shadow/explanation. */
import {Scenario} from 'Leaf.lspkg/Scenarios/scenario/Scenario';
import {expect} from 'Leaf.lspkg/Utils/common/Expect';
import {findSceneObjectByName,sleep} from 'Leaf.lspkg/Utils/common/Utils';
import {findInteractableByName} from 'Leaf.lspkg/Interactors/InteractableUtils';
import {OrbitLabLeafDriver,main,label} from './OrbitLabLeafDriver';
import {ORBIT_NAMES as N} from './OrbitLabSceneContracts';
@component
export class OrbitLabSolarScenario extends Scenario {
  async run():Promise<void>{
    const d=new OrbitLabLeafDriver();await d.start();
    const moon=findSceneObjectByName(N.moon),before=moon.getTransform().getWorldPosition();
    const angle=main().lesson.angle;
    await d.drag(findInteractableByName(N.slider),new vec3(0.1,0,0),700);await sleep(500);
    expect(Math.abs(main().lesson.angle-angle)).toBeGreaterThan(1);
    expect(moon.getTransform().getWorldPosition().distance(before)).toBeGreaterThan(0.1);
    const completed=main().lesson.completed;await d.solar();
    expect(main().lesson.completed).toBe(completed+1);
    expect(main().lesson.solved).toBe(true);
    expect(findSceneObjectByName(N.solarShadow).enabled).toBe(true);
    expect(label(N.feedback).includes('Solar eclipse:')).toBe(true);
  }
}
