// Offline regenerator using the installed ls-clad build-sfx skill.
const fs = require('fs');
const path = require('path');
if(!process.env.CLAD_SKILLS_DIR)throw new Error('Set CLAD_SKILLS_DIR to the installed ls-clad skills directory.');
const audio = require(path.resolve(process.env.CLAD_SKILLS_DIR,'build-sfx/tools'));
const PROJECT_ASSETS_SFX = path.resolve(__dirname,'../GeneratedSFX');
fs.mkdirSync(PROJECT_ASSETS_SFX, {recursive:true});
for (const [name, buffer] of [
  ['OrbitLabClick', audio.sfx_presets.uiClick({character:'soft'})],
  ['OrbitLabSuccess', audio.sfx_presets.uiSuccess()],
  ['OrbitLabRetry', audio.sfx_presets.uiToggle({on:false,pitch:-3})],
]) {
  const out=audio.mix_bus.applyFx(buffer,{hpf:160,lpf:6500,gain:0.75});
  audio.mix_bus.masterChain(out,{normalize:'peak'});
  audio.WavBuilder.write(out,path.join(PROJECT_ASSETS_SFX,name+'.wav'));
}
