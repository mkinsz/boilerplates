import React, { useEffect } from 'react';
import { Route, Switch } from 'react-router-dom';
import { AUTH } from './actions'
import { isAuth } from './utils';
import * as ws from './services'
import './styles/index.less'

const Home = React.lazy(() => import('./components/home'));

ws.init();

const App = props => {
	useEffect(() => {
		AUTH.login('mspspec', 'admin123')
	}, [])

	return <React.Suspense fallback={null}>
		<Switch>
			<Route path='/' component={Home} />
		</Switch>
	</React.Suspense>
};

export default App;
