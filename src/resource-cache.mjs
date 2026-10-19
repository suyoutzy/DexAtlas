export function createResourceCache({create,dispose,maxHidden=64,maxBytes=8*1024*1024}) {
 const entries=new Map();let clock=0,disposed=false,active=new Set();
 function remove(key){const entry=entries.get(key);if(!entry)return;entries.delete(key);dispose(entry.resource);}
 return {
  get(key){if(disposed)return null;let entry=entries.get(key);if(!entry){entry={resource:create(key)};entries.set(key,entry);}entry.touched=++clock;return entry.resource;},
  retain(ids){
   if(disposed)return;active=new Set(ids);
   const hidden=[...entries].filter(([key])=>!active.has(key)).sort((a,b)=>a[1].touched-b[1].touched);
   let bytes=hidden.reduce((sum,[,entry])=>sum+entry.resource.bytes,0),count=hidden.length;
   for(const [key,entry] of hidden){if(count<=maxHidden&&bytes<=maxBytes)break;remove(key);count--;bytes-=entry.resource.bytes;}
  },
  values(){return [...entries.values()].map(e=>e.resource);},
  stats(){const hidden=[...entries].filter(([key])=>!active.has(key));return {total:entries.size,hidden:hidden.length,hiddenBytes:hidden.reduce((n,[,e])=>n+e.resource.bytes,0)};},
  clear(){for(const key of [...entries.keys()])remove(key);active.clear();},
  dispose(){if(disposed)return;this.clear();disposed=true;}
 };
}
