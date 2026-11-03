/** Covers tilt miss, restored plane, completion, Replay and Reset. */
import {Scenario} from 'Leaf.lspkg/Scenarios/scenario/Scenario';
import {expect} from 'Leaf.lspkg/Utils/common/Expect';
import {findSceneObjectByName} from 'Leaf.lspkg/Utils/common/Utils';
import {OrbitLabLeafDriver,main,label} from './OrbitLabLeafDriver';
import {ORBIT_NAMES as N} from './OrbitLabSceneContracts';
@component
export class OrbitLabTiltReplayScenario extends Scenario {
  async run():Promise<void>{
    const d=new OrbitLabLeafDriver();await d.ready();await d.tap(N.reset);
    const initial={angle:main().lesson.angle,count:main().lesson.completed,tilt:main().lesson.tilted};
    await d.tap(N.action);await d.lunar();await d.tap(N.action);
    expect(main().lesson.stage).toBe('tilt');expect(main().lesson.tilted).toBe(true);
    const moon=findSceneObjectByName(N.moon),tiltedY=moon.getTransform().getLocalPosition().y;
    expect(tiltedY).toBeGreaterThan(1);
    const completed=main().lesson.completed;await d.tap(N.action);
    expect(main().lesson.completed).toBe(completed);expect(main().lesson.solved).toBe(false);
    expect(label(N.feedback).includes('Turn tilt OFF')).toBe(true);
    await d.tap(N.tilt);
    expect(main().lesson.tilted).toBe(false);
    expect(moon.getTransform().getLocalPosition().y).toBeCloseTo(0,3);
    await d.tap(N.action);expect(main().lesson.completed).toBe(completed+1);
    await d.tap(N.action);expect(main().lesson.stage).toBe('complete');
    await d.tap(N.action);expect(main().lesson.stage).toBe('welcome');
    expect(main().lesson.angle).toBe(initial.angle);expect(main().lesson.completed).toBe(initial.count);
    expect(main().lesson.tilted).toBe(initial.tilt);expect(moon.enabled).toBe(false);
    await d.tap(N.action);await d.tap(N.plus);await d.tap(N.tilt);await d.tap(N.reset);
    expect(main().lesson.stage).toBe('welcome');expect(main().lesson.angle).toBe(initial.angle);
    expect(main().lesson.tilted).toBe(initial.tilt);expect(main().lesson.completed).toBe(initial.count);
  }
}
