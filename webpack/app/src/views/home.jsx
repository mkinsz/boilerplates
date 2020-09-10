import React from 'react';
import { Link } from 'react-router-dom';
import { connect, useSelector } from 'react-redux';

import { userActions } from '../actions';

const HomePage = () => {
    const users = useSelector(state => state.users)
    const user = useSelector(state => state.authentication.user)

    React.useEffect(() => {
        userActions.getAll()
    }, [])

    const handleDeleteUser = id => {
        return (e) => userActions.delete(id);
    }

    return (
        <div className="col-md-6 col-md-offset-3">
            <h1>Hi {user.firstName}!</h1>
            <p>You're logged in with React!!</p>
            <h3>All registered users:</h3>
            {users.loading && <em>Loading users...</em>}
            {users.error && <span className="text-danger">ERROR: {users.error}</span>}
            {users.items &&
                <ul>
                    {users.items.map((user, index) =>
                        <li key={user.id}>
                            {user.firstName + ' ' + user.lastName}
                            {
                                user.deleting ? <em> - Deleting...</em>
                                    : user.deleteError ? <span className="text-danger"> - ERROR: {user.deleteError}</span>
                                        : <span> - <a onClick={handleDeleteUser(user.id)}>Delete</a></span>
                            }
                        </li>
                    )}
                </ul>
            }
            <p>
                <Link to="/login">Logout</Link>
            </p>
        </div>
    );
}

export default HomePage;