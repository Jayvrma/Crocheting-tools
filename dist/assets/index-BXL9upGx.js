(function(){const e=document.createElement("link").relList;if(e&&e.supports&&e.supports("modulepreload"))return;for(const n of document.querySelectorAll('link[rel="modulepreload"]'))r(n);new MutationObserver(n=>{for(const o of n)if(o.type==="childList")for(const l of o.addedNodes)l.tagName==="LINK"&&l.rel==="modulepreload"&&r(l)}).observe(document,{childList:!0,subtree:!0});function s(n){const o={};return n.integrity&&(o.integrity=n.integrity),n.referrerPolicy&&(o.referrerPolicy=n.referrerPolicy),n.crossOrigin==="use-credentials"?o.credentials="include":n.crossOrigin==="anonymous"?o.credentials="omit":o.credentials="same-origin",o}function r(n){if(n.ep)return;n.ep=!0;const o=s(n);fetch(n.href,o)}})();const h=`<nav class="navbar">\r
  <a href="#/" class="navbar-brand">\r
    <img src="{{logoSrc}}" alt="" class="navbar-logo" />\r
    Crochet Tools\r
  </a>\r
  <div class="navbar-links">\r
    <a href="#/upload">Upload</a>\r
    <a href="#/files">Files</a>\r
    <a href="#/view">View</a>\r
    <a href="#/info">Info</a>\r
  </div>\r
</nav>\r
`,g=`<section class="page">\r
  <h1>Welcome to Crochet Tools</h1>\r
</section>`,v=`<section class="files-page">\r
  <aside class="files-sidebar">\r
    <div id="pdfList" class="pdf-list"></div>\r
  </aside>\r
  <div class="files-main">\r
    <p id="status" class="status"></p>\r
    <nav class="nav-links">\r
    </nav>\r
  </div>\r
</section>`,y=`<section class="page">\r
  <h1>View</h1>\r
  <p>Coming soon.</p>\r
  <nav class="nav-links">\r
    <a href="#/">Back</a>\r
  </nav>\r
</section>\r
`,w=`<section class="page">\r
  <h1>Info</h1>\r
  <p>Coming soon.</p>\r
  <nav class="nav-links">\r
    <a href="#/">Back</a>\r
  </nav>\r
</section>\r
`,P="/assets/cat-DQjn3gr-.png",i=(t,e={})=>t.replace(/{{\s*(\w+)\s*}}/g,(s,r)=>e[r]??""),L=`<section class="page">\r
  <h1 class="header_upload">Upload Files</h1>\r
  <label for="filePicker" class="file-picker-trigger">\r
    <img src="{{placeholderSrc}}" alt="Choose a PDF file" class="file-picker-image" />\r
  </label>\r
  <input type="file" id="filePicker" accept="application/pdf" class="visually-hidden" />\r
  <p id="status" class="status">Choose a PDF to upload.</p>\r
\r
\r
</section>`,b=`<p>Uploaded PDFs:</p>\r
<ul class="list-group">\r
  {{items}}\r
</ul>`,C=`<li class="list-group-item">\r
  <span>{{name}}</span>\r
  <button type="button" class="remove-pdf" data-file-name="{{name}}">Remove</button>\r
</li>\r
`,I=`<p>No PDFs uploaded yet.</p>\r
`,H="/assets/cd-5SVVvPLD.webp",F=()=>i(L,{placeholderSrc:H}),M=8,S=t=>{const e=t.map(n=>i(C,n)).join(""),s=Math.max(0,M-t.length),r='<li class="list-group-item list-group-item-empty"></li>'.repeat(s);return i(b,{items:e+r})};let c=null;const U=()=>{const t=document.querySelector(".files-main");if(!t)return null;const e=t.getBoundingClientRect();return{x:Math.round(e.left),y:Math.round(e.top),width:Math.round(e.width),height:Math.round(e.height)}},u=t=>{const e=U();e&&(c=t,window.electronAPI.viewPdf(t,e))};window.addEventListener("resize",()=>{c&&u(c)});const d=async t=>{const e=document.getElementById("pdfList");if(e)try{const s=await window.electronAPI.listUploadedPdfs(),r=s.success?s.files:[];e.innerHTML=r.length?S(r):I,e.querySelectorAll(".remove-pdf").forEach(n=>{n.addEventListener("click",o=>{o.stopPropagation(),k(n.dataset.fileName,t)})}),e.querySelectorAll(".list-group-item:not(.list-group-item-empty)").forEach((n,o)=>{n.addEventListener("click",()=>u(r[o].path))})}catch(s){t&&(t.textContent=`Unable to load PDFs: ${s.message}`)}},k=async(t,e)=>{if(t){e&&(e.textContent="Removing PDF...");try{const s=await window.electronAPI.removePdf(t);e&&(e.textContent=s.success?"PDF removed.":`Remove failed: ${s.error}`),s.success&&await d(e)}catch(s){e&&(e.textContent=`Remove failed: ${s.message}`)}}},D=async(t,e)=>{e.textContent="Uploading...";try{const s={name:t.name,mimeType:t.type,buffer:await t.arrayBuffer()},r=await window.electronAPI.uploadFile(s);e.textContent=r.success?`Successfully copied to: ${r.savedPath}`:`Upload failed: ${r.error}`,r.success&&await d(e)}catch(s){e.textContent=`Upload failed: ${s.message}`}},x=()=>{const t=document.getElementById("filePicker"),e=document.getElementById("status");!t||!e||t.addEventListener("change",s=>{var n;const r=(n=s.target.files)==null?void 0:n[0];r&&D(r,e)})},B=()=>{c=null;const t=document.getElementById("status");d(t)},f=document.createElement("main");f.className="app-shell";document.body.innerHTML="";document.body.appendChild(f);const a=i(h,{logoSrc:P}),p={"/":()=>a+g,"/upload":()=>a+F(),"/files":()=>a+v,"/view":()=>a+y,"/info":()=>a+w},m=()=>{const t=window.location.hash||"#/",e=t.startsWith("#")?t.slice(1):t,s=p[e]||p["/"];e!=="/files"&&window.electronAPI.hidePdfView(),f.innerHTML=s(),e==="/upload"&&x(),e==="/files"&&B()};window.addEventListener("hashchange",m);m();
