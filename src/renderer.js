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
import './pages/review.css';
import navbarHtml from './pages/navbar.html?raw';
import homeHtml from './pages/home.html?raw';
import filesHtml from './pages/files.html?raw';
import viewHtml from './pages/view.html?raw';
import infoHtml from './pages/info.html?raw';
import reviewHtml from './pages/review.html?raw';
import logoSrc from './images/cat.png';
import { fillTemplate } from './template.js';
import { attachFilesPageEvents, attachUploadPageEvents, renderUploadPage } from './upload.js';
import { attachReviewPageEvents } from './review.js';

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
  '/review': () => navbar + reviewHtml,
};

const render = () => {
  const hash = window.location.hash || '#/';
  const [path, query = ''] = hash.slice(1).split('?');
  const params = new URLSearchParams(query);
  const fileName = params.get('file');
  const route = routes[path] || routes['/'];

  // Always hide the old PDF; the files and review pages show it again for their own pane
  window.electronAPI.hidePdfView();

  app.innerHTML = route();

  if (path === '/upload') {
    attachUploadPageEvents();
  }

  if (path === '/files') {
    attachFilesPageEvents();
  }

  if (path === '/review') {
    attachReviewPageEvents(fileName);
  }
};

window.addEventListener('hashchange', render);
render();
