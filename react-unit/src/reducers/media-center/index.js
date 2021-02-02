import {initialState as routeIS, reducer as RouteReducer} from './route'

export const initialState = {
	Route: routeIS,
}

export default function reducer(state = initialState, action) {
		if (action.type.startsWith('MediaCenter'))
		action.type = action.type.substring(11)
	else return state
	if (action.type.startsWith('Route')) {
		action.type = action.type.substring(5)
		const ret = RouteReducer(state.Route, action)
		if (ret !== state.Route) {
			const newState = {...state}
			newState.Route = ret
			return newState
		}
		return state
	}
	return state
}
