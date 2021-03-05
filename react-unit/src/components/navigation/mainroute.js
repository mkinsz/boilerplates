import React from "react";
import { Switch, Route, Redirect } from "react-router-dom";
import { AuthRoute } from "../public";

const Screen = React.lazy(() => import("../screen"));
const Center = React.lazy(() => import("../center"));
const Matrix = React.lazy(() => import("../matrix"));
const MediaRoute = React.lazy(() => import("../route"));
const Config = React.lazy(() => import("../config"));
const Status = React.lazy(() => import("../status"));
const Maintain = React.lazy(() => import("../maintain"));
const About = React.lazy(() => import("../about"));

const MainRoute = () => {
  const routes = window.nologin ? (
    <>
      <Route path="/screen" component={Screen} />
      <Route path="/center" component={Center} />
      <Route path="/matrix" component={Matrix} />
      <Route path="/route/:id?" component={MediaRoute} />
      <Route path="/config" component={Config} />
      <Route path="/display" component={Status} />
      <Route path="/maintain" component={Maintain} />
      <Route path="/about" component={About} />
      <Redirect to="/screen" />
    </>
  ) : (
    <>
      <AuthRoute path="/screen" component={Screen} />
      <AuthRoute path="/center" component={Center} />
      <AuthRoute path="/matrix" component={Matrix} />
      <AuthRoute path="/route/:id?" component={MediaRoute} />
      <AuthRoute path="/config" component={Config} />
      <AuthRoute path="/display" component={Status} />
      <AuthRoute path="/maintain" component={Maintain} />
      <AuthRoute path="/about" component={About} />
      <Redirect to="/screen" />
    </>
  );

  return (
    <React.Suspense fallback={null}>
      <Switch>{routes}</Switch>
    </React.Suspense>
  );
};

export default MainRoute;
