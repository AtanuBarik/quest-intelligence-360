(() => {
  'use strict';
  if (window.Chart) return;

  const PALETTE = ['#35792a','#034c1f','#c6d52f','#024c6a','#3995bb','#80276c','#c78800','#9a9a9a','#e0044e'];
  const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
  const num = v => Number.isFinite(Number(v)) ? Number(v) : 0;
  const colorAt = (value, i=0, fallback=PALETTE[i%PALETTE.length]) => Array.isArray(value) ? (value[i%value.length] || fallback) : (value || fallback);
  const alpha = (hex,a=.14) => {
    if (!hex || !/^#([0-9a-f]{6})$/i.test(hex)) return `rgba(53,121,42,${a})`;
    const n=parseInt(hex.slice(1),16);return `rgba(${(n>>16)&255},${(n>>8)&255},${n&255},${a})`;
  };
  const niceMax = v => {
    if (v <= 1) return 1;
    const p = 10 ** Math.floor(Math.log10(v));
    const m = v / p;
    return (m <= 1 ? 1 : m <= 2 ? 2 : m <= 5 ? 5 : 10) * p;
  };
  const truncate = (ctx,text,maxWidth) => {
    let s=String(text ?? ''); if (ctx.measureText(s).width<=maxWidth) return s;
    while(s.length>2 && ctx.measureText(s+'…').width>maxWidth) s=s.slice(0,-1);
    return s+'…';
  };

  class ChartLite {
    static defaults = {font:{family:'Arial, Helvetica, sans-serif'},color:'#646464',borderColor:'#e3e6e3',animation:false,devicePixelRatio:1.35};
    static instances = {};
    static _id = 0;

    constructor(target, config={}) {
      this.canvas = typeof target === 'string' ? document.getElementById(target) : target;
      if (!this.canvas || !this.canvas.getContext) throw new Error('Chart target canvas was not found');
      this.ctx = this.canvas.getContext('2d');
      this.config = config;
      this.data = config.data || {labels:[],datasets:[]};
      this.options = config.options || {};
      this.id = String(++ChartLite._id);
      ChartLite.instances[this.id] = this;
      this._resize = () => this.draw();
      window.addEventListener('resize', this._resize, {passive:true});
      if (window.ResizeObserver) {
        this._observer = new ResizeObserver(() => this.draw());
        this._observer.observe(this.canvas.parentElement || this.canvas);
      }
      requestAnimationFrame(() => this.draw());
    }

    update(){ this.draw(); }
    resize(){ this.draw(); }
    destroy(){
      window.removeEventListener('resize', this._resize);
      this._observer?.disconnect();
      delete ChartLite.instances[this.id];
      if (this.ctx) this.ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
    }

    _size(){
      const parent=this.canvas.parentElement || this.canvas;
      const rect=parent.getBoundingClientRect();
      const cssW=Math.max(280, Math.round(rect.width || this.canvas.clientWidth || 600));
      const cssH=Math.max(190, Math.round(rect.height || this.canvas.clientHeight || 280));
      const dpr=clamp(Number(ChartLite.defaults.devicePixelRatio)||window.devicePixelRatio||1,1,1.5);
      if (this.canvas.width!==Math.round(cssW*dpr) || this.canvas.height!==Math.round(cssH*dpr)) {
        this.canvas.width=Math.round(cssW*dpr);this.canvas.height=Math.round(cssH*dpr);
        this.canvas.style.width=cssW+'px';this.canvas.style.height=cssH+'px';
      }
      this.ctx.setTransform(dpr,0,0,dpr,0,0);
      return {w:cssW,h:cssH,dpr};
    }

    _legend(ctx,w,h){
      const legend=this.options?.plugins?.legend || {};
      if (legend.display===false) return {top:8,bottom:8};
      const labels=(this.data?.datasets||[]).map((d,i)=>({label:d.label||`Series ${i+1}`,color:colorAt(d.borderColor || d.backgroundColor,i)}));
      if (!labels.length && this.data?.labels?.length && ['doughnut','pie','polarArea'].includes(this.config.type)) {
        const bg=this.data.datasets?.[0]?.backgroundColor;
        this.data.labels.forEach((l,i)=>labels.push({label:l,color:colorAt(bg,i)}));
      }
      if (!labels.length) return {top:8,bottom:8};
      ctx.save();ctx.font=`600 10px ${ChartLite.defaults.font.family}`;ctx.textBaseline='middle';
      const position=legend.position || 'bottom';let x=14,y=position==='top'?12:h-16;
      labels.forEach(item=>{
        const tw=Math.min(150,ctx.measureText(item.label).width);const need=tw+26;
        if(x+need>w-8){x=14;y+=position==='top'?17:-17;}
        ctx.fillStyle=item.color;ctx.beginPath();ctx.arc(x+4,y,4,0,Math.PI*2);ctx.fill();
        ctx.fillStyle=ChartLite.defaults.color;ctx.fillText(truncate(ctx,item.label,135),x+13,y);x+=need;
      });ctx.restore();
      return position==='top'?{top:Math.max(30,y+14),bottom:8}:{top:8,bottom:Math.max(30,h-y+14)};
    }

    draw(){
      if (!this.canvas.isConnected) return;
      const {w,h}=this._size(),ctx=this.ctx;
      ctx.clearRect(0,0,w,h);
      ctx.fillStyle='rgba(255,255,255,0)';ctx.fillRect(0,0,w,h);
      const leg=this._legend(ctx,w,h);
      const area={x:52,y:leg.top+8,w:w-72,h:h-leg.top-leg.bottom-36};
      if(area.w<80||area.h<60) return;
      try{
        switch(this.config.type){
          case 'doughnut':case 'pie':case 'polarArea': return this._doughnut(ctx,area);
          case 'bubble':case 'scatter': return this._bubble(ctx,area);
          case 'radar': return this._radar(ctx,area);
          case 'bar': return this._bar(ctx,area);
          default: return this._line(ctx,area);
        }
      } catch(error){
        console.warn('ChartLite render fallback:',error);
        ctx.fillStyle='#646464';ctx.font='12px Arial';ctx.fillText('Chart data available',area.x+12,area.y+24);
      }
    }

    _grid(ctx,a,max=100,min=0){
      ctx.save();ctx.strokeStyle=ChartLite.defaults.borderColor;ctx.fillStyle=ChartLite.defaults.color;ctx.font='9px Arial';ctx.lineWidth=1;
      for(let i=0;i<=4;i++){
        const y=a.y+a.h-(a.h*i/4);ctx.beginPath();ctx.moveTo(a.x,y);ctx.lineTo(a.x+a.w,y);ctx.stroke();
        const v=min+(max-min)*i/4;ctx.textAlign='right';ctx.textBaseline='middle';ctx.fillText(Math.round(v),a.x-7,y);
      }
      ctx.restore();
    }

    _labels(ctx,a,labels){
      ctx.save();ctx.fillStyle=ChartLite.defaults.color;ctx.font='9px Arial';ctx.textAlign='center';ctx.textBaseline='top';
      labels.forEach((l,i)=>{const x=a.x+a.w*(i+.5)/labels.length;ctx.fillText(truncate(ctx,l,Math.max(40,a.w/labels.length-6)),x,a.y+a.h+8);});ctx.restore();
    }

    _line(ctx,a){
      const labels=this.data.labels||[];const sets=this.data.datasets||[];
      const vals=sets.flatMap(d=>(d.data||[]).map(num));let min=Number(this.options?.scales?.y?.min);let max=Number(this.options?.scales?.y?.max);
      if(!Number.isFinite(min)) min=Math.min(0,...vals);if(!Number.isFinite(max)) max=niceMax(Math.max(1,...vals));if(max===min)max=min+1;
      this._grid(ctx,a,max,min);this._labels(ctx,a,labels);
      sets.forEach((d,di)=>{
        const data=(d.data||[]).map(num);const col=colorAt(d.borderColor || d.backgroundColor,di);const pts=data.map((v,i)=>({x:a.x+a.w*(labels.length<=1?.5:i/(labels.length-1)),y:a.y+a.h-(v-min)/(max-min)*a.h}));
        if(d.fill&&pts.length){ctx.save();ctx.beginPath();ctx.moveTo(pts[0].x,a.y+a.h);pts.forEach(p=>ctx.lineTo(p.x,p.y));ctx.lineTo(pts[pts.length-1].x,a.y+a.h);ctx.closePath();ctx.fillStyle=colorAt(d.backgroundColor,di,alpha(col,.12));ctx.fill();ctx.restore();}
        ctx.save();ctx.strokeStyle=col;ctx.lineWidth=d.borderWidth||2.3;ctx.lineJoin='round';ctx.lineCap='round';ctx.beginPath();pts.forEach((p,i)=>i?ctx.lineTo(p.x,p.y):ctx.moveTo(p.x,p.y));ctx.stroke();
        pts.forEach(p=>{ctx.fillStyle=colorAt(d.pointBackgroundColor,di,col);ctx.beginPath();ctx.arc(p.x,p.y,d.pointRadius===0?0:(d.pointRadius||2.5),0,Math.PI*2);ctx.fill();});ctx.restore();
      });
    }

    _bar(ctx,a){
      const labels=this.data.labels||[];const sets=this.data.datasets||[];const horizontal=this.options?.indexAxis==='y';const stacked=Boolean(this.options?.scales?.x?.stacked||this.options?.scales?.y?.stacked);
      if(horizontal){
        const vals=sets.flatMap(d=>(d.data||[]).map(num));const max=Number(this.options?.scales?.x?.max)||niceMax(Math.max(1,...vals));
        ctx.save();ctx.font='9px Arial';ctx.textBaseline='middle';
        const row=a.h/Math.max(1,labels.length);const bh=Math.max(5,Math.min(18,row/(sets.length+0.5)));
        labels.forEach((lab,i)=>{
          const y=a.y+row*(i+.5);ctx.fillStyle=ChartLite.defaults.color;ctx.textAlign='right';ctx.fillText(truncate(ctx,lab,120),a.x-7,y);
          sets.forEach((d,di)=>{const v=num(d.data?.[i]);const yy=y+(di-(sets.length-1)/2)*(bh+2);ctx.fillStyle=colorAt(d.backgroundColor,di);ctx.fillRect(a.x,yy-bh/2,a.w*v/max,bh);});
        });ctx.strokeStyle=ChartLite.defaults.borderColor;for(let i=0;i<=4;i++){const x=a.x+a.w*i/4;ctx.beginPath();ctx.moveTo(x,a.y);ctx.lineTo(x,a.y+a.h);ctx.stroke();ctx.textAlign='center';ctx.textBaseline='top';ctx.fillStyle=ChartLite.defaults.color;ctx.fillText(Math.round(max*i/4),x,a.y+a.h+7);}ctx.restore();return;
      }
      let max;
      if(stacked) max=Math.max(...labels.map((_,i)=>sets.reduce((s,d)=>s+num(d.data?.[i]),0)),1); else max=Math.max(...sets.flatMap(d=>(d.data||[]).map(num)),1);
      max=Number(this.options?.scales?.y?.max)||niceMax(max);this._grid(ctx,a,max,0);this._labels(ctx,a,labels);
      const group=a.w/Math.max(1,labels.length);const gap=Math.min(8,group*.12);
      labels.forEach((_,i)=>{
        if(stacked){let base=a.y+a.h;const bw=Math.max(5,group-gap*2);sets.forEach((d,di)=>{const v=num(d.data?.[i]),hh=a.h*v/max;ctx.fillStyle=colorAt(d.backgroundColor,i,colorAt(d.backgroundColor,di));ctx.fillRect(a.x+i*group+gap,base-hh,bw,hh);base-=hh;});}
        else {const bw=Math.max(4,(group-gap*2)/Math.max(1,sets.length));sets.forEach((d,di)=>{const v=num(d.data?.[i]),hh=a.h*v/max;ctx.fillStyle=colorAt(d.backgroundColor,i,colorAt(d.backgroundColor,di));ctx.fillRect(a.x+i*group+gap+di*bw,a.y+a.h-hh,Math.max(3,bw-2),hh);});}
      });
    }

    _doughnut(ctx,a){
      const ds=this.data.datasets?.[0]||{data:[]};const data=(ds.data||[]).map(v=>Math.max(0,num(v)));const sum=data.reduce((s,v)=>s+v,0)||1;const cx=a.x+a.w/2,cy=a.y+a.h/2,r=Math.min(a.w,a.h)*.38;let start=-Math.PI/2;
      data.forEach((v,i)=>{const end=start+Math.PI*2*v/sum;ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,r,start,end);ctx.closePath();ctx.fillStyle=colorAt(ds.backgroundColor,i);ctx.fill();start=end;});
      const cut=String(this.options?.cutout||'60%').includes('%')?parseFloat(this.options.cutout)/100:.6;ctx.beginPath();ctx.arc(cx,cy,r*cut,0,Math.PI*2);ctx.fillStyle='#fff';ctx.fill();ctx.fillStyle='#034c1f';ctx.font='700 18px Arial';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(String(Math.round(sum)),cx,cy-3);ctx.font='9px Arial';ctx.fillStyle='#646464';ctx.fillText('total',cx,cy+15);
    }

    _bubble(ctx,a){
      const sets=this.data.datasets||[];const pts=sets.flatMap(d=>(d.data||[]).map(p=>typeof p==='object'?p:{x:0,y:num(p)}));
      let xmin=Number(this.options?.scales?.x?.min),xmax=Number(this.options?.scales?.x?.max),ymin=Number(this.options?.scales?.y?.min),ymax=Number(this.options?.scales?.y?.max);
      const xs=pts.map(p=>num(p.x)),ys=pts.map(p=>num(p.y));if(!Number.isFinite(xmin))xmin=Math.min(0,...xs);if(!Number.isFinite(xmax))xmax=niceMax(Math.max(1,...xs));if(!Number.isFinite(ymin))ymin=Math.min(0,...ys);if(!Number.isFinite(ymax))ymax=niceMax(Math.max(1,...ys));
      this._grid(ctx,a,ymax,ymin);ctx.save();ctx.strokeStyle=ChartLite.defaults.borderColor;for(let i=0;i<=4;i++){const x=a.x+a.w*i/4;ctx.beginPath();ctx.moveTo(x,a.y);ctx.lineTo(x,a.y+a.h);ctx.stroke();ctx.fillStyle=ChartLite.defaults.color;ctx.font='9px Arial';ctx.textAlign='center';ctx.fillText(Math.round(xmin+(xmax-xmin)*i/4),x,a.y+a.h+13);}ctx.restore();
      sets.forEach((d,di)=>{(d.data||[]).forEach((p,pi)=>{const o=typeof p==='object'?p:{x:pi,y:num(p)};const x=a.x+(num(o.x)-xmin)/(xmax-xmin||1)*a.w,y=a.y+a.h-(num(o.y)-ymin)/(ymax-ymin||1)*a.h,r=clamp(num(o.r)||num(Array.isArray(d.pointRadius)?d.pointRadius[pi]:d.pointRadius)||7,4,26);ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fillStyle=colorAt(d.backgroundColor,pi,colorAt(d.backgroundColor,di));ctx.fill();ctx.strokeStyle=colorAt(d.borderColor,di,'#fff');ctx.stroke();if(d.label){ctx.fillStyle='#26352d';ctx.font='8px Arial';ctx.textAlign='center';ctx.fillText(truncate(ctx,d.label,90),x,y+r+11);}});});
    }

    _radar(ctx,a){
      const labels=this.data.labels||[];const sets=this.data.datasets||[];if(!labels.length)return;const cx=a.x+a.w/2,cy=a.y+a.h/2,r=Math.min(a.w,a.h)*.36;const max=Number(this.options?.scales?.r?.max)||niceMax(Math.max(1,...sets.flatMap(d=>(d.data||[]).map(num))));
      ctx.save();ctx.strokeStyle=ChartLite.defaults.borderColor;for(let ring=1;ring<=5;ring++){ctx.beginPath();labels.forEach((_,i)=>{const ang=-Math.PI/2+i*Math.PI*2/labels.length,x=cx+Math.cos(ang)*r*ring/5,y=cy+Math.sin(ang)*r*ring/5;i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.closePath();ctx.stroke();}
      labels.forEach((lab,i)=>{const ang=-Math.PI/2+i*Math.PI*2/labels.length;ctx.beginPath();ctx.moveTo(cx,cy);ctx.lineTo(cx+Math.cos(ang)*r,cy+Math.sin(ang)*r);ctx.stroke();ctx.fillStyle=ChartLite.defaults.color;ctx.font='9px Arial';ctx.textAlign=Math.cos(ang)>.2?'left':Math.cos(ang)<-.2?'right':'center';ctx.textBaseline=Math.sin(ang)>.2?'top':Math.sin(ang)<-.2?'bottom':'middle';ctx.fillText(truncate(ctx,lab,90),cx+Math.cos(ang)*(r+10),cy+Math.sin(ang)*(r+10));});
      sets.forEach((d,di)=>{const col=colorAt(d.borderColor||d.backgroundColor,di);ctx.beginPath();(d.data||[]).forEach((v,i)=>{const ang=-Math.PI/2+i*Math.PI*2/labels.length,rr=r*num(v)/max,x=cx+Math.cos(ang)*rr,y=cy+Math.sin(ang)*rr;i?ctx.lineTo(x,y):ctx.moveTo(x,y);});ctx.closePath();ctx.fillStyle=colorAt(d.backgroundColor,di,alpha(col,.12));ctx.fill();ctx.strokeStyle=col;ctx.lineWidth=2;ctx.stroke();});ctx.restore();
    }
  }

  window.Chart = ChartLite;
  window.dispatchEvent(new CustomEvent('quest:chart-engine-ready'));
})();
