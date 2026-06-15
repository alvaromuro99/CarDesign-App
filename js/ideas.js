/* ============ IDEAS ============ */
function newIdea(){const id=uid();state.ideas=state.ideas||[];state.ideas.push({id,title:'Nueva idea',emoji:'📄',folder:'General',blocks:[{id:uid(),type:'text',text:''}]});current='idea:'+id;render();closeNav()}
function renderIdea(id){
  const idea=(state.ideas||[]).find(i=>i.id===id);
  if(!idea){current='dashboard';return renderDashboard()}
  document.getElementById('topbar').innerHTML='<span class="emoji-lg" id="iEmoji" title="Cambiar emoji" style="cursor:pointer">'+(idea.emoji||'📄')+'</span>'+
    '<div style="flex:1">'+
      '<h1 contenteditable spellcheck="false" id="iTitle">'+esc(idea.title)+'</h1>'+
      '<p class="desc">Carpeta: <span contenteditable spellcheck="false" id="iFolder" style="border-bottom:1px dashed var(--line)">'+esc(idea.folder||'General')+'</span></p>'+
    '</div>'+
    '<button class="del" id="iDel" title="Eliminar idea" style="font-size:18px;color:var(--muted);background:transparent;border:0">🗑</button>';
  document.getElementById('iTitle').onblur=e=>{idea.title=e.target.textContent.trim()||'Sin título';save();renderNav()};
  document.getElementById('iFolder').onblur=e=>{idea.folder=e.target.textContent.trim()||'General';save();renderNav()};
  document.getElementById('iEmoji').onclick=()=>{const e=prompt('Emoji para esta idea:',idea.emoji||'📄');if(e!==null){idea.emoji=e.trim()||'📄';save();render()}};
  document.getElementById('iDel').onclick=()=>{if(confirm('¿Eliminar esta idea?')){state.ideas=state.ideas.filter(x=>x.id!==idea.id);current='dashboard';render()}};
  renderBlocks(idea);
}
function renderBlocks(idea){
  const c=document.getElementById('content');let h='';
  (idea.blocks||[]).forEach(b=>{
    h+='<div class="idea-block" data-id="'+b.id+'"><div class="bh"><span class="bt">'+(b.type==='text'?'Texto':b.type==='list'?'Lista':'Tabla')+'</span><button class="bdel" data-act="bdel">🗑</button></div>';
    if(b.type==='text')h+='<div class="idea-text" contenteditable spellcheck="false" data-bf="text">'+esc(b.text||'')+'</div>';
    else if(b.type==='list')h+='<ul class="idea-list">'+(b.items||[]).map((it,ix)=>'<li contenteditable spellcheck="false" data-li="'+ix+'">'+esc(it)+'</li>').join('')+'</ul><button class="mini" data-act="addli" style="margin-top:6px">+ línea</button>';
    else if(b.type==='table')h+='<div style="overflow-x:auto"><table class="idea-tbl"><tbody>'+(b.rows||[]).map((row,ri)=>'<tr>'+row.map((cell,ci)=>'<td contenteditable spellcheck="false" data-r="'+ri+'" data-c="'+ci+'">'+esc(cell)+'</td>').join('')+'</tr>').join('')+'</tbody></table></div><div style="margin-top:6px;display:flex;gap:8px"><button class="mini" data-act="addrow">+ fila</button><button class="mini" data-act="addcol">+ columna</button></div>';
    h+='</div>';
  });
  h+='<div class="idea-addopts"><button data-add="text">+ Texto</button><button data-add="list">+ Lista</button><button data-add="table">+ Tabla</button></div>';
  c.innerHTML=h;bindBlocks(idea,c);
}
function bindBlocks(idea,c){
  c.querySelectorAll('.idea-block').forEach(el=>{
    const b=idea.blocks.find(x=>x.id===el.dataset.id);
    el.querySelector('[data-act="bdel"]').onclick=()=>{idea.blocks=idea.blocks.filter(x=>x.id!==b.id);renderBlocks(idea)};
    const tx=el.querySelector('[data-bf="text"]');if(tx)tx.onblur=()=>{b.text=tx.innerText;save()};
    el.querySelectorAll('[data-li]').forEach(li=>li.onblur=()=>{b.items[+li.dataset.li]=li.innerText;save()});
    const addli=el.querySelector('[data-act="addli"]');if(addli)addli.onclick=()=>{b.items.push('');renderBlocks(idea)};
    el.querySelectorAll('[data-r]').forEach(td=>td.onblur=()=>{b.rows[+td.dataset.r][+td.dataset.c]=td.innerText;save()});
    const ar=el.querySelector('[data-act="addrow"]');if(ar)ar.onclick=()=>{const cols=(b.rows[0]||['','']).length;b.rows.push(Array(cols).fill(''));renderBlocks(idea)};
    const ac=el.querySelector('[data-act="addcol"]');if(ac)ac.onclick=()=>{b.rows.forEach(r=>r.push(''));renderBlocks(idea)};
  });
  c.querySelectorAll('[data-add]').forEach(btn=>btn.onclick=()=>{const ty=btn.dataset.add;const nb={id:uid(),type:ty};if(ty==='text')nb.text='';else if(ty==='list')nb.items=[''];else nb.rows=[['Columna 1','Columna 2'],['',''],['','']];idea.blocks.push(nb);renderBlocks(idea)});
}
