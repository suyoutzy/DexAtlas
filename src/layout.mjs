// View coordinates express engineering reading order, never academic taxonomy.
const stages={
  goal:{x:-310,y:0,z:0,step:'01'},
  system:{x:-185,y:-85,z:65,step:'02'},
  method:{x:-75,y:65,z:-70,step:'03'},
  design:{x:75,y:155,z:15,step:'03.A'},
  demonstration:{x:75,y:20,z:15,step:'03.B'},
  interaction:{x:75,y:-115,z:15,step:'03.C'},
  deployment:{x:225,y:55,z:-65,step:'04'},
  evaluation:{x:325,y:-85,z:65,step:'05'},
  complete:{x:445,y:0,z:0,step:'06'}
};

export function restoreEngineeringPosition(node) {
  if(node.kind!=='stage'||!node.layoutAnchor)return;
  const {x,y,z}=node.layoutAnchor;
  Object.assign(node,{x,y,z,fx:x,fy:y,fz:z,vx:0,vy:0,vz:0});
}

export function createEngineeringMotion() {
  const returns=new Map(),duration=650;
  return {
    drag(node){returns.delete(node);},
    release(node,now,reducedMotion=false){
      if(node.kind!=='stage'||!node.layoutAnchor)return;
      returns.delete(node);
      if(reducedMotion){restoreEngineeringPosition(node);return;}
      returns.set(node,{started:now,from:{x:node.x,y:node.y,z:node.z}});
    },
    tick(now,reducedMotion=false){
      for(const [node,{started,from}] of returns){
        const t=Math.max(0,Math.min(1,(now-started)/duration));
        if(t===1||reducedMotion){restoreEngineeringPosition(node);returns.delete(node);continue;}
        // A lightly damped return: no jump on release and a small elastic settle.
        const ease=1-Math.exp(-8*t)*(Math.cos(10*t)+.8*Math.sin(10*t));
        for(const axis of ['x','y','z']){
          node['f'+axis]=node[axis]=from[axis]+(node.layoutAnchor[axis]-from[axis])*ease;
          node['v'+axis]=0;
        }
      }
    }
  };
}

export function applyEngineeringLayout(data) {
  const nodes=new Map(data.nodes.map(n=>[n.id,n]));
  for(const node of data.nodes.filter(n=>n.kind==='stage')) {
    const position=stages[node.stageId];
    if(!position)throw new Error('未设置工程环节的展示位置：'+node.stageId);
    node.layoutAnchor={x:position.x,y:position.y,z:position.z};
    node.step=position.step;node.branch=position.step.includes('.');
    restoreEngineeringPosition(node);
  }
  data.nodes.filter(n=>n.kind==='term').forEach((node,index)=>{
    const uses=data.links.filter(e=>e.kind==='usage'&&e.to===node.id).map(e=>nodes.get(e.from));
    const average=axis=>uses.length?uses.reduce((sum,n)=>sum+n[axis],0)/uses.length:(axis==='x'?85:0);
    const angle=index*2.3999632297;
    node.layoutTarget={x:average('x')+Math.cos(angle)*80,y:average('y')+(index%2?1:-1)*(115+(index%4)*25),z:average('z')+Math.sin(angle)*90};
    Object.assign(node,node.layoutTarget);
  });
  return data;
}
