import React from "react";
import "./App.css";
import "./assets/font/iconfont.css";
import SimpleSiderbar from './components/SimpleSiderbar'
import routes from './components/routes'

const App = () => {
  return (
      <SimpleSiderbar routes={routes}/>
  );
};

export default App;