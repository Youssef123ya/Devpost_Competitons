/** LEAF interaction helpers. Names and expected behavior were observed in preview.
 * Drives real UIKit/SIK controls; never calls domain setters to solve a challenge. */
import {DefaultLeafInteractor} from 'Leaf.lspkg/Interactors/interactor/DefaultLeafInteractor';
import {findInteractableByName} from 'Leaf.lspkg/Interactors/InteractableUtils';
import {findSceneObjectByName,sleep} from 'Leaf.lspkg/Utils/common/Utils';
import {OrbitLabMain} from './OrbitLabMain';
import {ORBIT_NAMES} from './OrbitLabSceneContracts';

export function main():OrbitLabMain {
  return findSceneObjectByName(ORBIT_NAMES.main).getComponent(OrbitLabMain.getTypeName()) as OrbitLabMain;
}
export function label(name:string):string {
  return (findSceneObjectByName(name).getComponent('Component.Text') as Text).text;
}
export class OrbitLabLeafDriver extends DefaultLeafInteractor {
  async ready():Promise<void>{
    for(let i=0;i<40;i++){if(main()?.ready)return;await sleep(100);}
    throw new Error('Orbit Lab did not become ready in four seconds');
  }
  async tap(name:string):Promise<void>{
    const target=findInteractableByName(name);
    if(!target)throw new Error('Missing enabled control: '+name);
    await this.trigger(target);await sleep(450);
  }
  async start():Promise<void>{await this.ready();await this.tap(ORBIT_NAMES.reset);await this.tap(ORBIT_NAMES.action);}
  async orbit(target:number):Promise<void>{
    for(let i=0;i<25;i++){
      const s=main().lesson,delta=((target-s.angle+540)%360)-180;
      if(Math.abs(delta)<=s.angleTolerance)return;
      await this.tap(delta>0?ORBIT_NAMES.plus:ORBIT_NAMES.minus);
    }
    throw new Error('Orbit steps did not reach '+target+' degrees');
  }
  async solar():Promise<void>{await this.orbit(0);await this.tap(ORBIT_NAMES.action);}
  async lunar():Promise<void>{await this.solar();await this.tap(ORBIT_NAMES.action);await this.orbit(180);await this.tap(ORBIT_NAMES.action);}
}
