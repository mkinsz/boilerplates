import _ from 'lodash'

export const initialState = {
	Scene: {'0': {ID: '0', children: []}},
}

const insertItem = (set, array, data) => {
	let find = false
	for (const index in array) {				
		if (data.Pos < set[array[index]].Pos) {
			const i = Number(index)
			if (i) data.prev = array[i - 1]
			else data.prev = null
			data.next = array[i]
			array.splice(i, 0, data.ID)
			find = true
			break
		}
	}
	if (!find) {
		if (array.length) data.prev = array[array.length - 1]
		else data.prev = null
		data.next = null
		array.push(data.ID)
	}
}

const removeItem = (set, id) => {
	const item = set[id]
	if (item.prev) set[item.prev].next = item.next
	if (item.next) set[item.next].prev = item.prev
	set[item.Parent].children = set[item.Parent].children.filter(v => v !== item.ID)
}

const sortArray = (set, array) => {
	array.sort((a, b) => set[a].Pos - set[b].Pos)
	for (const ii in array) {
		const id = array[ii]
		const index = Number(ii)
		const i = set[id]
		if (index > 0) i.prev = array[index - 1]
		else i.prev = null
		if (index < array.length - 1) i.next = array[index + 1]
		else i.next = null
	}
}

export function reducer(state, action) {
	switch (action.type) {
	case 'Scene': {
		const set = _.cloneDeep(state.Scene)
		console.log(action)
		if (action.del) {
			
			removeItem(set, action.del)
			delete set[action.del]
		} else {
			console.log(action.data)
			if (Array.isArray(action.data)) {
				for (const item of action.data) {
					if (!item.Level) item.children = []
					set[item.ID] = item
				}
				set['0'].children = []
				for (const id in set) {
					if (id === '0') continue
					if(!set[set[id].Parent]) continue
					set[set[id].Parent].children.push(id)
				}
				for (const id in set) {
					const c = set[id].children
					if (c) sortArray(set, c)
				}
			} else {
				const data = action.data
				const item = set[data.ID]
				if (item) _.merge(item, data)
				else if(data) {
					console.log(data)
					console.log(set)
					if (!data.Level) data.children = []
					insertItem(set, set[data.Parent].children, data)
					set[data.ID] = data
				}
			}
		}
		const newState = {...state}
		newState.Scene = set
		return newState
	}
	case 'SceneMove': {
		const data = action.data
		const set = _.cloneDeep(state.Scene)
		const newParent = set[data.ID].Parent !== data.Parent
		const children = set[data.Parent].children
		if (newParent) {
			removeItem(set, data.ID)
			insertItem(set, children, data)
		}
		set[data.ID] = data
		if (!newParent) sortArray(set, children)
		const newState = {...state}
		newState.Scene = set
		return newState
	}
	case 'SceneUpdate': {
		const set = _.cloneDeep(state.Scene)
		for (const s of action.data) {
			const scene = set[s.ID]
			for (const g of s.Groups) {
				const group = scene.Groups[g.Index]
				for (const p of g.Ports) {
					const port = group.Ports[p.Index]
					if (p.Edge !== undefined) port.Edge = p.Edge
					if (p.State !== undefined) port.State = p.State
				}
				group.State = g.State
			}
			scene.State = s.State
		}
		const newState = {...state}
		newState.Scene = set
		return newState
	}
	default: return state
	}
}
