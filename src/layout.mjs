// View coordinates express engineering reading order, never academic taxonomy.
const stages={
  goal:{x:-450,y:0,z:0,step:'01'},
  system:{x:-285,y:0,z:0,step:'02'},
  method:{x:-120,y:0,z:0,step:'03'},
  design:{x:85,y:120,z:0,step:'03.A'},
  demonstration:{x:85,y:0,z:0,step:'03.B'},
  interaction:{x:85,y:-120,z:0,step:'03.C'},
  deployment:{x:290,y:0,z:0,step:'04'},
  evaluation:{x:455,y:0,z:0,step:'05'},
  complete:{x:620,y:0,z:0,step:'06'}
};

export function restoreEngineeringPosition(node) {
  if(node.kind!=='stage'||!node.layoutAnchor)return;
  const {x,y,z}=node.layoutAnchor;
  Object.assign(node,{x,y,z,fx:x,fy:y,fz:z,vx:0,vy:0,vz:0});
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
    node.layoutTarget={x:average('x')+Math.cos(angle)*80,y:average('y')+(index%2?1:-1)*(115+(index%4)*25),z:Math.sin(angle)*90};
    Object.assign(node,node.layoutTarget);
  });
  return data;
}
