/** Passive lesson card. Main supplies every challenge and feedback string. */
import {panel,text} from './OrbitLabLayoutUI';

@component
export class OrbitLabInstructionUI extends BaseScriptComponent {
  @ui.label('<span style="color:#67E8F9">Orbit Lab — lesson card</span>')
  @ui.separator
  @ui.group_start('Settings')
  @input @hint('Card width in centimeters') @widget(new SliderWidget(40,49,1)) width:number=46;
  @input @hint('Card height in centimeters') @widget(new SliderWidget(13,19,1)) height:number=15;
  @input @hint('Shared title and body scale') @widget(new SliderWidget(1,1.5,0.05)) textScale:number=1.15;
  @input('vec4','{0.40,0.92,1,1}') @hint('Progress and title accent') @widget(new ColorWidget()) accent:vec4;
  @ui.group_end
  public ready=false;
  private title:Text;private instruction:Text;private feedback:Text;private progress:Text;

  onAwake():void {this.createEvent('OnStartEvent').bind(()=>this.build());}
  private build():void {
    const col=panel(this.sceneObject,this.width,this.height),w=this.width-4;
    this.progress=text(col,'OrbitLabProgress','ECLIPSE EXPLORER',w,1.3,'Caption',this.textScale);
    this.progress.textFill.color=this.accent;
    this.title=text(col,'OrbitLabTitle','Orbit Lab',w,2.4,'HeadlineXL',this.textScale);
    this.title.textFill.color=new vec4(1,0.92,0.70,1);
    this.instruction=text(col,'OrbitLabInstruction','Move the Moon. Find the shadow.',w,3.2,'Body',this.textScale);
    this.feedback=text(col,'OrbitLabFeedback','Pinch Start to begin.',w,2.5,'Body',this.textScale);
    text(col,'OrbitLabDisclaimer','Illustration — not to scale · Virtual tabletop',w,1.2,'Caption');
    this.ready=true;
  }
  setView(title:string,instruction:string,feedback:string,progress:string,success:boolean):void {
    if(!this.ready)return;
    this.title.text=title;this.instruction.text=instruction;this.feedback.text=feedback;this.progress.text=progress;
    this.feedback.textFill.color=success?new vec4(0.58,1,0.69,1):new vec4(1,0.96,0.86,1);
  }
}
