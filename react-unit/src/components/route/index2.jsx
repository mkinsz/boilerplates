import React from 'react'
import { createUseStyles } from 'react-jss'
import SceneList from './scene-list'
import SceneControl from './scene-control'

const useStyles = createUseStyles({
	container: {
		width: '100%',
		height: '100%',
		display: 'flex',
	},
	left: {
		width: 300,
		flexShrink: 0,
		display: 'flex',
		flexDirection: 'column',
	},
	mid: {
		flexGrow: 1,
	},
	right: {
		width: 300,
		height: '100%',
		flexShrink: 0,
	},
	content: {
		flexGrow: 1,
		overflow: 'auto',
	},
	h: {
		height: '100%',
	},
})

const Index = () => {
	const classes = useStyles()

	return <div className={classes.container}>
		<div className={classes.left}>
			<SceneList />
		</div>
		<div className={classes.mid}><SceneControl /></div>
		<div className={classes.right}>
		</div>
	</div>
}

export default Index
