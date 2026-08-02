/**
 * This file will automatically be loaded by vite and run in the "renderer" context.
 * To learn more about the differences between the "main" and the "renderer" context in
 * Electron, visit:
 *
 * https://electronjs.org/docs/tutorial/process-model
 *
 * By default, Node.js integration in this file is disabled. When enabling Node.js integration
 * in a renderer process, please be aware of potential security implications. You can read
 * more about security risks here:
 *
 * https://electronjs.org/docs/tutorial/security
 *
 * To enable Node.js integration in this file, open up `main.js` and enable the `nodeIntegration`
 * flag:
 *
 * ```
 *  // Create the browser window.
 *  mainWindow = new BrowserWindow({
 *    width: 800,
 *    height: 600,
 *    webPreferences: {
 *      nodeIntegration: true
 *    }
 *  });
 * ```
 */

import './index.css';
import { attachUploadPageEvents, renderUploadPage } from './upload.js';

const app = document.createElement('main');
app.className = 'app-shell';
document.body.innerHTML = '';
document.body.appendChild(app);

const routes = {
  '/': () => `
    <section class="page">
      <h1>Welcome to Crochet Tools</h1>
      <nav class="nav-links">
        <a href="#/upload">Upload</a>
      </nav>
    </section>
  `,
  '/upload': () => renderUploadPage(),
};

const render = () => {
  const hash = window.location.hash || '#/';
  const path = hash.startsWith('#') ? hash.slice(1) : hash;
  const route = routes[path] || routes['/'];
  app.innerHTML = route();

  if (path === '/upload') {
    attachUploadPageEvents();
  }
};

window.addEventListener('hashchange', render);
render();
