/** Covers welcome/Start and the non-advancing wrong-answer guard. */
import {Scenario} from 'Leaf.lspkg/Scenarios/scenario/Scenario';
import {expect} from 'Leaf.lspkg/Utils/common/Expect';
import {findSceneObjectByName} from 'Leaf.lspkg/Utils/common/Utils';
import {OrbitLabLeafDriver,main,label} from './OrbitLabLeafDriver';
import {ORBIT_NAMES as N} from './OrbitLabSceneContracts';
@component
export class OrbitLabStartScenario extends Scenario {
  async run():Promise<void>{
    const d=new OrbitLabLeafDriver();await d.ready();await d.tap(N.reset);
    expect(main().lesson.stage).toBe('welcome');
    expect(findSceneObjectByName(N.moon).enabled).toBe(false);
    await d.tap(N.action);
    expect(main().lesson.stage).toBe('solar');
    expect(findSceneObjectByName(N.moon).enabled).toBe(true);
    const before=main().lesson.completed;
    await d.tap(N.action);
    expect(main().lesson.completed).toBe(before);
    expect(main().lesson.stage).toBe('solar');
    expect(label(N.feedback).includes('0°')).toBe(true);
  }
}
