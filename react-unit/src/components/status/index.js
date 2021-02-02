import React from 'react';
import { Switch, Route } from 'react-router-dom';

const Status = React.lazy(() => import('./status'));

export default ({ match }) => {
  return (
    <React.Suspense fallback={null}>
      <Switch>
        <Route path={`${match.url}`} component={Status} />
      </Switch>
    </React.Suspense>
  );
}