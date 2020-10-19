import React from "react";
import {
  BrowserRouter as Router,
  Switch,
  Route
} from "react-router-dom";
import App from "./App";


export default function Routes() {
  return (
    <Router basename={process.env.PUBLIC_URL}>
        <Switch>
          <Route path="/song/:song">
            <App/>
          </Route>
          <Route path="/">
            <App/>
          </Route>
        </Switch>
    </Router>
  )
};