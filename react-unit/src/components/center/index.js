import React from 'react';

const Center = () => {
    const url = `http://${process.env.NODE_ENV == 'production' ?
        window.location.hostname : "10.67.24.94"}:8080/media-center/conference/`

    return (
        <iframe style={{ width: '100%', height: '100%', overflow: 'hidden' }} src={url} />
    )
}

export default Center;