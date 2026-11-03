/** Single lesson-state owner. Pure educational puzzle logic; no scene/UI access.
 * Angle 0 = Moon between Sun and Earth. Angle 180 = Moon beyond Earth. */
export type Stage='welcome'|'solar'|'lunar'|'tilt'|'complete';
export class OrbitLabState {
  stage:Stage='welcome';angle=90;tilted=false;solved=false;completed=0;
  feedback='Pinch Start. Move around the model to inspect the alignment.';
  constructor(public angleTolerance=10,public tiltDegrees=18){}
  get active():boolean{return this.stage!=='welcome'&&this.stage!=='complete';}
  get tilt():number{return this.tilted?this.tiltDegrees:0;}
  get solar():boolean{return Math.min(this.angle,360-this.angle)<=this.angleTolerance&&!this.tilted;}
  get lunar():boolean{return Math.abs(this.angle-180)<=this.angleTolerance&&!this.tilted;}
  get title():string {
    return {welcome:'Orbit Lab',solar:'Make a solar eclipse',lunar:'Make a lunar eclipse',tilt:'Why not every month?',complete:'Orbit complete'}[this.stage];
  }
  get instruction():string {
    return {
      welcome:'Place the Moon. Follow its shadow.\nDiscover what makes an eclipse.',
      solar:'Put the Moon BETWEEN Sun and Earth.\nUse the slider or the ±15° buttons.',
      lunar:'Put Earth BETWEEN Sun and Moon.\nMove the Moon to the far side of Earth.',
      tilt:'The Moon is at new moon, but the plane is tilted.\nTurn tilt OFF so the shadow reaches Earth.',
      complete:'Eclipses need the right order AND the right plane.\nA tilted orbit usually carries the shadow past Earth.'
    }[this.stage];
  }
  get progress():string {
    return {welcome:'ECLIPSE EXPLORER',solar:'1 / 3  ·  SOLAR',lunar:'2 / 3  ·  LUNAR',tilt:'3 / 3  ·  ORBIT TILT',complete:'3 / 3  ·  ALL CHALLENGES COMPLETE'}[this.stage];
  }
  get action():string{return this.stage==='welcome'?'Start':this.stage==='complete'?'Replay':this.solved?'Next':'Check alignment';}
  reset():void {
    this.stage='welcome';this.angle=90;this.tilted=false;this.solved=false;this.completed=0;
    this.feedback='Pinch Start. Move around the model to inspect the alignment.';
  }
  setAngle(angle:number):void {
    if(!this.active||this.solved||this.stage==='tilt')return;
    this.angle=((angle%360)+360)%360;this.poseFeedback();
  }
  setTilt(tilted:boolean):void {
    if(!this.active||this.solved)return;this.tilted=tilted;this.poseFeedback();
  }
  private poseFeedback():void {
    this.feedback=this.tilted?'The tilted plane sends the shadow above/below the target.':
      (this.stage==='lunar'?this.lunar:this.solar)?'The bodies line up. Check your alignment.':'Follow the violet shadow outline. Does it reach the target?';
  }
  /** Returns the sound cue associated with a user action. */
  act():'click'|'success'|'retry' {
    if(this.stage==='welcome') {this.stage='solar';this.feedback='Sunlight travels from the amber Sun toward Earth.';return 'click';}
    if(this.stage==='complete'){this.reset();return 'click';}
    if(this.solved) {
      this.solved=false;
      if(this.stage==='solar'){this.stage='lunar';this.angle=90;this.tilted=false;this.feedback='Find the opposite alignment. Earth must cast its shadow on the Moon.';}
      else if(this.stage==='lunar'){this.stage='tilt';this.angle=0;this.tilted=true;this.feedback='Same order, different plane: this shadow misses. The tilt is exaggerated.';}
      else {this.stage='complete';this.feedback='You aligned the order and the plane. Replay to explore again.';}
      return 'click';
    }
    const correct=this.stage==='lunar'?this.lunar:this.solar;
    if(!correct) {
      this.feedback=this.tilted?'Right order is not enough. Turn tilt OFF to bring the Moon into the plane.':
        this.stage==='lunar'?'Move the Moon to 180°: Earth must lie between Sun and Moon.':'Move the Moon toward 0°: it must lie between Sun and Earth.';
      return 'retry';
    }
    this.solved=true;this.completed++;
    this.feedback=this.stage==='solar'?'Solar eclipse: the Moon blocks sunlight and its shadow reaches Earth.':
      this.stage==='lunar'?'Lunar eclipse: Earth blocks sunlight and the Moon enters Earth’s shadow.':
      'Aligned again! Real eclipses occur near orbital nodes. The real tilt is about 5°.';
    return 'success';
  }
}
