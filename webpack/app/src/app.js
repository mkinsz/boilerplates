import React from 'react';
import moment from 'moment';

const App = () => (
    <div>
        <h1 style={{color: 'red'}}>React</h1>
        <h2> {moment().format('YYYY-MM-DD hh:mm:ss')}</h2>
    </div>
);

export default App;