import express from 'express';
import cors from 'cors';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const app = express();
app.use(cors()); app.use(express.json());

let ISSUES = [];
let USERS = [{name:'Upender', email:'admin@ct.com', password:'admin', role:'admin'}];
let SESSIONS = {};
function newId() { return Math.random().toString(36).slice(2,12); }

app.post('/api/login', (req,res)=>{ let u=USERS.find(x=>x.email===req.body.email && x.password===req.body.password); if(!u) return res.status(400).json({msg:"Wrong credentials"}); let t=newId(); SESSIONS[t]=u; res.json({token:t, name:u.name, role:u.role }); });
app.post('/api/register', (req,res)=>{ let {name,email,password}=req.body; if(USERS.find(x=>x.email===email)) return res.status(409).json({msg:"Email exists"}); USERS.push({name,email,password,role:"user"}); res.json({msg:"Registered"}); });
app.get('/api/issues', (req,res)=>{ let out = ISSUES.filter(i=>!i.isHidden); let { category, status } = req.query; if (category) out = out.filter(x=>x.category===category); if (status) out = out.filter(x=>x.status===status); res.json(out.reverse()); });
app.post('/api/issues', (req,res)=>{ let o = req.body; o._id=newId(); o.spamFlags=0; o.isHidden=false; o.status="Reported"; o.statusHistory=[{status:"Reported", timeChanged:new Date()}]; ISSUES.push(o); res.json(o); });
app.post('/api/issues/:id/flag', (req,res)=>{ let i = ISSUES.find(x=>x._id===req.params.id); if(!i) return res.status(404).end(); i.spamFlags++; if(i.spamFlags>=3) i.isHidden=true; res.json({ok:true, spamFlags:i.spamFlags}); });
app.post('/api/issues/:id/status', (req,res)=>{ let token = req.headers.authorization?.split(' ')[1]; let u = SESSIONS[token]; if(!u||u.role!=='admin') return res.status(401).end(); let i = ISSUES.find(x=>x._id===req.params.id); if(!i) return res.status(404).end(); i.status=req.body.status; i.statusHistory.push({status:req.body.status,timeChanged:new Date()}); res.json(i); });
app.get('/api/admin/flagged',(req,res)=>{ let token = req.headers.authorization?.split(' ')[1]; let u = SESSIONS[token]; if(!u||u.role!=='admin') return res.status(401).end(); res.json(ISSUES.filter(x=>x.spamFlags>0)); });
app.get('/api/admin/analytics',(req,res)=>{ let token = req.headers.authorization?.split(' ')[1]; let u = SESSIONS[token]; if(!u||u.role!=='admin') return res.status(401).end(); let cats={}; for(let i of ISSUES) cats[i.category]=(cats[i.category]||0)+1; res.json({stats:Object.entries(cats).map(([k,v])=>({category:k,count:v}))}); });
app.use(express.static(__dirname));
app.get('/',(_,res)=>res.sendFile(join(__dirname, 'index.html')));
app.listen(5000, '0.0.0.0', ()=>console.log("CivicTrack running on port 5000!"));
