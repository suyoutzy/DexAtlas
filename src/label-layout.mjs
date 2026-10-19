const clamp=(v,min,max)=>Math.max(min,Math.min(v,Math.max(min,max)));
const overlaps=(a,b)=>a.left<b.left+b.width+6&&a.left+a.width+6>b.left&&a.top<b.top+b.height+6&&a.top+a.height+6>b.top;

export function createLabelCollisionIndex() {
  const cells=new Map(),size=128;
  function visit(box,callback){for(let x=Math.floor(box.left/size);x<=Math.floor((box.left+box.width+6)/size);x++)for(let y=Math.floor(box.top/size);y<=Math.floor((box.top+box.height+6)/size);y++)if(callback(x+','+y))return true;return false;}
  return {
    add(box){visit(box,key=>{if(!cells.has(key))cells.set(key,[]);cells.get(key).push(box);});},
    collides(box){const checked=new Set();return visit(box,key=>(cells.get(key)||[]).some(other=>{if(checked.has(other))return false;checked.add(other);return overlaps(box,other);}));}
  };
}

export function placeScreenLabel(point,width,height,occupied,viewport,{below=false,collides}={}) {
  const rightMargin=viewport.rightMargin??(viewport.width<800?72:88);
  const maxLeft=viewport.width-width-rightMargin,maxTop=viewport.height-height-30;
  if(maxLeft<8||maxTop<12)return null;
  const preferredTop=below?point.y+17:point.y-height-17;
  const baseLeft=point.x-width/2,candidates=[];
  for(let row=-10;row<=10;row++)for(const column of [0,-1,1]){
    const left=clamp(baseLeft+column*(width+9),8,viewport.width-width-rightMargin);
    const top=preferredTop+row*(height+9);
    if(top<12||top+height>viewport.height-30)continue;
    candidates.push({left,top,width,height,cost:Math.abs(row)*(height+9)+Math.abs(column)*(width+9)*1.6});
  }
  candidates.sort((a,b)=>a.cost-b.cost);
  const free=box=>!(collides?collides(box):occupied.some(other=>overlaps(box,other)));
  const local=candidates.find(free);if(local)return local;
  // Search the full available viewport at rectangle boundaries. A local grid
  // alone misses free bands near the edges on narrow screens.
  const xs=new Set([8,maxLeft,clamp(baseLeft,8,maxLeft)]);
  const ys=new Set([12,maxTop,clamp(preferredTop,12,maxTop)]);
  for(const other of occupied) {
    for(const x of [other.left-width-6,other.left+other.width+6])if(x>=8&&x<=maxLeft)xs.add(x);
    for(const y of [other.top-height-6,other.top+other.height+6])if(y>=12&&y<=maxTop)ys.add(y);
  }
  // Keep the same minimum-cost result without allocating/sorting X*Y boxes.
  let best=null;
  for(const left of xs){
    const horizontal=Math.abs(left-baseLeft)*1.6;if(best&&horizontal>=best.cost)continue;
    for(const top of ys){
      const cost=Math.abs(top-preferredTop)+horizontal;if(best&&cost>=best.cost)continue;
      const box={left,top,width,height,cost};if(free(box))best=box;
    }
  }
  return best;
}
