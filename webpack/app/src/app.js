import React from 'react';
import { useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import { Route, Switch, Redirect } from 'react-router-dom';

import { alertActions } from './actions';
import { AuthRoute } from './components';

import HomePage from './views/home';
import LoginPage from './views/login';
import RegisterPage from './views/regist';

const App = props => {
    const location = useLocation();
    const alert = useSelector(state => state.alert);

    React.useEffect(() => {
        alertActions.clear();
    }, [location])

    return (
        <div className="jumbotron">
            <h2>😀 😎 👍 💯</h2>
            <div className="container">
                <div className="col-sm-8 col-sm-offset-2">
                    {alert.message && <div className={`alert ${alert.type}`}>{alert.message}</div>}
                    <Switch>
                        <AuthRoute exact path="/" component={HomePage} />
                        <Route path="/login" component={LoginPage} />
                        <Route path="/register" component={RegisterPage} />
                        <Redirect from="*" to="/" />
                    </Switch>
                </div>
            </div>
        </div>
    )
};

export default App;