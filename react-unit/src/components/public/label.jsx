import React from 'react'
import { Tooltip } from 'antd'
import { createUseStyles } from 'react-jss'

const useStyles = createUseStyles({
	label: {
		overflow: 'hidden',
		textOverflow: 'ellipsis',
		whiteSpace: 'nowrap',
	},
})

const Label = props => <Tooltip title={props.text}>
	<div className={`${props.className} ${useStyles().label}`} style={props.style}>
		{props.text}
	</div>
</Tooltip>

export default Label
