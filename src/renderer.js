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
import { attachViewPageEvents, viewNavbarActions } from './view.js';

const app = document.createElement('main');
app.className = 'app-shell';
document.body.innerHTML = '';
document.body.appendChild(app);

// actions fills the navbar's top-right slot for pages that need their own buttons there
const navbar = (actions = '') => fillTemplate(navbarHtml, { logoSrc, actions });

const routes = {
  '/': () => navbar() + homeHtml,
  '/upload': () => navbar() + renderUploadPage(),
  '/files': () => navbar() + filesHtml,
  '/view': () => navbar(viewNavbarActions) + viewHtml,
  '/info': () => navbar() + infoHtml,
  '/review': () => navbar() + reviewHtml,
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

  if (path === '/view') {
    attachViewPageEvents();
  }

  if (path === '/review') {
    attachReviewPageEvents(fileName);
  }
};

window.addEventListener('hashchange', render);
render();
