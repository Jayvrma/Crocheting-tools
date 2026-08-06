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
import './pages/pdf-list.css';
import navbarHtml from './pages/navbar.html?raw';
import homeHtml from './pages/home.html?raw';
import filesHtml from './pages/files.html?raw';
import viewHtml from './pages/view.html?raw';
import infoHtml from './pages/info.html?raw';
import logoSrc from './images/cat.png';
import { fillTemplate } from './template.js';
import { attachFilesPageEvents, attachUploadPageEvents, renderUploadPage } from './upload.js';

const app = document.createElement('main');
app.className = 'app-shell';
document.body.innerHTML = '';
document.body.appendChild(app);

const navbar = fillTemplate(navbarHtml, { logoSrc });

const routes = {
  '/': () => navbar + homeHtml,
  '/upload': () => navbar + renderUploadPage(),
  '/files': () => navbar + filesHtml,
  '/view': () => navbar + viewHtml,
  '/info': () => navbar + infoHtml,
};

const render = () => {
  const hash = window.location.hash || '#/';
  const path = hash.startsWith('#') ? hash.slice(1) : hash;
  const route = routes[path] || routes['/'];

  if (path !== '/files') {
    window.electronAPI.hidePdfView();
  }

  app.innerHTML = route();

  if (path === '/upload') {
    attachUploadPageEvents();
  }

  if (path === '/files') {
    attachFilesPageEvents();
  }
};

window.addEventListener('hashchange', render);
render();
