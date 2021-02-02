import React from 'react';

export const Label = props => {
    return <div style={{ height: '32px', lineHeight: '32px',...props.cstyle }}>
        {props.children}
    </div>
}