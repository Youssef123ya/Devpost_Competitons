/** Owns the procedural, articulated solar-system illustration. Authored anchors
 * and vertex material are inputs; it renders state supplied by Main, never scores. */
import {OrbitLabGeometry, Color} from './OrbitLabGeometry';

@component
export class OrbitLabModelMesh extends BaseScriptComponent {
  @ui.label('<span style="color:#67E8F9">Orbit Lab — spatial model</span>')
  @ui.separator
  @ui.group_start('References')
  @input @hint('Vertex-color material from SimpleVertexBaseColor package') material!: Material;
  @input @hint('Authored Sun anchor') sun!: SceneObject;
  @input @hint('Authored Earth anchor, center of the Moon orbit') earth!: SceneObject;
  @input @hint('Authored moving Moon anchor') moon!: SceneObject;
  @input @hint('Authored orbit plane, tilted by the lesson') orbit!: SceneObject;
  @input @hint('Authored wireframe Moon shadow anchor') solarShadow!: SceneObject;
  @input @hint('Authored wireframe Earth shadow anchor') lunarShadow!: SceneObject;
  @input @hint('Authored sunlight-ray cue anchor') sunlight!: SceneObject;
  @input @hint('Authored virtual-tabletop stand-in anchor') plinth!: SceneObject;
  @ui.group_end
  @ui.group_start('Settings')
  @input @hint('Moon orbit radius in centimeters') @widget(new SliderWidget(7,12,0.5)) orbitRadius: number=10;
  @input @hint('Earth radius in centimeters') @widget(new SliderWidget(2,4,0.1)) earthRadius: number=3.2;
  @input @hint('Moon radius in centimeters; intentionally exaggerated') @widget(new SliderWidget(0.8,1.8,0.1)) moonRadius: number=1.3;
  @input @hint('Sun radius in centimeters; intentionally exaggerated') @widget(new SliderWidget(3,5,0.1)) sunRadius: number=4.2;
  @input @hint('Slow Sun rotation in degrees per second') @widget(new SliderWidget(0,20,1)) sunSpin: number=5;
  @ui.group_end

  public ready=false;
  public moonPosition=new vec3(0,0,0);
  private sunBase: quat;

  onAwake(): void {
    this.createEvent('OnStartEvent').bind(()=>this.build());
    this.createEvent('UpdateEvent').bind(()=>{
      if(this.ready) this.sun.getTransform().setLocalRotation(this.sunBase.multiply(quat.angleAxis(getTime()*this.sunSpin*Math.PI/180,vec3.up())));
    });
  }

  private build(): void {
    if(!this.material||!this.sun||!this.earth||!this.moon||!this.orbit||!this.solarShadow||!this.lunarShadow||!this.sunlight||!this.plinth) {
      console.error('[OrbitLabModelMesh] Missing authored input; finish scene wiring.'); return;
    }
    this.sunBase=this.sun.getTransform().getLocalRotation();
    new OrbitLabGeometry().sphere(this.sunRadius,n=>{
      const band=0.84+0.16*Math.sin(n[1]*18+n[0]*6);
      return [1,0.52+0.30*band,0.12+0.14*band,1];
    }).attach(this.sun,this.material);
    new OrbitLabGeometry().sphere(this.earthRadius,n=>{
      // Abstract continent-like markings, deliberately not a geographic map.
      const land=Math.sin(n[0]*7+n[2]*4)+Math.cos(n[1]*9-n[2]*6)>0.65;
      const ice=Math.abs(n[1])>0.88;
      const base=ice?[0.88,0.98,1]:land?[0.28,0.90,0.61]:[0.10,0.51,0.91];
      const light=0.35+0.65*Math.max(0,-n[0]);
      return [base[0]*light,base[1]*light,base[2]*light,1];
    }).attach(this.earth,this.material);
    new OrbitLabGeometry().sphere(this.moonRadius,n=>{
      const crater=Math.sin(n[0]*23)*Math.cos(n[1]*19)*Math.sin(n[2]*17);
      const light=(0.48+0.4*Math.max(0,-n[0]))*(0.9+0.1*crater);
      return [light,light*0.97,light*0.88,1];
    },20,32).attach(this.moon,this.material);
    new OrbitLabGeometry().ring(this.orbitRadius,0.085,[0.28,0.88,0.98,1]).attach(this.orbit,this.material);
    const rays=new OrbitLabGeometry();
    for(const z of [-2,0,2]) {
      rays.tube([[0,0,z],[9,0,z]],0.055,[1,0.81,0.32,1]);
      rays.tube([[8.3,0,z-0.3],[9,0,z],[8.3,0,z+0.3]],0.07,[1,0.81,0.32,1]);
    }
    rays.attach(this.sunlight,this.material);
    this.shadow(this.solarShadow,this.moonRadius,15,[0.78,0.56,1,1]);
    this.shadow(this.lunarShadow,this.earthRadius,16,[0.78,0.56,1,1]);
    // Parametric rim + supports: clearly a virtual stand-in, not detected furniture.
    const table=new OrbitLabGeometry();
    const corners:[[number,number,number],[number,number,number],[number,number,number],[number,number,number]]=[[-24,0,-9],[24,0,-9],[24,0,9],[-24,0,9]];
    table.tube([...corners,corners[0]],0.18,[0.36,0.71,0.78,1]);
    for(const x of [-21,21]) table.tube([[x,0,-7],[x,-3,-7]],0.14,[0.36,0.71,0.78,1]);
    table.attach(this.plinth,this.material);
    this.ready=true;
    this.setPose(90,0,false);
    console.log('[OrbitLab] Procedural model ready. Illustration — not to scale.');
  }

  private shadow(root: SceneObject,r: number,length: number,color: Color): void {
    const g=new OrbitLabGeometry();
    g.ring(r,0.045,color,'x',0).ring(0.2,0.045,color,'x',length);
    for(let k=0;k<6;k++) {
      const a=k*Math.PI/3;
      g.tube([[0,r*Math.cos(a),r*Math.sin(a)],[length,0.2*Math.cos(a),0.2*Math.sin(a)]],0.035,color);
    }
    g.attach(root,this.material);
  }

  /** Orbital plane rotates about Z, so new/full Moon moves above/below Sun-Earth. */
  setPose(angleDegrees: number,tiltDegrees: number,lunar: boolean): void {
    if(!this.ready) return;
    const a=angleDegrees*Math.PI/180,i=tiltDegrees*Math.PI/180,r=this.orbitRadius;
    const center=this.earth.getTransform().getLocalPosition();
    this.moonPosition=new vec3(center.x-r*Math.cos(a)*Math.cos(i),center.y+r*Math.cos(a)*Math.sin(i),center.z+r*Math.sin(a));
    this.moon.getTransform().setLocalPosition(this.moonPosition);
    this.orbit.getTransform().setLocalRotation(quat.angleAxis(-i,vec3.forward()));
    this.solarShadow.getTransform().setLocalPosition(this.moonPosition);
    const sunPos=this.sun.getTransform().getLocalPosition();
    const dir=this.moonPosition.sub(sunPos).normalize();
    this.solarShadow.getTransform().setLocalRotation(quat.rotationFromTo(vec3.right(),dir));
    this.solarShadow.enabled=!lunar;
    this.lunarShadow.enabled=lunar;
  }

  setVisible(visible: boolean): void {
    for(const root of [this.sun,this.earth,this.moon,this.orbit,this.sunlight,this.plinth]) root.enabled=visible;
    if(!visible) {this.solarShadow.enabled=false;this.lunarShadow.enabled=false;}
  }
}
