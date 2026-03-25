import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import Overlay from './components/Overlay';
import './index.css';

ReactDOM.render(
  <React.StrictMode>
    <Overlay />
    <App />
  </React.StrictMode>,
  document.getElementById('root')
);

