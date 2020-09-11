import { createStore, applyMiddleware, compose } from 'redux';
import thunkMiddleware from 'redux-thunk';
import { createLogger } from 'redux-logger';
import rootReducer from '../reducers';

const loggerMiddleware = createLogger();

// const composeEnhancers =
// 	typeof window === 'object' &&
// 		window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ ?
// 		window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__({
// 			// Specify extension’s options like name, actionsBlacklist, actionsCreators, serialize...
// 		}) : compose;

export const store = createStore(
	rootReducer,
	// composeEnhancers(
		applyMiddleware(
			thunkMiddleware,
			// loggerMiddleware
		)
	// )
);

// const makeStore = () => {
// 	const store = createStore(
// 		rootReducer, 
// 		window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
// 	);

// 	if ('production' !== process.env.NODE_ENV && module.hot)
// 		module.hot.accept('../reducers', () => store.replaceReducer(reducers));

// 	return store;
// };


// export const store = makeStore();