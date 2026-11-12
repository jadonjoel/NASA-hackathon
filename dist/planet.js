/* Self-contained WebGL artwork: no textures, libraries, or network dependency. */
(()=>{'use strict';
 const canvas=document.getElementById('planet');
 const gl=canvas.getContext('webgl',{alpha:true,antialias:false,powerPreference:'low-power'});
 if(!gl)return;
 const vertex=`attribute vec2 position;void main(){gl_Position=vec4(position,0.0,1.0);}`;
 const fragment=`precision highp float;
 uniform vec2 resolution;uniform float rotation;uniform float tilt;uniform float world;uniform float scroll;
 float hash(vec3 p){p=fract(p*.3183099+vec3(.1,.2,.3));p*=17.;return fract(p.x*p.y*p.z*(p.x+p.y+p.z));}
 float noise(vec3 x){vec3 i=floor(x),f=fract(x);f=f*f*(3.-2.*f);return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);}
 float fbm(vec3 p){float v=0.;float a=.5;for(int i=0;i<5;i++){v+=noise(p)*a;p=p*2.08+3.7;a*=.5;}return v;}
 mat3 rotY(float a){float c=cos(a),s=sin(a);return mat3(c,0.,s,0.,1.,0.,-s,0.,c);}
 mat3 rotX(float a){float c=cos(a),s=sin(a);return mat3(1.,0.,0.,0.,c,-s,0.,s,c);}
 void main(){
 vec2 uv=(gl_FragCoord.xy-resolution*.5)/resolution.y;
 float aspect=resolution.x/resolution.y;
 vec2 center=vec2((aspect>.9?.19:.055)-scroll*.28,.065-scroll*.16);
 float radius=aspect>.9?.405:.35;
 radius*=1.+scroll*2.4;
 vec2 q=(uv-center)/radius;float r2=dot(q,q);
 float halo=exp(-max(r2-1.,0.)*12.)*.012;
 vec3 background=vec3(.073,.078,.080)+vec3(halo);
 float vign=length(uv*vec2(.65,1.));background*=1.-vign*.3;
 vec2 cell=floor(gl_FragCoord.xy/3.);float star=hash(vec3(cell,43.));
 if(star>.9996)background+=vec3(.08)*pow(max(0.,1.-length(fract(gl_FragCoord.xy/3.)-.5)*2.),2.);
 if(r2>1.){gl_FragColor=vec4(background,1.);return;}
 vec3 n=vec3(q,sqrt(1.-r2));mat3 rot=rotY(rotation+scroll*1.8)*rotX(tilt);vec3 p=rot*n;
 float land=fbm(p*3.2+vec3(13.));float grain=fbm(p*90.);float detail=fbm(p*24.);
 float mare=smoothstep(.33,.63,land);
 float albedo=.27+mare*.36+detail*.19+(grain-.5)*.13;
 float craterShade=0.;float craterAlbedo=0.;
 for(int i=0;i<42;i++){
 float fi=float(i);float y=1.-(fi+.5)/42.*2.;float rr=sqrt(1.-y*y);float angle=fi*2.399963;
 vec3 c=vec3(cos(angle)*rr,y,sin(angle)*rr);
 float size=.035+hash(vec3(fi,13.,8.))*.12;
 float d=length(p-c)/size;
 if(d<1.5){float rim=exp(-pow((d-1.)*10.,2.));float bowl=1.-smoothstep(.25,1.,d);vec3 dir=normalize(p-c+vec3(.0001));float shade=dot(dir,rot*normalize(vec3(-.7,.65,1.)));craterShade+=shade*bowl*.28-rim*.045;craterAlbedo+=rim*.11-bowl*.04;}
 }
 albedo+=craterAlbedo*(1.-world*.45);
 vec3 light=normalize(vec3(-.65,.65,.7));float diffuse=max(0.,dot(n,light)+craterShade*(1.-world*.3));
 diffuse=pow(diffuse,1.1);float earthshine=.022+.022*max(n.z,0.);
 vec3 moon=vec3(albedo*.97,albedo*.99,albedo);
 vec3 mars=mix(vec3(.22,.10,.055),vec3(.73,.39,.22),smoothstep(.18,.75,land))*(.65+detail*.6+grain*.23);
 mars+=craterAlbedo*.4;float ice=smoothstep(.91,.98,abs(p.y));mars=mix(mars,vec3(.75,.72,.66),ice*.7);
 vec3 surface=mix(moon,mars,world);vec3 color=surface*(diffuse*1.28+earthshine);
 float rim=pow(1.-n.z,4.)*max(0.,dot(n,light))*.11;
 color+=mix(vec3(.7,.8,.88),vec3(.7,.32,.13),world)*rim;
 float edge=1.-smoothstep(.995,1.,r2);color=mix(background,color,edge);
 gl_FragColor=vec4(color,1.);
 }`;
 function compile(type,src){const s=gl.createShader(type);gl.shaderSource(s,src);gl.compileShader(s);if(!gl.getShaderParameter(s,gl.COMPILE_STATUS)){console.warn('Globe shader unavailable',gl.getShaderInfoLog(s));return null}return s}
 const vs=compile(gl.VERTEX_SHADER,vertex),fs=compile(gl.FRAGMENT_SHADER,fragment);if(!vs||!fs)return;
 const program=gl.createProgram();gl.attachShader(program,vs);gl.attachShader(program,fs);gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))return;gl.useProgram(program);
 const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);const pos=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(pos);gl.vertexAttribPointer(pos,2,gl.FLOAT,false,0,0);
 const u=Object.fromEntries(['resolution','rotation','tilt','world','scroll'].map(x=>[x,gl.getUniformLocation(program,x)]));
 let angle=.8,dragAngle=0,tilt=.12,targetTilt=.12,world=0,targetWorld=0,drag=false,lastX=0,lastY=0,lastTime=0,visible=true,frame=0,dirty=true;
 function resize(){const b=canvas.getBoundingClientRect();const dpr=Math.min(devicePixelRatio||1,1.25);canvas.width=Math.round(b.width*dpr);canvas.height=Math.round(b.height*dpr);gl.viewport(0,0,canvas.width,canvas.height);dirty=true;wake()}
 function render(time){frame=0;const paused=window.explorerMotion?.paused||false;const delta=Math.min((time-lastTime)/1000,.04)||0;lastTime=time;if(document.hidden||!visible)return;
 if(!paused&&!drag)angle+=delta*.027;
 angle+=(dragAngle)*.12;dragAngle*=.88;tilt+=(targetTilt-tilt)*.06;world+=(targetWorld-world)*(paused?1:.055);
 gl.useProgram(program);gl.uniform2f(u.resolution,canvas.width,canvas.height);gl.uniform1f(u.rotation,angle);gl.uniform1f(u.tilt,tilt);gl.uniform1f(u.world,world);gl.uniform1f(u.scroll,paused?0:(window.explorerCamera||0));gl.drawArrays(gl.TRIANGLES,0,6);dirty=false;
 document.documentElement.classList.add('webgl-ready');
 if(!paused||Math.abs(targetWorld-world)>.001||Math.abs(dragAngle)>.001||dirty)frame=requestAnimationFrame(render);
 }
 function wake(){if(!frame&&visible&&!document.hidden)frame=requestAnimationFrame(render)}
 canvas.addEventListener('pointerdown',e=>{drag=true;lastX=e.clientX;lastY=e.clientY;canvas.classList.add('dragging');canvas.setPointerCapture(e.pointerId)});
 canvas.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();dragAngle+=e.key==='ArrowLeft'?-.18:.18;dirty=true;wake()}});
 canvas.addEventListener('pointermove',e=>{if(drag){dragAngle+=(e.clientX-lastX)*.005;targetTilt=Math.max(-.8,Math.min(.8,targetTilt+(e.clientY-lastY)*.003));lastX=e.clientX;lastY=e.clientY;dirty=true;wake()}else if(!window.explorerMotion?.paused){const r=canvas.getBoundingClientRect();targetTilt=.12+(e.clientY/r.height-.5)*.12}});
 function endDrag(){drag=false;canvas.classList.remove('dragging')};canvas.addEventListener('pointerup',endDrag);canvas.addEventListener('pointercancel',endDrag);canvas.addEventListener('lostpointercapture',endDrag);
 addEventListener('worldchange',e=>{targetWorld=e.detail==='mars'?1:0;dirty=true;wake()});addEventListener('motionchange',()=>{dirty=true;wake()});addEventListener('resize',resize);addEventListener('scroll',()=>{dirty=true;wake()},{passive:true});document.addEventListener('visibilitychange',wake);
 canvas.addEventListener('webglcontextlost',e=>{e.preventDefault();cancelAnimationFrame(frame);document.documentElement.classList.remove('webgl-ready')});
 canvas.addEventListener('webglcontextrestored',()=>location.reload());
 if('IntersectionObserver' in window)new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)wake()},{rootMargin:'100px'}).observe(canvas);
 resize();
})();
