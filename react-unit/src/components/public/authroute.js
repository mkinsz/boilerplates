import React from 'react';
import { Route, Redirect } from 'react-router-dom';
import { isAuth } from '../../utils';

export const AuthRoute = ({ component: Component, ...rest }) => (
  <Route {...rest} render={props =>
        !!isAuth() ? <Component {...props} /> :
        <Redirect to={{ pathname: '/login',}} />
    }
  />
);