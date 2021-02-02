import React from 'react';
import { Switch, Route, Redirect } from 'react-router-dom';
import { AuthRoute } from '../public';

const Screen = React.lazy(() => import('../screen'));
const Center = React.lazy(() => import('../center'));
const Matrix = React.lazy(() => import('../matrix'));
const MediaRoute = React.lazy(() => import('../route'));
const Config = React.lazy(() => import('../config'));
const Status = React.lazy(() => import('../status'));
const Maintain = React.lazy(() => import('../maintain'));
const About = React.lazy(() => import('../about'))

const MainRoute = () => (
        <React.Suspense fallback={null}>
            <Switch>
                <AuthRoute path='/screen' component={Screen} />
                <AuthRoute path='/center' component={Center} />
                <AuthRoute path='/matrix' component={Matrix} />
                <AuthRoute path='/route/:id?' component={MediaRoute} />
                <AuthRoute path='/config' component={Config} />
                <AuthRoute path='/display' component={Status} />
                <AuthRoute path='/maintain' component={Maintain} />
                <AuthRoute path='/about' component={About} />
                <Redirect to='/screen' />
            </Switch>
        </React.Suspense>
)

export default MainRoute;