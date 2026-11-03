/** Owns audio playback only. Generated assets are fixed; volume is Inspector-tunable. */
const CLICK=requireAsset('../GeneratedSFX/OrbitLabClick.wav') as AudioTrackAsset;
const SUCCESS=requireAsset('../GeneratedSFX/OrbitLabSuccess.wav') as AudioTrackAsset;
const RETRY=requireAsset('../GeneratedSFX/OrbitLabRetry.wav') as AudioTrackAsset;
const MUSIC=requireAsset('../GeneratedSFX/OrbitLabBackgroundMusic.wav') as AudioTrackAsset;
@component
export class OrbitLabAudioController extends BaseScriptComponent {
  @ui.label('<span style="color:#67E8F9">Orbit Lab — sound</span>')
  @ui.separator
  @ui.group_start('Settings')
  @input @hint('Immediate interaction-cue volume') @widget(new SliderWidget(0,1,0.05)) sfxVolume:number=0.5;
  @input @hint('Quiet ambient music volume; zero mutes the bed') @widget(new SliderWidget(0,0.5,0.01)) musicVolume:number=0.08;
  @ui.group_end
  private cues:{click:AudioComponent;success:AudioComponent;retry:AudioComponent};
  onAwake():void {
    const music=this.getSceneObject().createComponent('Component.AudioComponent') as AudioComponent;
    music.audioTrack=MUSIC;music.volume=this.musicVolume;music.play(-1);
    this.createEvent('OnStartEvent').bind(()=>{
      music.playbackMode=Audio.PlaybackMode.LowPower;
      this.cues={click:this.make(CLICK),success:this.make(SUCCESS),retry:this.make(RETRY)};
    });
  }
  private make(track:AudioTrackAsset):AudioComponent {
    const a=this.getSceneObject().createComponent('Component.AudioComponent') as AudioComponent;
    a.audioTrack=track;a.volume=this.sfxVolume;a.playbackMode=Audio.PlaybackMode.LowLatency;return a;
  }
  play(cue:'click'|'success'|'retry'):void {if(this.cues){this.cues[cue].stop(false);this.cues[cue].play(1);}}
}
