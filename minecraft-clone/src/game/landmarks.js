// Deterministic, editable voxel architecture. No additional collision system.
export function addLandmarks(terrain, salt) {
  const {heights,mapType,size}=terrain,limit=size/2-1;
  const blocks=new Map(terrain.cubes.map(c=>[c.key,c])),sites=[];
  const put=(x,y,z,texture)=>{if(Math.abs(x)>limit||Math.abs(z)>limit||y<1||y>64)return;const key=[x,y,z].join(',');blocks.set(key,{key,pos:[x,y,z],texture});};
  const targets=[[12,-3],[-29,-26],[27,27],[-48,43],[48,-45],[-70,-65],[70,65],[-130,-120],[130,120],[-140,65],[140,-65],[-60,145],[60,-145],[-160,155],[160,-155]].slice(0,size===100?3:size===150?5:size===200?7:15);
  const names={forest:'숲지기의 오두막',meadow:'들꽃 농가',islands:'바닷바람 쉼터',snow:'눈길 산장'};
  targets.forEach(([tx,tz],index)=>{
    let best=null;
    for(let x=tx-10;x<=tx+10;x+=2)for(let z=tz-10;z<=tz+10;z+=2){
      if(Math.abs(x)>limit-8||Math.abs(z)>limit-10||Math.hypot(x,z-10)<13||sites.some(s=>Math.hypot(s.x-x,s.z-z)<21))continue;
      const hs=[];for(let dx=-4;dx<=4;dx++)for(let dz=-4;dz<=4;dz++)hs.push(heights.get(`${x+dx},${z+dz}`));
      const lo=Math.min(...hs),hi=Math.max(...hs);
      if(hi-lo>5||hi<4||(mapType!=='islands'&&lo<3))continue;
      const score=Math.hypot(x-tx,z-tz)+(hi-lo)*2+((salt+x*13+z*7)>>>0)%7*.1;
      if(!best||score<best.score)best={x,z,floor:hi,score};
    }
    if(!best)return;
    const {x,z,floor:f}=best,type=index%3===0?'cabin':index%3===1?'gazebo':'ruin';
    // Clear branches and provide a solid foundation; original terrain outside this pad stays intact.
    for(let dx=-7;dx<=7;dx++)for(let dz=-7;dz<=7;dz++){
      for(let y=f+1;y<=30;y++)blocks.delete([x+dx,y,z+dz].join(','));
      if(Math.abs(dx)<=4&&Math.abs(dz)<=4){
        for(let y=(heights.get(`${x+dx},${z+dz}`)||1)+1;y<f;y++)put(x+dx,y,z+dz,'stone');
        put(x+dx,f,z+dz,type==='ruin'?'slate':'wood');
      }
    }
    const p=(dx,dy,dz,t)=>put(x+dx,f+dy,z+dz,t);
    if(type==='cabin'){
      const wall=mapType==='meadow'?'plaster':mapType==='snow'?'log':'wood';
      for(let dx=-4;dx<=4;dx++)for(let dz=-3;dz<=3;dz++)for(let dy=1;dy<=3;dy++){
        if(Math.abs(dx)!==4&&Math.abs(dz)!==3)continue;
        if(dz===3&&Math.abs(dx)<=1&&dy<=2)continue;
        const window=dy===2&&((Math.abs(dz)===3&&Math.abs(dx)===2)||(Math.abs(dx)===4&&Math.abs(dz)<=1));
        p(dx,dy,dz,window?'glass':Math.abs(dx)===4&&Math.abs(dz)===3?'log':wall);
      }
      for(let dx=-5;dx<=5;dx++)for(let dz=-4;dz<=4;dz++)p(dx,4+Math.floor((5-Math.abs(dx))/2),dz,mapType==='snow'?'snow':mapType==='meadow'?'roof':'slate');
      // Roof gables close the attic, leaving the doorway and windows unobstructed.
      for(let dx=-4;dx<=4;dx++)for(let dy=4;dy<4+Math.floor((5-Math.abs(dx))/2);dy++)for(const dz of [-3,3])p(dx,dy,dz,wall);
      // Bench, table, cupboard and bedside lantern are all removable blocks.
      for(let dx=-2;dx<=0;dx++)p(dx,1,-1,'wood');
      p(1,1,-1,'log');p(1,2,-1,'wood');p(2,1,-2,'wood');p(2,2,-2,'lantern');
      p(-3,1,-2,'brick');p(-3,2,-2,'leaves');
      p(-3,1,4,'log');p(-3,2,4,'lantern');p(3,1,4,'log');p(3,2,4,'lantern');
    } else if(type==='gazebo'){
      for(const dx of [-3,3])for(const dz of [-3,3])for(let dy=1;dy<=3;dy++)p(dx,dy,dz,'log');
      for(let dx=-4;dx<=4;dx++)for(let dz=-4;dz<=4;dz++)p(dx,4+(Math.max(Math.abs(dx),Math.abs(dz))<3?1:0),dz,'roof');
      for(let dx=-2;dx<=2;dx++){p(dx,1,-2,'wood');p(dx,2,-3,'wood');}
      p(0,1,0,'log');p(0,2,0,'wood');p(0,3,0,'lantern');
      for(const dx of [-4,4]){p(dx,1,3,'brick');p(dx,2,3,'leaves');}
    } else {
      for(const dx of [-3,3])for(const dz of [-3,3])for(let dy=1;dy<=((dx+dz)>0?3:2);dy++)p(dx,dy,dz,'stone');
      for(let dx=-1;dx<=1;dx++)for(let dz=-1;dz<=1;dz++)p(dx,1,dz,dx===0&&dz===0?'lantern':'slate');
      for(let dx=-2;dx<=2;dx++)p(dx,1,-3,'wood');
      p(3,4,3,'leaves');p(-3,3,-3,'leaves');
    }
    // Broad entrance steps climb at most one voxel per step.
    for(let step=1;step<=5;step++)for(let dx=-1;dx<=1;dx++){
      const zz=z+4+step,yy=f-step;if(yy<1||yy<(heights.get(`${x+dx},${zz}`)||0))continue;
      put(x+dx,yy,zz,'stone');for(let y=yy+1;y<=f+4;y++)blocks.delete([x+dx,y,zz].join(','));
    }
    sites.push({id:`site-${index}`,type,x,z,y:f+.5,name:type==='cabin'?names[mapType]:type==='gazebo'?'바람 정자':'이끼 낀 돌터'});
  });
  // A low boardwalk crosses the winding river near the spawn trail.
  const river=terrain.water.filter(([,,z])=>z===10).map(([x])=>x).filter(x=>x<0);
  if(river.length){
    const left=Math.min(...river)-3,right=Math.max(...river)+3;
    for(let x=left;x<=right;x++)for(let z=9;z<=11;z++){
      put(x,4,z,'wood');for(let y=5;y<=9;y++)blocks.delete([x,y,z].join(','));
      if(z!==10&&x%3===0){put(x,5,z,'log');if(x===left||x>=right-2)put(x,6,z,'lantern');}
    }
    for(const x of [left-1,right+1])for(let z=9;z<=11;z++)put(x,3,z,'wood');
    sites.push({id:'bridge',type:'bridge',x:(left+right)/2,z:10,y:4.5,name:'물결 나무다리'});
  }
  return {...terrain,cubes:[...blocks.values()],sites};
}
