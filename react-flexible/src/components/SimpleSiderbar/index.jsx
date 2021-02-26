import React from "react";
import { Route, Link } from "react-router-dom";

const SimpleSiderbar = props => {

  return (
    <>
      <div style={{ display: "flex" }}>
        <div style={{ padding: 10, width: 150, background: "#f0f0f0" }} >
          <ul style={{ listStyleType: "none", padding: 0 }}>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/bubble">Bubble</Link>
            </li>
            <li>
              <Link to="/test">Test</Link>
            </li>
          </ul>

          {/* {props.routes.map((route, index) => (
            <Route
              key={index}
              path={route.path}
              exact={route.exact}
              component={route.sidebar}
            />
          ))} */}
        </div>

        <div style={{ flex: 1, padding: 10 }}>
          {props.routes.map((route, index) => (
            // Render more <Route>s with the same paths as
            // above, but different components this time.
            <Route
              key={index}
              path={route.path}
              exact={route.exact}
              component={route.main}
            />
          ))}
        </div>
      </div>
    </>
  );
}

export default SimpleSiderbar;