import React from 'react';
import RouterHeader from './route-header';
import RouterBodyLeft from './route-body-left';
import RouterBodyRight from './route-body-right';
import { Switch, Route } from 'react-router-dom';

const MediaRouteItem = React.lazy(() => import('../route/detail-index.jsx'));

import './index.less'

const Index = () => {
    return <>
        <Switch>
            <Route path="/route/id" component={MediaRouteItem} />
        </Switch>
        <div className="route">
            <RouterHeader />
            <div className="route-body">
                <RouterBodyLeft />
                <RouterBodyRight />
            </div>
        </div>
    </>
}

export default Index