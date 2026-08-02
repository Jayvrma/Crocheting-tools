(function(){const n=document.createElement("link").relList;if(n&&n.supports&&n.supports("modulepreload"))return;for(const e of document.querySelectorAll('link[rel="modulepreload"]'))s(e);new MutationObserver(e=>{for(const t of e)if(t.type==="childList")for(const r of t.addedNodes)r.tagName==="LINK"&&r.rel==="modulepreload"&&s(r)}).observe(document,{childList:!0,subtree:!0});function a(e){const t={};return e.integrity&&(t.integrity=e.integrity),e.referrerPolicy&&(t.referrerPolicy=e.referrerPolicy),e.crossOrigin==="use-credentials"?t.credentials="include":e.crossOrigin==="anonymous"?t.credentials="omit":t.credentials="same-origin",t}function s(e){if(e.ep)return;e.ep=!0;const t=a(e);fetch(e.href,t)}})();const u=()=>`
  <section class="page">
    <h1>Upload Files</h1>
    <input type="file" id="filePicker" accept="application/pdf" />
    <p id="status">Choose a PDF to upload.</p>
    <div id="pdfList" class="pdf-list"></div>
    <nav class="nav-links">
      <a href="#/">Back</a>
    </nav>
  </section>
`,i=async()=>{const o=document.getElementById("pdfList"),n=document.getElementById("status");if(o)try{const a=await window.electronAPI.listUploadedPdfs();if(!a.success){o.innerHTML="<p>No PDFs uploaded yet.</p>";return}if(!a.files.length){o.innerHTML="<p>No PDFs uploaded yet.</p>";return}o.innerHTML=`
      <p>Uploaded PDFs:</p>
      <ul>
        ${a.files.map(s=>`
          <li>
            <span>${s.name}</span>
            <button type="button" class="remove-pdf" data-file-name="${s.name}">Remove</button>
          </li>
        `).join("")}
      </ul>
    `,o.querySelectorAll(".remove-pdf").forEach(s=>{s.addEventListener("click",async()=>{const e=s.getAttribute("data-file-name");if(e){n.textContent="Removing PDF...";try{const t=await window.electronAPI.removePdf(e);t.success?(n.textContent="PDF removed.",await i()):n.textContent=`Remove failed: ${t.error}`}catch(t){n.textContent=`Remove failed: ${t.message}`}}})})}catch(a){n&&(n.textContent=`Unable to load PDFs: ${a.message}`)}},f=()=>{const o=document.getElementById("filePicker"),n=document.getElementById("status");!o||!n||(i(),o.addEventListener("change",async a=>{var e;const s=(e=a.target.files)==null?void 0:e[0];if(s){n.textContent="Uploading...";try{const t={name:s.name,mimeType:s.type,buffer:await s.arrayBuffer()},r=await window.electronAPI.uploadFile(t);r.success?(n.textContent=`Successfully copied to: ${r.savedPath}`,await i()):n.textContent=`Upload failed: ${r.error}`}catch(t){n.textContent=`Upload failed: ${t.message}`}}}))},c=document.createElement("main");c.className="app-shell";document.body.innerHTML="";document.body.appendChild(c);const l={"/":()=>`
    <section class="page">
      <h1>Welcome to Crochet Tools</h1>
      <nav class="nav-links">
        <a href="#/upload">Upload</a>
      </nav>
    </section>
  `,"/upload":()=>u()},d=()=>{const o=window.location.hash||"#/",n=o.startsWith("#")?o.slice(1):o,a=l[n]||l["/"];c.innerHTML=a(),n==="/upload"&&f()};window.addEventListener("hashchange",d);d();
