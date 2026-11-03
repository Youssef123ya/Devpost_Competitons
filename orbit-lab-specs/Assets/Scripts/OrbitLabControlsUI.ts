/** Passive UIKit controls. Emits intent; owns only programmatic-update guards. */
import Event from 'SpectaclesInteractionKit.lspkg/Utils/Event';
import {Slider} from 'SpectaclesUIKit.lspkg/Scripts/Components/Slider/Slider';
import {panel,text,flex,child,button,Face} from './OrbitLabLayoutUI';

const PLAY=requireAsset('../Icons/play_arrow.png') as Texture;
const CHECK=requireAsset('../Icons/check.png') as Texture;
const NEXT=requireAsset('../Icons/arrow_forward.png') as Texture;
const REPLAY=requireAsset('../Icons/replay.png') as Texture;

@component
export class OrbitLabControlsUI extends BaseScriptComponent {
  @ui.label('<span style="color:#67E8F9">Orbit Lab — controls</span>')
  @ui.separator
  @ui.group_start('Settings')
  @input @hint('Control card width in centimeters') @widget(new SliderWidget(40,49,1)) width:number=46;
  @input @hint('Control card height in centimeters') @widget(new SliderWidget(21,27,1)) height:number=23;
  @input @hint('Orbit change per precision-button press') @widget(new SliderWidget(5,30,5)) stepDegrees:number=15;
  @input @hint('Reject duplicate release events while a short press animation settles') @widget(new SliderWidget(0.25,0.5,0.05)) buttonCooldownSeconds:number=0.35;
  @ui.group_end
  public readonly onAction=new Event<void>();public readonly onReset=new Event<void>();
  public readonly onOrbitChange=new Event<number>();public readonly onOrbitStep=new Event<number>();
  public readonly onTiltToggle=new Event<void>();
  public ready=false;
  private readout:Text;private tiltText:Text;private slider:Slider;private tilt:Face;
  private minus:Face;private plus:Face;private primary:Face;private syncing=false;

  onAwake():void {this.createEvent('OnStartEvent').bind(()=>this.build());}
  private build():void {
    const w=this.width-4,col=panel(this.sceneObject,this.width,this.height);
    this.readout=text(col,'OrbitLabOrbitReadout','Moon orbit 90°',w,1.5,'Subheadline',1.15);
    child(col,'OrbitRow',w,6,host=>{
      const row=flex(host,'OrbitFlex',w,6,true,1);
      this.minus=button(row,'OrbitLabMinus','−'+this.stepDegrees+'°',undefined,7,6,()=>this.onOrbitStep.invoke(-this.stepDegrees),this.buttonCooldownSeconds);
      child(row,'OrbitLabOrbitSlider',w-16,6,so=>{
        this.slider=so.createComponent(Slider.getTypeName()) as Slider;
        this.slider.size=new vec3(w-16,6,1);this.slider.currentValue=0.25;
        this.slider.onValueChange.add(v=>{if(!this.syncing)this.onOrbitChange.invoke(v*360);});
      });
      this.plus=button(row,'OrbitLabPlus','+'+this.stepDegrees+'°',undefined,7,6,()=>this.onOrbitStep.invoke(this.stepDegrees),this.buttonCooldownSeconds);
    });
    child(col,'TiltRow',w,6,host=>{
      const row=flex(host,'TiltFlex',w,6,true,1.5);
      this.tiltText=text(row,'OrbitLabTiltLabel','Tilted orbit: OFF',w-14,3,'Body',1.15);
      this.tilt=button(row,'OrbitLabTilt','Tilt orbit',undefined,12.5,6,()=>this.onTiltToggle.invoke(),this.buttonCooldownSeconds);
    });
    child(col,'ActionRow',w,6,host=>{
      const row=flex(host,'ActionFlex',w,6,true,1.5);
      this.primary=button(row,'OrbitLabAction','Start',PLAY,w-14,6,()=>this.onAction.invoke(),this.buttonCooldownSeconds);
      button(row,'OrbitLabReset','Reset',REPLAY,12.5,6,()=>this.onReset.invoke(),this.buttonCooldownSeconds);
    });
    this.ready=true;
    console.log('[OrbitLab] UIKit controls ready. Slider or ±15° steps; tilt action.');
  }
  setControls(angle:number,tilted:boolean,interactive:boolean,orbitLocked=false,tiltDegrees=18):void {
    if(!this.ready)return;this.syncing=true;
    this.readout.text='Moon orbit '+Math.round(angle)+'°';
    this.tiltText.text='Tilted orbit: '+(tilted?'ON ('+tiltDegrees+'°)':'OFF');
    if(Math.abs(this.slider.currentValue-angle/360)>0.001)this.slider.currentValue=angle/360;
    this.tilt.content.text=tilted?'Flatten orbit':'Tilt orbit';
    this.slider.inactive=!interactive||orbitLocked;this.minus.button.inactive=!interactive||orbitLocked;this.plus.button.inactive=!interactive||orbitLocked;
    this.tilt.button.inactive=!interactive;this.syncing=false;
  }
  setAction(label:string,kind:'play'|'check'|'next'|'replay'):void {
    if(!this.ready)return;this.primary.content.text=label;
    this.primary.content.leadingIcon={play:PLAY,check:CHECK,next:NEXT,replay:REPLAY}[kind];
  }
}
