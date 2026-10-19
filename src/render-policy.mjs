const profiles={balanced:{maxDpr:1,maxPixels:1920*1080,bloomScale:.5},high:{maxDpr:1.5,maxPixels:2560*1440,bloomScale:1}};
export function resolveRenderPolicy({quality='balanced',width,height,dpr=1}) {
 const profile=profiles[quality]||profiles.balanced;
 width=Math.max(1,width||1);height=Math.max(1,height||1);dpr=Number.isFinite(dpr)&&dpr>0?dpr:1;
 const pixelRatio=Math.min(dpr,profile.maxDpr,Math.sqrt(profile.maxPixels/(width*height)));
 return {pixelRatio,width:Math.floor(width*pixelRatio),height:Math.floor(height*pixelRatio),bloomScale:profile.bloomScale};
}
