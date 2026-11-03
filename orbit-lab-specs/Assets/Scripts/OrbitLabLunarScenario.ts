/** Covers Earth-between-Sun-and-Moon alignment and one-step score progression. */
import {Scenario} from 'Leaf.lspkg/Scenarios/scenario/Scenario';
import {expect} from 'Leaf.lspkg/Utils/common/Expect';
import {findSceneObjectByName} from 'Leaf.lspkg/Utils/common/Utils';
import {OrbitLabLeafDriver,main,label} from './OrbitLabLeafDriver';
import {ORBIT_NAMES as N} from './OrbitLabSceneContracts';
@component
export class OrbitLabLunarScenario extends Scenario {
  async run():Promise<void>{
    const d=new OrbitLabLeafDriver();await d.start();await d.solar();await d.tap(N.action);
    expect(main().lesson.stage).toBe('lunar');const completed=main().lesson.completed;
    await d.orbit(180);await d.tap(N.action);
    expect(main().lesson.completed).toBe(completed+1);
    expect(main().lesson.solved).toBe(true);
    expect(findSceneObjectByName(N.lunarShadow).enabled).toBe(true);
    expect(findSceneObjectByName(N.solarShadow).enabled).toBe(false);
    expect(label(N.feedback).includes('Lunar eclipse:')).toBe(true);
  }
}
