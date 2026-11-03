/** IK reach/targeting coverage. Fail-fast diagnostics prevent a fallback hiding failure. */
import {Scenario} from 'Leaf.lspkg/Scenarios/scenario/Scenario';
import {expect} from 'Leaf.lspkg/Utils/common/Expect';
import {sleep} from 'Leaf.lspkg/Utils/common/Utils';
import {findInteractableByName} from 'Leaf.lspkg/Interactors/InteractableUtils';
import {createIKInteractor} from 'Leaf.lspkg/Interactors/interactor/ik/visualizer/BitmojiAvatar';
import {DiagnosticRecorder} from 'Leaf.lspkg/Diagnostic/DiagnosticRecorder';
import {OrbitLabLeafDriver,main} from './OrbitLabLeafDriver';
import {ORBIT_NAMES as N} from './OrbitLabSceneContracts';
@component
export class OrbitLabIKScenario extends Scenario {
  async run():Promise<void>{
    const d=new OrbitLabLeafDriver();await d.ready();await d.tap(N.reset);
    DiagnosticRecorder.getInstance().setPolicy('fail-fast');
    const ik=createIKInteractor({avatar:{debugOverlay:false}}),target=findInteractableByName(N.action);
    console.log('[OrbitLab QA] Start uses '+(ik.right.isIndirect(target)?'indirect pinch targeting':'direct reach'));
    await ik.trigger(target);await sleep(500);expect(main().lesson.stage).toBe('solar');
    await ik.trigger(findInteractableByName(N.reset));await sleep(500);
    expect(main().lesson.stage).toBe('welcome');
  }
}
