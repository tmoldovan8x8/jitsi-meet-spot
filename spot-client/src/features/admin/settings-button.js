import React from 'react';
import { Link } from 'react-router-dom';

import { ROUTES } from 'routing/constants';

/**
 * A cog that directs to the settings view on click.
 */
class SettingsButton extends React.Component {
    /**
     * Implements React's {@link Component#render()}.
     *
     * @inheritdoc
     */
    render() {
        return (
            <div className = 'cog'>
                <Link to = { ROUTES.ADMIN } >
                    <i className = 'icon-settings' />
                </Link>
            </div>
        );
    }
}

export default SettingsButton;
