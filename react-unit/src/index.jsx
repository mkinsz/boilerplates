import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import App from './App';
import { BrowserRouter } from 'react-router-dom'

import registerServiceWorker from './registerServiceWorker';

//打包时，用的BrowserRouter并加上了basename，因为放在服务器的二级目录下
ReactDOM.render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
  document.getElementById('root'));
registerServiceWorker();
