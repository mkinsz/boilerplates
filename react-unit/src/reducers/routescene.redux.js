import { send } from '../services';
import _ from 'lodash';
import { post } from '../services/graphql';

const initialState = {
	search:"",
	enable: false,
	scene:{},
	scenes:{}
};

export const routescene = (state = initialState, action) => {
	switch (action.type) {
		case '/routescene/search': {
			state.search = action.search
			return state
		}
		case '/routescene/scenes/get':{
			var scenes = state.scenes
			const _data = action.data.data.RoutescenesByparent
			for (const i in _data) {
				scenes[_data[i].id] = _data[i]
			}
			state.scenes = JSON.parse(JSON.stringify(scenes))
			return state
		}
		case '/routescene/scene/update':{
			console.log(action)
			state.scene[action.data.parent].chnnls[action.data.id] = action.data
			console.log(state.scene)
			return state
		}
		case '/routescene/scene/get':{
			state.scene = {}
			const _data = action.data.data.RouteGroups
			for (const i in _data) {
				state.scene[_data[i].id] = _data[i]
				let chnnls = {}
				for (const x in _data[i].chnnls) {
					chnnls[_data[i].chnnls[x].id] = {..._data[i].chnnls[x], enable:action.enable}
				}
				_data[i].chnnls = chnnls
			}
			console.log(state.scene)
			return state
		}
		case '/routescene/enable': {
			state.enable = action.enable
			console.log(state.enable)
			if(state.enable){
				let arr = []
				for (const x in state.scene) {
					for (const y in state.scene[x].chnnls) {
						const e = state.scene[x].chnnls[y]
						arr.push({id:0, outid:e.outid, outname:e.outname, inid:e.inid, inname:e.inname})
					}
				}

				let s = "["
				for (const i in arr) {
					const e = arr[i]
					s += `{id:0,outid:"${e.outid}",outname:"${e.outname}",inid:"${e.inid}",inname:"${e.inname}"},`
				}
				s += "]"
				console.log(`mutation{EnableRouteScene(chnnls:${s}){id}}`)
				const a = `mutation{EnableRouteScene(chnnls:${s}){id}}`
				post(a).then(data=>console.log(data))

				for (const i in arr) {
					const e = arr[i]
					var type = e.type == 8 ? 1 : 2
					var on = e.inid == '' ? 1 : 0
            		post(`mutation{Exchange(outid:"${e.outid}", inid:"${e.inid}", on:"${on}", type:"${type}")}`).then(_data=>console.log(_data))
				}
			}
			return state;
		}
		default:
			return state;
	}
};
