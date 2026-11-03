/** MeshBuilder geometry only. Centimeter units, CCW triangles, baked vertex colors.
 * No scene placement or lesson state lives here. */
export type Color = [number, number, number, number];
export type Point = [number, number, number];

export class OrbitLabGeometry {
  private vertices: number[] = [];
  private indices: number[] = [];

  private vertex(p: Point, n: Point, c: Color): number {
    const index = this.vertices.length / 10;
    this.vertices.push(...p, ...n, ...c);
    return index;
  }

  sphere(radius: number, paint: (n: Point) => Color, lat = 24, lon = 48): this {
    const start = this.vertices.length / 10;
    for (let j = 0; j <= lat; j++) {
      const a = j * Math.PI / lat;
      for (let k = 0; k <= lon; k++) {
        const b = k * Math.PI * 2 / lon;
        const n: Point = [Math.sin(a) * Math.cos(b), Math.cos(a), Math.sin(a) * Math.sin(b)];
        this.vertex([radius*n[0], radius*n[1], radius*n[2]], n, paint(n));
      }
    }
    for (let j = 0; j < lat; j++) for (let k = 0; k < lon; k++) {
      const a = start + j*(lon+1)+k, b = a+lon+1;
      this.indices.push(a, a+1, b, a+1, b+1, b);
    }
    return this;
  }

  /** Tube along a sampled centerline. The stable tangent frame also closes rings. */
  tube(points: Point[], radius: number, color: Color, sides = 6): this {
    const start = this.vertices.length / 10;
    for (let i = 0; i < points.length; i++) {
      const a = points[Math.max(0, i-1)], b = points[Math.min(points.length-1, i+1)];
      let tx=b[0]-a[0], ty=b[1]-a[1], tz=b[2]-a[2];
      const len=Math.sqrt(tx*tx+ty*ty+tz*tz)||1; tx/=len; ty/=len; tz/=len;
      const helper: Point = Math.abs(ty)<0.9 ? [0,1,0] : [1,0,0];
      let ux=ty*helper[2]-tz*helper[1], uy=tz*helper[0]-tx*helper[2], uz=tx*helper[1]-ty*helper[0];
      const ul=Math.sqrt(ux*ux+uy*uy+uz*uz)||1; ux/=ul; uy/=ul; uz/=ul;
      const vx=ty*uz-tz*uy, vy=tz*ux-tx*uz, vz=tx*uy-ty*ux;
      for(let k=0;k<=sides;k++) {
        const a=k*Math.PI*2/sides,c=Math.cos(a),s=Math.sin(a);
        const n:Point=[ux*c+vx*s,uy*c+vy*s,uz*c+vz*s], p=points[i];
        this.vertex([p[0]+n[0]*radius,p[1]+n[1]*radius,p[2]+n[2]*radius],n,color);
      }
    }
    for(let i=0;i<points.length-1;i++) for(let k=0;k<sides;k++) {
      const a=start+i*(sides+1)+k,b=a+sides+1;
      this.indices.push(a,a+1,b,a+1,b+1,b);
    }
    return this;
  }

  ring(radius: number, tubeRadius: number, color: Color, axis: 'y'|'x' = 'y', x = 0): this {
    const pts: Point[]=[];
    for(let k=0;k<=96;k++) {
      const a=k*Math.PI*2/96;
      pts.push(axis==='y' ? [Math.cos(a)*radius,0,Math.sin(a)*radius] : [x,Math.cos(a)*radius,Math.sin(a)*radius]);
    }
    return this.tube(pts,tubeRadius,color);
  }

  attach(root: SceneObject, material: Material): RenderMeshVisual {
    const builder=new MeshBuilder([{name:'position',components:3},{name:'normal',components:3,normalized:true},{name:'color',components:4}]);
    builder.topology=MeshTopology.Triangles; builder.indexType=MeshIndexType.UInt16;
    builder.appendVerticesInterleaved(this.vertices); builder.appendIndices(this.indices);
    const rmv=root.createComponent('Component.RenderMeshVisual') as RenderMeshVisual;
    rmv.mesh=builder.getMesh(); rmv.mainMaterial=material; builder.updateMesh();
    return rmv;
  }
}
