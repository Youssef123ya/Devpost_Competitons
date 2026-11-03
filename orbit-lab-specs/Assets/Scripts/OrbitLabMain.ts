/** Coordinates authored model, passive UI, state, and audio. No UI construction.
 * All required component handles are assigned by the saved Phase B bootstrap. */
import {OrbitLabModelMesh} from './OrbitLabModelMesh';
import {OrbitLabInstructionUI} from './OrbitLabInstructionUI';
import {OrbitLabControlsUI} from './OrbitLabControlsUI';
import {OrbitLabAudioController} from './OrbitLabAudioController';
import {OrbitLabState} from './OrbitLabState';

@component
export class OrbitLabMain extends BaseScriptComponent {
  @ui.label('<span style="color:#67E8F9">Orbit Lab — lesson coordinator</span>')
  @ui.separator
  @ui.group_start('References')
  @input @hint('Authored procedural model component') model!:OrbitLabModelMesh;
  @input @hint('Authored passive lesson card') instructionUI!:OrbitLabInstructionUI;
  @input @hint('Authored passive control card') controlsUI!:OrbitLabControlsUI;
  @input @hint('Authored audio controller') audio!:OrbitLabAudioController;
  @ui.group_end
  @ui.group_start('Settings')
  @input @hint('Illustrative alignment tolerance in degrees, not an astronomical prediction') @widget(new SliderWidget(3,15,1)) alignmentTolerance:number=10;
  @input @hint('Exaggerated teaching tilt used by the switch') @widget(new SliderWidget(12,24,1)) teachingTilt:number=18;
  @input @hint('Draw interaction colliders for debugging after preview restart') debugColliders:boolean=false;
  @ui.group_end
  public lesson:OrbitLabState;
  public ready=false;
  private initialized=false;
  onAwake():void {
    this.createEvent('OnStartEvent').bind(()=>this.start());
    this.createEvent('UpdateEvent').bind(()=>{
      if(this.initialized&&!this.ready&&this.model.ready&&this.instructionUI.ready&&this.controlsUI.ready){
        this.ready=true;this.render();this.setColliderDebugAll(this.sceneObject,this.debugColliders);
        console.log('[OrbitLab] Ready: welcome. World-anchored lesson; 3 challenges.');
      }
    });
  }
  private start():void {
    if(!this.model||!this.instructionUI||!this.controlsUI||!this.audio){console.error('[OrbitLab] Required component input is missing. Finish Phase B.');return;}
    this.lesson=new OrbitLabState(this.alignmentTolerance,this.teachingTilt);
    this.controlsUI.onAction.add(()=>{const cue=this.lesson.act();this.audio.play(cue);this.render();console.log('[OrbitLab] '+this.lesson.stage+' solved='+this.lesson.solved+' completed='+this.lesson.completed);});
    this.controlsUI.onReset.add(()=>{this.lesson.reset();this.audio.play('click');this.render();});
    this.controlsUI.onOrbitStep.add(step=>{this.lesson.setAngle(this.lesson.angle+step);this.audio.play('click');this.render();});
    this.controlsUI.onOrbitChange.add(angle=>{this.lesson.setAngle(angle);this.render();});
    this.controlsUI.onTiltToggle.add(()=>{this.lesson.setTilt(!this.lesson.tilted);this.audio.play('click');this.render();});
    this.initialized=true;
  }
  private render():void {
    if(!this.ready)return;const s=this.lesson;
    this.model.setPose(s.angle,s.tilt,s.stage==='lunar');this.model.setVisible(s.stage!=='welcome');
    this.instructionUI.setView(s.title,s.instruction,s.feedback,s.progress,s.solved||s.stage==='complete');
    this.controlsUI.setControls(s.angle,s.tilted,s.active&&!s.solved,s.stage==='tilt',s.tiltDegrees);
    this.controlsUI.setAction(s.action,s.stage==='welcome'?'play':s.stage==='complete'?'replay':s.solved?'next':'check');
  }
  private setColliderDebugAll(obj:SceneObject,enable:boolean):void {
    const c=obj.getComponent('Physics.ColliderComponent') as ColliderComponent;
    if(c)c.debugDrawEnabled=enable;
    const b=obj.getComponent('Physics.BodyComponent') as ColliderComponent;if(b)b.debugDrawEnabled=enable;
    for(let i=0;i<obj.getChildrenCount();i++)this.setColliderDebugAll(obj.getChild(i),enable);
  }
}
