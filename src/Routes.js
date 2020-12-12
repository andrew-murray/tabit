import React from "react";
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect
} from "react-router-dom";
import App from "./App";


export default function Routes() {
  return (
    <Router basename={process.env.PUBLIC_URL}>
        <Switch>
          <Route
            path="/song/:song"
            component={App}
          />
          <Route
            path="/launch"
            component={App}
          />
          <Route
            path="/"
          >
            <Redirect to="/launch" />
          </Route>
        </Switch>
    </Router>
  )
};