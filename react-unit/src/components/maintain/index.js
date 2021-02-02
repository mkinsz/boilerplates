import React from 'react';
import { Switch, Route } from 'react-router-dom';

const Log = React.lazy(() => import('./log'));

const Maintain = ({ match }) => {
  return (
    <React.Suspense fallback={null}>
      <Switch>
        <Route path={`${match.url}`} component={Log} />
      </Switch>
    </React.Suspense>
  );
}

export default Maintain;       