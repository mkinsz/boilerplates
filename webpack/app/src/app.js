import React from 'react';
import moment from 'moment';

const App = () => (
    <div>
        <h2>😀 😎 👍 💯</h2>
        <h2 style={{ color: 'red' }}>React</h2>
        <h3> {moment().format('YYYY-MM-DD hh:mm:ss')}</h3>
    </div>
);

export default App;