import React, { useState, useEffect } from 'react';

const Cell = React.forwardRef((props, ref) => {
    const [enter, setEnter] = useState(false)

    const handleDragEnter = e => {
        e.preventDefault();
        e.stopPropagation();
        setEnter(true)
    };

    const handleDragLeave = e => {
        e.preventDefault();
        e.stopPropagation();
        setEnter(false)
    };

    const handleDragOver = e => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = e => {
        setEnter(false)
    }

    return <div ref={ref} {...props}
        style={{
            ...props.style,
            className: 'cell', fontSize: 20,
            backgroundColor: enter ? 'lightgrey' : '#F5FAFF',
            border: '1px solid #2196F3'
        }}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
    >
    </div>
})

export default Cell;