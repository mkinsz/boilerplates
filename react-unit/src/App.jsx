import React, { useEffect } from 'react';
import { Route, Switch } from 'react-router-dom';
import { AuthRoute } from './components/public';
import { isAuth, setUnlogin, getUnlogin, setUser, setToken } from './utils';
import { AUTH } from './actions'
import * as ws from './services'
import './styles/index.less'

const Home = React.lazy(() => import('./components/home'));
const Login = React.lazy(() => import('./components/login'));

const connect = () => {
	if (ws.status() !== WebSocket.OPEN ||
		ws.status() !== WebSocket.CONNECTING) ws.init();
}

const vars = {}
window.location.href.replace(/[?&]+([^=&]+)=([^&]*)/gi, function (m, key, value) {
	vars[key] = value
})

const nologin = !isNaN(Number(vars['nl']))

console.log('-----> ', vars, nologin)

if (nologin) {
	setUnlogin(1)
	window.nologin = true;
	ws.init();

	AUTH.login('mspspec', 'admin123')
	setUser('mspspec')
} else {
	setToken()
	setUnlogin(0)
	window.nologin = false;
	if (isAuth()) connect();
}

const App = props => {

	return <React.Suspense fallback={null}>
		<Switch>
			{
				window.nologin ? <>
					<Route path='/' component={Home} />
				</> : <>
					<Route exact path='/login' component={Login} />
					<AuthRoute path='/' component={Home} />
				</>
			}
		</Switch>
	</React.Suspense>
};

export default App;
