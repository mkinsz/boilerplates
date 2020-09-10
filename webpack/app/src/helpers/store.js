import { createStore, applyMiddleware } from 'redux';
// import thunkMiddleware from 'redux-thunk';
// import { createLogger } from 'redux-logger';
import rootReducer from '../reducers';

// const loggerMiddleware = createLogger();

// export const store = createStore(
//     rootReducer,
//     // applyMiddleware(
//     //     thunkMiddleware,
//     //     loggerMiddleware
//     // )
// );

const makeStore = () => {
	// const composeEnhancers = composeWithDevTools({});

	const store = createStore(
		rootReducer, 
		// composeEnhancers
		window.__REDUX_DEVTOOLS_EXTENSION__ && window.__REDUX_DEVTOOLS_EXTENSION__()
	);

	if ('production' !== process.env.NODE_ENV && module.hot)
		module.hot.accept('../reducers', () => store.replaceReducer(reducers));

	return store;
};


export const store = makeStore();