import React, { useEffect } from 'react';
import { Route, Switch } from 'react-router-dom';
import { AuthRoute } from './components/public';
import { isAuth } from './utils';
import * as ws from './services'
import './styles/index.less'

const Home = React.lazy(() => import('./components/home'));
const Login = React.lazy(() => import('./components/login'));

const connect = () => {
	if (ws.status() !== WebSocket.OPEN ||
		ws.status() !== WebSocket.CONNECTING) ws.init();
}
if (isAuth()) connect();

const App = props => {
	return <React.Suspense fallback={null}>
		<Switch>
			<Route exact path='/login' component={Login} />
			<AuthRoute path='/' component={Home} />
		</Switch>
	</React.Suspense>
};

export default App;
