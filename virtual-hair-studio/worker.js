/**
 * Virtual Hair Studio 2.0 — Cloudflare Worker
 * Secret: OPENAI_API_KEY (set with wrangler secret put OPENAI_API_KEY)
 * Public env: ALLOWED_ORIGIN=https://lc1733.github.io
 * Optional secret: ACCESS_TOKEN (strong random string; only for private deployments)
 * IMPORTANT: Browser-public deployment without authentication can incur API charges.
 */
const MAX_JSON_BYTES = 12 * 1024 * 1024;
const json=(value,status=200,origin='')=>new Response(JSON.stringify(value),{status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store',...(origin?{'Access-Control-Allow-Origin':origin,'Vary':'Origin'}:{})}});
export default {async fetch(request,env){
 const origin=request.headers.get('Origin')||'';
 const allowed=env.ALLOWED_ORIGIN||'https://lc1733.github.io';
 const cors=origin===allowed?origin:'';
 if(request.method==='OPTIONS')return new Response(null,{status:cors?204:403,headers:cors?{'Access-Control-Allow-Origin':cors,'Access-Control-Allow-Methods':'GET, POST, OPTIONS','Access-Control-Allow-Headers':'Content-Type','Access-Control-Max-Age':'600'}:{}});
 if(origin&&!cors)return json({error:'Origen no autorizado'},403);
 const path=new URL(request.url).pathname;
 if(path==='/health'&&request.method==='GET')return json({ok:true,configured:Boolean(env.OPENAI_API_KEY)},200,cors);
 if(path!=='/generate'||request.method!=='POST')return json({error:'Ruta no encontrada'},404,cors);
 if(!env.OPENAI_API_KEY)return json({error:'Falta configurar OPENAI_API_KEY en Cloudflare Workers.'},503,cors);
 const length=Number(request.headers.get('Content-Length')||0);
 if(length>MAX_JSON_BYTES)return json({error:'Imagen demasiado grande'},413,cors);
 let input;try{const raw=await request.text();if(raw.length>MAX_JSON_BYTES)return json({error:'Imagen demasiado grande'},413,cors);input=JSON.parse(raw)}catch{return json({error:'JSON inválido'},400,cors)}
 const {image_base64,style,color,details=''}=input||{};
 if(typeof image_base64!=='string'||!image_base64.length||image_base64.length>MAX_JSON_BYTES)return json({error:'Fotografía inválida'},400,cors);
 if(typeof style!=='string'||style.length>150||typeof color!=='string'||color.length>60||typeof details!=='string'||details.length>350)return json({error:'Parámetros inválidos'},400,cors);
 // Validate base64 before decoding; generated JPEG input from frontend
 if(!/^[A-Za-z0-9+/]+={0,2}$/.test(image_base64))return json({error:'Codificación de imagen inválida'},400,cors);
 try{
 const binary=atob(image_base64);const bytes=new Uint8Array(binary.length);for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
 const prompt='Edit ONLY the hair of the person in the input photo. Create a photorealistic, naturally integrated hairstyle: '+style+'. Hair color: '+color+'. Extra hair instructions: '+details+'. Preserve the exact facial identity, expression, age, eyebrows, eyes, skin texture, beard, clothing, pose, framing, lighting, and background as closely as possible. No wigs, cartoon effects, painted overlays, black holes, or changes to facial features. Return one realistic edited photograph.';
 const form=new FormData();form.append('model','gpt-image-1.5');form.append('image',new File([bytes],'portrait.jpg',{type:'image/jpeg'}));form.append('prompt',prompt);form.append('size','auto');form.append('quality','medium');
 const response=await fetch('https://api.openai.com/v1/images/edits',{method:'POST',headers:{'Authorization':'Bearer '+env.OPENAI_API_KEY},body:form});
 const payload=await response.json();if(!response.ok)return json({error:'OpenAI: '+(payload.error?.message||'Error de generación')},502,cors);
 const output=payload.data?.[0]?.b64_json;if(!output)return json({error:'OpenAI no devolvió una imagen codificada.'},502,cors);
 return json({image_base64:output},200,cors);
 }catch(e){return json({error:'Error de procesamiento: '+String(e.message||e)},500,cors)}
}};
