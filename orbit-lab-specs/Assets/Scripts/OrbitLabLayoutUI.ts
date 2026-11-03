/** Shared passive UIKit composition. No lesson decisions or authored placement. */
import {FlexLayout} from 'SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexLayout';
import {FlexItem} from 'SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexItem';
import {FlexAlign,FlexDirection,FlexJustify} from 'SpectaclesUIKit.lspkg/Scripts/Components/Layout2D/Flex/FlexTypes';
import {BackPlate} from 'SpectaclesUIKit.lspkg/Scripts/BackPlate';
import {Button} from 'SpectaclesUIKit.lspkg/Scripts/Components/Button/Button';
import {ElementContent} from 'SpectaclesUIKit.lspkg/Scripts/Components/Content/ElementContent';

const FONT=requireAsset('../Fonts/Inter.ttf') as Font;
const TYPE_SCALE={Title1:{size:105,weight:700},Title2:{size:93,weight:700},HeadlineXL:{size:62,weight:700},Headline1:{size:54,weight:700},Headline2:{size:48,weight:700},Subheadline:{size:41,weight:700},Button:{size:39,weight:500},Callout:{size:39,weight:700},Body:{size:39,weight:500},Caption:{size:38,weight:500}};
type Role=keyof typeof TYPE_SCALE;
const FONT_SIZE_SCALE=1;
export function applyTextRole(t:Text,role:Role,scale=1):void {
  t.size=TYPE_SCALE[role].size*FONT_SIZE_SCALE*scale;
  (t as Text & {weight?:number}).weight=TYPE_SCALE[role].weight;
}
export function obj(parent:SceneObject,name:string,z=0):SceneObject {
  const so=global.scene.createSceneObject(name);so.setParent(parent);
  so.getTransform().setLocalPosition(new vec3(0,0,z));return so;
}
export function flex(parent:SceneObject,name:string,w:number,h:number,row=false,gap=0.4):SceneObject {
  const so=obj(parent,name,0.02),f=so.createComponent(FlexLayout.getTypeName()) as FlexLayout;
  f.autoDiscoverItemsOnStart=false;
  f.onInitialized.add(()=>{
    f.width=w;f.height=h;f.direction=row?FlexDirection.Row:FlexDirection.Column;
    f.justifyContent=FlexJustify.Center;f.alignItems=FlexAlign.Center;
    if(row)f.columnGap=gap;else f.rowGap=gap;
  });return so;
}
export function child(parent:SceneObject,name:string,w:number,h:number,build:(so:SceneObject)=>void):SceneObject {
  const so=obj(parent,name,0.02),i=so.createComponent(FlexItem.getTypeName()) as FlexItem;
  i.overrideWidth=w;i.overrideHeight=h;i.flexShrink=0;i.flexGrow=0;
  build(so);
  const layout=parent.getComponent(FlexLayout.getTypeName()) as FlexLayout;
  if(layout)layout.addItems([i]);return so;
}
export function panel(root:SceneObject,w:number,h:number):SceneObject {
  root.createComponent('Component.Canvas');
  const backing=root.createComponent(BackPlate.getTypeName()) as BackPlate;
  backing.size=new vec2(w,h);backing.style='simple';
  return flex(obj(root,'Content',0.6),'Column',w-3,h-2,false,0.35);
}
export function text(parent:SceneObject,name:string,value:string,w:number,h:number,role:Role,scale=1):Text {
  let result:Text;
  child(parent,name,w,h,so=>{
    const t=so.createComponent('Component.Text') as Text;t.font=FONT;t.text=value;t.depthTest=true;
    t.horizontalAlignment=HorizontalAlignment.Center;t.verticalAlignment=VerticalAlignment.Center;
    t.horizontalOverflow=HorizontalOverflow.Wrap;t.verticalOverflow=VerticalOverflow.Overflow;
    t.layoutRect=Rect.create(-w/2,w/2,-h/2,h/2);applyTextRole(t,role,scale);result=t;
  });return result!;
}
export type Face={button:Button;content:ElementContent;root:SceneObject};
export function button(parent:SceneObject,name:string,label:string,icon:Texture|undefined,w:number,h:number,action:()=>void,cooldownSeconds=0.35):Face {
  let b:Button,e:ElementContent;
  const root=child(parent,name,w,h,so=>{
    b=so.createComponent(Button.getTypeName()) as Button;
    b.onInitialized.add(()=>{b.size=new vec3(w,h,1);});
    const face=obj(so,'Face',0.08);
    e=face.createComponent(ElementContent.getTypeName()) as ElementContent;
    e.text=label;e.textSize=TYPE_SCALE.Button.size;e.contentAlignment='center';
    e.sizeOverride=new vec2(w-1,h-0.5);e.spacing=0.6;if(icon)e.leadingIcon=icon;
    // UIKit can emit a second release while a short pinch's press animation settles.
    // One action per visual press prevents accidental double steps/advances.
    let lastAction=-Infinity;
    b.onTriggerUp.add(()=>{const now=getTime();if(now-lastAction<cooldownSeconds)return;lastAction=now;action();});
  });return {button:b!,content:e!,root};
}
