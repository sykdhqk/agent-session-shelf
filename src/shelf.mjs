export const DISPOSITIONS=['archive','cooldown','retire','keep','review'];
function shape(o,keys,at){if(!o||typeof o!=='object'||Array.isArray(o))throw Error(at+' must be an object');for(const k of keys)if(!Object.hasOwn(o,k))throw Error(at+': missing '+k);for(const k of Object.keys(o))if(!keys.includes(k))throw Error(at+': unknown '+k);}
function text(v,at,max=200){if(typeof v!=='string'||!v.trim()||v.length>max)throw Error(at+' must be nonempty text (max '+max+')');}
function timestamp(v,at){if(typeof v!=='string'||!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{3})?Z$/.test(v))throw Error(at+' must be a UTC ISO timestamp');const n=Date.parse(v);if(!Number.isFinite(n)||new Date(n).toISOString()!==v.replace(/(?<!\.\d{3})Z$/,'.000Z'))throw Error(at+' is not a real UTC date');return n;}
function integer(v,at,min,max){if(!Number.isInteger(v)||v<min||v>max)throw Error(at+' must be an integer from '+min+' to '+max);}
export function validateInventory(input){
 shape(input,['schemaVersion','title','asOf','policy','sessions'],'inventory');if(input.schemaVersion!==1)throw Error('Expected schemaVersion 1');text(input.title,'title');const now=timestamp(input.asOf,'asOf');
 shape(input.policy,['inactiveHours','graceHours','maxEvidenceAgeHours'],'policy');for(const k of ['inactiveHours','graceHours'])integer(input.policy[k],k,0,87600);integer(input.policy.maxEvidenceAgeHours,'maxEvidenceAgeHours',1,87600);
 if(!Array.isArray(input.sessions)||input.sessions.length>200)throw Error('sessions must be an array with at most 200 entries');const ids=new Set();
 for(const s of input.sessions){shape(s,['id','title','repository','lastActivityAt','checkedAt','running','dirty','pinned','archivedAt','pullRequests'],'session');text(s.id,'session.id',80);if(!/^[A-Za-z0-9_-]+$/.test(s.id)||ids.has(s.id))throw Error('Invalid or duplicate session id');ids.add(s.id);text(s.title,'session.title',300);text(s.repository,'repository',200);
  for(const k of ['lastActivityAt','checkedAt','archivedAt'])if(s[k]!==null){if(timestamp(s[k],s.id+'.'+k)>now)throw Error(s.id+'.'+k+' is after asOf');}else if(k==='lastActivityAt')throw Error('lastActivityAt is required');
  for(const k of ['running','dirty'])if(s[k]!==null&&typeof s[k]!=='boolean')throw Error(k+' must be boolean or null');if(typeof s.pinned!=='boolean')throw Error('pinned must be boolean');
  if(s.pullRequests!==null){if(!Array.isArray(s.pullRequests)||s.pullRequests.length>100)throw Error('pullRequests must be null or an array of at most 100 items');const prs=new Set();for(const p of s.pullRequests){shape(p,['number','state'],'pullRequest');integer(p.number,'PR number',1,2147483647);if(prs.has(p.number))throw Error('Duplicate PR number in session');prs.add(p.number);if(!['open','merged','closed','unknown'].includes(p.state))throw Error('Invalid PR state');}}
 }
 return JSON.parse(JSON.stringify(input));
}
export function planInventory(input){
 const inventory=validateInventory(input),now=Date.parse(inventory.asOf),p=inventory.policy;
 const items=inventory.sessions.map(s=>{
  const reasons=[],hold=[],unknown=[];const idleHours=(now-Date.parse(s.lastActivityAt))/3600000;
  if(s.pinned)hold.push('pinned');if(s.running===true)hold.push('running');if(s.dirty===true)hold.push('dirty');
  if(s.running===null)unknown.push('running-unknown');if(s.dirty===null)unknown.push('dirty-unknown');
  if(s.checkedAt===null)unknown.push('unchecked');else{if((now-Date.parse(s.checkedAt))/3600000>p.maxEvidenceAgeHours)unknown.push('stale');if(Date.parse(s.checkedAt)<Date.parse(s.lastActivityAt))unknown.push('activity-after-check');}
  if(s.pullRequests===null||s.pullRequests.length===0)unknown.push('prs-missing');else{if(s.pullRequests.some(x=>x.state==='open'))hold.push('pr-open');if(s.pullRequests.some(x=>x.state==='closed'))hold.push('pr-unmerged');if(s.pullRequests.some(x=>x.state==='unknown'))unknown.push('pr-unknown');}
  if(idleHours<p.inactiveHours)hold.push('recent');
  if(s.archivedAt!==null&&Date.parse(s.lastActivityAt)>Date.parse(s.archivedAt))unknown.push('activity-after-archive');
  reasons.push(...hold,...unknown);let disposition,eligibleAt=null;
  if(hold.length)disposition='keep';else if(unknown.length)disposition='review';else if(s.archivedAt===null){disposition='archive';reasons.push('all-merged-inactive');}else{eligibleAt=new Date(Date.parse(s.archivedAt)+p.graceHours*3600000).toISOString();disposition=now>=Date.parse(eligibleAt)?'retire':'cooldown';reasons.push(disposition==='retire'?'grace-elapsed':'grace-pending');}
  return {id:s.id,title:s.title,repository:s.repository,disposition,reasons,idleHours,eligibleAt};
 });
 const counts=Object.fromEntries(DISPOSITIONS.map(k=>[k,items.filter(x=>x.disposition===k).length]));
 return {schemaVersion:1,kind:'agent-session-shelf-plan',asOf:inventory.asOf,inventory,counts,items,execution:'planning-only'};
}
export function setPinned(input,id,pinned){const next=validateInventory(input);if(typeof pinned!=='boolean')throw Error('pinned must be boolean');const s=next.sessions.find(s=>s.id===id);if(!s)throw Error('Unknown session');s.pinned=pinned;return next;}
export function toMarkdown(input){const p=planInventory(input);const esc=v=>String(v).replaceAll('\\','\\\\').replaceAll('|','\\|').replace(/[\r\n]+/g,' ').replaceAll('<','&lt;').replaceAll('>','&gt;');return ['# Agent Session Shelf / 智能体会话整理清单','',esc(p.inventory.title),'','As of / 快照时间: '+p.asOf,'','Planning only: no session, branch, worktree or file was archived or deleted.','仅生成计划：没有实际归档或删除会话、分支、工作树或文件。','',`Policy / 规则: inactive ${p.inventory.policy.inactiveHours} h; archive grace ${p.inventory.policy.graceHours} h; evidence age ≤ ${p.inventory.policy.maxEvidenceAgeHours} h.`,`Counts / 数量: archive=${p.counts.archive}, cooldown=${p.counts.cooldown}, retire=${p.counts.retire}, keep=${p.counts.keep}, review=${p.counts.review}.`,'','| Session / 会话 | Repository / 仓库 | Disposition / 建议 | Reasons / 依据 | Grace ends / 宽限期结束 |','|---|---|---|---|---|',...p.items.map(x=>`| ${esc(x.id+' · '+x.title)} | ${esc(x.repository)} | ${x.disposition} | ${x.reasons.join(', ')} | ${x.eligibleAt??'—'} |`),'','archive = review marking done; cooldown = wait; retire = review removal, not deletion approval; keep = known hold; review = insufficient or contradictory evidence.','archive 为待审阅归档，cooldown 为宽限期内，retire 为待审阅移除，不代表删除批准；keep 为有明确保留条件，review 为证据不足或矛盾。','','Refresh live PR, worktree and activity evidence before any action. Pinning is a local planning preference, not a change to a connected service.','实际操作前重新核对 PR、工作树和活动状态。固定仅是本计划偏好，不改变外部服务。',''].join('\n');}
