import React from 'react'
import { Input } from 'antd'

const FocusInput = props => {
	const ref = React.useRef()
	const [value, setValue] = React.useState()
	React.useEffect(() => {if (ref.current) ref.current.focus()}, [])
	return <Input size='small' {...props} ref={ref} value={value}
		onChange={e => setValue(e.target.value)}
		onBlur={() => props.onFinish(value)} 
		onPressEnter={() => props.onFinish(value)}
		onFinish={undefined} />
}

export default FocusInput
